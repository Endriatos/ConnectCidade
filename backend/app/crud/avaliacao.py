from sqlalchemy.orm import Session

from app.models.avaliacao import Avaliacao
from app.models.solicitacao import Solicitacao, StatusSolicitacao
from app.schemas.avaliacao import AvaliacaoCreate


def criar_avaliacao(
    db: Session,
    id_solicitacao: int,
    id_usuario: int,
    dados: AvaliacaoCreate,
) -> Avaliacao:
    """
    Cria uma avaliação para uma solicitação resolvida.

    Regras validadas antes da criação:
    - A solicitação deve existir.
    - O status da solicitação deve ser RESOLVIDO.
    - Somente o autor da solicitação pode avaliá-la.
    - Cada solicitação só pode ter uma avaliação (unique no banco).

    Lança ValueError com mensagem descritiva para cada regra violada.
    """
    # Busca a solicitação — lança erro se não existir
    solicitacao = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_solicitacao).first()
    if solicitacao is None:
        raise ValueError("Solicitação não encontrada.")

    # Somente solicitações com status RESOLVIDO podem ser avaliadas
    if solicitacao.status != StatusSolicitacao.RESOLVIDO:
        raise ValueError("Apenas solicitações resolvidas podem ser avaliadas.")

    # Somente o autor da solicitação pode registrar uma avaliação
    if solicitacao.id_autor != id_usuario:
        raise ValueError("Você não tem permissão para avaliar esta solicitação.")

    # Impede duplicidade — cada solicitação aceita no máximo uma avaliação
    avaliacao_existente = db.query(Avaliacao).filter(Avaliacao.id_solicitacao == id_solicitacao).first()
    if avaliacao_existente is not None:
        raise ValueError("Esta solicitação já foi avaliada.")

    # Cria e persiste a nova avaliação
    avaliacao = Avaliacao(
        id_solicitacao=id_solicitacao,
        id_usuario=id_usuario,
        foi_resolvido=dados.foi_resolvido,
        nota=dados.nota,
        comentario=dados.comentario,
    )
    db.add(avaliacao)
    db.commit()
    db.refresh(avaliacao)
    return avaliacao
