import enum
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, cast, func, Integer
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


class PeriodoDashboard(str, enum.Enum):
    d7   = "7d"
    d15  = "15d"
    d30  = "30d"
    d90  = "90d"
    d180 = "180d"
    d365 = "365d"
    tudo = "tudo"


_STATUS_ABERTOS = [
    StatusSolicitacao.PENDENTE,
    StatusSolicitacao.EM_ANALISE,
    StatusSolicitacao.EM_ANDAMENTO,
]

_DIAS_POR_PERIODO = {
    PeriodoDashboard.d7:   7,
    PeriodoDashboard.d15:  15,
    PeriodoDashboard.d30:  30,
    PeriodoDashboard.d90:  90,
    PeriodoDashboard.d180: 180,
    PeriodoDashboard.d365: 365,
}

_MESES_POR_PERIODO = {
    PeriodoDashboard.d90:  3,
    PeriodoDashboard.d180: 6,
    PeriodoDashboard.d365: 12,
}


def _arredondar(valor: Optional[float]) -> Optional[float]:
    return round(valor, 1) if valor is not None else None


def _calcular_data_inicio(periodo: PeriodoDashboard) -> Optional[datetime]:
    agora = datetime.now(timezone.utc)
    delta = _DIAS_POR_PERIODO.get(periodo)
    return (agora - timedelta(days=delta)) if delta else None


def _filtro_periodo(query, campo, data_inicio: Optional[datetime]):
    if data_inicio is not None:
        return query.filter(campo >= data_inicio)
    return query


def _aware(dt: datetime) -> datetime:
    return dt if (dt.tzinfo is not None) else dt.replace(tzinfo=timezone.utc)


def _gerar_tendencia(
    db: Session,
    periodo: PeriodoDashboard,
    agora: datetime,
) -> List[GraficoMensalItem]:
    """
    Retorna pontos de tendência (criadas vs. resolvidas) adaptados ao período:
    - ≤ 30 dias → granularidade diária, label "DD/MM"
    - > 30 dias → granularidade mensal, label "YYYY-MM"
    Um único SELECT com date_trunc + CASE é feito para cada granularidade.
    """
    # --- granularidade diária ---
    if periodo in (PeriodoDashboard.d7, PeriodoDashboard.d15, PeriodoDashboard.d30):
        n_dias = _DIAS_POR_PERIODO[periodo]
        data_inicio = agora - timedelta(days=n_dias)

        rows = (
            db.query(
                func.date_trunc("day", Solicitacao.data_registro).label("ponto"),
                func.count(Solicitacao.id_solicitacao).label("criadas"),
                func.count(
                    case(
                        (Solicitacao.status == StatusSolicitacao.RESOLVIDO, 1),
                        else_=None,
                    )
                ).label("resolvidas"),
            )
            .filter(Solicitacao.data_registro >= data_inicio)
            .group_by("ponto")
            .all()
        )

        by_day = {
            (_aware(r.ponto).year, _aware(r.ponto).month, _aware(r.ponto).day): (r.criadas, r.resolvidas)
            for r in rows
        }

        resultado = []
        for i in range(n_dias - 1, -1, -1):
            dia = agora - timedelta(days=i)
            criadas, resolvidas = by_day.get((dia.year, dia.month, dia.day), (0, 0))
            resultado.append(GraficoMensalItem(
                mes=dia.strftime("%d/%m"),
                criadas=criadas,
                resolvidas=resolvidas,
            ))
        return resultado

    # --- granularidade mensal ---
    if periodo == PeriodoDashboard.tudo:
        min_data_raw = db.query(func.min(Solicitacao.data_registro)).scalar()
        if min_data_raw:
            min_data = _aware(min_data_raw)
            meses = (agora.year - min_data.year) * 12 + (agora.month - min_data.month) + 1
            n_meses = min(meses, 36)
        else:
            n_meses = 12
    else:
        n_meses = _MESES_POR_PERIODO.get(periodo, 6)

    total_meses_inicio = agora.year * 12 + (agora.month - 1) - (n_meses - 1)
    ano_ini = total_meses_inicio // 12
    mes_ini = total_meses_inicio % 12 + 1
    data_range_inicio = datetime(ano_ini, mes_ini, 1, tzinfo=timezone.utc)

    rows = (
        db.query(
            func.date_trunc("month", Solicitacao.data_registro).label("ponto"),
            func.count(Solicitacao.id_solicitacao).label("criadas"),
            func.count(
                case(
                    (Solicitacao.status == StatusSolicitacao.RESOLVIDO, 1),
                    else_=None,
                )
            ).label("resolvidas"),
        )
        .filter(Solicitacao.data_registro >= data_range_inicio)
        .group_by("ponto")
        .all()
    )

    by_month = {
        (_aware(r.ponto).year, _aware(r.ponto).month): (r.criadas, r.resolvidas)
        for r in rows
    }

    resultado = []
    for i in range(n_meses - 1, -1, -1):
        total_m = agora.year * 12 + (agora.month - 1) - i
        ano_m = total_m // 12
        mes_m = total_m % 12 + 1
        criadas, resolvidas = by_month.get((ano_m, mes_m), (0, 0))
        resultado.append(GraficoMensalItem(
            mes=f"{ano_m:04d}-{mes_m:02d}",
            criadas=criadas,
            resolvidas=resolvidas,
        ))
    return resultado


