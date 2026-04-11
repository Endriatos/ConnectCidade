from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.solicitacao import SolicitacaoResumoResponse  # necessário para CidadaoDetalheResponse
from app.utils.auth_utils import validar_complexidade_senha as _validar_complexidade_senha


class UsuarioCreate(BaseModel):
    cpf: str
    nome_usuario: str
    email: EmailStr
    senha: str
    telefone: Optional[str] = None
    data_nascimento: date

    @field_validator("senha")
    @classmethod
    def validar_complexidade_senha(cls, v: str) -> str:
        """
        Delega a validação de complexidade para a função centralizada em auth_utils,
        garantindo que schemas e routers apliquem exatamente as mesmas regras.
        """
        _validar_complexidade_senha(v)
        return v


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    tipo_usuario: str
    cpf: str
    nome_usuario: str
    email: str
    telefone: Optional[str] = None
    data_nascimento: date
    status_ativo: bool
    data_cadastro: datetime


# Schema para atualização parcial do perfil do usuário autenticado
class UsuarioUpdate(BaseModel):
    # Todos os campos são opcionais — apenas os informados serão atualizados
    nome_usuario: Optional[str] = None
    telefone: Optional[str] = None
    data_nascimento: Optional[date] = None


# Schema de resposta para listagem de administradores no painel admin
class AdministradorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    nome_usuario: str
    email: str
    cpf: str
    data_cadastro: datetime


# Schema de resposta para busca de cidadão por CPF no painel admin
class CidadaoBuscaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    nome_usuario: str
    email: str
    cpf: str
    data_cadastro: datetime
    # Indica se o usuário já possui perfil de administrador
    ja_e_admin: bool


# Schema de resposta para o detalhe completo de um cidadão no painel admin
class CidadaoDetalheResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    nome_usuario: str
    email: str
    cpf: str
    telefone: Optional[str]
    data_cadastro: datetime
    status_ativo: bool
    # Lista de solicitações do cidadão, ordenadas da mais recente para a mais antiga
    solicitacoes: List[SolicitacaoResumoResponse]


# Schema para alteração de email de um usuário pelo painel admin
class AlterarEmailRequest(BaseModel):
    # Novo endereço de email — validado como EmailStr pelo Pydantic
    email: EmailStr


# Schema para alteração de senha do usuário autenticado
class AlterarSenhaRequest(BaseModel):
    # Senha atual para confirmar a identidade antes de permitir a troca
    senha_atual: str
    # Nova senha — complexidade validada pelo validator abaixo
    senha_nova: str

    @field_validator("senha_nova")
    @classmethod
    def validar_complexidade_senha(cls, v: str) -> str:
        """Delega a validação para a função centralizada em auth_utils."""
        _validar_complexidade_senha(v)
        return v
