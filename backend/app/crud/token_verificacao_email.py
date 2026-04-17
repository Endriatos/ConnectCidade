import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.token_verificacao_email import TokenVerificacaoEmail


def _hash_token(token_bruto: str) -> str:
    return hashlib.sha256(token_bruto.encode()).hexdigest()


def criar_token(db: Session, id_usuario: int) -> str:
    db.query(TokenVerificacaoEmail).filter(
        TokenVerificacaoEmail.id_usuario == id_usuario,
        TokenVerificacaoEmail.usado == False,  # noqa: E712
    ).update({"usado": True}, synchronize_session=False)

    token_bruto = secrets.token_urlsafe(32)
    token_hash = _hash_token(token_bruto)
    expira_em = datetime.now(timezone.utc) + timedelta(hours=24)

    novo_token = TokenVerificacaoEmail(
        id_usuario=id_usuario,
        token_hash=token_hash,
        expira_em=expira_em,
    )
    db.add(novo_token)
    db.commit()
    return token_bruto


def buscar_token_valido(db: Session, token_bruto: str) -> Optional[TokenVerificacaoEmail]:
    token_hash = _hash_token(token_bruto)
    agora = datetime.now(timezone.utc)
    return (
        db.query(TokenVerificacaoEmail)
        .filter(
            TokenVerificacaoEmail.token_hash == token_hash,
            TokenVerificacaoEmail.usado == False,  # noqa: E712
            TokenVerificacaoEmail.expira_em > agora,
        )
        .first()
    )


def invalidar_token(db: Session, token: TokenVerificacaoEmail) -> None:
    token.usado = True
    db.commit()
