from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TokenRecuperacao(Base):
    __tablename__ = "token_recuperacao"

    id_token = Column(Integer, primary_key=True, autoincrement=True)
    # Referência ao usuário dono do token de recuperação
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    # Armazenamos o hash SHA-256 do token — nunca o valor bruto enviado por e-mail
    token_hash = Column(String(64), nullable=False)
    # Instante a partir do qual o token não é mais válido
    expira_em = Column(DateTime(timezone=True), nullable=False)
    # Indica se o token já foi consumido — tokens usados são rejeitados mesmo dentro do prazo
    usado = Column(Boolean, nullable=False, default=False)
    data_criacao = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relacionamento com Usuario para acesso fácil aos dados do dono do token
    usuario = relationship("Usuario")
