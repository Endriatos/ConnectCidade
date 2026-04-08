from unittest.mock import patch

import pytest

from app.models.usuario import TipoUsuario, Usuario
from tests.conftest import (
    _cadastrar_e_logar,
    _criar_admin_e_logar,
    _criar_solicitacao,
    _gerar_cpf,
)

# Seeds a partir de 1200 para não colidir com os outros arquivos de teste

# ---------------------------------------------------------------------------
# GET /admin/usuarios/administradores
# ---------------------------------------------------------------------------


def test_listar_admins_sem_token(client):
    """Acessar listagem de admins sem token deve retornar 401."""
    resp = client.get("/admin/usuarios/administradores")
    assert resp.status_code == 401


def test_listar_admins_sucesso(client, db):
    """Admin autenticado recebe 200 e a lista contém o próprio admin."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1200), "au_admin1@email.com")

    # Obtém o id do admin autenticado para confirmar que está na lista
    id_admin = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token_admin}"}
    ).json()["id_usuario"]

    resp = client.get(
        "/admin/usuarios/administradores",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    ids_retornados = [item["id_usuario"] for item in resp.json()]
    # O próprio admin autenticado deve aparecer na listagem
    assert id_admin in ids_retornados


# ---------------------------------------------------------------------------
# GET /admin/usuarios/buscar?cpf=
# ---------------------------------------------------------------------------


def test_buscar_sem_token(client):
    """Busca por CPF sem token deve retornar 401."""
    resp = client.get(f"/admin/usuarios/buscar?cpf={_gerar_cpf(1201)}")
    assert resp.status_code == 401


def test_buscar_cpf_invalido(client, db):
    """CPF com todos os dígitos iguais é inválido pelo critério da Receita Federal — espera 422."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1201), "au_admin2@email.com")

    resp = client.get(
        "/admin/usuarios/buscar?cpf=00000000000",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 422


def test_buscar_cpf_nao_cadastrado(client, db):
    """CPF válido mas sem cadastro no sistema deve retornar 404."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1202), "au_admin3@email.com")

    # Usa um CPF válido gerado por seed alto, improvável de estar cadastrado
    cpf_ausente = _gerar_cpf(9999)

    resp = client.get(
        f"/admin/usuarios/buscar?cpf={cpf_ausente}",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 404


def test_buscar_cidadao_ja_e_admin_false(client, db):
    """Busca pelo CPF de um cidadão comum deve retornar 200 com ja_e_admin=False."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1203), "au_cidadao1@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1204), "au_admin4@email.com")

    resp = client.get(
        f"/admin/usuarios/buscar?cpf={_gerar_cpf(1203)}",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    assert resp.json()["ja_e_admin"] is False


def test_buscar_admin_ja_e_admin_true(client, db):
    """Busca pelo CPF de um administrador deve retornar 200 com ja_e_admin=True."""
    # Admin que será buscado (sujeito)
    _criar_admin_e_logar(client, db, _gerar_cpf(1205), "au_admin5@email.com")
    # Admin autenticado para realizar a busca
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1206), "au_admin6@email.com")

    resp = client.get(
        f"/admin/usuarios/buscar?cpf={_gerar_cpf(1205)}",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    assert resp.json()["ja_e_admin"] is True


# ---------------------------------------------------------------------------
# GET /admin/usuarios/{id}
# ---------------------------------------------------------------------------


def test_detalhar_sem_token(client):
    """Acessar detalhe de usuário sem token deve retornar 401."""
    resp = client.get("/admin/usuarios/999999")
    assert resp.status_code == 401


def test_detalhar_inexistente(client, db):
    """Admin busca usuário com id inexistente — espera 404."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1207), "au_admin7@email.com")

    resp = client.get(
        "/admin/usuarios/999999",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 404


def test_detalhar_cidadao_sem_solicitacoes(client, db):
    """Cidadão sem solicitações deve retornar 200 com solicitacoes=[]."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1208), "au_cidadao2@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1209), "au_admin8@email.com")

    id_cidadao = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token_cidadao}"}
    ).json()["id_usuario"]

    resp = client.get(
        f"/admin/usuarios/{id_cidadao}",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    dados = resp.json()
    assert dados["id_usuario"] == id_cidadao
    # Cidadão não tem nenhuma solicitação criada
    assert dados["solicitacoes"] == []


def test_detalhar_cidadao_com_solicitacoes(client, db):
    """Cidadão com solicitações criadas deve retornar 200 com lista não vazia."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1210), "au_cidadao3@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1211), "au_admin9@email.com")

    # Cria duas solicitações para o cidadão
    # Cria duas solicitações para o cidadão
    _criar_solicitacao(client, token_cidadao)
    _criar_solicitacao(client, token_cidadao)

    id_cidadao = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token_cidadao}"}
    ).json()["id_usuario"]

    resp = client.get(
        f"/admin/usuarios/{id_cidadao}",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    dados = resp.json()
    # Deve haver ao menos as 2 solicitações criadas acima
    assert len(dados["solicitacoes"]) >= 2
    # Cada item deve ter os campos esperados pelo schema
    for sol in dados["solicitacoes"]:
        assert "id_solicitacao" in sol
        assert "protocolo" in sol
        assert "nome_categoria" in sol
        assert "status" in sol
        assert "data_registro" in sol


# ---------------------------------------------------------------------------
# PATCH /admin/usuarios/{id}/email
# ---------------------------------------------------------------------------


def test_alterar_email_sem_token(client):
    """Alterar email sem token deve retornar 401."""
    resp = client.patch("/admin/usuarios/999999/email", json={"email": "x@x.com"})
    assert resp.status_code == 401


def test_alterar_email_inexistente(client, db):
    """Admin tenta alterar email de usuário com id inexistente — espera 404."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1212), "au_admin10@email.com")

    resp = client.patch(
        "/admin/usuarios/999999/email",
        json={"email": "novo@email.com"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 404


def test_alterar_email_em_uso(client, db):
    """Tentar usar um email já cadastrado por outro usuário deve retornar 400."""
    # Cidadão alvo que terá o email alterado
    token_alvo = _cadastrar_e_logar(client, _gerar_cpf(1213), "au_cidadao4@email.com")
    # Cidadão cujo email já está em uso no sistema
    _cadastrar_e_logar(client, _gerar_cpf(1214), "au_cidadao5@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1215), "au_admin11@email.com")

    id_alvo = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token_alvo}"}
    ).json()["id_usuario"]

    # Tenta alterar para o email que já pertence ao segundo cidadão
    resp = client.patch(
        f"/admin/usuarios/{id_alvo}/email",
        json={"email": "au_cidadao5@email.com"},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 400


def test_alterar_email_sucesso(client, db):
    """Email válido e único deve ser atualizado com sucesso; GET /{id} confirma o novo valor."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1216), "au_cidadao6@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1217), "au_admin12@email.com")

    id_cidadao = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token_cidadao}"}
    ).json()["id_usuario"]

    novo_email = "au_cidadao6_novo@email.com"

    resp = client.patch(
        f"/admin/usuarios/{id_cidadao}/email",
        json={"email": novo_email},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200

    # Confirma que o email foi de fato atualizado consultando o detalhe do usuário
    dados = client.get(
        f"/admin/usuarios/{id_cidadao}",
        headers={"Authorization": f"Bearer {token_admin}"},
    ).json()
    assert dados["email"] == novo_email


# ---------------------------------------------------------------------------
# PATCH /admin/usuarios/{id}/promover
# ---------------------------------------------------------------------------


def test_promover_sem_token(client):
    """Promover usuário sem token deve retornar 401."""
    resp = client.patch("/admin/usuarios/999999/promover")
    assert resp.status_code == 401


def test_promover_inexistente(client, db):
    """Admin tenta promover usuário com id inexistente — espera 404."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1218), "au_admin13@email.com")

    resp = client.patch(
        "/admin/usuarios/999999/promover",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 404


def test_promover_ja_admin(client, db):
    """Tentar promover quem já é ADMIN deve retornar 400."""
    # Admin sujeito (será o alvo da promoção)
    _criar_admin_e_logar(client, db, _gerar_cpf(1219), "au_admin14@email.com")
    # Admin autenticado para realizar a operação
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1220), "au_admin15@email.com")

    id_sujeito = client.get(
        "/admin/usuarios/buscar",
        params={"cpf": _gerar_cpf(1219)},
        headers={"Authorization": f"Bearer {token_admin}"},
    ).json()["id_usuario"]

    resp = client.patch(
        f"/admin/usuarios/{id_sujeito}/promover",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 400


def test_promover_sucesso(client, db):
    """Cidadão promovido deve ter tipo_usuario == ADMIN confirmado no banco."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1221), "au_cidadao7@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1222), "au_admin16@email.com")

    id_cidadao = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token_cidadao}"}
    ).json()["id_usuario"]

    resp = client.patch(
        f"/admin/usuarios/{id_cidadao}/promover",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200

    # Confirma diretamente no banco que o tipo_usuario foi atualizado
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_cidadao).first()
    db.refresh(usuario)
    assert usuario.tipo_usuario == TipoUsuario.ADMIN


# ---------------------------------------------------------------------------
# PATCH /admin/usuarios/{id}/revogar
# ---------------------------------------------------------------------------


def test_revogar_sem_token(client):
    """Revogar admin sem token deve retornar 401."""
    resp = client.patch("/admin/usuarios/999999/revogar")
    assert resp.status_code == 401


def test_revogar_inexistente(client, db):
    """Admin tenta revogar usuário com id inexistente — espera 404."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1223), "au_admin17@email.com")

    resp = client.patch(
        "/admin/usuarios/999999/revogar",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 404


def test_revogar_ja_cidadao(client, db):
    """Tentar revogar quem já é CIDADAO deve retornar 400."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1224), "au_cidadao8@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1225), "au_admin18@email.com")

    id_cidadao = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token_cidadao}"}
    ).json()["id_usuario"]

    resp = client.patch(
        f"/admin/usuarios/{id_cidadao}/revogar",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 400


def test_revogar_auto_revogacao(client, db):
    """Admin não pode revogar o próprio acesso — espera 403."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1226), "au_admin19@email.com")

    id_admin = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {token_admin}"}
    ).json()["id_usuario"]

    resp = client.patch(
        f"/admin/usuarios/{id_admin}/revogar",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 403


def test_revogar_sucesso(client, db):
    """Admin revogado deve ter tipo_usuario == CIDADAO confirmado no banco."""
    # Admin sujeito (terá o acesso revogado)
    _criar_admin_e_logar(client, db, _gerar_cpf(1227), "au_admin20@email.com")
    # Admin autenticado para realizar a revogação
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1228), "au_admin21@email.com")

    id_sujeito = client.get(
        "/admin/usuarios/buscar",
        params={"cpf": _gerar_cpf(1227)},
        headers={"Authorization": f"Bearer {token_admin}"},
    ).json()["id_usuario"]

    resp = client.patch(
        f"/admin/usuarios/{id_sujeito}/revogar",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200

    # Confirma diretamente no banco que o tipo_usuario foi rebaixado para CIDADAO
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_sujeito).first()
    db.refresh(usuario)
    assert usuario.tipo_usuario == TipoUsuario.CIDADAO
