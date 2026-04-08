from app.models.solicitacao import Solicitacao, StatusSolicitacao
from tests.conftest import (
    _cadastrar_e_logar,
    _criar_solicitacao,
    _gerar_cpf,
)

# Seeds a partir de 900 para não colidir com CPFs de outros arquivos de teste


def _url_avaliar(id_sol: int) -> str:
    """Monta a URL do endpoint de avaliação para uma solicitação."""
    return f"/avaliacoes/{id_sol}"


def _resolver_solicitacao(db, id_sol: int) -> None:
    """Muda o status de uma solicitação para RESOLVIDO diretamente no banco."""
    sol = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_sol).first()
    sol.status = StatusSolicitacao.RESOLVIDO
    db.commit()


def test_avaliar_sucesso(client, db):
    """Autor avalia solicitação resolvida com dados válidos — espera 201 com campos corretos."""
    token = _cadastrar_e_logar(client, _gerar_cpf(900), "avaliacao1@email.com")
    id_sol = _criar_solicitacao(client, token)

    # Resolve a solicitação diretamente no banco para habilitar a avaliação
    _resolver_solicitacao(db, id_sol)

    resp = client.post(
        _url_avaliar(id_sol),
        json={"foi_resolvido": True, "nota": 5, "comentario": "Ótimo"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 201
    dados = resp.json()
    # Verifica que os campos retornados correspondem ao que foi enviado
    assert dados["id_solicitacao"] == id_sol
    assert dados["foi_resolvido"] is True
    assert dados["nota"] == 5
    assert dados["comentario"] == "Ótimo"


def test_avaliar_solicitacao_nao_resolvida(client, db):
    """Tentar avaliar solicitação PENDENTE deve retornar 400."""
    token = _cadastrar_e_logar(client, _gerar_cpf(901), "avaliacao2@email.com")
    id_sol = _criar_solicitacao(client, token)

    # A solicitação permanece PENDENTE — não deve permitir avaliação
    resp = client.post(
        _url_avaliar(id_sol),
        json={"foi_resolvido": False, "nota": 3},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 400


def test_avaliar_solicitacao_inexistente(client, db):
    """Tentar avaliar um id que não existe deve retornar 400."""
    token = _cadastrar_e_logar(client, _gerar_cpf(902), "avaliacao3@email.com")

    resp = client.post(
        _url_avaliar(999999),
        json={"foi_resolvido": True, "nota": 4},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 400


def test_avaliar_nao_autor(client, db):
    """Usuário que não é o autor da solicitação não pode avaliá-la — espera 400."""
    # Cidadão A cria a solicitação
    token_autor = _cadastrar_e_logar(client, _gerar_cpf(903), "avaliacao4a@email.com")
    id_sol = _criar_solicitacao(client, token_autor)
    _resolver_solicitacao(db, id_sol)

    # Cidadão B tenta avaliar a solicitação do cidadão A
    token_outro = _cadastrar_e_logar(client, _gerar_cpf(904), "avaliacao4b@email.com")
    resp = client.post(
        _url_avaliar(id_sol),
        json={"foi_resolvido": True, "nota": 2},
        headers={"Authorization": f"Bearer {token_outro}"},
    )

    assert resp.status_code == 400


def test_avaliar_duplicado(client, db):
    """Autor que já avaliou a solicitação não pode avaliá-la novamente — espera 400."""
    token = _cadastrar_e_logar(client, _gerar_cpf(905), "avaliacao5@email.com")
    id_sol = _criar_solicitacao(client, token)
    _resolver_solicitacao(db, id_sol)

    # Primeira avaliação — deve ser aceita
    resp1 = client.post(
        _url_avaliar(id_sol),
        json={"foi_resolvido": True, "nota": 4},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp1.status_code == 201

    # Segunda avaliação para a mesma solicitação — deve ser rejeitada
    resp2 = client.post(
        _url_avaliar(id_sol),
        json={"foi_resolvido": True, "nota": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp2.status_code == 400


def test_avaliar_nota_invalida(client, db):
    """Enviar nota fora do intervalo 1–5 deve retornar 422 (validação do Pydantic)."""
    token = _cadastrar_e_logar(client, _gerar_cpf(906), "avaliacao6@email.com")
    id_sol = _criar_solicitacao(client, token)
    _resolver_solicitacao(db, id_sol)

    # Nota 6 viola a restrição le=5 definida no schema AvaliacaoCreate
    resp = client.post(
        _url_avaliar(id_sol),
        json={"foi_resolvido": True, "nota": 6},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert resp.status_code == 422


def test_avaliar_sem_autenticacao(client):
    """Acessar POST /avaliacoes/{id} sem token deve retornar 401 ou 403."""
    resp = client.post(
        _url_avaliar(1),
        json={"foi_resolvido": True, "nota": 4},
    )
    assert resp.status_code in (401, 403)
