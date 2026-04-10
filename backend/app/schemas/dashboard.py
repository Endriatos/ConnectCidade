from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict


# Item de distribuição de solicitações por categoria
class CategoriaStatusItem(BaseModel):
    id_categoria: int
    nome_categoria: str
    cor_hex: str
    total: int


# Item de média de avaliação por categoria
class MediaAvaliacaoCategoria(BaseModel):
    id_categoria: int
    nome_categoria: str
    # Média arredondada para 1 casa decimal
    media_nota: float


# Item do gráfico mensal (criadas vs. resolvidas por mês)
class GraficoMensalItem(BaseModel):
    # Formato "YYYY-MM"
    mes: str
    criadas: int
    resolvidas: int


class FilaAtencaoItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_solicitacao: int
    protocolo: str
    nome_categoria: str
    cor_hex: str
    status: str
    contador_apoios: int
    data_registro: datetime
    endereco_referencia: str
    descricao: str
    score: int


class DashboardResponse(BaseModel):
    # -----------------------------------------------------------------------
    # KPIs fixos — ignoram o filtro de período
    # -----------------------------------------------------------------------

    # Solicitações em andamento: PENDENTE + EM_ANALISE + EM_ANDAMENTO
    total_abertos: int
    # Contagem de solicitações em cada um dos 5 status
    por_status: Dict[str, int]
    # Total de solicitações não canceladas agrupadas por categoria
    por_categoria: List[CategoriaStatusItem]
    # Cidadãos ativos cadastrados na plataforma
    total_cidadaos: int
    # Média de nota das avaliações agrupada por categoria (apenas categorias com avaliações)
    media_avaliacao_por_categoria: List[MediaAvaliacaoCategoria]
    # Média geral de todas as avaliações; null se não houver nenhuma
    media_avaliacao_geral: Optional[float]

    # -----------------------------------------------------------------------
    # Dados filtrados pelo período selecionado
    # -----------------------------------------------------------------------

    # Solicitações criadas dentro do período
    total_abertas_periodo: int
    # Solicitações com status RESOLVIDO criadas dentro do período
    total_resolvidas_periodo: int
    # Média de dias entre data_registro e data_resolucao para solicitações resolvidas no período
    tempo_medio_resolucao_dias: Optional[float]
    # Percentual (0-100) de avaliações com foi_resolvido=True no período; null se sem avaliações
    indice_resolucao_efetiva: Optional[float]
    # Média de notas das avaliações de solicitações criadas no período; null se sem avaliações
    media_avaliacao_periodo: Optional[float]
    # Evolução mensal dos últimos 6 meses (independente do filtro de período)
    grafico_mensal: List[GraficoMensalItem]
