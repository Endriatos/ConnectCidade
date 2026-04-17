import enum

from sqlalchemy import Column, Date, DateTime, Enum as SAEnum, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class TipoUsuario(str, enum.Enum):
    CIDADAO = "CIDADAO"
    ADMIN = "ADMIN"


class StatusConta(int, enum.Enum):
    PENDENTE = 0   # aguardando confirmação de e-mail
    ATIVO = 1      # conta confirmada e ativa
    BLOQUEADO = 2  # conta bloqueada pelo administrador


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    tipo_usuario = Column(SAEnum(TipoUsuario), nullable=False)
    cpf = Column(String(11), unique=True, nullable=False)
    nome_usuario = Column(String(150), nullable=False)
    email = Column(String(254), unique=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    telefone = Column(String(11), nullable=True)
    data_nascimento = Column(Date, nullable=False)
    status_conta = Column(Integer, nullable=False, default=StatusConta.ATIVO)
    data_cadastro = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
