import pytest
from datetime import date
from sqlalchemy.orm import sessionmaker

from app.models import Categoria

USUARIO_BASE = {
    "cpf": "52998224725",
    "nome_usuario": "Usuário Teste",
    "email": "teste@email.com",
    "senha": "senha123",
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


def test_criar_solicitacao_sucesso(client):
    token = get_token(client)
    resp = client.post(
        "/solicitacoes",
        json=SOLICITACAO_BASE,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "protocolo" in data
    assert data["status"] == "PENDENTE"


def test_criar_solicitacao_sem_autenticacao(client):
    resp = client.post("/solicitacoes", json=SOLICITACAO_BASE)
    assert resp.status_code == 401


def test_duplicata_detectada(client):
    token = get_token(client)
    # Primeira solicitação na localização
    client.post(
        "/solicitacoes",
        json={**SOLICITACAO_BASE, "confirmar_duplicata": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    # Segunda solicitação no mesmo local sem confirmar — deve retornar aviso com status 200
    resp = client.post(
        "/solicitacoes",
        json={**SOLICITACAO_BASE, "confirmar_duplicata": False},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert "aviso" in resp.json()


def test_confirmar_duplicata(client):
    token = get_token(client)
    # Com confirmar_duplicata=True a solicitação deve ser criada mesmo com duplicata próxima
    resp = client.post(
        "/solicitacoes",
        json={**SOLICITACAO_BASE, "confirmar_duplicata": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201


def test_listar_minhas_solicitacoes(client):
    token = get_token(client)
    client.post(
        "/solicitacoes",
        json={**SOLICITACAO_BASE, "confirmar_duplicata": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = client.get("/solicitacoes/minhas", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_cancelar_solicitacao(client):
    token = get_token(client)
    resp_create = client.post(
        "/solicitacoes",
        json={**SOLICITACAO_BASE, "confirmar_duplicata": True},
        headers={"Authorization": f"Bearer {token}"},
    )
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
    resp_create = client.post(
        "/solicitacoes",
        json={**SOLICITACAO_BASE, "confirmar_duplicata": True},
        headers={"Authorization": f"Bearer {token}"},
    )
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
