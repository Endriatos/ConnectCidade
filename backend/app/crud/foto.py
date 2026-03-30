from sqlalchemy.orm import Session

from app.models import Foto


def get_fotos_por_solicitacao(db: Session, id_solicitacao: int):
    # Retorna todas as fotos da solicitação ordenadas pela posição definida no campo ordem
    return (
        db.query(Foto)
        .filter(Foto.id_solicitacao == id_solicitacao)
        .order_by(Foto.ordem)
        .all()
    )


def create_foto(db: Session, id_solicitacao: int, caminho_arquivo: str, ordem: int) -> Foto:
    # Cria um novo registro de foto vinculado à solicitação informada
    foto = Foto(
        id_solicitacao=id_solicitacao,
        caminho_arquivo=caminho_arquivo,
        ordem=ordem,
    )
    db.add(foto)
    db.commit()
    db.refresh(foto)
    return foto


def create_foto_nocommit(db: Session, id_solicitacao: int, caminho_arquivo: str, ordem: int) -> Foto:
    # Novo: igual ao create_foto, mas sem commit — usado ao criar solicitação com várias fotos num único commit no router
    foto = Foto(
        id_solicitacao=id_solicitacao,
        caminho_arquivo=caminho_arquivo,
        ordem=ordem,
    )
    db.add(foto)
    return foto
