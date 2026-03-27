from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UsuarioCreate(BaseModel):
    cpf: str
    nome_usuario: str
    email: EmailStr
    senha: str
    telefone: Optional[str] = None
    data_nascimento: date


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    tipo_usuario: str
    cpf: str
    nome_usuario: str
    email: str
    status_ativo: bool
    data_cadastro: datetime


# Schema para atualização parcial do perfil do usuário autenticado
class UsuarioUpdate(BaseModel):
    # Todos os campos são opcionais — apenas os informados serão atualizados
    nome_usuario: Optional[str] = None
    telefone: Optional[str] = None
    data_nascimento: Optional[date] = None
