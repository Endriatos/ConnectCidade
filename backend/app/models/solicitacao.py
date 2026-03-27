import enum

from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.sql import func

from app.database import Base


class StatusSolicitacao(str, enum.Enum):
    PENDENTE = "PENDENTE"
    EM_ANALISE = "EM_ANALISE"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    RESOLVIDO = "RESOLVIDO"
    CANCELADO = "CANCELADO"


# Critérios de ordenação disponíveis na listagem de solicitações
class OrdemSolicitacao(str, enum.Enum):
    mais_recentes = "mais_recentes"
    mais_antigos = "mais_antigos"
    mais_apoiados = "mais_apoiados"


class Solicitacao(Base):
    __tablename__ = "solicitacao"

    id_solicitacao = Column(Integer, primary_key=True, autoincrement=True)
    id_autor = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("categoria.id_categoria"), nullable=False)
    protocolo = Column(String(12), unique=True, nullable=False)
    descricao = Column(Text, nullable=False)
    endereco_referencia = Column(String(300), nullable=False)
    latitude = Column(Numeric(precision=9, scale=6), nullable=False)
    longitude = Column(Numeric(precision=9, scale=6), nullable=False)
    status = Column(SAEnum(StatusSolicitacao), nullable=False, default=StatusSolicitacao.PENDENTE)
    contador_apoios = Column(Integer, nullable=False, default=0)
    data_registro = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    data_atualizacao = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    data_resolucao = Column(DateTime(timezone=True), nullable=True)
