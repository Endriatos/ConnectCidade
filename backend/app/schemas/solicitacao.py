from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.foto import FotoResponse


class SolicitacaoCreate(BaseModel):
    id_categoria: int
    descricao: str
    endereco_referencia: str
    latitude: float
    longitude: float
    confirmar_duplicata: bool = False


class SolicitacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_solicitacao: int
    id_autor: int
    id_categoria: int
    protocolo: str
    descricao: str
    endereco_referencia: str
    latitude: float
    longitude: float
    status: str
    contador_apoios: int
    data_registro: datetime
    data_atualizacao: datetime
    data_resolucao: Optional[datetime] = None


class SolicitacaoMapaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_solicitacao: int
    latitude: float
    longitude: float
    id_categoria: int
    protocolo: str
    status: str
    endereco_referencia: str
    descricao: str
    contador_apoios: int
    data_registro: datetime
    fotos: List[FotoResponse]
