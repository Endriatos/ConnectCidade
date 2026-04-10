import enum
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.avaliacao import Avaliacao
from app.models.categoria import Categoria
from app.models.solicitacao import Solicitacao, StatusSolicitacao
from app.models.usuario import TipoUsuario, Usuario
from app.schemas.dashboard import (
    CategoriaStatusItem,
    DashboardResponse,
    FilaAtencaoItem,
    GraficoMensalItem,
    MediaAvaliacaoCategoria,
)
from app.utils.deps import get_admin_atual, get_db

router = APIRouter(prefix="/admin/dashboard", tags=["Admin - Dashboard"])

# Opções de período para filtro do dashboard
class PeriodoDashboard(str, enum.Enum):
    d7 = "7d"
    d30 = "30d"
    d90 = "90d"
    tudo = "tudo"


# Status considerados "em aberto" para o KPI total_abertos
_STATUS_ABERTOS = [
    StatusSolicitacao.PENDENTE,
    StatusSolicitacao.EM_ANALISE,
    StatusSolicitacao.EM_ANDAMENTO,
]


def _arredondar(valor: Optional[float]) -> Optional[float]:
    """Arredonda para 1 casa decimal ou retorna None se o valor for None."""
    return round(valor, 1) if valor is not None else None


def _calcular_data_inicio(periodo: PeriodoDashboard) -> Optional[datetime]:
    """Retorna o datetime de início do período, ou None para 'tudo'."""
    agora = datetime.now(timezone.utc)
    mapa = {
        PeriodoDashboard.d7: timedelta(days=7),
        PeriodoDashboard.d30: timedelta(days=30),
        PeriodoDashboard.d90: timedelta(days=90),
    }
    delta = mapa.get(periodo)
    return (agora - delta) if delta else None


def _filtro_periodo(query, campo, data_inicio: Optional[datetime]):
    """Aplica o filtro de data_inicio a uma query SQLAlchemy se definido."""
    if data_inicio is not None:
        return query.filter(campo >= data_inicio)
    return query


