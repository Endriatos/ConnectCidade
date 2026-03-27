from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.crud.admin_solicitacao import atualizar_status, listar_solicitacoes
from app.models.solicitacao import OrdemSolicitacao, StatusSolicitacao
from app.schemas.solicitacao import PaginacaoResponse, SolicitacaoResponse
from app.utils.deps import get_admin_atual, get_db

router = APIRouter(prefix="/admin/solicitacoes", tags=["Admin - Solicitações"])


@router.get("", response_model=PaginacaoResponse)
def listar_solicitacoes_admin(
    # Filtro opcional por status da solicitação
    status_filtro: Optional[StatusSolicitacao] = Query(None, alias="status"),
    # Filtro opcional por id da categoria
    id_categoria: Optional[int] = Query(None),
    # Busca parcial pelo protocolo da solicitação
    protocolo: Optional[str] = Query(None),
    # Critério de ordenação: mais_recentes (padrão), mais_antigos ou mais_apoiados
    ordem: Optional[OrdemSolicitacao] = Query(None),
    # Número da página desejada (começa em 1)
    pagina: int = Query(1, ge=1),
    # Quantidade de itens por página
    por_pagina: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    # Exige que o usuário autenticado seja administrador
    admin_atual=Depends(get_admin_atual),
):
    """
    Lista solicitações com filtros e paginação para o painel administrativo.

    Retorna 403 se o usuário autenticado não for administrador.
    """
    return listar_solicitacoes(
        db=db,
        status=status_filtro,
        id_categoria=id_categoria,
        protocolo=protocolo,
        ordem=ordem,
        pagina=pagina,
        por_pagina=por_pagina,
    )


class AtualizarStatusRequest(BaseModel):
    """Body da requisição para atualização de status pelo administrador."""

    status_novo: StatusSolicitacao
    # Comentário obrigatório — mínimo 1 caractere para garantir explicação da mudança
    comentario: str = Field(..., min_length=1)


@router.patch("/{id_solicitacao}/status", response_model=SolicitacaoResponse)
def atualizar_status_solicitacao(
    id_solicitacao: int,
    body: AtualizarStatusRequest,
    db: Session = Depends(get_db),
    admin_atual=Depends(get_admin_atual),
):
    """
    Atualiza o status de uma solicitação como administrador.

    Registra a mudança na tabela atualizacao para auditoria completa.
    Retorna 404 se a solicitação não existir.
    Retorna 403 se o usuário autenticado não for administrador.
    """
    try:
        solicitacao = atualizar_status(
            db=db,
            id_solicitacao=id_solicitacao,
            status_novo=body.status_novo,
            comentario=body.comentario,
            id_administrador=admin_atual.id_usuario,
        )
    except ValueError as e:
        # ValueError com "não encontrada" indica solicitação inexistente → 404
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    return solicitacao
