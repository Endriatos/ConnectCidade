from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


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
        Valida os requisitos mínimos de segurança da senha no cadastro.
        Espelha as mesmas regras de complexidade exigidas pelo frontend,
        garantindo consistência mesmo em chamadas diretas à API.
        """
        if len(v) < 8:
            raise ValueError("A senha deve ter pelo menos 8 caracteres.")
        if not any(c.isupper() for c in v):
            raise ValueError("A senha deve conter pelo menos uma letra maiúscula.")
        if not any(c.islower() for c in v):
            raise ValueError("A senha deve conter pelo menos uma letra minúscula.")
        if not any(c.isdigit() for c in v):
            raise ValueError("A senha deve conter pelo menos um número.")
        # Caractere especial: qualquer símbolo que não seja letra nem dígito
        if not any(not c.isalnum() for c in v):
            raise ValueError("A senha deve conter pelo menos um caractere especial.")
        return v


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
    # Nova senha — complexidade validada pelo validator abaixo
    senha_nova: str

    @field_validator("senha_nova")
    @classmethod
    def validar_complexidade_senha(cls, v: str) -> str:
        """Valida que a nova senha atende aos requisitos mínimos de segurança."""
        if len(v) < 8:
            raise ValueError("A senha deve ter pelo menos 8 caracteres.")
        if not any(c.isupper() for c in v):
            raise ValueError("A senha deve conter pelo menos uma letra maiúscula.")
        if not any(c.islower() for c in v):
            raise ValueError("A senha deve conter pelo menos uma letra minúscula.")
        if not any(c.isdigit() for c in v):
            raise ValueError("A senha deve conter pelo menos um número.")
        # Caractere especial: qualquer símbolo que não seja letra nem dígito
        if not any(not c.isalnum() for c in v):
            raise ValueError("A senha deve conter pelo menos um caractere especial.")
        return v
