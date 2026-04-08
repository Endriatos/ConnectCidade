from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Notificacao(Base):
    __tablename__ = "notificacao"

    id_notificacao = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_solicitacao = Column(Integer, ForeignKey("solicitacao.id_solicitacao"), nullable=False)
    mensagem = Column(String(300), nullable=False)
    lida = Column(Boolean, nullable=False, default=False)
    data_criacao = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relacionamento com Solicitacao — carregado automaticamente junto com a notificação (lazy="joined")
    # Permite acessar notificacao.solicitacao.protocolo sem query adicional
    solicitacao = relationship("Solicitacao", lazy="joined")

    @property
    def protocolo(self) -> str:
        """Retorna o protocolo da solicitação vinculada, ou string vazia se não houver."""
        return self.solicitacao.protocolo if self.solicitacao else ""
