from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.crud.apoio import ja_apoiou
from app.crud.atualizacao import get_timeline
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

router = APIRouter(prefix="/solicitacoes", tags=["Solicitações"])


@router.post("")
def criar_solicitacao(
    dados: SolicitacaoCreate,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    # Se o usuário não confirmou, verifica se já existe solicitação semelhante próxima
    if not dados.confirmar_duplicata:
        duplicata = verificar_duplicata(db, dados.id_categoria, dados.latitude, dados.longitude)
        if duplicata:
            # Retorna status 200 com detalhes da duplicata para o frontend decidir se prossegue
            return {
                "aviso": (
                    f"Já existe uma solicitação semelhante próxima a este local. "
                    f"Deseja registrar mesmo assim?"
                ),
                "duplicata_id": duplicata.id_solicitacao,
                "protocolo": duplicata.protocolo,
                "descricao": duplicata.descricao,
                "status": duplicata.status.value,
                "contador_apoios": duplicata.contador_apoios,
                "data_registro": duplicata.data_registro,
            }

    # Sem duplicata ou usuário confirmou — cria a nova solicitação e retorna 201
    solicitacao = create_solicitacao(db, dados, usuario_atual.id_usuario)
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
