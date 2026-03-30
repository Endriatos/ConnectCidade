from datetime import date, datetime, timedelta, timezone
from unittest.mock import patch

import pytest

from app.models.solicitacao import Solicitacao, StatusSolicitacao
from tests.conftest import _jpeg_bytes

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SOLICITACAO_BASE = {
    "id_categoria": 1,
    "descricao": "Buraco na pista",
    "endereco_referencia": "Rua do Mapa, 100",
    "latitude": -23.550520,
    "longitude": -46.633308,
    "confirmar_duplicata": True,
}


def _cadastrar_e_logar(client, cpf: str, email: str) -> str:
    """Cadastra um usuário (ignora se já existir) e retorna o access token."""
    client.post(
        "/auth/cadastro",
        json={
            "cpf": cpf,
            "nome_usuario": f"Usuário {cpf}",
            "email": email,
            "senha": "senha123",
            "data_nascimento": str(date(1995, 6, 15)),
        },
    )
    resp = client.post("/auth/login", json={"cpf": cpf, "senha": "senha123"})
    return resp.json()["access_token"]



def _criar_solicitacao(client, token: str) -> int:
    data = {
        "id_categoria": str(SOLICITACAO_BASE["id_categoria"]),
        "descricao": SOLICITACAO_BASE["descricao"],
        "endereco_referencia": SOLICITACAO_BASE["endereco_referencia"],
        "latitude": str(SOLICITACAO_BASE["latitude"]),
        "longitude": str(SOLICITACAO_BASE["longitude"]),
        "confirmar_duplicata": "true" if SOLICITACAO_BASE.get("confirmar_duplicata") else "false",
    }
    with patch("app.routers.solicitacoes.garantir_bucket_publico"), patch(
        "app.routers.solicitacoes.fazer_upload_foto", return_value="http://minio-fake/foto.jpg"
    ):
        resp = client.post(
            "/solicitacoes",
            data=data,
            files=[("fotos", ("m.jpg", _jpeg_bytes(), "image/jpeg"))],
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 201
    return resp.json()["id_solicitacao"]


# ---------------------------------------------------------------------------
# Fixture: usuário logado
# ---------------------------------------------------------------------------


@pytest.fixture
def usuario_logado(client):
    """Cadastra um usuário de teste e retorna o token de autenticação."""
    return _cadastrar_e_logar(client, "71428793860", "mapa@email.com")


# ---------------------------------------------------------------------------
# Testes
# ---------------------------------------------------------------------------


def test_mapa_autenticado(client, usuario_logado):
    """GET /mapa/solicitacoes com token válido deve retornar 200 e ao menos 1 item."""
    token = usuario_logado

    # Cria uma solicitação para garantir que há pelo menos um item no mapa
    _criar_solicitacao(client, token)

    resp = client.get(
        "/mapa/solicitacoes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_mapa_sem_autenticacao(client):
    """GET /mapa/solicitacoes sem token deve retornar 401 ou 403."""
    resp = client.get("/mapa/solicitacoes")
    assert resp.status_code in (401, 403)


def test_mapa_exclui_canceladas(client, db, usuario_logado):
    """Solicitações canceladas não devem aparecer no mapa."""
    token = usuario_logado
    id_sol = _criar_solicitacao(client, token)

    # Cancela a solicitação diretamente no banco
    sol = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_sol).first()
    sol.status = StatusSolicitacao.CANCELADO
    db.commit()

    resp = client.get(
        "/mapa/solicitacoes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    ids_no_mapa = [item["id_solicitacao"] for item in resp.json()]
    assert id_sol not in ids_no_mapa


def test_mapa_exclui_resolvidas_antigas(client, db, usuario_logado):
    """Solicitações resolvidas há mais de 48 horas não devem aparecer no mapa."""
    token = usuario_logado
    id_sol = _criar_solicitacao(client, token)

    # Marca como RESOLVIDO com data_resolucao 49 horas atrás
    sol = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_sol).first()
    sol.status = StatusSolicitacao.RESOLVIDO
    sol.data_resolucao = datetime.now(timezone.utc) - timedelta(hours=49)
    db.commit()

    resp = client.get(
        "/mapa/solicitacoes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    ids_no_mapa = [item["id_solicitacao"] for item in resp.json()]
    assert id_sol not in ids_no_mapa


def test_mapa_inclui_resolvidas_recentes(client, db, usuario_logado):
    """Solicitações resolvidas há menos de 48 horas ainda devem aparecer no mapa."""
    token = usuario_logado
    id_sol = _criar_solicitacao(client, token)

    # Marca como RESOLVIDO com data_resolucao 1 hora atrás (dentro da janela de 48h)
    sol = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_sol).first()
    sol.status = StatusSolicitacao.RESOLVIDO
    sol.data_resolucao = datetime.now(timezone.utc) - timedelta(hours=1)
    db.commit()

    resp = client.get(
        "/mapa/solicitacoes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    ids_no_mapa = [item["id_solicitacao"] for item in resp.json()]
    assert id_sol in ids_no_mapa
