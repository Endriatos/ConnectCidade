from datetime import date

USUARIO_BASE = {
    "cpf": "52998224725",
    "nome_usuario": "Teste Silva",
    "email": "teste@email.com",
    "senha": "Senha@123",
    "data_nascimento": str(date(1995, 6, 15)),
}


def test_cadastro_sucesso(client):
    resp = client.post("/auth/cadastro", json=USUARIO_BASE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["cpf"] == USUARIO_BASE["cpf"]
    assert data["nome_usuario"] == USUARIO_BASE["nome_usuario"]
    assert data["email"] == USUARIO_BASE["email"]
    assert data["tipo_usuario"] == "CIDADAO"
    assert data["status_ativo"] is True


def test_cadastro_cpf_invalido(client):
    payload = {**USUARIO_BASE, "cpf": "00000000000"}
    resp = client.post("/auth/cadastro", json=payload)
    assert resp.status_code == 422


def test_cadastro_cpf_duplicado(client):
    client.post("/auth/cadastro", json=USUARIO_BASE)
    resp = client.post("/auth/cadastro", json=USUARIO_BASE)
    assert resp.status_code == 400


def test_cadastro_email_duplicado(client):
    client.post("/auth/cadastro", json=USUARIO_BASE)
    payload = {**USUARIO_BASE, "cpf": "11144477735"}
    resp = client.post("/auth/cadastro", json=payload)
    assert resp.status_code == 400


def test_login_sucesso(client):
    client.post("/auth/cadastro", json=USUARIO_BASE)
    resp = client.post("/auth/login", json={"cpf": USUARIO_BASE["cpf"], "senha": USUARIO_BASE["senha"]})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "tipo_usuario" in data


def test_login_senha_errada(client):
    client.post("/auth/cadastro", json=USUARIO_BASE)
    resp = client.post("/auth/login", json={"cpf": USUARIO_BASE["cpf"], "senha": "errada"})
    assert resp.status_code == 401


def test_login_cpf_inexistente(client):
    resp = client.post("/auth/login", json={"cpf": "52998224725", "senha": "qualquer"})
    assert resp.status_code == 401


def test_me_autenticado(client):
    client.post("/auth/cadastro", json=USUARIO_BASE)
    login = client.post("/auth/login", json={"cpf": USUARIO_BASE["cpf"], "senha": USUARIO_BASE["senha"]})
    token = login.json()["access_token"]
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["cpf"] == USUARIO_BASE["cpf"]


def test_me_sem_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401
