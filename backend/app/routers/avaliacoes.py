from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.notificacao import criar_notificacao
from app.crud.avaliacao import criar_avaliacao
from app.models.atualizacao import Atualizacao
from app.models.solicitacao import Solicitacao
from app.models.usuario import Usuario
from app.schemas.avaliacao import AvaliacaoCreate, AvaliacaoResponse
from app.utils.email_utils import _RODAPE_STATUS, enviar_email, montar_template_email
from app.utils.deps import get_db, get_usuario_atual

router = APIRouter(prefix="/avaliacoes", tags=["Avaliações"])


def _enviar_email_avaliacao_admin(email: str, protocolo: str, nome_curto: str) -> None:
    from app.config import settings

    link = f"{settings.FRONTEND_URL}/admin/solicitacoes"
    corpo_html = montar_template_email(
        titulo=f"Nova avaliação na solicitação {protocolo}",
        saudacao=f"Olá, {nome_curto}!",
        linhas=[
            f"A solicitação <strong>#{protocolo}</strong> recebeu uma avaliação do cidadão.",
            "Acesse o painel administrativo para consultar os detalhes.",
        ],
        rotulo_botao="Ver solicitações no painel",
        url_botao=link,
        rodape=_RODAPE_STATUS,
    )
    try:
        enviar_email(email, f"Solicitação {protocolo} avaliada — Connect Cidade", corpo_html)
    except RuntimeError:
        pass


@router.post("/{id_solicitacao}", response_model=AvaliacaoResponse, status_code=status.HTTP_201_CREATED)
def avaliar_solicitacao(
    id_solicitacao: int,
    body: AvaliacaoCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    # Exige usuário autenticado — retorna 401/403 se não houver token válido
    usuario_atual=Depends(get_usuario_atual),
):
    """
    Registra a avaliação do cidadão para uma solicitação resolvida.

    Retorna 400 se:
    - A solicitação não existir.
    - O status não for RESOLVIDO.
    - O usuário não for o autor da solicitação.
    - A solicitação já tiver sido avaliada.
    Retorna 201 com os dados da avaliação em caso de sucesso.
    """
    try:
        avaliacao = criar_avaliacao(
            db=db,
            id_solicitacao=id_solicitacao,
            id_usuario=usuario_atual.id_usuario,
            dados=body,
        )
    except ValueError as e:
        # Qualquer regra de negócio violada é tratada como 400 Bad Request
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    solicitacao = db.query(Solicitacao).filter(Solicitacao.id_solicitacao == id_solicitacao).first()
    protocolo = solicitacao.protocolo if solicitacao else ""
    # Considera apenas administradores que realmente atuaram na solicitação
    # (registrados na timeline de atualizações de status).
    ids_admins_envolvidos = {
        row[0]
        for row in (
            db.query(Atualizacao.id_administrador)
            .filter(
                Atualizacao.id_solicitacao == id_solicitacao,
                Atualizacao.id_administrador.isnot(None),
            )
            .distinct()
            .all()
        )
    }
    if solicitacao:
        # O autor da solicitação nunca deve receber notificação de avaliação da própria solicitação.
        ids_admins_envolvidos.discard(solicitacao.id_autor)
    # O usuário que acabou de avaliar também não deve ser notificado sobre a própria ação.
    ids_admins_envolvidos.discard(avaliacao.id_usuario)
    if ids_admins_envolvidos:
        admins_envolvidos = (
            db.query(Usuario)
            .filter(
                Usuario.id_usuario.in_(ids_admins_envolvidos),
            )
            .all()
        )
        for admin in admins_envolvidos:
            criar_notificacao(
                db=db,
                id_usuario=admin.id_usuario,
                id_solicitacao=id_solicitacao,
                mensagem=f"A solicitação {protocolo} foi avaliada pelo cidadão.",
            )
            background_tasks.add_task(
                _enviar_email_avaliacao_admin,
                admin.email,
                protocolo,
                admin.nome_usuario.split()[0],
            )

    return avaliacao