@router.get("/fila-atencao", response_model=List[FilaAtencaoItem])
def get_fila_atencao(
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_admin_atual),
):
    """Retorna as 5 solicitações em aberto com maior score de atenção.

    Score = contador_apoios + (dias_desde_registro // 3).
    Considera apenas os status PENDENTE, EM_ANALISE e EM_ANDAMENTO.
    """
    agora = datetime.now(timezone.utc)

    rows = (
        db.query(Solicitacao, Categoria)
        .join(Categoria, Solicitacao.id_categoria == Categoria.id_categoria)
        .filter(Solicitacao.status.in_(_STATUS_ABERTOS))
        .all()
    )

    def _score(sol: Solicitacao) -> int:
        reg = sol.data_registro
        if reg.tzinfo is None:
            reg = reg.replace(tzinfo=timezone.utc)
        dias = (agora - reg).days
        return sol.contador_apoios + (dias // 3)

    top5 = sorted(rows, key=lambda r: _score(r[0]), reverse=True)[:5]

    return [
        FilaAtencaoItem(
            id_solicitacao=sol.id_solicitacao,
            protocolo=sol.protocolo,
            nome_categoria=cat.nome_categoria,
            cor_hex=cat.cor_hex,
            status=sol.status.value,
            contador_apoios=sol.contador_apoios,
            data_registro=sol.data_registro,
            endereco_referencia=sol.endereco_referencia,
            descricao=sol.descricao,
            score=_score(sol),
            latitude=float(sol.latitude),
            longitude=float(sol.longitude),
        )
        for sol, cat in top5
    ]


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    periodo: PeriodoDashboard = Query(PeriodoDashboard.d30),
    db: Session = Depends(get_db),
    # Apenas admins autenticados podem acessar o dashboard
    _admin: Usuario = Depends(get_admin_atual),
):
    """Retorna KPIs e métricas do painel administrativo, opcionalmente filtrados por período."""
    data_inicio = _calcular_data_inicio(periodo)

    # -----------------------------------------------------------------------
    # KPIs fixos (independem do período)
    # -----------------------------------------------------------------------

    # Total de solicitações nos status considerados em aberto
    total_abertos: int = (
        db.query(func.count(Solicitacao.id_solicitacao))
        .filter(Solicitacao.status.in_(_STATUS_ABERTOS))
        .scalar() or 0
    )

    # Contagem por status — inicializa todos os 5 com zero para garantir chaves completas
    por_status: dict = {s.value: 0 for s in StatusSolicitacao}
    for status_val, contagem in db.query(
        Solicitacao.status, func.count(Solicitacao.id_solicitacao)
    ).group_by(Solicitacao.status).all():
        por_status[status_val.value] = contagem

    # Solicitações não canceladas agrupadas por categoria (LEFT JOIN para incluir categorias vazias)
    rows_categoria = (
        db.query(
            Categoria.id_categoria,
            Categoria.nome_categoria,
            Categoria.cor_hex,
            func.count(Solicitacao.id_solicitacao).label("total"),
        )
        .outerjoin(
            Solicitacao,
            (Solicitacao.id_categoria == Categoria.id_categoria)
            & (Solicitacao.status != StatusSolicitacao.CANCELADO),
        )
        .group_by(Categoria.id_categoria, Categoria.nome_categoria, Categoria.cor_hex)
        .all()
    )
    por_categoria: List[CategoriaStatusItem] = [
        CategoriaStatusItem(
            id_categoria=r.id_categoria,
            nome_categoria=r.nome_categoria,
            cor_hex=r.cor_hex,
            total=r.total,
        )
        for r in rows_categoria
    ]

    # Total de cidadãos ativos (status_ativo=True)
    total_cidadaos: int = (
        db.query(func.count(Usuario.id_usuario))
        .filter(
            Usuario.tipo_usuario == TipoUsuario.CIDADAO,
            Usuario.status_ativo == True,  # noqa: E712
        )
        .scalar() or 0
    )

    # Média de avaliações por categoria — exclui categorias sem nenhuma avaliação
    rows_media_cat = (
        db.query(
            Categoria.id_categoria,
            Categoria.nome_categoria,
            func.avg(Avaliacao.nota).label("media"),
        )
        .join(Solicitacao, Avaliacao.id_solicitacao == Solicitacao.id_solicitacao)
        .join(Categoria, Solicitacao.id_categoria == Categoria.id_categoria)
        .group_by(Categoria.id_categoria, Categoria.nome_categoria)
        .having(func.count(Avaliacao.id_avaliacao) > 0)
        .all()
    )
    media_avaliacao_por_categoria: List[MediaAvaliacaoCategoria] = [
        MediaAvaliacaoCategoria(
            id_categoria=r.id_categoria,
            nome_categoria=r.nome_categoria,
            media_nota=_arredondar(float(r.media)),
        )
        for r in rows_media_cat
    ]

    # Média geral de todas as avaliações
    media_geral_raw = db.query(func.avg(Avaliacao.nota)).scalar()
    media_avaliacao_geral: Optional[float] = _arredondar(
        float(media_geral_raw) if media_geral_raw is not None else None
    )

    # -----------------------------------------------------------------------
    # Dados filtrados pelo período
    # -----------------------------------------------------------------------

    # Total de solicitações criadas no período
    total_abertas_periodo: int = _filtro_periodo(
        db.query(func.count(Solicitacao.id_solicitacao)),
        Solicitacao.data_registro,
        data_inicio,
    ).scalar() or 0

    # Solicitações resolvidas criadas no período
    total_resolvidas_periodo: int = _filtro_periodo(
        db.query(func.count(Solicitacao.id_solicitacao)).filter(
            Solicitacao.status == StatusSolicitacao.RESOLVIDO
        ),
        Solicitacao.data_registro,
        data_inicio,
    ).scalar() or 0

    # Tempo médio de resolução em dias — calculado em Python para portabilidade entre bancos
    q_resolvidas = _filtro_periodo(
        db.query(Solicitacao.data_registro, Solicitacao.data_resolucao).filter(
            Solicitacao.status == StatusSolicitacao.RESOLVIDO,
            Solicitacao.data_resolucao.isnot(None),
        ),
        Solicitacao.data_registro,
        data_inicio,
    ).all()

    tempo_medio_resolucao_dias: Optional[float] = None
    if q_resolvidas:
        # Garante que ambos os campos são timezone-aware antes de subtrair
        def _aware(dt: datetime) -> datetime:
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

        dias = [
            (_aware(r.data_resolucao) - _aware(r.data_registro)).total_seconds() / 86400
            for r in q_resolvidas
        ]
        tempo_medio_resolucao_dias = _arredondar(sum(dias) / len(dias))

    # Avaliações de solicitações criadas no período (JOIN para acessar data_registro)
    q_avals = _filtro_periodo(
        db.query(Avaliacao.foi_resolvido, Avaliacao.nota)
        .join(Solicitacao, Avaliacao.id_solicitacao == Solicitacao.id_solicitacao),
        Solicitacao.data_registro,
        data_inicio,
    ).all()

    indice_resolucao_efetiva: Optional[float] = None
    media_avaliacao_periodo: Optional[float] = None
    if q_avals:
        # Índice de resolução efetiva: % de avaliações com foi_resolvido=True
        total_avals = len(q_avals)
        resolvidas_ok = sum(1 for a in q_avals if a.foi_resolvido)
        indice_resolucao_efetiva = _arredondar(resolvidas_ok / total_avals * 100)

        # Média de notas no período
        media_avaliacao_periodo = _arredondar(
            sum(a.nota for a in q_avals) / total_avals
        )

    # -----------------------------------------------------------------------
    # Gráfico mensal — últimos 6 meses calendário, independente do período
    # -----------------------------------------------------------------------

    agora = datetime.now(timezone.utc)
    grafico_mensal: List[GraficoMensalItem] = []

    for i in range(5, -1, -1):
        # Calcula ano e mês do mês i meses atrás usando aritmética de meses
        total_meses = agora.year * 12 + (agora.month - 1) - i
        ano_m = total_meses // 12
        mes_m = total_meses % 12 + 1

        inicio_mes = datetime(ano_m, mes_m, 1, tzinfo=timezone.utc)
        fim_mes = (
            datetime(ano_m + 1, 1, 1, tzinfo=timezone.utc)
            if mes_m == 12
            else datetime(ano_m, mes_m + 1, 1, tzinfo=timezone.utc)
        )

        criadas_mes: int = (
            db.query(func.count(Solicitacao.id_solicitacao))
            .filter(
                Solicitacao.data_registro >= inicio_mes,
                Solicitacao.data_registro < fim_mes,
            )
            .scalar() or 0
        )

        resolvidas_mes: int = (
            db.query(func.count(Solicitacao.id_solicitacao))
            .filter(
                Solicitacao.data_registro >= inicio_mes,
                Solicitacao.data_registro < fim_mes,
                Solicitacao.status == StatusSolicitacao.RESOLVIDO,
            )
            .scalar() or 0
        )

        grafico_mensal.append(
            GraficoMensalItem(
                mes=f"{ano_m:04d}-{mes_m:02d}",
                criadas=criadas_mes,
                resolvidas=resolvidas_mes,
            )
        )

    return DashboardResponse(
        total_abertos=total_abertos,
        por_status=por_status,
        por_categoria=por_categoria,
        total_cidadaos=total_cidadaos,
        media_avaliacao_por_categoria=media_avaliacao_por_categoria,
        media_avaliacao_geral=media_avaliacao_geral,
        total_abertas_periodo=total_abertas_periodo,
        total_resolvidas_periodo=total_resolvidas_periodo,
        tempo_medio_resolucao_dias=tempo_medio_resolucao_dias,
        indice_resolucao_efetiva=indice_resolucao_efetiva,
        media_avaliacao_periodo=media_avaliacao_periodo,
        grafico_mensal=grafico_mensal,
    )
