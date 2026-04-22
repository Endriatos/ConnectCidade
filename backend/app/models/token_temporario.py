import enum

from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TipoToken(str, enum.Enum):
    RECUPERACAO_SENHA = "RECUPERACAO_SENHA"
    VERIFICACAO_EMAIL = "VERIFICACAO_EMAIL"


class TokenTemporario(Base):
    __tablename__ = "token_temporario"

    id_token = Column(Integer, primary_key=True, autoincrement=True)
    # Tipo do token — define o fluxo e o tempo de expiração
    tipo = Column(SAEnum(TipoToken), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    # Armazenamos o hash SHA-256 do token — nunca o valor bruto enviado por e-mail
    token_hash = Column(String(64), nullable=False)
    expira_em = Column(DateTime(timezone=True), nullable=False)
    # Tokens usados são rejeitados mesmo dentro do prazo
    usado = Column(Boolean, nullable=False, default=False)
    data_criacao = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # Relacionamento com Usuario para acesso fácil aos dados do dono do token
    usuario = relationship("Usuario")
