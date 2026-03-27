from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.atualizacao import Atualizacao
from app.models.solicitacao import Solicitacao, StatusSolicitacao


def atualizar_status(
    db: Session,
    id_solicitacao: int,
    status_novo: StatusSolicitacao,
    comentario: str,
    id_administrador: int,
) -> Solicitacao:
    """
    Atualiza o status de uma solicitação e registra a mudança na tabela atualizacao.

    Regras aplicadas:
    - Se o status_novo for RESOLVIDO, preenche data_resolucao com o instante atual.
    - Se a solicitação estava RESOLVIDO e está saindo desse status, limpa data_resolucao.
    - Sempre registra um registro de auditoria em atualizacao com status anterior/novo,
      comentário do administrador e referência ao admin responsável.

    Lança ValueError se a solicitação não for encontrada.
    """
    # Busca a solicitação — lança erro se não existir (tratado no router como 404)
    solicitacao = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_solicitacao).first()
    if not solicitacao:
        raise ValueError("Solicitação não encontrada.")

    status_anterior = solicitacao.status

    # Registra a auditoria da mudança de status na tabela atualizacao
    atualizacao = Atualizacao(
        id_solicitacao=id_solicitacao,
        id_administrador=id_administrador,
        status_anterior=status_anterior,
        status_novo=status_novo,
        comentario=comentario,
        data_atualizacao=datetime.now(timezone.utc),
    )
    db.add(atualizacao)

    # Atualiza o status da solicitação
    solicitacao.status = status_novo
    solicitacao.data_atualizacao = datetime.now(timezone.utc)

    # Preenche data_resolucao ao marcar como RESOLVIDO
    if status_novo == StatusSolicitacao.RESOLVIDO:
        solicitacao.data_resolucao = datetime.now(timezone.utc)
    # Limpa data_resolucao ao sair do status RESOLVIDO
    elif status_anterior == StatusSolicitacao.RESOLVIDO:
        solicitacao.data_resolucao = None

    db.commit()
    db.refresh(solicitacao)
    return solicitacao
