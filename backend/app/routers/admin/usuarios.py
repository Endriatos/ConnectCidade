from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.usuario import get_usuario_por_cpf, get_usuario_por_email, get_usuario_por_id
from app.models.categoria import Categoria
from app.models.solicitacao import Solicitacao
from app.models.usuario import TipoUsuario, Usuario
from app.schemas.solicitacao import SolicitacaoResumoResponse
from app.schemas.usuario import (
    AdministradorResponse,
    AlterarEmailRequest,
    CidadaoBuscaResponse,
    CidadaoDetalheResponse,
)
from app.utils.cpf_utils import validar_cpf
from app.utils.deps import get_admin_atual, get_db

# Router único para toda a gestão de usuários e administradores no painel admin
router = APIRouter(prefix="/admin/usuarios", tags=["Admin - Usuários"])


# ---------------------------------------------------------------------------
# Listagem de administradores
# ---------------------------------------------------------------------------


@router.get("/administradores", response_model=List[AdministradorResponse])
def listar_administradores(
    db: Session = Depends(get_db),
    # Apenas admins autenticados podem acessar este endpoint
    _admin: Usuario = Depends(get_admin_atual),
):
    """Retorna todos os usuários com tipo_usuario == ADMIN, sem paginação."""
    return (
        db.query(Usuario)
        .filter(Usuario.tipo_usuario == TipoUsuario.ADMIN)
        .all()
    )


# ---------------------------------------------------------------------------
# Busca, detalhe e edição de usuário
# Atenção: /buscar deve ser declarado antes de /{id} para evitar conflito de rota
# ---------------------------------------------------------------------------


@router.get("/buscar", response_model=CidadaoBuscaResponse)
def buscar_usuario_por_cpf(
    # CPF a ser consultado — obrigatório e validado antes da busca no banco
    cpf: str = Query(...),
    db: Session = Depends(get_db),
    # Apenas admins autenticados podem usar esta busca
    _admin: Usuario = Depends(get_admin_atual),
):
    """Busca um usuário pelo CPF. Retorna 422 se o CPF for inválido e 404 se não encontrado."""
    # Valida o formato e os dígitos verificadores do CPF antes de consultar o banco
    if not validar_cpf(cpf):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="CPF inválido.",
        )

    usuario = get_usuario_por_cpf(db, cpf)

    # CPF válido mas sem cadastro no sistema
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    # Constrói o response explicitamente pois ja_e_admin é calculado, não vem do model
    return CidadaoBuscaResponse(
        id_usuario=usuario.id_usuario,
        nome_usuario=usuario.nome_usuario,
        email=usuario.email,
        cpf=usuario.cpf,
        data_cadastro=usuario.data_cadastro,
        ja_e_admin=usuario.tipo_usuario == TipoUsuario.ADMIN,
    )


@router.get("/{id}", response_model=CidadaoDetalheResponse)
def detalhar_usuario(
    id: int,
    db: Session = Depends(get_db),
    # Apenas admins autenticados podem acessar o detalhe de um cidadão
    _admin: Usuario = Depends(get_admin_atual),
):
    """Retorna dados completos de um usuário e suas solicitações, da mais recente para a mais antiga."""
    usuario = get_usuario_por_id(db, id)

    # Usuário não encontrado no sistema
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    # Busca as solicitações do usuário com join na tabela de categorias para obter nome_categoria
    # Ordenadas da mais recente para a mais antiga
    rows = (
        db.query(Solicitacao, Categoria.nome_categoria)
        .join(Categoria, Solicitacao.id_categoria == Categoria.id_categoria)
        .filter(Solicitacao.id_autor == id)
        .order_by(Solicitacao.data_registro.desc())
        .all()
    )

    # Constrói a lista de resumos — nome_categoria vem do join, não do model
    solicitacoes = [
        SolicitacaoResumoResponse(
            id_solicitacao=sol.id_solicitacao,
            protocolo=sol.protocolo,
            nome_categoria=nome_categoria,
            status=sol.status.value,
            data_registro=sol.data_registro,
        )
        for sol, nome_categoria in rows
    ]

    return CidadaoDetalheResponse(
        id_usuario=usuario.id_usuario,
        nome_usuario=usuario.nome_usuario,
        email=usuario.email,
        cpf=usuario.cpf,
        telefone=usuario.telefone,
        data_cadastro=usuario.data_cadastro,
        status_ativo=usuario.status_ativo,
        solicitacoes=solicitacoes,
    )


@router.patch("/{id}/email")
def alterar_email_usuario(
    id: int,
    body: AlterarEmailRequest,
    db: Session = Depends(get_db),
    # Apenas admins autenticados podem alterar o email de outro usuário
    _admin: Usuario = Depends(get_admin_atual),
):
    """Atualiza o email de um usuário. Retorna 404 se não encontrado e 400 se o email já estiver em uso."""
    usuario = get_usuario_por_id(db, id)

    # Usuário não encontrado no sistema
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    # Verifica se o novo email já pertence a outro usuário
    existente = get_usuario_por_email(db, body.email)
    if existente is not None and existente.id_usuario != id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está em uso por outro usuário.",
        )

    usuario.email = body.email
    db.commit()

    return {"mensagem": f"Email do usuário {usuario.nome_usuario} atualizado com sucesso."}


# ---------------------------------------------------------------------------
# Promoção e revogação de administradores
# ---------------------------------------------------------------------------


@router.patch("/{id}/promover")
def promover_usuario(
    id: int,
    db: Session = Depends(get_db),
    # Apenas admins autenticados podem promover outros usuários
    _admin: Usuario = Depends(get_admin_atual),
):
    """Eleva o tipo_usuario de um cidadão para ADMIN."""
    usuario = get_usuario_por_id(db, id)

    # Usuário não cadastrado no sistema
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    # Não faz sentido promover quem já é administrador
    if usuario.tipo_usuario == TipoUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário já é administrador.",
        )

    usuario.tipo_usuario = TipoUsuario.ADMIN
    db.commit()

    return {"mensagem": f"Usuário {usuario.nome_usuario} promovido a administrador com sucesso."}


@router.patch("/{id}/revogar")
def revogar_admin(
    id: int,
    db: Session = Depends(get_db),
    # Admin autenticado — necessário para bloquear auto-revogação
    admin_atual: Usuario = Depends(get_admin_atual),
):
    """Rebaixa o tipo_usuario de um administrador para CIDADAO."""
    usuario = get_usuario_por_id(db, id)

    # Administrador com esse id não existe no sistema
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    # Admin não pode revogar a si mesmo — evita que o sistema fique sem nenhum admin
    if id == admin_atual.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é permitido revogar o próprio acesso de administrador.",
        )

    # Não faz sentido revogar quem já é cidadão comum
    if usuario.tipo_usuario == TipoUsuario.CIDADAO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário já é cidadão.",
        )

    usuario.tipo_usuario = TipoUsuario.CIDADAO
    db.commit()

    return {"mensagem": f"Acesso de administrador de {usuario.nome_usuario} revogado com sucesso."}
