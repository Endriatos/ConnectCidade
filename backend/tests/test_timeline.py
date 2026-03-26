from datetime import datetime, timezone

from app.models.atualizacao import Atualizacao
from app.models.solicitacao import StatusSolicitacao
from tests.conftest import _cadastrar_e_logar, _criar_solicitacao, _gerar_cpf

# Seeds a partir de 200 para não colidir com CPFs usados em outros arquivos de teste


def test_timeline_vazia(client):
    """Solicitação recém-criada não possui atualizações — timeline deve ser lista vazia."""
    token = _cadastrar_e_logar(client, _gerar_cpf(200), "timeline_vazia@email.com")
    id_sol = _criar_solicitacao(client, token)

    resp = client.get(
        f"/solicitacoes/{id_sol}/timeline",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    assert resp.json() == []


def test_timeline_sem_autenticacao(client):
    """Acessar a timeline sem token deve retornar 401 ou 403."""
    resp = client.get("/solicitacoes/1/timeline")
    assert resp.status_code in (401, 403)


def test_timeline_solicitacao_inexistente(client):
    """Acessar a timeline de uma solicitação com id inexistente deve retornar 404."""
    token = _cadastrar_e_logar(client, _gerar_cpf(201), "timeline_404@email.com")

    resp = client.get(
        "/solicitacoes/999999/timeline",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 404


def test_timeline_campos_obrigatorios(client, db):
    """
    Após inserir um registro de atualização com id_administrador=None,
    a timeline deve retornar os campos obrigatórios e nome_administrador igual a None.
    """
    token = _cadastrar_e_logar(client, _gerar_cpf(202), "timeline_campos@email.com")
    id_sol = _criar_solicitacao(client, token)

    # Insere manualmente um registro de atualização sem administrador (ação do cidadão)
    atualizacao = Atualizacao(
        id_solicitacao=id_sol,
        id_administrador=None,
        status_anterior=StatusSolicitacao.PENDENTE,
        status_novo=StatusSolicitacao.CANCELADO,
        comentario="Cancelado pelo cidadão",
    )
    db.add(atualizacao)
    db.commit()

    resp = client.get(
        f"/solicitacoes/{id_sol}/timeline",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    itens = resp.json()
    assert len(itens) == 1

    item = itens[0]
    # Verifica que todos os campos obrigatórios estão presentes na resposta
    assert "id_atualizacao" in item
    assert "status_anterior" in item
    assert "status_novo" in item
    assert "comentario" in item
    assert "data_atualizacao" in item
    # Sem administrador registrado, nome_administrador deve ser None
    assert item["nome_administrador"] is None


def test_timeline_ordem_cronologica(client, db):
    """
    Dois registros inseridos com datas distintas devem ser retornados
    em ordem ascendente por data_atualizacao (mais antigo primeiro).
    """
    token = _cadastrar_e_logar(client, _gerar_cpf(203), "timeline_ordem@email.com")
    id_sol = _criar_solicitacao(client, token)

    # Insere o registro mais recente primeiro para garantir que a ordenação vem da query
    atualizacao_recente = Atualizacao(
        id_solicitacao=id_sol,
        id_administrador=None,
        status_anterior=StatusSolicitacao.EM_ANALISE,
        status_novo=StatusSolicitacao.RESOLVIDO,
        comentario="Resolvido",
        data_atualizacao=datetime(2026, 6, 1, tzinfo=timezone.utc),
    )
    atualizacao_antiga = Atualizacao(
        id_solicitacao=id_sol,
        id_administrador=None,
        status_anterior=StatusSolicitacao.PENDENTE,
        status_novo=StatusSolicitacao.CANCELADO,
        comentario="Cancelado",
        data_atualizacao=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )
    db.add(atualizacao_recente)
    db.add(atualizacao_antiga)
    db.commit()

    resp = client.get(
        f"/solicitacoes/{id_sol}/timeline",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    itens = resp.json()
    assert len(itens) == 2

    # O primeiro item deve ser o mais antigo (janeiro antes de junho)
    assert itens[0]["data_atualizacao"] < itens[1]["data_atualizacao"]
