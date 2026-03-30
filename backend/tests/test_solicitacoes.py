import io
from datetime import date
from unittest.mock import patch

import pytest
from PIL import Image
from sqlalchemy.orm import sessionmaker

from app.models import Categoria, Foto, Solicitacao

USUARIO_BASE = {
    "cpf": "52998224725",
    "nome_usuario": "Usuário Teste",
    "email": "teste@email.com",
    "senha": "Senha@123",
    "data_nascimento": str(date(1995, 6, 15)),
}

SOLICITACAO_BASE = {
    "id_categoria": 1,
    "descricao": "Buraco na rua principal",
    "endereco_referencia": "Rua Teste, 123",
    "latitude": -23.550520,
    "longitude": -46.633308,
    "confirmar_duplicata": True
}

CATEGORIAS_SEED = [
    {"nome_categoria": "Coleta de Resíduos", "cor_hex": "#66BB6A", "descricao": "Resíduos"},
    {"nome_categoria": "Iluminação Pública", "cor_hex": "#FFCA28", "descricao": "Iluminação"},
    {"nome_categoria": "Acessibilidade", "cor_hex": "#42A5F5", "descricao": "Acesso"},
    {"nome_categoria": "Manutenção de Vias", "cor_hex": "#FF7043", "descricao": "Vias"},
]


@pytest.fixture(scope="session", autouse=True)
def seed_categorias(test_engine):
    # Cria as 4 categorias fixas uma única vez por sessão de testes
    Session = sessionmaker(bind=test_engine)
    db = Session()
    try:
        for cat in CATEGORIAS_SEED:
            if not db.query(Categoria).filter_by(nome_categoria=cat["nome_categoria"]).first():
                db.add(Categoria(**cat))
        db.commit()
    finally:
        db.close()


def get_token(client):
    # Tenta cadastrar (ignora erro se já existe) e faz login
    client.post("/auth/cadastro", json=USUARIO_BASE)
    resp = client.post("/auth/login", json={"cpf": USUARIO_BASE["cpf"], "senha": USUARIO_BASE["senha"]})
    return resp.json()["access_token"]


@pytest.fixture(autouse=True)
def _mock_minio_criar_solicitacao():
    with patch("app.routers.solicitacoes.garantir_bucket_publico"), patch(
        "app.routers.solicitacoes.fazer_upload_foto", return_value="http://minio-fake/foto.jpg"
    ):
        yield


