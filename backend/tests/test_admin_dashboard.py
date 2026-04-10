from unittest.mock import patch

from tests.conftest import (
    _cadastrar_e_logar,
    _criar_admin_e_logar,
    _criar_solicitacao,
    _gerar_cpf,
)

# Seeds a partir de 1300 para não colidir com os outros arquivos de teste

# URL base do endpoint
_URL = "/admin/dashboard"


# ---------------------------------------------------------------------------
# Autenticação
# ---------------------------------------------------------------------------


def test_dashboard_sem_token(client):
    """Acessar o dashboard sem token deve retornar 401."""
    resp = client.get(_URL)
    assert resp.status_code == 401


def test_dashboard_cidadao_nao_pode(client):
    """Cidadão autenticado não tem permissão para acessar o dashboard — espera 403."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1300), "db_cidadao1@email.com")

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_cidadao}"})

    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Estrutura do response
# ---------------------------------------------------------------------------


def test_dashboard_estrutura_response(client, db):
    """
    Admin autenticado sem dados relevantes deve receber 200 com todos os campos
    presentes e com os tipos corretos (int, float|None, list, dict).
    """
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1301), "db_admin1@email.com")

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200
    dados = resp.json()

    # Campos inteiros obrigatórios
    assert isinstance(dados["total_abertos"], int)
    assert isinstance(dados["total_cidadaos"], int)
    assert isinstance(dados["total_abertas_periodo"], int)
    assert isinstance(dados["total_resolvidas_periodo"], int)

    # Campos opcionais devem ser float ou None
    assert dados["media_avaliacao_geral"] is None or isinstance(dados["media_avaliacao_geral"], float)
    assert dados["tempo_medio_resolucao_dias"] is None or isinstance(dados["tempo_medio_resolucao_dias"], float)
    assert dados["indice_resolucao_efetiva"] is None or isinstance(dados["indice_resolucao_efetiva"], float)
    assert dados["media_avaliacao_periodo"] is None or isinstance(dados["media_avaliacao_periodo"], float)

    # Campos de lista
    assert isinstance(dados["por_categoria"], list)
    assert isinstance(dados["media_avaliacao_por_categoria"], list)
    assert isinstance(dados["grafico_mensal"], list)

    # por_status deve ser um dicionário
    assert isinstance(dados["por_status"], dict)


# ---------------------------------------------------------------------------
# KPIs fixos
# ---------------------------------------------------------------------------


def test_dashboard_total_cidadaos(client, db):
    """Após criar 2 cidadãos, total_cidadaos deve ser >= 2."""
    _cadastrar_e_logar(client, _gerar_cpf(1302), "db_cidadao2@email.com")
    _cadastrar_e_logar(client, _gerar_cpf(1303), "db_cidadao3@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1304), "db_admin2@email.com")

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200
    # Os dois cidadãos criados acima devem estar contabilizados
    assert resp.json()["total_cidadaos"] >= 2


def test_dashboard_total_abertos(client, db):
    """Após criar 1 solicitação (status PENDENTE), total_abertos deve ser >= 1."""
    token_cidadao = _cadastrar_e_logar(client, _gerar_cpf(1305), "db_cidadao4@email.com")
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1306), "db_admin3@email.com")

    # Solicitação criada fica com status PENDENTE, que é contabilizado em total_abertos
    _criar_solicitacao(client, token_cidadao)

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200
    assert resp.json()["total_abertos"] >= 1


def test_dashboard_por_status_contem_todos_os_status(client, db):
    """por_status deve conter exatamente os 5 status como chaves, mesmo com contagem zero."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1307), "db_admin4@email.com")

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200
    por_status = resp.json()["por_status"]

    # Todos os 5 status devem estar presentes como chaves
    status_esperados = {"PENDENTE", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDO", "CANCELADO"}
    assert set(por_status.keys()) == status_esperados
    # Cada valor deve ser um inteiro não-negativo
    assert all(isinstance(v, int) and v >= 0 for v in por_status.values())


def test_dashboard_por_categoria_contem_4_itens(client, db):
    """por_categoria deve conter exatamente 4 itens — as 4 categorias seedadas no conftest."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1308), "db_admin5@email.com")

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200
    por_categoria = resp.json()["por_categoria"]

    # Deve haver exatamente as 4 categorias do seed
    assert len(por_categoria) == 4

    # Cada item deve ter os campos esperados pelo schema
    for item in por_categoria:
        assert "id_categoria" in item
        assert "nome_categoria" in item
        assert "cor_hex" in item
        assert "total" in item
        assert isinstance(item["total"], int)


# ---------------------------------------------------------------------------
# Filtro de período
# ---------------------------------------------------------------------------


def test_dashboard_todos_os_periodos_retornam_200(client, db):
    """Os 4 valores do enum de período devem retornar 200."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1309), "db_admin6@email.com")
    headers = {"Authorization": f"Bearer {token_admin}"}

    # Testa cada valor possível do enum PeriodoDashboard
    for periodo in ("7d", "30d", "90d", "tudo"):
        resp = client.get(f"{_URL}?periodo={periodo}", headers=headers)
        assert resp.status_code == 200, f"Falhou para periodo={periodo}"


def test_dashboard_sem_periodo_usa_default(client, db):
    """Omitir o parâmetro periodo deve usar o default (30d) e retornar 200."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1310), "db_admin7@email.com")

    # Requisição sem o query param periodo
    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Gráfico mensal
# ---------------------------------------------------------------------------


def test_dashboard_grafico_mensal_tem_6_itens(client, db):
    """grafico_mensal deve sempre retornar exatamente 6 itens, independente do período."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1311), "db_admin8@email.com")

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200
    grafico = resp.json()["grafico_mensal"]
    assert len(grafico) == 6


def test_dashboard_grafico_mensal_campos(client, db):
    """Cada item do grafico_mensal deve ter os campos mes, criadas e resolvidas."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1312), "db_admin9@email.com")

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200
    for item in resp.json()["grafico_mensal"]:
        assert "mes" in item
        assert "criadas" in item
        assert "resolvidas" in item
        # mes deve estar no formato YYYY-MM
        assert len(item["mes"]) == 7
        assert item["mes"][4] == "-"
        assert isinstance(item["criadas"], int)
        assert isinstance(item["resolvidas"], int)


def test_dashboard_grafico_mensal_ordem_cronologica(client, db):
    """Os meses do grafico_mensal devem estar em ordem cronológica crescente."""
    token_admin = _criar_admin_e_logar(client, db, _gerar_cpf(1313), "db_admin10@email.com")

    resp = client.get(_URL, headers={"Authorization": f"Bearer {token_admin}"})

    assert resp.status_code == 200
    meses = [item["mes"] for item in resp.json()["grafico_mensal"]]

    # Compara cada mês com o seguinte — strings "YYYY-MM" ordenam corretamente lexicograficamente
    for i in range(len(meses) - 1):
        assert meses[i] < meses[i + 1], (
            f"Ordem incorreta: {meses[i]} não é anterior a {meses[i + 1]}"
        )
