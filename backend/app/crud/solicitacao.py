from sqlalchemy.orm import Session

from app.models import Solicitacao
from app.models.solicitacao import StatusSolicitacao
from app.schemas.solicitacao import SolicitacaoCreate
from app.utils.geo_utils import calcular_distancia_metros
from app.utils.protocolo_utils import gerar_protocolo


def get_solicitacao_por_id(db: Session, id_solicitacao: int):
    # Busca uma solicitação pelo seu identificador único
    return db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_solicitacao).first()


def get_solicitacoes_por_autor(db: Session, id_autor: int):
    # Retorna todas as solicitações criadas pelo usuário, da mais recente para a mais antiga
    return (
        db.query(Solicitacao)
        .filter(Solicitacao.id_autor == id_autor)
        .order_by(Solicitacao.data_registro.desc())
        .all()
    )


def verificar_duplicata(db: Session, id_categoria: int, latitude: float, longitude: float):
    """
    Verifica se já existe uma solicitação ativa (não cancelada) da mesma categoria
    a menos de 50 metros do ponto informado. Retorna a solicitação mais próxima ou None.
    """
    # Busca todas as solicitações ativas da mesma categoria
    solicitacoes_ativas = (
        db.query(Solicitacao)
        .filter(
            Solicitacao.id_categoria == id_categoria,
            Solicitacao.status != StatusSolicitacao.CANCELADO,
        )
        .all()
    )

    # Para cada solicitação ativa, calcula a distância em metros até o ponto informado
    for solicitacao in solicitacoes_ativas:
        distancia = calcular_distancia_metros(
            latitude,
            longitude,
            float(solicitacao.latitude),
            float(solicitacao.longitude),
        )
        # Se a distância for menor que 50 metros, considera duplicata
        if distancia < 50:
            return solicitacao

    return None


def create_solicitacao(db: Session, dados: SolicitacaoCreate, id_autor: int):
    # Gera o número de protocolo único para esta solicitação
    protocolo = gerar_protocolo(db)
    solicitacao = Solicitacao(
        id_autor=id_autor,
        id_categoria=dados.id_categoria,
        protocolo=protocolo,
        descricao=dados.descricao,
        endereco_referencia=dados.endereco_referencia,
        latitude=dados.latitude,
        longitude=dados.longitude,
        status=StatusSolicitacao.PENDENTE,
        contador_apoios=0,
    )
    db.add(solicitacao)
    # flush: envia o INSERT na transação atual para obter id_solicitacao sem dar commit
    # (o router faz commit depois de gravar também as fotos na mesma transação)
    db.flush()
    db.refresh(solicitacao)
    return solicitacao


def cancelar_solicitacao(db: Session, solicitacao: Solicitacao) -> Solicitacao:
    # Atualiza o status da solicitação para CANCELADO e persiste no banco
    solicitacao.status = StatusSolicitacao.CANCELADO
    db.commit()
    db.refresh(solicitacao)
    return solicitacao
