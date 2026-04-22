import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.token_temporario import TipoToken, TokenTemporario

# Tempo de expiração por tipo de token
_EXPIRACAO = {
    TipoToken.RECUPERACAO_SENHA: timedelta(minutes=30),
    TipoToken.VERIFICACAO_EMAIL: timedelta(hours=24),
}


def _hash_token(token_bruto: str) -> str:
    """Calcula o hash SHA-256 do token bruto — nunca armazenamos o valor original."""
    return hashlib.sha256(token_bruto.encode()).hexdigest()


def criar_token(db: Session, id_usuario: int, tipo: TipoToken) -> str:
    """
    Gera um token temporário do tipo informado para o usuário.

    - Invalida tokens anteriores do mesmo tipo para o usuário.
    - Armazena apenas o hash SHA-256 — o token bruto é retornado uma única vez para envio por e-mail.
    - Expiração: 30 minutos para RECUPERACAO_SENHA, 24 horas para VERIFICACAO_EMAIL.
    """
    # Invalida tokens anteriores do mesmo tipo para o mesmo usuário
    db.query(TokenTemporario).filter(
        TokenTemporario.id_usuario == id_usuario,
        TokenTemporario.tipo == tipo,
        TokenTemporario.usado == False,  # noqa: E712
    ).update({"usado": True}, synchronize_session=False)

    # Gera token criptograficamente seguro e calcula seu hash para armazenamento
    token_bruto = secrets.token_urlsafe(32)
    token_hash = _hash_token(token_bruto)
    expira_em = datetime.now(timezone.utc) + _EXPIRACAO[tipo]

    novo_token = TokenTemporario(
        tipo=tipo,
        id_usuario=id_usuario,
        token_hash=token_hash,
        expira_em=expira_em,
    )
    db.add(novo_token)
    db.commit()
    # Retorna o valor bruto — única oportunidade de acessá-lo antes de ser descartado
    return token_bruto


def buscar_token_valido(db: Session, token_bruto: str, tipo: TipoToken) -> Optional[TokenTemporario]:
    """
    Busca um token válido pelo valor bruto e tipo informados.

    Considera válido apenas se: hash confere, tipo confere, não foi usado e ainda não expirou.
    """
    token_hash = _hash_token(token_bruto)
    agora = datetime.now(timezone.utc)
    return (
        db.query(TokenTemporario)
        .filter(
            TokenTemporario.token_hash == token_hash,
            TokenTemporario.tipo == tipo,
            TokenTemporario.usado == False,  # noqa: E712
            TokenTemporario.expira_em > agora,
        )
        .first()
    )


def invalidar_token(db: Session, token: TokenTemporario) -> None:
    """Marca o token como usado para impedir reutilização."""
    token.usado = True
    db.commit()
