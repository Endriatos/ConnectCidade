from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.config import settings

# bcrypt é um algoritmo de hashing projetado especificamente para senhas.
# Diferente de MD5/SHA, ele é intencionalmente lento e inclui um "salt" aleatório
# embutido no hash, o que o torna resistente a ataques de força bruta e rainbow tables.
# Nunca armazenamos a senha em texto puro — apenas o hash resultante.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def validar_complexidade_senha(senha: str) -> None:
    """
    Valida os requisitos mínimos de segurança de uma senha.
    Fonte única da lógica de complexidade — reutilizada pelos schemas e routers.
    Lança ValueError com mensagem em português para cada regra violada.
    """
    if len(senha) < 8:
        raise ValueError("A senha deve ter pelo menos 8 caracteres.")
    if not any(c.isupper() for c in senha):
        raise ValueError("A senha deve conter pelo menos uma letra maiúscula.")
    if not any(c.islower() for c in senha):
        raise ValueError("A senha deve conter pelo menos uma letra minúscula.")
    if not any(c.isdigit() for c in senha):
        raise ValueError("A senha deve conter pelo menos um número.")
    # Caractere especial: qualquer símbolo que não seja letra nem dígito
    if not any(not c.isalnum() for c in senha):
        raise ValueError("A senha deve conter pelo menos um caractere especial.")


def hashear_senha(senha: str) -> str:
    return pwd_context.hash(senha)


def verificar_senha(senha: str, hash: str) -> bool:
    return pwd_context.verify(senha, hash)


def criar_token_acesso(dados: dict) -> str:
    """
    Gera um JSON Web Token (JWT) assinado com a chave secreta da aplicação.

    JWT é um padrão (RFC 7519) para transmitir informações entre partes de forma
    compacta e segura. O token é composto por três partes codificadas em Base64:
    header (algoritmo), payload (dados) e assinatura. A assinatura garante que o
    token não foi adulterado — qualquer alteração invalida a assinatura.

    Campos do payload:
      - sub  (subject): identifica o usuário — usamos o CPF como identificador único
      - tipo: tipo de usuário (CIDADAO ou ADMIN) — usado para controle de acesso
      - exp  (expiration): timestamp UTC de expiração — após essa data o token é rejeitado
    """
    payload = dados.copy()
    expiracao = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # exp é um campo reservado do JWT — bibliotecas como python-jose o validam automaticamente
    payload["exp"] = expiracao
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
