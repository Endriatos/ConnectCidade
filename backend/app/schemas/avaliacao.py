from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# Schema de entrada para criação de avaliação de uma solicitação resolvida
class AvaliacaoCreate(BaseModel):
    # Indica se o cidadão considera que o problema foi de fato resolvido
    foi_resolvido: bool
    # Nota de 1 (péssimo) a 5 (ótimo) para o atendimento
    nota: int = Field(..., ge=1, le=5)
    # Comentário livre e opcional sobre a resolução
    comentario: Optional[str] = None


# Schema de resposta com os dados completos da avaliação registrada
class AvaliacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_avaliacao: int
    id_solicitacao: int
    id_usuario: int
    foi_resolvido: bool
    nota: int
    comentario: Optional[str]
    data_avaliacao: datetime
