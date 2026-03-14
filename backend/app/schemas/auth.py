from pydantic import BaseModel


class LoginInput(BaseModel):
    cpf: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tipo_usuario: str