@router.get("/fila-atencao", response_model=List[FilaAtencaoItem])
def get_fila_atencao(
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_admin_atual),
):
    ultima = func.coalesce(Solicitacao.data_atualizacao, Solicitacao.data_registro)
    score_expr = (
        Solicitacao.contador_apoios
        + cast(func.floor(func.extract("day", func.now() - ultima) / 3), Integer)
    )

    rows = (
        db.query(Solicitacao, Categoria, score_expr.label("score"))
        .join(Categoria, Solicitacao.id_categoria == Categoria.id_categoria)
        .filter(Solicitacao.status.in_(_STATUS_ABERTOS))
        .order_by(score_expr.desc())
        .limit(5)
        .all()
    )

    return [
        FilaAtencaoItem(
            id_solicitacao=sol.id_solicitacao,
            protocolo=sol.protocolo,
            nome_categoria=cat.nome_categoria,
            cor_hex=cat.cor_hex,
            status=sol.status.value,
            contador_apoios=sol.contador_apoios,
            data_registro=sol.data_registro,
            data_atualizacao=sol.data_atualizacao or sol.data_registro,
            endereco_referencia=sol.endereco_referencia,
            descricao=sol.descricao,
            score=score,
            latitude=float(sol.latitude),
            longitude=float(sol.longitude),
        )
        for sol, cat, score in rows
    ]


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    periodo: PeriodoDashboard = Query(PeriodoDashboard.d30),
    db: Session = Depends(get_db),
    _admin: Usuario = Depends(get_admin_atual),
):
    agora = datetime.now(timezone.utc)
    data_inicio = _calcular_data_inicio(periodo)

    # -----------------------------------------------------------------------
    # KPIs fixos (snapshot atual, sem filtro de período)
    # -----------------------------------------------------------------------

    total_abertos: int = (
        db.query(func.count(Solicitacao.id_solicitacao))
        .filter(Solicitacao.status.in_(_STATUS_ABERTOS))
        .scalar() or 0
    )

    total_cidadaos: int = (
        db.query(func.count(Usuario.id_usuario))
        .filter(
            Usuario.tipo_usuario == TipoUsuario.CIDADAO,
            Usuario.status_ativo == True,  # noqa: E712
        )
        .scalar() or 0
    )

    media_geral_raw = db.query(func.avg(Avaliacao.nota)).scalar()
    media_avaliacao_geral: Optional[float] = _arredondar(
        float(media_geral_raw) if media_geral_raw is not None else None
    )

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

    # -----------------------------------------------------------------------
    # Distribuições filtradas pelo período
    # -----------------------------------------------------------------------

    por_status: dict = {s.value: 0 for s in StatusSolicitacao}
    q_status = db.query(Solicitacao.status, func.count(Solicitacao.id_solicitacao)).group_by(Solicitacao.status)
    if data_inicio is not None:
        q_status = q_status.filter(Solicitacao.data_registro >= data_inicio)
    for status_val, contagem in q_status.all():
        por_status[status_val.value] = contagem

    join_cond = (
        (Solicitacao.id_categoria == Categoria.id_categoria)
        & (Solicitacao.status != StatusSolicitacao.CANCELADO)
    )
    if data_inicio is not None:
        join_cond = join_cond & (Solicitacao.data_registro >= data_inicio)

    rows_categoria = (
        db.query(
            Categoria.id_categoria,
            Categoria.nome_categoria,
            Categoria.cor_hex,
            func.count(Solicitacao.id_solicitacao).label("total"),
        )
        .outerjoin(Solicitacao, join_cond)
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

    # -----------------------------------------------------------------------
    # KPIs filtrados pelo período
    # -----------------------------------------------------------------------

    total_abertas_periodo: int = _filtro_periodo(
        db.query(func.count(Solicitacao.id_solicitacao)),
        Solicitacao.data_registro,
        data_inicio,
    ).scalar() or 0

    total_resolvidas_periodo: int = _filtro_periodo(
        db.query(func.count(Solicitacao.id_solicitacao)).filter(
            Solicitacao.status == StatusSolicitacao.RESOLVIDO
        ),
        Solicitacao.data_registro,
        data_inicio,
    ).scalar() or 0

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
        dias_lista = [
            (_aware(r.data_resolucao) - _aware(r.data_registro)).total_seconds() / 86400
            for r in q_resolvidas
        ]
        tempo_medio_resolucao_dias = _arredondar(sum(dias_lista) / len(dias_lista))

    q_avals = _filtro_periodo(
        db.query(Avaliacao.foi_resolvido, Avaliacao.nota)
        .join(Solicitacao, Avaliacao.id_solicitacao == Solicitacao.id_solicitacao),
        Solicitacao.data_registro,
        data_inicio,
    ).all()

    indice_resolucao_efetiva: Optional[float] = None
    media_avaliacao_periodo: Optional[float] = None
    if q_avals:
        total_avals = len(q_avals)
        resolvidas_ok = sum(1 for a in q_avals if a.foi_resolvido)
        indice_resolucao_efetiva = _arredondar(resolvidas_ok / total_avals * 100)
        media_avaliacao_periodo = _arredondar(sum(a.nota for a in q_avals) / total_avals)

    # -----------------------------------------------------------------------
    # Gráfico de tendência — granularidade adaptada ao período
    # -----------------------------------------------------------------------

    grafico_mensal = _gerar_tendencia(db, periodo, agora)

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
