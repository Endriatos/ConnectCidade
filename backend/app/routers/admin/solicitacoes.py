from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.crud.admin_solicitacao import atualizar_status, get_solicitacao_por_id, listar_solicitacoes
from app.crud.notificacao import criar_notificacao
from app.crud.usuario import get_usuario_por_id
from app.utils.email_utils import enviar_email
from app.models.solicitacao import StatusSolicitacao
from app.schemas.solicitacao import PaginacaoResponse, SolicitacaoResponse
from app.utils.deps import get_admin_atual, get_db

router = APIRouter(prefix="/admin/solicitacoes", tags=["Admin - Solicitações"])


@router.get("", response_model=PaginacaoResponse)
def listar_solicitacoes_admin(
    # Filtro opcional por status da solicitação
    status_filtro: Optional[StatusSolicitacao] = Query(None, alias="status"),
    # Filtro opcional por id da categoria
    id_categoria: Optional[int] = Query(None),
    # Busca parcial pelo protocolo da solicitação
    protocolo: Optional[str] = Query(None),
    # Filtro opcional pelo id do cidadão autor das solicitações
    id_autor: Optional[int] = Query(None),
    # Busca parcial pelo endereço de referência da solicitação
    endereco: Optional[str] = Query(None),
    # Filtra solicitações criadas a partir desta data (formato YYYY-MM-DD)
    data_inicio: Optional[date] = Query(None),
    # Filtra solicitações criadas até esta data (formato YYYY-MM-DD, inclusive)
    data_fim: Optional[date] = Query(None),
    # Número da página desejada (começa em 1)
    pagina: int = Query(1, ge=1),
    # Quantidade de itens por página
    por_pagina: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    # Exige que o usuário autenticado seja administrador
    admin_atual=Depends(get_admin_atual),
):
    """
    Lista solicitações com filtros e paginação para o painel administrativo.

    Retorna 403 se o usuário autenticado não for administrador.
    """
    return listar_solicitacoes(
        db=db,
        status=status_filtro,
        id_categoria=id_categoria,
        protocolo=protocolo,
        id_autor=id_autor,
        endereco=endereco,
        data_inicio=data_inicio,
        data_fim=data_fim,
        pagina=pagina,
        por_pagina=por_pagina,
    )


@router.get("/{id_solicitacao}", response_model=SolicitacaoResponse)
def detalhar_solicitacao_admin(
    id_solicitacao: int,
    db: Session = Depends(get_db),
    # Exige que o usuário autenticado seja administrador
    admin_atual=Depends(get_admin_atual),
):
    """
    Retorna o detalhe de uma solicitação pelo id para o painel administrativo.

    Retorna 404 se a solicitação não existir.
    Retorna 403 se o usuário autenticado não for administrador.
    O campo ja_apoiado é retornado como None pois não se aplica ao contexto admin.
    """
    solicitacao = get_solicitacao_por_id(db, id_solicitacao)

    # Solicitação inexistente → 404
    if solicitacao is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada.")

    # Monta a resposta incluindo ja_apoiado=None, que não se aplica ao contexto admin
    return SolicitacaoResponse.model_validate({**solicitacao.__dict__, "ja_apoiado": None})


class AtualizarStatusRequest(BaseModel):
    """Body da requisição para atualização de status pelo administrador."""

    status_novo: StatusSolicitacao
    # Comentário obrigatório — mínimo 1 caractere para garantir explicação da mudança
    comentario: str = Field(..., min_length=1)


@router.patch("/{id_solicitacao}/status", response_model=SolicitacaoResponse)
def atualizar_status_solicitacao(
    id_solicitacao: int,
    body: AtualizarStatusRequest,
    db: Session = Depends(get_db),
    admin_atual=Depends(get_admin_atual),
):
    """
    Atualiza o status de uma solicitação como administrador.

    Registra a mudança na tabela atualizacao para auditoria completa.
    Retorna 404 se a solicitação não existir.
    Retorna 403 se o usuário autenticado não for administrador.
    """
    try:
        solicitacao = atualizar_status(
            db=db,
            id_solicitacao=id_solicitacao,
            status_novo=body.status_novo,
            comentario=body.comentario,
            id_administrador=admin_atual.id_usuario,
        )
    except ValueError as e:
        # ValueError com "não encontrada" indica solicitação inexistente → 404
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    # Notifica o autor apenas se ele não for o próprio administrador que fez a mudança
    if solicitacao.id_autor != admin_atual.id_usuario:
        # Mapeamento de valores do enum para rótulos legíveis em português
        _rotulos_status = {
            "PENDENTE": "Pendente",
            "EM_ANALISE": "Em Análise",
            "EM_ANDAMENTO": "Em Andamento",
            "RESOLVIDO": "Resolvido",
            "CANCELADO": "Cancelado",
        }
        status_formatado = _rotulos_status.get(solicitacao.status.value, solicitacao.status.value)
        mensagem = (
            f"O status da sua solicitação {solicitacao.protocolo} "
            f"foi atualizado para {status_formatado}."
        )
        criar_notificacao(db, solicitacao.id_autor, solicitacao.id_solicitacao, mensagem)

        autor = get_usuario_por_id(db, solicitacao.id_autor)
        if autor:
            corpo_html = f"""
            <p>Olá, {autor.nome_usuario}!</p>
            <p>O status da sua solicitação <strong>{solicitacao.protocolo}</strong>
            foi atualizado para <strong>{status_formatado}</strong>.</p>
            <p><strong>Comentário do administrador:</strong> {body.comentario}</p>
            <p>Atualização realizada por: {admin_atual.nome_usuario}</p>
            """
            try:
                enviar_email(
                    autor.email,
                    f"Atualização da sua solicitação {solicitacao.protocolo} — Connect Cidade",
                    corpo_html,
                )
            except RuntimeError:
                pass

    return solicitacao
