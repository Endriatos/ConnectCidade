from sqlalchemy.orm import Session

from app.models.apoio import Apoio
from app.models.solicitacao import Solicitacao, StatusSolicitacao


def ja_apoiou(db: Session, id_solicitacao: int, id_usuario: int) -> bool:
    """Retorna True se o usuário já registrou apoio para esta solicitação."""
    return (
        db.query(Apoio)
        .filter(
            Apoio.id_solicitacao == id_solicitacao,
            Apoio.id_usuario == id_usuario,
        )
        .first()
        is not None
    )


def apoiar(db: Session, id_solicitacao: int, id_usuario: int) -> Apoio:
    """
    Registra o apoio do usuário à solicitação e incrementa o contador_apoios.

    Lança ValueError se:
    - a solicitação não existir;
    - a solicitação estiver CANCELADA;
    - o usuário já tiver apoiado esta solicitação.
    """
    # Busca a solicitação — garante que existe antes de qualquer operação
    solicitacao = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_solicitacao).first()
    if not solicitacao:
        raise ValueError("Solicitação não encontrada.")

    # Não permite apoiar solicitações canceladas
    if solicitacao.status == StatusSolicitacao.CANCELADO:
        raise ValueError("Não é possível apoiar uma solicitação cancelada.")

    # Impede apoio duplicado do mesmo usuário
    if ja_apoiou(db, id_solicitacao, id_usuario):
        raise ValueError("Usuário já apoiou esta solicitação.")

    # Cria o registro de apoio na tabela apoio
    apoio = Apoio(id_solicitacao=id_solicitacao, id_usuario=id_usuario)
    db.add(apoio)

    # Incrementa o contador denormalizado para consultas rápidas sem JOIN
    solicitacao.contador_apoios += 1

    db.commit()
    db.refresh(apoio)
    return apoio


def retirar_apoio(db: Session, id_solicitacao: int, id_usuario: int) -> None:
    """
    Remove o apoio do usuário à solicitação e decrementa o contador_apoios.

    Lança ValueError se o usuário não tiver apoiado esta solicitação.
    O contador nunca é decrementado abaixo de zero por segurança.
    """
    # Verifica se a solicitação existe antes de buscar o apoio
    solicitacao = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_solicitacao).first()
    if not solicitacao:
        raise ValueError("Solicitação não encontrada.")

    # Verifica se o apoio existe antes de tentar remover
    apoio = (
        db.query(Apoio)
        .filter(
            Apoio.id_solicitacao == id_solicitacao,
            Apoio.id_usuario == id_usuario,
        )
        .first()
    )
    if not apoio:
        raise ValueError("Usuário não apoiou esta solicitação.")

    # Remove o registro de apoio
    db.delete(apoio)

    # Decrementa o contador garantindo que não fique negativo
    if solicitacao.contador_apoios > 0:
        solicitacao.contador_apoios -= 1

    db.commit()
