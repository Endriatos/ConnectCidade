from app.models.solicitacao import Solicitacao, StatusSolicitacao
from tests.conftest import _cadastrar_e_logar, _criar_solicitacao, _gerar_cpf


# ---------------------------------------------------------------------------
# Testes de apoio (POST /apoios/{id_solicitacao})
# ---------------------------------------------------------------------------


def test_apoiar_sucesso(client):
    """Um usuário diferente do autor consegue apoiar uma solicitação — espera 204."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(1), "autor_apoio@email.com")
    token_apoiador = _cadastrar_e_logar(client, _gerar_cpf(2), "apoiador@email.com")

    id_sol = _criar_solicitacao(client, token_autor)

    resp = client.post(
        f"/apoios/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    )
    assert resp.status_code == 204


def test_apoiar_duplicado(client):
    """O mesmo usuário não pode apoiar a mesma solicitação duas vezes — espera 400."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(3), "autor_dup@email.com")
    token_apoiador = _cadastrar_e_logar(client, _gerar_cpf(4), "apoiador_dup@email.com")

    id_sol = _criar_solicitacao(client, token_autor)

    # Primeiro apoio deve funcionar
    client.post(f"/apoios/{id_sol}", headers={"Authorization": f"Bearer {token_apoiador}"})

    # Segundo apoio deve ser rejeitado
    resp = client.post(
        f"/apoios/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    )
    assert resp.status_code == 400


def test_apoiar_solicitacao_inexistente(client):
    """Apoiar uma solicitação com id inexistente deve retornar 404."""
    token = _cadastrar_e_logar(client, _gerar_cpf(5), "inexistente_apoio@email.com")

    resp = client.post(
        "/apoios/999999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404


def test_apoiar_solicitacao_cancelada(client, db):
    """Apoiar uma solicitação cancelada deve retornar 400."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(6), "autor_cancel@email.com")
    token_apoiador = _cadastrar_e_logar(client, _gerar_cpf(7), "apoiador_cancel@email.com")

    id_sol = _criar_solicitacao(client, token_autor)

    # Cancela a solicitação diretamente no banco
    sol = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_sol).first()
    sol.status = StatusSolicitacao.CANCELADO
    db.commit()

    resp = client.post(
        f"/apoios/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    )
    assert resp.status_code == 400


def test_apoiar_sem_autenticacao(client):
    """Tentar apoiar sem token deve retornar 401 ou 403."""
    resp = client.post("/apoios/1")
    assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Testes de retirada de apoio (DELETE /apoios/{id_solicitacao})
# ---------------------------------------------------------------------------


def test_retirar_apoio_sucesso(client):
    """Apoiar e depois retirar o apoio deve retornar 204 em ambas as operações."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(8), "autor_ret@email.com")
    token_apoiador = _cadastrar_e_logar(client, _gerar_cpf(9), "apoiador_ret@email.com")

    id_sol = _criar_solicitacao(client, token_autor)

    # Apoia primeiro
    client.post(f"/apoios/{id_sol}", headers={"Authorization": f"Bearer {token_apoiador}"})

    # Retira o apoio
    resp = client.delete(
        f"/apoios/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    )
    assert resp.status_code == 204


def test_retirar_apoio_sem_ter_apoiado(client):
    """Retirar apoio sem ter apoiado antes deve retornar 400 ou 404."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(10), "autor_semret@email.com")
    token_usuario = _cadastrar_e_logar(client, _gerar_cpf(11), "usuario_semret@email.com")

    id_sol = _criar_solicitacao(client, token_autor)

    resp = client.delete(
        f"/apoios/{id_sol}",
        headers={"Authorization": f"Bearer {token_usuario}"},
    )
    assert resp.status_code in (400, 404)


def test_retirar_apoio_sem_autenticacao(client):
    """Tentar retirar apoio sem token deve retornar 401 ou 403."""
    resp = client.delete("/apoios/1")
    assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Testes do campo ja_apoiado no detalhe da solicitação
# ---------------------------------------------------------------------------


def test_ja_apoiado_no_detalhe(client):
    """Após apoiar, GET /solicitacoes/{id} deve retornar ja_apoiado: true."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(12), "autor_jaapoiado@email.com")
    token_apoiador = _cadastrar_e_logar(client, _gerar_cpf(13), "apoiador_jaapoiado@email.com")

    id_sol = _criar_solicitacao(client, token_autor)
    client.post(f"/apoios/{id_sol}", headers={"Authorization": f"Bearer {token_apoiador}"})

    resp = client.get(
        f"/solicitacoes/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    )
    assert resp.status_code == 200
    assert resp.json()["ja_apoiado"] is True


def test_nao_apoiado_no_detalhe(client):
    """Para usuário que não apoiou, GET /solicitacoes/{id} deve retornar ja_apoiado: false."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(14), "autor_naoapoiado@email.com")
    token_outro = _cadastrar_e_logar(client, _gerar_cpf(15), "outro_naoapoiado@email.com")

    id_sol = _criar_solicitacao(client, token_autor)

    resp = client.get(
        f"/solicitacoes/{id_sol}",
        headers={"Authorization": f"Bearer {token_outro}"},
    )
    assert resp.status_code == 200
    assert resp.json()["ja_apoiado"] is False


# ---------------------------------------------------------------------------
# Testes do campo contador_apoios
# ---------------------------------------------------------------------------


def test_contador_apoios_incrementa(client):
    """Após apoiar, contador_apoios deve ter aumentado 1 em relação ao valor inicial."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(16), "autor_incr@email.com")
    token_apoiador = _cadastrar_e_logar(client, _gerar_cpf(17), "apoiador_incr@email.com")

    id_sol = _criar_solicitacao(client, token_autor)

    # Captura o contador antes do apoio
    antes = client.get(
        f"/solicitacoes/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    ).json()["contador_apoios"]

    client.post(f"/apoios/{id_sol}", headers={"Authorization": f"Bearer {token_apoiador}"})

    # Verifica que o contador aumentou exatamente 1
    depois = client.get(
        f"/solicitacoes/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    ).json()["contador_apoios"]

    assert depois == antes + 1


def test_contador_apoios_decrementa(client):
    """Após apoiar e retirar o apoio, contador_apoios deve voltar ao valor original."""
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(18), "autor_decr@email.com")
    token_apoiador = _cadastrar_e_logar(client, _gerar_cpf(19), "apoiador_decr@email.com")

    id_sol = _criar_solicitacao(client, token_autor)

    # Captura o contador inicial
    inicial = client.get(
        f"/solicitacoes/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    ).json()["contador_apoios"]

    # Apoia e depois retira
    client.post(f"/apoios/{id_sol}", headers={"Authorization": f"Bearer {token_apoiador}"})
    client.delete(f"/apoios/{id_sol}", headers={"Authorization": f"Bearer {token_apoiador}"})

    # Verifica que voltou ao valor inicial
    final = client.get(
        f"/solicitacoes/{id_sol}",
        headers={"Authorization": f"Bearer {token_apoiador}"},
    ).json()["contador_apoios"]

    assert final == inicial
