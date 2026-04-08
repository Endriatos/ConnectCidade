from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.crud.notificacao import listar_notificacoes, marcar_como_lida, marcar_todas_como_lidas
from app.schemas.notificacao import NotificacaoResponse
from app.utils.deps import get_db, get_usuario_atual

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])


@router.get("", response_model=List[NotificacaoResponse])
def listar(
    db: Session = Depends(get_db),
    # Exige usuário autenticado — retorna 401/403 se não houver token válido
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Retorna todas as notificações do usuário autenticado,
    ordenadas da mais recente para a mais antiga.
    Notificações com mais de 90 dias são removidas automaticamente antes da listagem.
    """
    return listar_notificacoes(db, usuario_atual.id_usuario)


@router.patch("/{id_notificacao}/lida", response_model=NotificacaoResponse)
def marcar_lida(
    id_notificacao: int,
    db: Session = Depends(get_db),
    # Exige usuário autenticado — garante que o usuário só acessa suas próprias notificações
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Marca uma notificação específica como lida.
    Retorna 404 se a notificação não existir ou não pertencer ao usuário autenticado.
    """
    notificacao = marcar_como_lida(db, id_notificacao, usuario_atual.id_usuario)

    # Notificação inexistente ou de outro usuário → 404
    if notificacao is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada.",
        )

    return notificacao


@router.patch("/lidas", status_code=status.HTTP_204_NO_CONTENT)
def marcar_todas_lidas(
    db: Session = Depends(get_db),
    # Exige usuário autenticado — marca apenas as notificações do próprio usuário
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Marca todas as notificações não lidas do usuário autenticado como lidas de uma vez.
    Retorna 204 No Content em caso de sucesso — sem corpo na resposta.
    """
    marcar_todas_como_lidas(db, usuario_atual.id_usuario)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
