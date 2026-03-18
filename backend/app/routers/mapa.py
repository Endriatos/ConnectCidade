from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.foto import get_fotos_por_solicitacao
from app.models.solicitacao import Solicitacao, StatusSolicitacao
from app.schemas.foto import FotoResponse
from app.schemas.solicitacao import SolicitacaoMapaResponse
from app.utils.deps import get_db, get_usuario_atual

router = APIRouter(prefix="/mapa", tags=["Mapa"])


@router.get("/solicitacoes", response_model=List[SolicitacaoMapaResponse])
def listar_solicitacoes_mapa(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Retorna todas as solicitações visíveis no mapa.

    Filtros aplicados:
    - Exclui solicitações com status CANCELADO
    - Exclui solicitações RESOLVIDO há mais de 48 horas (para que resoluções
      recentes ainda apareçam brevemente no mapa como feedback visual)
    """

    # Limite de tempo: 48 horas atrás a partir de agora (UTC)
    limite_resolucao = datetime.now(timezone.utc) - timedelta(hours=48)

    # Busca todas as solicitações que não estão canceladas
    # e que, se resolvidas, foram resolvidas há menos de 48 horas
    solicitacoes = (
        db.query(Solicitacao)
        .filter(
            # Nunca exibir solicitações canceladas
            Solicitacao.status != StatusSolicitacao.CANCELADO,
            # Solicitações RESOLVIDO só aparecem se foram resolvidas
            # dentro das últimas 48 horas; as demais (PENDENTE, EM_ANDAMENTO)
            # passam direto neste filtro pois data_resolucao é NULL
            (Solicitacao.data_resolucao == None)  # noqa: E711
            | (Solicitacao.data_resolucao >= limite_resolucao),
        )
        .all()
    )

    resultado = []
    for sol in solicitacoes:
        # Busca as fotos vinculadas a esta solicitação, ordenadas por ordem
        fotos_db = get_fotos_por_solicitacao(db, sol.id_solicitacao)
        fotos = [FotoResponse.model_validate(f) for f in fotos_db]

        # Monta manualmente o SolicitacaoMapaResponse incluindo as fotos
        resultado.append(
            SolicitacaoMapaResponse(
                id_solicitacao=sol.id_solicitacao,
                latitude=float(sol.latitude),
                longitude=float(sol.longitude),
                id_categoria=sol.id_categoria,
                protocolo=sol.protocolo,
                status=sol.status,
                endereco_referencia=sol.endereco_referencia,
                descricao=sol.descricao,
                contador_apoios=sol.contador_apoios,
                data_registro=sol.data_registro,
                fotos=fotos,
            )
        )

    return resultado
