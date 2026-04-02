import pytest
from sqlalchemy.exc import IntegrityError

from tests.conftest import (
    _cadastrar_e_logar,
    _criar_admin_e_logar,
    _criar_solicitacao,
    _gerar_cpf,
)

# Seeds a partir de 1000 para não colidir com os outros arquivos de teste


@pytest.fixture
def setup(client, db):
    """
    Prepara o estado base para os testes de notificações:
    - Cadastra um cidadão e cria uma solicitação
    - Cria um admin e atualiza o status da solicitação para EM_ANALISE
    - A atualização de status dispara automaticamente uma notificação para o cidadão
    """
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1000), "notif_cidadao1@email.com")
    id_solicitacao = _criar_solicitacao(client, token_cidadao)

    # Tenta criar o admin; se já existir (IntegrityError), faz rollback e apenas realiza o login
    try:
        token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1001), "notif_admin1@email.com")
    except IntegrityError:
        # Admin já existe no banco — desfaz a transação pendente e autentica diretamente
        db.rollback()
        resp = client.post("/auth/login", json={"cpf": _gerar_cpf(1001), "senha": "Senha@123"})
        token_admin = resp.json()["access_token"]

    # Atualiza o status — isso dispara a criação da notificação para o cidadão
    client.patch(
        f"/admin/solicitacoes/{id_solicitacao}/status",
        json={"status_novo": "EM_ANALISE", "comentario": "Iniciando análise"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    return {
        "token_cidadao": token_cidadao,
        "token_admin": token_admin,
        "id_solicitacao": id_solicitacao,
    }


def test_listar_retorna_notificacao(client, setup):
    """Cidadão lista notificações e recebe ao menos 1 item com todos os campos esperados."""
    resp = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    )

    assert resp.status_code == 200
    itens = resp.json()
    assert len(itens) >= 1

    # Verifica que todos os campos do schema estão presentes no primeiro item
    notif = itens[0]
    assert "id_notificacao" in notif
    assert "id_solicitacao" in notif
    assert "protocolo" in notif
    assert "mensagem" in notif
    assert notif["lida"] is False
    assert "data_criacao" in notif


def test_mensagem_contem_status_formatado(client, setup):
    """A mensagem da notificação deve conter o rótulo formatado 'Em Análise'."""
    resp = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    )

    assert resp.status_code == 200
    mensagens = [n["mensagem"] for n in resp.json()]
    # Verifica que ao menos uma mensagem contém o status formatado em português
    assert any("Em Análise" in m for m in mensagens)


def test_marcar_como_lida(client, setup):
    """Cidadão marca notificação como lida e recebe 200 com lida=True na resposta."""
    # Obtém o id da primeira notificação
    id_notificacao = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    ).json()[0]["id_notificacao"]

    resp = client.patch(
        f"/notificacoes/{id_notificacao}/lida",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    )

    assert resp.status_code == 200
    assert resp.json()["lida"] is True


def test_listar_apos_marcar_lida(client, setup):
    """Após marcar como lida, a notificação deve aparecer com lida=True na listagem."""
    # Obtém e marca a notificação como lida
    id_notificacao = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    ).json()[0]["id_notificacao"]

    client.patch(
        f"/notificacoes/{id_notificacao}/lida",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    )

    # Lista novamente e verifica que o campo lida foi atualizado
    itens = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    ).json()

    notif = next(n for n in itens if n["id_notificacao"] == id_notificacao)
    assert notif["lida"] is True


def test_marcar_inexistente_retorna_404(client, setup):
    """Tentar marcar como lida uma notificação inexistente deve retornar 404."""
    resp = client.patch(
        "/notificacoes/99999/lida",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    )

    assert resp.status_code == 404


def test_cidadao_nao_ve_notificacao_de_outro(client, db, setup):
    """
    Notificações são isoladas por usuário: o primeiro cidadão não deve receber
    as notificações geradas para o segundo cidadão.
    """
    # Registra quantas notificações o cidadão 1 tem antes de criar as do cidadão 2
    itens_antes = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    ).json()
    ids_antes = {n["id_notificacao"] for n in itens_antes}

    # Cria segundo cidadão com solicitação própria
    token_cidadao2 = _cadastrar_e_logar(client, _gerar_cpf(1002), "notif_cidadao2@email.com")
    id_sol2 = _criar_solicitacao(client, token_cidadao2)

    # Admin atualiza o status da solicitação do cidadão 2 — gera notificação para ele
    client.patch(
        f"/admin/solicitacoes/{id_sol2}/status",
        json={"status_novo": "EM_ANALISE", "comentario": "Analisando do cidadão 2"},
        headers={"Authorization": f"Bearer {setup['token_admin']}"},
    )

    # O cidadão 1 lista as notificações — não deve ver as do cidadão 2
    itens_depois = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    ).json()
    ids_depois = {n["id_notificacao"] for n in itens_depois}

    # O conjunto de notificações do cidadão 1 não deve ter crescido
    assert ids_depois == ids_antes


def test_sem_token_retorna_401(client):
    """GET /notificacoes sem token de autenticação deve retornar 401."""
    resp = client.get("/notificacoes")
    assert resp.status_code == 401


def test_multiplas_atualizacoes_geram_multiplas_notificacoes(client, setup):
    """
    Cada atualização de status gera uma notificação distinta.
    Após duas atualizações, o cidadão deve ter ao menos 2 notificações.
    """
    # Segunda atualização de status — a primeira já foi feita no fixture setup
    client.patch(
        f"/admin/solicitacoes/{setup['id_solicitacao']}/status",
        json={"status_novo": "EM_ANDAMENTO", "comentario": "Equipe a caminho"},
        headers={"Authorization": f"Bearer {setup['token_admin']}"},
    )

    itens = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    ).json()

    # Deve haver ao menos 2 notificações (uma por cada mudança de status)
    assert len(itens) >= 2


def test_marcar_todas_como_lidas(client, setup):
    """
    Após chamar PATCH /notificacoes/lidas, todas as notificações do cidadão
    devem ter lida=True na listagem subsequente.
    """
    # Faz segunda atualização de status para garantir ao menos 2 notificações
    client.patch(
        f"/admin/solicitacoes/{setup['id_solicitacao']}/status",
        json={"status_novo": "EM_ANDAMENTO", "comentario": "Equipe a caminho"},
        headers={"Authorization": f"Bearer {setup['token_admin']}"},
    )

    # Marca todas as notificações como lidas de uma vez
    resp = client.patch(
        "/notificacoes/lidas",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    )
    assert resp.status_code == 204

    # Verifica que todas as notificações estão marcadas como lidas
    itens = client.get(
        "/notificacoes",
        headers={"Authorization": f"Bearer {setup['token_cidadao']}"},
    ).json()
    assert len(itens) >= 2
    assert all(n["lida"] is True for n in itens)


def test_marcar_todas_sem_token_retorna_401(client):
    """PATCH /notificacoes/lidas sem token de autenticação deve retornar 401."""
    resp = client.patch("/notificacoes/lidas")
    assert resp.status_code == 401
