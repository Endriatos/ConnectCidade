from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.crud.usuario import alterar_senha, atualizar_usuario
from app.schemas.usuario import AlterarSenhaRequest, UsuarioResponse, UsuarioUpdate
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


@router.patch("/me/senha", status_code=status.HTTP_204_NO_CONTENT)
def alterar_senha_usuario(
    body: AlterarSenhaRequest,
    db: Session = Depends(get_db),
    # Exige usuário autenticado — retorna 401/403 se não houver token válido
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Altera a senha do usuário autenticado.

    Retorna 400 se a senha atual informada estiver incorreta.
    Retorna 204 No Content em caso de sucesso — sem corpo na resposta.
    """
    try:
        alterar_senha(
            db=db,
            usuario=usuario_atual,
            senha_atual=body.senha_atual,
            senha_nova=body.senha_nova,
        )
    except ValueError as e:
        # Senha atual incorreta — não deve revelar detalhes adicionais de segurança
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return Response(status_code=status.HTTP_204_NO_CONTENT)
