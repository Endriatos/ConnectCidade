from datetime import date

from passlib.context import CryptContext

from app.models.solicitacao import StatusSolicitacao
from app.models.usuario import TipoUsuario, Usuario
from tests.conftest import _cadastrar_e_logar, _criar_solicitacao, _gerar_cpf

# Seeds a partir de 300 para não colidir com CPFs de outros arquivos de teste

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _criar_admin_e_logar(client, db, cpf: str, email: str) -> str:
    """
    Insere um usuário com tipo_usuario=ADMIN diretamente no banco (sem passar pela API,
    que só permite cadastro de cidadãos) e retorna o token via login.
    """
    admin = Usuario(
        tipo_usuario=TipoUsuario.ADMIN,
        cpf=cpf,
        nome_usuario=f"Admin {cpf}",
        email=email,
        senha_hash=pwd_context.hash("senha123"),
        data_nascimento=date(1985, 1, 1),
    )
    db.add(admin)
    db.commit()

    # Realiza login pela API para obter o token JWT
    resp = client.post("/auth/login", json={"cpf": cpf, "senha": "senha123"})
    return resp.json()["access_token"]


# URL base do endpoint de admin
def _url_status(id_sol: int) -> str:
    return f"/admin/solicitacoes/{id_sol}/status"


# ---------------------------------------------------------------------------
# Testes
# ---------------------------------------------------------------------------


def test_atualizar_status_sucesso(client, db):
    """Admin muda status de PENDENTE para EM_ANALISE — espera 200 e status correto na resposta."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(300), "cidadao_admin1@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(301), "admin1@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    resp = client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANALISE", "comentario": "Analisando a ocorrência."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    assert resp.json()["status"] == "EM_ANALISE"


def test_atualizar_status_registra_timeline(client, db):
    """Após mudar o status, a timeline da solicitação deve conter 1 item com os dados corretos."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(302), "cidadao_admin2@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(303), "admin2@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANDAMENTO", "comentario": "Equipe enviada ao local."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    resp = client.get(
        f"/solicitacoes/{id_sol}/timeline",
        headers={"Authorization": f"Bearer {token_cidadao}"},
    )

    assert resp.status_code == 200
    itens = resp.json()
    assert len(itens) == 1
    # Verifica que os dados da mudança foram registrados corretamente na timeline
    assert itens[0]["status_anterior"] == "PENDENTE"
    assert itens[0]["status_novo"] == "EM_ANDAMENTO"
    assert itens[0]["comentario"] == "Equipe enviada ao local."


def test_atualizar_status_resolve_seta_data_resolucao(client, db):
    """Ao marcar como RESOLVIDO, data_resolucao não deve ser null na resposta."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(304), "cidadao_admin3@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(305), "admin3@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    resp = client.patch(
        _url_status(id_sol),
        json={"status_novo": "RESOLVIDO", "comentario": "Problema solucionado."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    # data_resolucao deve ser preenchida automaticamente ao resolver
    assert resp.json()["data_resolucao"] is not None


def test_atualizar_status_sai_de_resolvido_limpa_data_resolucao(client, db):
    """Ao sair do status RESOLVIDO, data_resolucao deve ser limpa (null)."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(306), "cidadao_admin4@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(307), "admin4@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    # Primeiro resolve a solicitação
    client.patch(
        _url_status(id_sol),
        json={"status_novo": "RESOLVIDO", "comentario": "Resolvido."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    # Depois reabre como EM_ANDAMENTO — data_resolucao deve ser apagada
    resp = client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANDAMENTO", "comentario": "Reaberto por solicitação."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    assert resp.json()["data_resolucao"] is None


def test_atualizar_status_sem_autenticacao(client):
    """Acessar o endpoint sem token deve retornar 401 ou 403."""
    resp = client.patch("/admin/solicitacoes/1/status", json={"status_novo": "EM_ANALISE", "comentario": "x"})
    assert resp.status_code in (401, 403)


def test_atualizar_status_cidadao_nao_pode(client):
    """Cidadão autenticado não pode acessar endpoint de admin — espera 403."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(308), "cidadao_admin5@email.com")

    resp = client.patch(
        "/admin/solicitacoes/1/status",
        json={"status_novo": "EM_ANALISE", "comentario": "Tentativa indevida."},
        headers={"Authorization": f"Bearer {token_cidadao}"},
    )

    assert resp.status_code == 403


def test_atualizar_status_solicitacao_inexistente(client, db):
    """Admin tenta mudar status de solicitação inexistente — espera 404."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(309), "admin5@email.com")

    resp = client.patch(
        "/admin/solicitacoes/999999/status",
        json={"status_novo": "EM_ANALISE", "comentario": "Não existe."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 404


def test_atualizar_status_comentario_vazio(client, db):
    """Enviar comentário vazio deve retornar 422 (validação do Pydantic)."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(310), "cidadao_admin6@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(311), "admin6@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    # Comentário com string vazia deve falhar na validação (min_length=1)
    resp = client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANALISE", "comentario": ""},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 422
