from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.notificacao import Notificacao


def criar_notificacao(
    db: Session,
    id_usuario: int,
    id_solicitacao: int,
    mensagem: str,
) -> Notificacao:
    """
    Instancia e persiste uma nova notificação para o usuário informado.
    Retorna o objeto Notificacao recém-criado.
    """
    notificacao = Notificacao(
        id_usuario=id_usuario,
        id_solicitacao=id_solicitacao,
        mensagem=mensagem,
    )
    db.add(notificacao)
    db.commit()
    db.refresh(notificacao)
    return notificacao


def excluir_antigas(db: Session, id_usuario: int) -> None:
    """
    Exclui todas as notificações do usuário (lidas e não lidas) com
    data_criacao anterior a 90 dias atrás, para evitar acúmulo no banco.
    """
    # Usa datetime com timezone UTC para consistência com os demais campos do sistema
    limite = datetime.now(timezone.utc) - timedelta(days=90)
    db.query(Notificacao).filter(
        Notificacao.id_usuario == id_usuario,
        Notificacao.data_criacao < limite,
    ).delete(synchronize_session=False)
    db.commit()


def listar_notificacoes(db: Session, id_usuario: int) -> List[Notificacao]:
    """
    Retorna todas as notificações do usuário ordenadas pela mais recente primeiro.
    Remove automaticamente notificações com mais de 90 dias antes de listar.
    O protocolo é acessível via notificacao.solicitacao.protocolo pelo relationship.
    """
    # Remove notificações antigas antes de montar a listagem
    excluir_antigas(db, id_usuario)

    return (
        db.query(Notificacao)
        .filter(Notificacao.id_usuario == id_usuario)
        .order_by(Notificacao.data_criacao.desc())
        .all()
    )


def marcar_como_lida(
    db: Session,
    id_notificacao: int,
    id_usuario: int,
) -> Optional[Notificacao]:
    """
    Marca uma notificação como lida, garantindo que ela pertence ao usuário autenticado.
    Retorna None se a notificação não existir ou não pertencer ao usuário.
    O protocolo é acessível via notificacao.solicitacao.protocolo pelo relationship.
    """
    notificacao = (
        db.query(Notificacao)
        .filter(
            Notificacao.id_notificacao == id_notificacao,
            Notificacao.id_usuario == id_usuario,
        )
        .first()
    )

    if notificacao is None:
        return None

    notificacao.lida = True
    db.commit()
    db.refresh(notificacao)
    return notificacao
