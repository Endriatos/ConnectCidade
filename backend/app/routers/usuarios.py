from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.crud.usuario import atualizar_usuario
from app.schemas.usuario import UsuarioResponse, UsuarioUpdate
from app.utils.deps import get_db, get_usuario_atual

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


@router.patch("/me", response_model=UsuarioResponse)
def atualizar_perfil(
    body: UsuarioUpdate,
    db: Session = Depends(get_db),
    # Exige usuário autenticado — retorna 401/403 se não houver token válido
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Atualiza os dados do perfil do usuário autenticado.

    Apenas os campos informados no body são atualizados;
    campos omitidos permanecem com seus valores anteriores.
    """
    return atualizar_usuario(db=db, usuario=usuario_atual, dados=body)
