import io
from datetime import date
from unittest.mock import patch

import pytest
from PIL import Image

# ---------------------------------------------------------------------------
# Helpers de dados base
# ---------------------------------------------------------------------------

SOLICITACAO_BASE = {
    "id_categoria": 1,
    "descricao": "Buraco na calçada",
    "endereco_referencia": "Av. Teste, 456",
    "latitude": -23.550520,
    "longitude": -46.633308,
    "confirmar_duplicata": True,
}


def _jpeg_bytes() -> bytes:
    """Gera bytes de um JPEG mínimo válido usando Pillow (100x100 vermelho)."""
    img = Image.new("RGB", (100, 100), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _cadastrar_e_logar(client, cpf: str, email: str) -> str:
    """Cadastra um usuário (ignora se já existe) e retorna o access token."""
    client.post(
        "/auth/cadastro",
        json={
            "cpf": cpf,
            "nome_usuario": f"Usuário {cpf}",
            "email": email,
            "senha": "senha123",
            "data_nascimento": str(date(1995, 1, 1)),
        },
    )
    resp = client.post("/auth/login", json={"cpf": cpf, "senha": "senha123"})
    return resp.json()["access_token"]


def _criar_solicitacao(client, token: str) -> int:
    """Cria uma solicitação e retorna o id_solicitacao."""
    resp = client.post(
        "/solicitacoes",
        json=SOLICITACAO_BASE,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.json()["id_solicitacao"]


# ---------------------------------------------------------------------------
# Fixture: cadastra usuário principal, faz login e cria uma solicitação
# ---------------------------------------------------------------------------

@pytest.fixture
def usuario_e_solicitacao(client):
    """Retorna (token, id_solicitacao) do usuário principal dos testes de fotos."""
    token = _cadastrar_e_logar(client, "11144477735", "fotos@email.com")
    id_sol = _criar_solicitacao(client, token)
    return token, id_sol


# ---------------------------------------------------------------------------
# Contexto padrão de mock: bloqueia chamadas reais ao MinIO em todos os testes
# ---------------------------------------------------------------------------

MOCK_BUCKET = patch("app.routers.fotos.garantir_bucket_publico")
MOCK_UPLOAD = patch("app.routers.fotos.fazer_upload_foto", return_value="http://minio-fake/foto.jpg")


def _upload(client, token: str, id_sol: int, jpeg: bytes = None):
    """Envia um arquivo de foto para o endpoint de upload."""
    if jpeg is None:
        jpeg = _jpeg_bytes()
    return client.post(
        f"/solicitacoes/{id_sol}/fotos",
        files={"arquivo": ("foto.jpg", jpeg, "image/jpeg")},
        headers={"Authorization": f"Bearer {token}"},
    )


# ---------------------------------------------------------------------------
# Testes
# ---------------------------------------------------------------------------

def test_upload_foto_sucesso(client, usuario_e_solicitacao):
    """Upload válido deve retornar 201 com caminho_arquivo e ordem=1."""
    token, id_sol = usuario_e_solicitacao
    with MOCK_BUCKET, MOCK_UPLOAD:
        resp = _upload(client, token, id_sol)

    assert resp.status_code == 201
    data = resp.json()
    assert "minio-fake" in data["caminho_arquivo"]
    assert data["ordem"] == 1


def test_upload_segunda_foto(client, usuario_e_solicitacao):
    """Segunda foto enviada deve ter ordem=2."""
    token, id_sol = usuario_e_solicitacao
    with MOCK_BUCKET, MOCK_UPLOAD:
        _upload(client, token, id_sol)           # primeira foto
        resp = _upload(client, token, id_sol)    # segunda foto

    assert resp.status_code == 201
    assert resp.json()["ordem"] == 2


def test_upload_sem_autenticacao(client, usuario_e_solicitacao):
    """Requisição sem token deve ser rejeitada com 401 ou 403."""
    _, id_sol = usuario_e_solicitacao
    with MOCK_BUCKET, MOCK_UPLOAD:
        resp = client.post(
            f"/solicitacoes/{id_sol}/fotos",
            files={"arquivo": ("foto.jpg", _jpeg_bytes(), "image/jpeg")},
        )
    assert resp.status_code in (401, 403)


def test_upload_solicitacao_inexistente(client, usuario_e_solicitacao):
    """Upload em solicitação que não existe deve retornar 404."""
    token, _ = usuario_e_solicitacao
    with MOCK_BUCKET, MOCK_UPLOAD:
        resp = _upload(client, token, id_sol=999999)
    assert resp.status_code == 404


def test_upload_solicitacao_de_outro_usuario(client, usuario_e_solicitacao):
    """Usuário tentando adicionar foto à solicitação de outro deve receber 403."""
    token_dono, id_sol = usuario_e_solicitacao

    # Cadastra segundo usuário e tenta fazer upload na solicitação do primeiro
    token_outro = _cadastrar_e_logar(client, "98765432100", "outro@email.com")
    with MOCK_BUCKET, MOCK_UPLOAD:
        resp = _upload(client, token_outro, id_sol)
    assert resp.status_code == 403


def test_limite_cinco_fotos(client, usuario_e_solicitacao):
    """Após 5 fotos, o sexto upload deve retornar 400."""
    token, id_sol = usuario_e_solicitacao
    with MOCK_BUCKET, MOCK_UPLOAD:
        for _ in range(5):
            r = _upload(client, token, id_sol)
            assert r.status_code == 201

        resp = _upload(client, token, id_sol)   # sexta foto — deve falhar
    assert resp.status_code == 400


def test_listar_fotos(client, usuario_e_solicitacao):
    """Foto enviada deve aparecer no GET de listagem da solicitação."""
    token, id_sol = usuario_e_solicitacao
    with MOCK_BUCKET, MOCK_UPLOAD:
        _upload(client, token, id_sol)

    resp = client.get(
        f"/solicitacoes/{id_sol}/fotos",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    fotos = resp.json()
    assert len(fotos) >= 1
    assert "minio-fake" in fotos[0]["caminho_arquivo"]
