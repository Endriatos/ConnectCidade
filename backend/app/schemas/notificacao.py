from datetime import datetime

from pydantic import BaseModel, ConfigDict


# Schema de resposta para notificações internas do usuário autenticado
class NotificacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_notificacao: int
    id_solicitacao: int
    # Protocolo da solicitação vinculada — preenchido via join no CRUD
    protocolo: str
    mensagem: str
    lida: bool
    data_criacao: datetime
