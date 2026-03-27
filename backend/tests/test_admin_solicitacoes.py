from datetime import date

from passlib.context import CryptContext

from app.models.solicitacao import StatusSolicitacao
from app.models.usuario import TipoUsuario, Usuario
from tests.conftest import _cadastrar_e_logar, _criar_solicitacao, _gerar_cpf

# Seeds a partir de 300 para não colidir com CPFs de outros arquivos de teste

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _criar_admin_e_logar(client, db, cpf: str, email: str) -> str:
    """
    Insere um usuário com tipo_usuario=ADMIN diretamente no banco (sem passar pela API,
    que só permite cadastro de cidadãos) e retorna o token via login.
    """
    admin = Usuario(
        tipo_usuario=TipoUsuario.ADMIN,
        cpf=cpf,
        nome_usuario=f"Admin {cpf}",
        email=email,
        senha_hash=pwd_context.hash("senha123"),
        data_nascimento=date(1985, 1, 1),
    )
    db.add(admin)
    db.commit()

    # Realiza login pela API para obter o token JWT
    resp = client.post("/auth/login", json={"cpf": cpf, "senha": "senha123"})
    return resp.json()["access_token"]


# URL base do endpoint de admin
def _url_status(id_sol: int) -> str:
    return f"/admin/solicitacoes/{id_sol}/status"


# ---------------------------------------------------------------------------
# Testes
# ---------------------------------------------------------------------------


def test_atualizar_status_sucesso(client, db):
    """Admin muda status de PENDENTE para EM_ANALISE — espera 200 e status correto na resposta."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(300), "cidadao_admin1@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(301), "admin1@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    resp = client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANALISE", "comentario": "Analisando a ocorrência."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    assert resp.json()["status"] == "EM_ANALISE"


def test_atualizar_status_registra_timeline(client, db):
    """Após mudar o status, a timeline da solicitação deve conter 1 item com os dados corretos."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(302), "cidadao_admin2@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(303), "admin2@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANDAMENTO", "comentario": "Equipe enviada ao local."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    resp = client.get(
        f"/solicitacoes/{id_sol}/timeline",
        headers={"Authorization": f"Bearer {token_cidadao}"},
    )

    assert resp.status_code == 200
    itens = resp.json()
    assert len(itens) == 1
    # Verifica que os dados da mudança foram registrados corretamente na timeline
    assert itens[0]["status_anterior"] == "PENDENTE"
    assert itens[0]["status_novo"] == "EM_ANDAMENTO"
    assert itens[0]["comentario"] == "Equipe enviada ao local."


