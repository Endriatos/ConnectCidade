import logging
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status

logger = logging.getLogger(__name__)
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.crud.apoio import ja_apoiou
from app.crud.atualizacao import get_timeline
from app.crud.foto import create_foto_nocommit
from app.crud.solicitacao import (
    cancelar_solicitacao,
    create_solicitacao,
    get_solicitacao_por_id,
    get_solicitacoes_por_autor,
    verificar_duplicata,
)
from app.models.solicitacao import StatusSolicitacao
from app.schemas.solicitacao import AtualizacaoResponse, SolicitacaoCreate, SolicitacaoResponse
from app.utils.deps import get_db, get_usuario_atual
from app.utils.foto_utils import apagar_foto_por_url_publica, fazer_upload_foto, garantir_bucket_publico

router = APIRouter(prefix="/solicitacoes", tags=["Solicitações"])


@router.post("")
async def criar_solicitacao(
    id_categoria: int = Form(),
    descricao: str = Form(),
    endereco_referencia: str = Form(),
    latitude: float = Form(),
    longitude: float = Form(),
    confirmar_duplicata: bool = Form(False),
    fotos: List[UploadFile] = File(),
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    # Monta o mesmo modelo de validação usado antes (JSON); aqui os valores vêm do multipart
    dados = SolicitacaoCreate(
        id_categoria=id_categoria,
        descricao=descricao,
        endereco_referencia=endereco_referencia,
        latitude=latitude,
        longitude=longitude,
        confirmar_duplicata=confirmar_duplicata,
    )

    # Foto obrigatória no servidor: entre 1 e 5 arquivos no campo repetido "fotos"
    if not fotos or len(fotos) < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Envie pelo menos uma foto.",
        )
    if len(fotos) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limite de 5 fotos por solicitação.",
        )

    # Se o usuário não confirmou, verifica se já existe solicitação semelhante próxima
    if not dados.confirmar_duplicata:
        duplicata = verificar_duplicata(db, dados.id_categoria, dados.latitude, dados.longitude)
        if duplicata:
            # Retorna status 200 com detalhes da duplicata para o frontend decidir se prossegue
            # (não grava solicitação nem envia nada ao MinIO neste caso)
            return JSONResponse(
                status_code=200,
                content=jsonable_encoder(
                    {
                        "aviso": (
                            "Já existe uma solicitação semelhante próxima a este local. "
                            "Deseja registrar mesmo assim?"
                        ),
                        "duplicata_id": duplicata.id_solicitacao,
                        "protocolo": duplicata.protocolo,
                        "descricao": duplicata.descricao,
                        "status": duplicata.status.value,
                        "contador_apoios": duplicata.contador_apoios,
                        "data_registro": duplicata.data_registro,
                    }
                ),
            )

    # Sem duplicata ou usuário confirmou — cria solicitação + todas as fotos na mesma transação (commit no fim)
    urls_minio: List[str] = []
    try:
        garantir_bucket_publico()
        # create_solicitacao faz flush para já existir id_solicitacao antes de gravar as fotos
        solicitacao = create_solicitacao(db, dados, usuario_atual.id_usuario)
        for ordem, arquivo in enumerate(fotos, start=1):
            arquivo_bytes = await arquivo.read()
            url = fazer_upload_foto(arquivo_bytes, arquivo.filename or "foto.jpg")
            urls_minio.append(url)
            # create_foto_nocommit: só db.add; o commit único fecha solicitação + fotos juntos
            create_foto_nocommit(db, solicitacao.id_solicitacao, url, ordem)
        db.commit()
        db.refresh(solicitacao)
    except Exception:
        logger.exception("Erro ao criar solicitação")
        db.rollback()
        # Compensação: remove objetos já enviados ao MinIO se o banco falhar depois do upload
        for url in urls_minio:
            try:
                apagar_foto_por_url_publica(url)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível criar a solicitação com as fotos. Tente novamente.",
        )

    # Retorna 201 com o JSON da solicitação criada (igual ao fluxo anterior em JSON)
    return Response(
        content=SolicitacaoResponse.model_validate(solicitacao).model_dump_json(),
        status_code=201,
        media_type="application/json",
    )


@router.get("/minhas", response_model=List[SolicitacaoResponse])
def listar_minhas_solicitacoes(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    # Retorna todas as solicitações criadas pelo usuário autenticado, ordenadas por data
    return get_solicitacoes_por_autor(db, usuario_atual.id_usuario)


@router.get("/{id_solicitacao}", response_model=SolicitacaoResponse)
def detalhar_solicitacao(
    id_solicitacao: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    # Busca a solicitação pelo id — retorna 404 se não encontrada
    solicitacao = get_solicitacao_por_id(db, id_solicitacao)
    if not solicitacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada.")

    # Monta a resposta incluindo ja_apoiado, calculado para o usuário autenticado,
    # passando diretamente no model_validate para evitar mutação do objeto
    return SolicitacaoResponse.model_validate(
        {**solicitacao.__dict__, "ja_apoiado": ja_apoiou(db, id_solicitacao, usuario_atual.id_usuario)}
    )


@router.get("/{id_solicitacao}/timeline", response_model=List[AtualizacaoResponse])
def listar_timeline(
    id_solicitacao: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    # Verifica se a solicitação existe — retorna 404 se não encontrada
    solicitacao = get_solicitacao_por_id(db, id_solicitacao)
    if not solicitacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada.")

    # Retorna o histórico de atualizações de status em ordem cronológica
    return get_timeline(db, id_solicitacao)


@router.patch("/{id_solicitacao}/cancelar", response_model=SolicitacaoResponse)
def cancelar(
    id_solicitacao: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    # Busca a solicitação — 404 se não existir
    solicitacao = get_solicitacao_por_id(db, id_solicitacao)
    if not solicitacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada.")

    # Apenas o autor pode cancelar a própria solicitação
    if solicitacao.id_autor != usuario_atual.id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para cancelar esta solicitação.")

    # Somente solicitações pendentes podem ser canceladas
    if solicitacao.status != StatusSolicitacao.PENDENTE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Somente solicitações pendentes podem ser canceladas.")

    return cancelar_solicitacao(db, solicitacao)