def _jpeg():
    img = Image.new("RGB", (8, 8), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _post_solicitacoes(client, token, payload, n_fotos=1):
    d = {
        "id_categoria": str(payload["id_categoria"]),
        "descricao": payload["descricao"],
        "endereco_referencia": payload["endereco_referencia"],
        "latitude": str(payload["latitude"]),
        "longitude": str(payload["longitude"]),
        "confirmar_duplicata": "true" if payload.get("confirmar_duplicata") else "false",
    }
    files = [("fotos", (f"f{i}.jpg", _jpeg(), "image/jpeg")) for i in range(n_fotos)]
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    return client.post("/solicitacoes", data=d, files=files, headers=headers)


def test_criar_solicitacao_sucesso(client):
    token = get_token(client)
    resp = _post_solicitacoes(client, token, SOLICITACAO_BASE)
    assert resp.status_code == 201
    data = resp.json()
    assert "protocolo" in data
    assert data["status"] == "PENDENTE"


def test_criar_solicitacao_sem_autenticacao(client):
    resp = _post_solicitacoes(client, None, SOLICITACAO_BASE)
    assert resp.status_code == 401


def test_criar_solicitacao_sem_fotos(client):
    token = get_token(client)
    d = {
        "id_categoria": str(SOLICITACAO_BASE["id_categoria"]),
        "descricao": SOLICITACAO_BASE["descricao"],
        "endereco_referencia": SOLICITACAO_BASE["endereco_referencia"],
        "latitude": str(SOLICITACAO_BASE["latitude"]),
        "longitude": str(SOLICITACAO_BASE["longitude"]),
        "confirmar_duplicata": "true",
    }
    resp = client.post(
        "/solicitacoes",
        data=d,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422


def test_criar_solicitacao_falha_na_segunda_foto_rollback_e_limpa_minio(client, db):
    token = get_token(client)
    payload = {**SOLICITACAO_BASE, "descricao": "__rollback_segunda_foto__"}
    primeira_url = "http://minio-fake/primeira.jpg"
    uploads = []

    def upload_side_effect(arquivo_bytes, nome_original):
        uploads.append(nome_original)
        if len(uploads) == 1:
            return primeira_url
        raise RuntimeError("falha simulada na segunda foto")

    with patch("app.routers.solicitacoes.garantir_bucket_publico"), patch(
        "app.routers.solicitacoes.fazer_upload_foto", side_effect=upload_side_effect
    ), patch("app.routers.solicitacoes.apagar_foto_por_url_publica") as mock_apagar:
        resp = _post_solicitacoes(client, token, payload, n_fotos=2)

    assert resp.status_code == 500
    assert db.query(Solicitacao).filter(Solicitacao.descricao == "__rollback_segunda_foto__").first() is None
    assert (
        db.query(Foto)
        .join(Solicitacao, Foto.id_solicitacao == Solicitacao.id_solicitacao)
        .filter(Solicitacao.descricao == "__rollback_segunda_foto__")
        .first()
        is None
    )
    mock_apagar.assert_called_once_with(primeira_url)


def test_duplicata_detectada(client):
    token = get_token(client)
    _post_solicitacoes(client, token, {**SOLICITACAO_BASE, "confirmar_duplicata": False})
    resp = _post_solicitacoes(client, token, {**SOLICITACAO_BASE, "confirmar_duplicata": False})
    assert resp.status_code == 200
    assert "aviso" in resp.json()


def test_confirmar_duplicata(client):
    token = get_token(client)
    _post_solicitacoes(client, token, {**SOLICITACAO_BASE, "confirmar_duplicata": False})
    resp = _post_solicitacoes(client, token, {**SOLICITACAO_BASE, "confirmar_duplicata": True})
    assert resp.status_code == 201


def test_listar_minhas_solicitacoes(client):
    token = get_token(client)
    _post_solicitacoes(client, token, {**SOLICITACAO_BASE, "confirmar_duplicata": True})
    resp = client.get("/solicitacoes/minhas", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_cancelar_solicitacao(client):
    token = get_token(client)
    resp_create = _post_solicitacoes(client, token, {**SOLICITACAO_BASE, "confirmar_duplicata": True})
    assert resp_create.status_code == 201
    id_sol = resp_create.json()["id_solicitacao"]

    resp_cancel = client.patch(
        f"/solicitacoes/{id_sol}/cancelar",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp_cancel.status_code == 200
    assert resp_cancel.json()["status"] == "CANCELADO"


def test_cancelar_solicitacao_nao_pendente(client, db):
    token = get_token(client)
    resp_create = _post_solicitacoes(client, token, {**SOLICITACAO_BASE, "confirmar_duplicata": True})
    assert resp_create.status_code == 201
    id_sol = resp_create.json()["id_solicitacao"]

    # Altera o status manualmente para EM_ANALISE usando a mesma sessão do cliente
    from app.models import Solicitacao
    from app.models.solicitacao import StatusSolicitacao
    sol = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_sol).first()
    sol.status = StatusSolicitacao.EM_ANALISE
    db.commit()

    resp = client.patch(
        f"/solicitacoes/{id_sol}/cancelar",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400


def test_listar_categorias(client):
    # Categorias são públicas — não requer autenticação
    resp = client.get("/categorias")
    assert resp.status_code == 200
    assert len(resp.json()) == 4
