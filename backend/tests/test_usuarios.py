from tests.conftest import _cadastrar_e_logar, _gerar_cpf

# Seeds a partir de 600 para não colidir com CPFs de outros arquivos de teste


def test_atualizar_perfil_sucesso(client):
    """Usuário autenticado atualiza o nome e recebe 200 com o novo nome na resposta."""
    token = _cadastrar_e_logar(client, _gerar_cpf(600), "usuario_upd1@email.com")

    resp = client.patch(
        "/usuarios/me",
        json={"nome_usuario": "Nome Atualizado"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    # O nome retornado deve refletir o valor enviado na requisição
    assert resp.json()["nome_usuario"] == "Nome Atualizado"


def test_atualizar_perfil_parcial(client):
    """Atualizar apenas o telefone não deve alterar o nome_usuario original."""
    cpf = _gerar_cpf(601)
    token = _cadastrar_e_logar(client, cpf, "usuario_upd2@email.com")

    # Primeiro obtém o nome original registrado no cadastro
    resp_original = client.patch(
        "/usuarios/me",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    nome_original = resp_original.json()["nome_usuario"]

    # Atualiza apenas o telefone, sem tocar no nome
    resp = client.patch(
        "/usuarios/me",
        json={"telefone": "51999990000"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    # O nome deve permanecer igual ao original — campos omitidos não são sobrescritos
    assert resp.json()["nome_usuario"] == nome_original


def test_atualizar_perfil_sem_autenticacao(client):
    """Acessar PATCH /usuarios/me sem token deve retornar 401 ou 403."""
    resp = client.patch("/usuarios/me", json={"nome_usuario": "Sem Token"})
    assert resp.status_code in (401, 403)


def test_atualizar_perfil_body_vazio(client):
    """
    Enviar body vazio {} deve retornar 200 sem alterar nenhum dado.

    Comportamento correto: todos os campos de UsuarioUpdate são opcionais,
    então um body vazio é válido e resulta em uma atualização sem efeito.
    """
    token = _cadastrar_e_logar(client, _gerar_cpf(602), "usuario_upd3@email.com")

    # Obtém o nome atual antes de enviar o body vazio
    resp_antes = client.patch(
        "/usuarios/me",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    nome_antes = resp_antes.json()["nome_usuario"]

    # Envia body vazio — nenhum campo deve ser modificado
    resp = client.patch(
        "/usuarios/me",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 200
    # Os dados retornados devem ser idênticos aos anteriores
    assert resp.json()["nome_usuario"] == nome_antes


# ---------------------------------------------------------------------------
# Testes de alteração de senha (PATCH /usuarios/me/senha)
# Seeds a partir de 700 para não colidir com os testes acima
# ---------------------------------------------------------------------------


def test_alterar_senha_sucesso(client):
    """Alteração com senha_atual correta deve retornar 204 e permitir login com a nova senha."""
    cpf = _gerar_cpf(700)
    _cadastrar_e_logar(client, cpf, "usuario_senha1@email.com")

    # Obtém token com a senha original para chamar o endpoint protegido
    token = _cadastrar_e_logar(client, cpf, "usuario_senha1@email.com")

    resp = client.patch(
        "/usuarios/me/senha",
        json={"senha_atual": "Senha@123", "senha_nova": "NovaSenha@456"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 204

    # Confirma que o login com a nova senha funciona corretamente
    resp_login = client.post("/auth/login", json={"cpf": cpf, "senha": "NovaSenha@456"})
    assert resp_login.status_code == 200
    assert "access_token" in resp_login.json()


def test_alterar_senha_atual_incorreta(client):
    """Enviar senha_atual errada deve retornar 400 com mensagem de erro."""
    cpf = _gerar_cpf(701)
    token = _cadastrar_e_logar(client, cpf, "usuario_senha2@email.com")

    resp = client.patch(
        "/usuarios/me/senha",
        # Senha atual deliberadamente incorreta para acionar o erro do crud
        json={"senha_atual": "SenhaErrada!", "senha_nova": "NovaSenha@456"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 400


def test_alterar_senha_nova_muito_curta(client):
    """Enviar senha_nova que não atende aos requisitos deve retornar 422 (validação do Pydantic)."""
    cpf = _gerar_cpf(702)
    token = _cadastrar_e_logar(client, cpf, "usuario_senha3@email.com")

    resp = client.patch(
        "/usuarios/me/senha",
        # senha_nova com apenas 3 caracteres viola o mínimo de 8 exigido pelo validator
        json={"senha_atual": "Senha@123", "senha_nova": "abc"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 422


def test_alterar_senha_sem_autenticacao(client):
    """Acessar PATCH /usuarios/me/senha sem token deve retornar 401 ou 403."""
    resp = client.patch(
        "/usuarios/me/senha",
        json={"senha_atual": "Senha@123", "senha_nova": "NovaSenha@456"},
    )
    assert resp.status_code in (401, 403)
