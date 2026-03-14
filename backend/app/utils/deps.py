from typing import Generator

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.usuario import get_usuario_por_cpf
from app.database import SessionLocal

# HTTPBearer extrai automaticamente o token do header "Authorization: Bearer <token>"
# e o disponibiliza como credentials.credentials na função que o recebe via Depends.
bearer_scheme = HTTPBearer()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency de banco de dados — injetada automaticamente pelo FastAPI via Depends.

    Injeção de dependência (DI) é um padrão onde o framework fornece recursos
    automaticamente para as funções que os declaram como parâmetros. Aqui,
    qualquer endpoint que declare `db: Session = Depends(get_db)` recebe uma
    sessão do banco pronta para uso, sem precisar gerenciá-la manualmente.

    O bloco try/finally garante que a sessão seja SEMPRE fechada ao final da
    requisição — mesmo que ocorra um erro — evitando vazamento de conexões.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_usuario_atual(
    credentials=Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    Dependency de autenticação — valida o JWT e retorna o usuário logado.

    Passo a passo:
      1. O HTTPBearer extrai o token do header Authorization e o entrega em credentials.
      2. Decodificamos o JWT usando SECRET_KEY — python-jose verifica a assinatura
         e a expiração (campo exp) automaticamente; qualquer falha lança JWTError.
      3. Extraímos o campo sub do payload, que contém o CPF do usuário.
      4. Buscamos o usuário no banco pelo CPF — se não existir, o token é inválido.
      5. Retornamos o objeto Usuario, que fica disponível no parâmetro do endpoint.
    """
    credenciais_exception = HTTPException(status_code=401, detail="Não autorizado")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        cpf: str = payload.get("sub")
        if cpf is None:
            raise credenciais_exception
    except JWTError:
        raise credenciais_exception

    usuario = get_usuario_por_cpf(db, cpf)
    if usuario is None:
        raise credenciais_exception

    return usuario
