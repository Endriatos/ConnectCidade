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
    # Indica se o usuário autenticado já apoiou esta solicitação;
    # preenchido manualmente no endpoint de detalhe (não vem do ORM)
    ja_apoiado: Optional[bool] = None


class AtualizacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_atualizacao: int
    status_anterior: str
    status_novo: str
    comentario: str
    data_atualizacao: datetime
    # Nome do administrador que realizou a atualização; None se não houver responsável registrado
    nome_administrador: Optional[str] = None


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
