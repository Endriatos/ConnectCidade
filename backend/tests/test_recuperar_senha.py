import re
from unittest.mock import patch

from tests.conftest import _cadastrar_e_logar, _gerar_cpf

# Seeds a partir de 1100 para não colidir com outros arquivos de teste

_NOVA_SENHA = "NovaSenha@456"


def _extrair_token_do_email(mock_enviar) -> str:
    """
    Inspeciona o argumento corpo_html da última chamada a enviar_email
    e extrai o valor do query param ?token= do link de recuperação.
    """
    # call_args é (args, kwargs); corpo_html é o terceiro argumento posicional
    corpo_html = mock_enviar.call_args[0][2]
    match = re.search(r"\?token=([^\s\"<]+)", corpo_html)
    assert match, "Token não encontrado no corpo do e-mail"
    return match.group(1)


def test_recuperar_senha_email_existente(client):
    """Solicitar recuperação com e-mail cadastrado deve retornar 200 e disparar envio de e-mail."""
    # Cria usuário exclusivo para este teste
    _cadastrar_e_logar(client, _gerar_cpf(1100), "rec1100@email.com")

    with patch("app.routers.auth.enviar_email") as mock_enviar:
        resp = client.post("/auth/recuperar-senha", json={"email": "rec1100@email.com"})

    assert resp.status_code == 200
    # Confirma que o e-mail foi enviado exatamente uma vez
    mock_enviar.assert_called_once()


def test_recuperar_senha_email_inexistente(client):
    """Solicitar recuperação com e-mail não cadastrado deve retornar 200 sem enviar e-mail."""
    with patch("app.routers.auth.enviar_email") as mock_enviar:
        resp = client.post("/auth/recuperar-senha", json={"email": "naoexiste@email.com"})

    assert resp.status_code == 200
    # E-mail não deve ser enviado — evita enumeração de contas
    mock_enviar.assert_not_called()


def test_redefinir_senha_token_valido(client):
    """Token válido gerado pelo fluxo de recuperação deve permitir redefinir a senha e logar com ela."""
    # Cria usuário exclusivo para este teste
    cpf = _gerar_cpf(1101)
    _cadastrar_e_logar(client, cpf, "rec1101@email.com")

    with patch("app.routers.auth.enviar_email") as mock_enviar:
        client.post("/auth/recuperar-senha", json={"email": "rec1101@email.com"})
        token_bruto = _extrair_token_do_email(mock_enviar)

    # Redefine a senha usando o token extraído do e-mail
    resp = client.post(
        "/auth/redefinir-senha",
        json={"token": token_bruto, "nova_senha": _NOVA_SENHA},
    )
    assert resp.status_code == 200

    # Confirma que o login com a nova senha funciona corretamente
    resp_login = client.post("/auth/login", json={"cpf": cpf, "senha": _NOVA_SENHA})
    assert resp_login.status_code == 200
    assert "access_token" in resp_login.json()


def test_redefinir_senha_token_invalido(client):
    """Token inexistente ou malformado deve retornar 400."""
    with patch("app.routers.auth.enviar_email"):
        resp = client.post(
            "/auth/redefinir-senha",
            json={"token": "tokeninvalido", "nova_senha": _NOVA_SENHA},
        )

    assert resp.status_code == 400


def test_redefinir_senha_token_ja_usado(client):
    """Reutilizar um token já consumido deve retornar 400 na segunda tentativa."""
    # Cria usuário exclusivo para este teste
    _cadastrar_e_logar(client, _gerar_cpf(1102), "rec1102@email.com")

    with patch("app.routers.auth.enviar_email") as mock_enviar:
        client.post("/auth/recuperar-senha", json={"email": "rec1102@email.com"})
        token_bruto = _extrair_token_do_email(mock_enviar)

    # Primeira redefinição — deve funcionar
    client.post(
        "/auth/redefinir-senha",
        json={"token": token_bruto, "nova_senha": _NOVA_SENHA},
    )

    # Segunda tentativa com o mesmo token — deve ser rejeitada
    resp = client.post(
        "/auth/redefinir-senha",
        json={"token": token_bruto, "nova_senha": _NOVA_SENHA},
    )
    assert resp.status_code == 400


def test_redefinir_senha_fraca(client):
    """Nova senha que não atende aos requisitos de complexidade deve retornar 422."""
    # Cria usuário exclusivo para este teste
    _cadastrar_e_logar(client, _gerar_cpf(1103), "rec1103@email.com")

    with patch("app.routers.auth.enviar_email") as mock_enviar:
        client.post("/auth/recuperar-senha", json={"email": "rec1103@email.com"})
        token_bruto = _extrair_token_do_email(mock_enviar)

    # "fraca" viola todos os requisitos: menos de 8 chars, sem maiúscula, sem número, sem especial
    resp = client.post(
        "/auth/redefinir-senha",
        json={"token": token_bruto, "nova_senha": "fraca"},
    )
    assert resp.status_code == 422


def test_redefinir_senha_token_invalido_nao_revela_email(client):
    """
    A resposta de recuperar-senha deve ser idêntica para e-mails existentes e inexistentes,
    impedindo que um atacante descubra quais e-mails estão cadastrados.
    """
    # Cria usuário exclusivo para este teste
    _cadastrar_e_logar(client, _gerar_cpf(1104), "rec1104@email.com")

    with patch("app.routers.auth.enviar_email"):
        resp_existente = client.post(
            "/auth/recuperar-senha", json={"email": "rec1104@email.com"}
        )
        resp_inexistente = client.post(
            "/auth/recuperar-senha", json={"email": "naoexiste9999@email.com"}
        )

    # Ambas as respostas devem ter o mesmo status e a mesma mensagem
    assert resp_existente.status_code == resp_inexistente.status_code == 200
    assert resp_existente.json() == resp_inexistente.json()
