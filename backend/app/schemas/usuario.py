from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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


# Schema para alteração de senha do usuário autenticado
class AlterarSenhaRequest(BaseModel):
    # Senha atual para confirmar a identidade antes de permitir a troca
    senha_atual: str
    # Nova senha com mínimo de 6 caracteres
    senha_nova: str = Field(..., min_length=6)
