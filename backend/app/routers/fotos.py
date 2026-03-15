from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.foto import create_foto, get_fotos_por_solicitacao
from app.crud.solicitacao import get_solicitacao_por_id
from app.models.solicitacao import StatusSolicitacao
from app.schemas.foto import FotoResponse
from app.utils.deps import get_db, get_usuario_atual

# Prefix /solicitacoes para manter os endpoints de foto aninhados sob a solicitação
router = APIRouter(prefix="/solicitacoes", tags=["Fotos"])


@router.post("/{id_solicitacao}/fotos")
def adicionar_foto(
    id_solicitacao: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    # Verifica se a solicitação existe
    solicitacao = get_solicitacao_por_id(db, id_solicitacao)
    if not solicitacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada.")

    # Apenas o autor pode adicionar fotos à própria solicitação
    if solicitacao.id_autor != usuario_atual.id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para adicionar fotos a esta solicitação.")

    # Fotos só podem ser adicionadas enquanto a solicitação estiver pendente
    if solicitacao.status != StatusSolicitacao.PENDENTE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fotos só podem ser adicionadas a solicitações pendentes.")

    # Limita a 5 fotos por solicitação para evitar abuso de armazenamento
    fotos_existentes = get_fotos_por_solicitacao(db, id_solicitacao)
    if len(fotos_existentes) >= 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Limite de 5 fotos por solicitação atingido.")

    # Upload de arquivo será implementado na Entrega 3 (integração com armazenamento)
    return {"mensagem": "Upload será implementado na Entrega 3"}


@router.get("/{id_solicitacao}/fotos", response_model=List[FotoResponse])
def listar_fotos(
    id_solicitacao: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    # Verifica se a solicitação existe antes de retornar as fotos
    solicitacao = get_solicitacao_por_id(db, id_solicitacao)
    if not solicitacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada.")

    return get_fotos_por_solicitacao(db, id_solicitacao)
