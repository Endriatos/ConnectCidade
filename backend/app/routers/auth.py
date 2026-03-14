from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.usuario import create_usuario, get_usuario_por_cpf, get_usuario_por_email
from app.schemas.auth import LoginInput, TokenResponse
from app.schemas.usuario import UsuarioCreate, UsuarioResponse
from app.utils.auth_utils import criar_token_acesso, verificar_senha
from app.utils.cpf_utils import validar_cpf
from app.utils.deps import get_db, get_usuario_atual

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/cadastro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def cadastro(dados: UsuarioCreate, db: Session = Depends(get_db)):
    if not validar_cpf(dados.cpf):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CPF inválido.")

    if get_usuario_por_cpf(db, dados.cpf):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado.")

    if get_usuario_por_email(db, dados.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado.")

    return create_usuario(db, dados)


@router.post("/login", response_model=TokenResponse)
def login(dados: LoginInput, db: Session = Depends(get_db)):
    usuario = get_usuario_por_cpf(db, dados.cpf)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="CPF ou senha incorretos.")

    if not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="CPF ou senha incorretos.")

    token = criar_token_acesso({"sub": usuario.cpf, "tipo": usuario.tipo_usuario.value})
    return TokenResponse(access_token=token, tipo_usuario=usuario.tipo_usuario.value)


@router.get("/me", response_model=UsuarioResponse)
def me(usuario_atual=Depends(get_usuario_atual)):
    return usuario_atual
