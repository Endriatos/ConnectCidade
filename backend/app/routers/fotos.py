from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.crud.foto import create_foto, get_fotos_por_solicitacao
from app.crud.solicitacao import get_solicitacao_por_id
from app.models.solicitacao import StatusSolicitacao
from app.schemas.foto import FotoResponse
from app.utils.deps import get_db, get_usuario_atual
from app.utils.foto_utils import fazer_upload_foto, garantir_bucket_publico

# Prefix /solicitacoes para manter os endpoints de foto aninhados sob a solicitação
router = APIRouter(prefix="/solicitacoes", tags=["Fotos"])


@router.post("/{id_solicitacao}/fotos", response_model=FotoResponse, status_code=status.HTTP_201_CREATED)
async def adicionar_foto(
    id_solicitacao: int,
    arquivo: UploadFile = File(...),
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

    # Lê os bytes do arquivo enviado pelo cliente
    arquivo_bytes = await arquivo.read()

    # Garante que o bucket MinIO existe e está com policy pública antes do upload
    garantir_bucket_publico()

    # Processa a imagem (redimensiona, comprime, remove EXIF) e faz upload para o MinIO,
    # retornando a URL pública para acesso direto à foto
    url = fazer_upload_foto(arquivo_bytes, arquivo.filename)

    # A ordem da foto é sequencial: total de fotos já existentes + 1
    ordem = len(fotos_existentes) + 1

    # Persiste o registro da foto no banco de dados e retorna com status 201
    return create_foto(db, id_solicitacao, url, ordem)


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
