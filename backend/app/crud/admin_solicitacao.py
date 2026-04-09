import math
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.atualizacao import Atualizacao
from app.models.solicitacao import OrdemSolicitacao, Solicitacao, StatusSolicitacao


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


def get_solicitacao_por_id(db: Session, id_solicitacao: int) -> Solicitacao | None:
    """
    Busca uma solicitação pelo id_solicitacao.
    Retorna o objeto Solicitacao se encontrado, ou None caso não exista.
    """
    return db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_solicitacao).first()


def listar_solicitacoes(
    db: Session,
    status: Optional[StatusSolicitacao] = None,
    id_categoria: Optional[int] = None,
    protocolo: Optional[str] = None,
    id_autor: Optional[int] = None,
    endereco: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    ordem: Optional[OrdemSolicitacao] = None,
    pagina: int = 1,
    por_pagina: int = 20,
) -> dict:
    """
    Lista solicitações com filtros opcionais e paginação.

    Filtros disponíveis:
    - status: filtra pelo status da solicitação (ex: ABERTO, RESOLVIDO)
    - id_categoria: filtra pela categoria da solicitação
    - protocolo: busca parcial (case-insensitive) no campo protocolo
    - id_autor: filtra pelo id do cidadão que criou a solicitação

    Ordenação:
    - "mais_apoiados": ordena por contador_apoios decrescente
    - "mais_antigos": ordena por data_registro crescente
    - qualquer outro valor ou None: ordena por data_registro decrescente (padrão)

    Retorna um dict compatível com PaginacaoResponse.
    """
    # Inicia a query base na tabela solicitacao
    query = db.query(Solicitacao)

    # Aplica filtro por status apenas se informado
    if status is not None:
        query = query.filter(Solicitacao.status == status)

    # Aplica filtro por categoria apenas se informado
    if id_categoria is not None:
        query = query.filter(Solicitacao.id_categoria == id_categoria)

    # Aplica busca parcial por protocolo apenas se informado
    if protocolo is not None:
        query = query.filter(Solicitacao.protocolo.ilike(f"%{protocolo}%"))

    # Aplica filtro por autor apenas se informado
    if id_autor is not None:
        query = query.filter(Solicitacao.id_autor == id_autor)

    # Busca parcial por endereço de referência
    if endereco is not None:
        query = query.filter(Solicitacao.endereco_referencia.ilike(f"%{endereco}%"))

    # Filtra solicitações criadas a partir de data_inicio (inclusive)
    if data_inicio is not None:
        inicio_dt = datetime(data_inicio.year, data_inicio.month, data_inicio.day, tzinfo=timezone.utc)
        query = query.filter(Solicitacao.data_registro >= inicio_dt)

    # Filtra solicitações criadas até data_fim (inclusive — avança ao início do dia seguinte)
    if data_fim is not None:
        fim_dt = datetime(data_fim.year, data_fim.month, data_fim.day, tzinfo=timezone.utc) + timedelta(days=1)
        query = query.filter(Solicitacao.data_registro < fim_dt)

    # Define a ordenação conforme o parâmetro recebido
    if ordem == OrdemSolicitacao.mais_apoiados:
        query = query.order_by(Solicitacao.contador_apoios.desc())
    elif ordem == OrdemSolicitacao.mais_antigos:
        query = query.order_by(Solicitacao.data_registro.asc())
    else:
        # Padrão (None ou mais_recentes): mais recentes primeiro
        query = query.order_by(Solicitacao.data_registro.desc())

    # Conta o total de registros antes de aplicar a paginação
    total = query.count()

    # Calcula o número total de páginas
    paginas = math.ceil(total / por_pagina) if total > 0 else 1

    # Aplica offset e limit para retornar apenas a página solicitada
    itens = query.offset((pagina - 1) * por_pagina).limit(por_pagina).all()

    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "paginas": paginas,
        "itens": itens,
    }
