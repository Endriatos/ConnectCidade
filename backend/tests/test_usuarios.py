from app.models.solicitacao import Solicitacao
from tests.conftest import _cadastrar_e_logar, _criar_solicitacao, _gerar_cpf

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


# ---------------------------------------------------------------------------
# Testes de exclusão de conta (DELETE /usuarios/me)
# Seeds a partir de 800 para não colidir com os testes acima
# ---------------------------------------------------------------------------


def test_excluir_conta_sucesso(client):
    """DELETE /usuarios/me com token válido deve retornar 204 sem corpo na resposta."""
    token = _cadastrar_e_logar(client, _gerar_cpf(800), "usuario_del1@email.com")

    resp = client.delete(
        "/usuarios/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 204


def test_excluir_conta_impede_login(client):
    """Após excluir a conta, o login com as credenciais originais deve retornar 401."""
    cpf = _gerar_cpf(801)
    token = _cadastrar_e_logar(client, cpf, "usuario_del2@email.com")

    # Exclui (anonimiza) a conta do usuário
    client.delete(
        "/usuarios/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Tenta logar com o CPF original — deve ser recusado pois os dados foram anonimizados
    resp_login = client.post("/auth/login", json={"cpf": cpf, "senha": "Senha@123"})
    assert resp_login.status_code == 401


def test_excluir_conta_sem_autenticacao(client):
    """Acessar DELETE /usuarios/me sem token deve retornar 401 ou 403."""
    resp = client.delete("/usuarios/me")
    assert resp.status_code in (401, 403)


def test_excluir_conta_preserva_solicitacoes(client, db):
    """
    A exclusão de conta não deve apagar as solicitações do usuário no banco.

    A conta é anonimizada (não deletada) para preservar a integridade referencial
    das solicitações vinculadas ao id_autor.
    """
    token = _cadastrar_e_logar(client, _gerar_cpf(802), "usuario_del3@email.com")

    # Cria uma solicitação antes de excluir a conta
    id_sol = _criar_solicitacao(client, token)

    # Exclui a conta do usuário
    client.delete(
        "/usuarios/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Verifica diretamente no banco que a solicitação ainda existe com o mesmo id
    solicitacao = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_sol).first()
    assert solicitacao is not None
    assert solicitacao.id_solicitacao == id_sol
