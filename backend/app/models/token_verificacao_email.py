from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TokenVerificacaoEmail(Base):
    __tablename__ = "token_verificacao_email"

    id_token = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    token_hash = Column(String(64), nullable=False)
    expira_em = Column(DateTime(timezone=True), nullable=False)
    usado = Column(Boolean, nullable=False, default=False)
    data_criacao = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    usuario = relationship("Usuario")
