from datetime import date
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.crud.admin_solicitacao import atualizar_status, get_solicitacao_por_id, listar_solicitacoes
from app.crud.avaliacao import listar_avaliacoes
from app.crud.notificacao import criar_notificacao
from app.crud.usuario import get_usuario_por_id
from app.models.avaliacao import Avaliacao
from app.models.usuario import Usuario
from app.utils.email_utils import _RODAPE_STATUS, enviar_email, montar_template_email
from app.models.solicitacao import StatusSolicitacao
from app.schemas.avaliacao import AvaliacaoPaginacaoResponse
from app.schemas.solicitacao import AvaliacaoResumoResponse, PaginacaoResponse, SolicitacaoResponse
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
    # Quando True, exclui solicitações com status RESOLVIDO ou CANCELADO (ignorado se status_filtro estiver definido)
    ocultar_encerradas: bool = Query(False),
    # Campo de ordenação: "data_registro" (padrão) ou "contador_apoios"
    ordenar_por: str = Query("data_registro", pattern="^(data_registro|contador_apoios)$"),
    # Direção da ordenação: "desc" (padrão, mais recente primeiro) ou "asc"
    direcao: str = Query("desc", pattern="^(asc|desc)$"),
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
        ocultar_encerradas=ocultar_encerradas,
        # Repassa os parâmetros de ordenação para o CRUD
        ordenar_por=ordenar_por,
        direcao=direcao,
        pagina=pagina,
        por_pagina=por_pagina,
    )


@router.get("/avaliacoes", response_model=AvaliacaoPaginacaoResponse)
def listar_avaliacoes_admin(
    # Filtro opcional por categoria
    id_categoria: Optional[int] = Query(None),
    # Filtro opcional por resolução efetiva (true = resolvido, false = não resolvido)
    foi_resolvido: Optional[bool] = Query(None),
    # Filtro opcional por nota exata (1 a 5)
    nota: Optional[int] = Query(None, ge=1, le=5),
    # Página solicitada — começa em 1
    pagina: int = Query(1, ge=1),
    # Quantidade de itens por página
    por_pagina: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    # Exige que o usuário autenticado seja administrador
    _admin=Depends(get_admin_atual),
):
    """Lista todas as avaliações com filtros opcionais. Restrito a administradores."""
    return listar_avaliacoes(
        db=db,
        id_categoria=id_categoria,
        foi_resolvido=foi_resolvido,
        nota=nota,
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

    autor = db.query(Usuario.nome_usuario).filter(Usuario.id_usuario == solicitacao.id_autor).scalar()
    av = db.query(Avaliacao).filter(Avaliacao.id_solicitacao == id_solicitacao).first()
    aval_resumo = AvaliacaoResumoResponse.model_validate(av) if av is not None else None

    return SolicitacaoResponse.model_validate(
        {
            **solicitacao.__dict__,
            "ja_apoiado": None,
            "ja_avaliado": av is not None,
            "nome_autor": autor,
            "avaliacao": aval_resumo,
        }
    )


class AtualizarStatusRequest(BaseModel):
    """Body da requisição para atualização de status pelo administrador."""

    status_novo: StatusSolicitacao
    # Comentário obrigatório — mínimo 1 caractere para garantir explicação da mudança
    comentario: str = Field(..., min_length=1)


def _enviar_email_status(email: str, protocolo: str, status_formatado: str, comentario: str, nome_curto: str) -> None:
    from app.config import settings
    link = f"{settings.FRONTEND_URL}/minhas-solicitacoes"
    corpo_html = montar_template_email(
        titulo=f"Atualização da solicitação {protocolo}",
        saudacao=f"Olá, {nome_curto}!",
        linhas=[
            f"O status da sua solicitação <strong>#{protocolo}</strong> foi atualizado para <strong>{status_formatado}</strong>.",
            f"<strong>Comentário:</strong> {comentario}",
        ],
        rotulo_botao="Ver minhas solicitações",
        url_botao=link,
        rodape=_RODAPE_STATUS,
    )
    try:
        enviar_email(email, f"Atualização da solicitação {protocolo} — Connect Cidade", corpo_html)
    except RuntimeError:
        pass


@router.patch("/{id_solicitacao}/status", response_model=SolicitacaoResponse)
def atualizar_status_solicitacao(
    id_solicitacao: int,
    body: AtualizarStatusRequest,
    background_tasks: BackgroundTasks,
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
        erro = str(e)
        # Admin tentando alterar a própria solicitação → 403 Forbidden
        if "própria solicitação" in erro:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=erro)
        # Solicitação encerrada (resolvida ou cancelada) → 422 Unprocessable Content
        if "encerradas" in erro:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=erro)
        # Solicitação não encontrada → 404
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=erro)

    _rotulos_status = {
        "PENDENTE": "Pendente",
        "EM_ANALISE": "Em Análise",
        "EM_ANDAMENTO": "Em Andamento",
        "RESOLVIDO": "Resolvido",
        "CANCELADO": "Cancelado",
    }
    status_formatado = _rotulos_status.get(solicitacao.status.value, solicitacao.status.value)
    autor = get_usuario_por_id(db, solicitacao.id_autor)
    if autor:
        mensagem = (
            f"O status da sua solicitação {solicitacao.protocolo} "
            f"foi atualizado para {status_formatado}."
        )
        criar_notificacao(db, solicitacao.id_autor, solicitacao.id_solicitacao, mensagem)
        background_tasks.add_task(
            _enviar_email_status,
            autor.email,
            solicitacao.protocolo,
            status_formatado,
            body.comentario,
            autor.nome_usuario.split()[0],
        )

    nome_autor = db.query(Usuario.nome_usuario).filter(Usuario.id_usuario == solicitacao.id_autor).scalar()
    return SolicitacaoResponse.model_validate({**solicitacao.__dict__, "nome_autor": nome_autor})
