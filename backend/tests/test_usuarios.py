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
