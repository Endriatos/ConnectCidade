from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.crud.apoio import apoiar, retirar_apoio as crud_retirar_apoio
from app.utils.deps import get_db, get_usuario_atual

router = APIRouter(prefix="/apoios", tags=["Apoios"])


@router.post("/{id_solicitacao}", status_code=status.HTTP_204_NO_CONTENT)
def adicionar_apoio(
    id_solicitacao: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Registra o apoio do usuário autenticado à solicitação informada.
    Retorna 204 No Content em caso de sucesso.
    Retorna 400 se a solicitação estiver cancelada ou o usuário já tiver apoiado.
    Retorna 404 se a solicitação não existir.
    """
    try:
        apoiar(db, id_solicitacao, usuario_atual.id_usuario)
    except ValueError as e:
        erro = str(e)
        # Distingue 404 (não encontrada) de 400 (regra de negócio)
        if "não encontrada" in erro:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=erro)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=erro)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{id_solicitacao}", status_code=status.HTTP_204_NO_CONTENT)
def retirar_apoio(
    id_solicitacao: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Remove o apoio do usuário autenticado à solicitação informada.
    Retorna 204 No Content em caso de sucesso.
    Retorna 400 se o usuário não tiver apoiado esta solicitação.
    """
    try:
        crud_retirar_apoio(db, id_solicitacao, usuario_atual.id_usuario)
    except ValueError as e:
        erro = str(e)
        # Distingue 404 (não encontrada) de 400 (regra de negócio)
        if "não encontrada" in erro:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=erro)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=erro)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
