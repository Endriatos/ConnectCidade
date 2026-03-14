from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Solicitacao


def gerar_protocolo(db: Session) -> str:
    ano_atual = str(datetime.now().year)

    # Busca a solicitação com o maior id para obter o último protocolo gerado
    ultima = db.query(Solicitacao).order_by(Solicitacao.id_solicitacao.desc()).first()

    if ultima is None:
        # Nenhuma solicitação existe ainda — sequencial começa em 1
        sequencial = 1
    else:
        # Extrai a parte numérica após o hífen (ex: "2026-00003" → "00003") e incrementa
        sequencial = int(ultima.protocolo.split("-")[1]) + 1

    # Formata o sequencial com 5 dígitos, preenchendo com zeros à esquerda
    return f"{ano_atual}-{str(sequencial).zfill(5)}"
