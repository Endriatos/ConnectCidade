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


# Schema de resumo de solicitação usado no detalhe de um cidadão no painel admin
# nome_categoria não existe no model Solicitacao — vem de join com a tabela categoria
class SolicitacaoResumoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_solicitacao: int
    protocolo: str
    nome_categoria: str
    status: str
    data_registro: datetime


# Schema de resposta paginada para listagem de solicitações administrativas
class PaginacaoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # Total de registros encontrados com os filtros aplicados
    total: int
    # Página atual da listagem
    pagina: int
    # Quantidade de itens por página
    por_pagina: int
    # Total de páginas calculado com base no total e por_pagina
    paginas: int
    # Itens da página atual
    itens: List[SolicitacaoResponse]
