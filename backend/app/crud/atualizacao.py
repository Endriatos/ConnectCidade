from sqlalchemy.orm import Session

from app.models.atualizacao import Atualizacao
from app.models.usuario import Usuario


def get_timeline(db: Session, id_solicitacao: int) -> list:
    """
    Retorna a timeline de atualizações de status de uma solicitação.

    Faz LEFT JOIN com a tabela usuario para trazer o nome do administrador
    responsável por cada atualização. Quando id_administrador é nulo
    (ação realizada pelo próprio cidadão, como cancelamento enquanto status PENDENTE), nome_administrador fica None.
    Os registros são ordenados por data_atualizacao ascendente para
    exibir a sequência cronológica das mudanças de status.
    """
    # Busca todas as atualizações da solicitação com JOIN opcional no usuário
    resultados = (
        db.query(Atualizacao, Usuario.nome_usuario)
        .outerjoin(Usuario, Atualizacao.id_administrador == Usuario.id_usuario)
        .filter(Atualizacao.id_solicitacao == id_solicitacao)
        .order_by(Atualizacao.data_atualizacao.asc())
        .all()
    )

    # Monta a lista de dicts compatível com AtualizacaoResponse
    timeline = []
    for atualizacao, nome_admin in resultados:
        timeline.append({
            "id_atualizacao": atualizacao.id_atualizacao,
            "status_anterior": atualizacao.status_anterior.value,
            "status_novo": atualizacao.status_novo.value,
            "comentario": atualizacao.comentario,
            "data_atualizacao": atualizacao.data_atualizacao,
            # Preenche com o nome do usuário ou None se o administrador não estiver registrado
            "nome_administrador": nome_admin,
        })

    return timeline