def test_atualizar_status_resolve_seta_data_resolucao(client, db):
    """Ao marcar como RESOLVIDO, data_resolucao não deve ser null na resposta."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(304), "cidadao_admin3@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(305), "admin3@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    resp = client.patch(
        _url_status(id_sol),
        json={"status_novo": "RESOLVIDO", "comentario": "Problema solucionado."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    # data_resolucao deve ser preenchida automaticamente ao resolver
    assert resp.json()["data_resolucao"] is not None


def test_atualizar_status_sai_de_resolvido_limpa_data_resolucao(client, db):
    """Ao sair do status RESOLVIDO, data_resolucao deve ser limpa (null)."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(306), "cidadao_admin4@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(307), "admin4@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    # Primeiro resolve a solicitação
    client.patch(
        _url_status(id_sol),
        json={"status_novo": "RESOLVIDO", "comentario": "Resolvido."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    # Depois reabre como EM_ANDAMENTO — data_resolucao deve ser apagada
    resp = client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANDAMENTO", "comentario": "Reaberto por solicitação."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    assert resp.json()["data_resolucao"] is None


def test_atualizar_status_sem_autenticacao(client):
    """Acessar o endpoint sem token deve retornar 401 ou 403."""
    resp = client.patch("/admin/solicitacoes/1/status", json={"status_novo": "EM_ANALISE", "comentario": "x"})
    assert resp.status_code in (401, 403)


def test_atualizar_status_cidadao_nao_pode(client):
    """Cidadão autenticado não pode acessar endpoint de admin — espera 403."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(308), "cidadao_admin5@email.com")

    resp = client.patch(
        "/admin/solicitacoes/1/status",
        json={"status_novo": "EM_ANALISE", "comentario": "Tentativa indevida."},
        headers={"Authorization": f"Bearer {token_cidadao}"},
    )

    assert resp.status_code == 403


def test_atualizar_status_solicitacao_inexistente(client, db):
    """Admin tenta mudar status de solicitação inexistente — espera 404."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(309), "admin5@email.com")

    resp = client.patch(
        "/admin/solicitacoes/999999/status",
        json={"status_novo": "EM_ANALISE", "comentario": "Não existe."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 404


def test_atualizar_status_comentario_vazio(client, db):
    """Enviar comentário vazio deve retornar 422 (validação do Pydantic)."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(310), "cidadao_admin6@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(311), "admin6@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    # Comentário com string vazia deve falhar na validação (min_length=1)
    resp = client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANALISE", "comentario": ""},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Testes de listagem paginada de solicitações (GET /admin/solicitacoes)
# Seeds a partir de 400 para não colidir com os testes acima
# ---------------------------------------------------------------------------


def test_listar_solicitacoes_admin_sucesso(client, db):
    """Admin acessa GET /admin/solicitacoes sem filtros e recebe 200 com estrutura paginada correta."""
    # Cria uma solicitação como cidadão para garantir pelo menos um item na listagem
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(400), "cidadao_lista1@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(401), "admin_lista1@email.com")

    _criar_solicitacao(client, token_cidadao)

    resp = client.get(
        "/admin/solicitacoes",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200

    dados = resp.json()
    # Verifica que todos os campos de paginação estão presentes na resposta
    assert "total" in dados
    assert "pagina" in dados
    assert "por_pagina" in dados
    assert "paginas" in dados
    assert "itens" in dados
    # Deve haver pelo menos a solicitação criada acima
    assert len(dados["itens"]) >= 1


def test_listar_solicitacoes_sem_autenticacao(client):
    """Acessar GET /admin/solicitacoes sem token deve retornar 401 ou 403."""
    resp = client.get("/admin/solicitacoes")
    assert resp.status_code in (401, 403)


def test_listar_solicitacoes_cidadao_nao_pode(client):
    """Cidadão autenticado não tem permissão para listar solicitações do painel admin — espera 403."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(402), "cidadao_lista2@email.com")

    resp = client.get(
        "/admin/solicitacoes",
        headers={"Authorization": f"Bearer {token_cidadao}"},
    )

    assert resp.status_code == 403


def test_listar_solicitacoes_filtro_status(client, db):
    """Após mudar o status para EM_ANALISE, a listagem filtrada deve retornar apenas itens com esse status."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(403), "cidadao_lista3@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(404), "admin_lista2@email.com")

    id_sol = _criar_solicitacao(client, token_cidadao)

    # Muda o status da solicitação criada para EM_ANALISE via PATCH
    client.patch(
        _url_status(id_sol),
        json={"status_novo": "EM_ANALISE", "comentario": "Iniciando análise."},
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    # Lista somente solicitações com status EM_ANALISE
    resp = client.get(
        "/admin/solicitacoes?status=EM_ANALISE",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    itens = resp.json()["itens"]
    # Todos os itens retornados devem ter exatamente o status filtrado
    assert all(item["status"] == "EM_ANALISE" for item in itens)


def test_listar_solicitacoes_filtro_categoria(client, db):
    """Listagem com ?id_categoria=1 deve retornar apenas solicitações dessa categoria."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(405), "cidadao_lista4@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(406), "admin_lista3@email.com")

    # _criar_solicitacao usa id_categoria=1 por padrão (definido em _SOLICITACAO_BASE)
    _criar_solicitacao(client, token_cidadao)

    resp = client.get(
        "/admin/solicitacoes?id_categoria=1",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    itens = resp.json()["itens"]
    # Todos os itens retornados devem pertencer à categoria 1
    assert all(item["id_categoria"] == 1 for item in itens)


def test_listar_solicitacoes_paginacao(client, db):
    """Com por_pagina=2, a página deve conter no máximo 2 itens e o total deve ser >= 3."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(407), "cidadao_lista5@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(408), "admin_lista4@email.com")

    # Cria 3 solicitações com o mesmo cidadão
    _criar_solicitacao(client, token_cidadao)
    _criar_solicitacao(client, token_cidadao)
    _criar_solicitacao(client, token_cidadao)

    resp = client.get(
        "/admin/solicitacoes?por_pagina=2",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    dados = resp.json()
    # A página não pode ter mais itens do que o limite solicitado
    assert len(dados["itens"]) <= 2
    # O total deve refletir ao menos as 3 criadas acima
    assert dados["total"] >= 3


def test_listar_solicitacoes_ordem_mais_apoiados(client, db):
    """Com ?ordem=mais_apoiados, o primeiro item da lista deve ter contador_apoios >= ao segundo."""
    # Cidadão A cria a primeira solicitação (sem apoios)
    token_cidadao_a = _cadastrar_e_logar(client, _gerar_cpf(409), "cidadao_lista6a@email.com")
    # Cidadão B cria a segunda solicitação (receberá um apoio)
    token_cidadao_b = _cadastrar_e_logar(client, _gerar_cpf(410), "cidadao_lista6b@email.com")
    # Cidadão C é quem vai apoiar a solicitação do cidadão B
    token_cidadao_c = _cadastrar_e_logar(client, _gerar_cpf(411), "cidadao_lista6c@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(412), "admin_lista5@email.com")

    _criar_solicitacao(client, token_cidadao_a)
    id_sol_b = _criar_solicitacao(client, token_cidadao_b)

    # Cidadão C apoia a solicitação do cidadão B para aumentar seu contador_apoios
    resp_apoio = client.post(
        f"/apoios/{id_sol_b}",
        headers={"Authorization": f"Bearer {token_cidadao_c}"},
    )
    assert resp_apoio.status_code == 204

    # Lista ordenando pelos mais apoiados
    resp = client.get(
        "/admin/solicitacoes?ordem=mais_apoiados",
        headers={"Authorization": f"Bearer {token_admin}"},
    )

    assert resp.status_code == 200
    itens = resp.json()["itens"]
    # Precisa haver pelo menos 2 itens para verificar a ordem
    assert len(itens) >= 2
    # O primeiro item deve ter contador_apoios maior ou igual ao segundo
    assert itens[0]["contador_apoios"] >= itens[1]["contador_apoios"]
