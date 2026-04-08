from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.avaliacao import criar_avaliacao
from app.schemas.avaliacao import AvaliacaoCreate, AvaliacaoResponse
from app.utils.deps import get_db, get_usuario_atual

router = APIRouter(prefix="/avaliacoes", tags=["Avaliações"])


@router.post("/{id_solicitacao}", response_model=AvaliacaoResponse, status_code=status.HTTP_201_CREATED)
def avaliar_solicitacao(
    id_solicitacao: int,
    body: AvaliacaoCreate,
    db: Session = Depends(get_db),
    # Exige usuário autenticado — retorna 401/403 se não houver token válido
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Registra a avaliação do cidadão para uma solicitação resolvida.

    Retorna 400 se:
    - A solicitação não existir.
    - O status não for RESOLVIDO.
    - O usuário não for o autor da solicitação.
    - A solicitação já tiver sido avaliada.
    Retorna 201 com os dados da avaliação em caso de sucesso.
    """
    try:
        avaliacao = criar_avaliacao(
            db=db,
            id_solicitacao=id_solicitacao,
            id_usuario=usuario_atual.id_usuario,
            dados=body,
        )
    except ValueError as e:
        # Qualquer regra de negócio violada é tratada como 400 Bad Request
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return avaliacao
