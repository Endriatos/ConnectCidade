from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.crud.admin_solicitacao import atualizar_status
from app.models.solicitacao import StatusSolicitacao
from app.schemas.solicitacao import SolicitacaoResponse
from app.utils.deps import get_admin_atual, get_db

router = APIRouter(prefix="/admin/solicitacoes", tags=["Admin - Solicitações"])


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
