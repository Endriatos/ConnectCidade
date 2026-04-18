import math
from typing import Optional

from sqlalchemy.orm import Session

from app.models.avaliacao import Avaliacao
from app.models.categoria import Categoria
from app.models.solicitacao import Solicitacao, StatusSolicitacao
from app.models.usuario import Usuario
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


def listar_avaliacoes(
    db: Session,
    id_categoria: Optional[int] = None,
    foi_resolvido: Optional[bool] = None,
    nota: Optional[int] = None,
    pagina: int = 1,
    por_pagina: int = 20,
) -> dict:
    """
    Lista avaliações com filtros opcionais e paginação para o painel admin.
    Ordenação fixa: mais recentes primeiro.
    """
    # Inicia query com JOINs para trazer dados da solicitação, categoria e autor
    query = (
        db.query(Avaliacao, Solicitacao.protocolo, Categoria.nome_categoria, Categoria.cor_hex, Usuario.nome_usuario)
        .join(Solicitacao, Avaliacao.id_solicitacao == Solicitacao.id_solicitacao)
        .join(Categoria, Solicitacao.id_categoria == Categoria.id_categoria)
        .join(Usuario, Avaliacao.id_usuario == Usuario.id_usuario)
    )

    # Filtra por categoria se informado
    if id_categoria is not None:
        query = query.filter(Solicitacao.id_categoria == id_categoria)

    # Filtra por resolução efetiva se informado
    if foi_resolvido is not None:
        query = query.filter(Avaliacao.foi_resolvido == foi_resolvido)

    # Filtra por nota exata se informado
    if nota is not None:
        query = query.filter(Avaliacao.nota == nota)

    # Ordena sempre pelas mais recentes primeiro
    query = query.order_by(Avaliacao.data_avaliacao.desc())

    total = query.count()
    paginas = math.ceil(total / por_pagina) if total > 0 else 1
    rows = query.offset((pagina - 1) * por_pagina).limit(por_pagina).all()

    # Monta os dicts combinando os campos da avaliação com os dados dos JOINs
    itens = [
        {
            **av.__dict__,
            "protocolo": protocolo,
            "nome_categoria": nome_categoria,
            "cor_hex": cor_hex,
            "nome_autor": nome_usuario,
        }
        for av, protocolo, nome_categoria, cor_hex, nome_usuario in rows
    ]

    return {"total": total, "pagina": pagina, "por_pagina": por_pagina, "paginas": paginas, "itens": itens}
