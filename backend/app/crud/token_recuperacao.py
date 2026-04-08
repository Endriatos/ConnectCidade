import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.token_recuperacao import TokenRecuperacao


def _hash_token(token_bruto: str) -> str:
    """Calcula o hash SHA-256 do token bruto — nunca armazenamos o valor original."""
    return hashlib.sha256(token_bruto.encode()).hexdigest()


def criar_token(db: Session, id_usuario: int) -> str:
    """
    Gera um token de recuperação de senha para o usuário informado.

    - Invalida todos os tokens anteriores do usuário para evitar múltiplos tokens ativos.
    - Armazena apenas o hash SHA-256 — o token bruto é retornado uma única vez para envio por e-mail.
    - O token expira em 1 hora a partir da criação.
    """
    # Invalida tokens anteriores do usuário que ainda não foram usados
    db.query(TokenRecuperacao).filter(
        TokenRecuperacao.id_usuario == id_usuario,
        TokenRecuperacao.usado == False,  # noqa: E712
    ).update({"usado": True}, synchronize_session=False)

    # Gera token criptograficamente seguro e calcula seu hash para armazenamento
    token_bruto = secrets.token_urlsafe(32)
    token_hash = _hash_token(token_bruto)

    # Define a janela de validade de 1 hora
    expira_em = datetime.now(timezone.utc) + timedelta(hours=1)

    novo_token = TokenRecuperacao(
        id_usuario=id_usuario,
        token_hash=token_hash,
        expira_em=expira_em,
    )
    db.add(novo_token)
    db.commit()

    # Retorna o valor bruto — única oportunidade de acessá-lo antes de ser descartado
    return token_bruto


def buscar_token_valido(db: Session, token_bruto: str) -> Optional[TokenRecuperacao]:
    """
    Busca um token de recuperação válido pelo valor bruto recebido.

    Considera válido apenas se: hash confere, não foi usado e ainda não expirou.
    Retorna o objeto TokenRecuperacao ou None se inválido/inexistente.
    """
    token_hash = _hash_token(token_bruto)
    agora = datetime.now(timezone.utc)

    return (
        db.query(TokenRecuperacao)
        .filter(
            TokenRecuperacao.token_hash == token_hash,
            TokenRecuperacao.usado == False,  # noqa: E712
            TokenRecuperacao.expira_em > agora,
        )
        .first()
    )


def invalidar_token(db: Session, token: TokenRecuperacao) -> None:
    """
    Marca o token como usado para impedir reutilização.
    Deve ser chamado imediatamente após a senha ser redefinida com sucesso.
    """
    token.usado = True
    db.commit()
