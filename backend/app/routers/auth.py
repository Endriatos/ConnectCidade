from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.crud import token_recuperacao, token_verificacao_email as crud_verif
from app.crud.usuario import create_usuario, get_usuario_por_cpf, get_usuario_por_email
from app.models.usuario import StatusConta
from app.schemas.auth import LoginInput, TokenResponse
from app.schemas.usuario import UsuarioCreate, UsuarioResponse
from app.utils.auth_utils import criar_token_acesso, hashear_senha, validar_complexidade_senha, verificar_senha
from app.utils.cpf_utils import validar_cpf
from app.utils.deps import get_db, get_usuario_atual
from app.utils.email_utils import enviar_email, montar_template_email

router = APIRouter(prefix="/auth", tags=["Autenticação"])


def _enviar_email_verificacao(usuario_id: int, nome: str, email: str, db: Session) -> None:
    token_bruto = crud_verif.criar_token(db, usuario_id)
    link = f"{settings.FRONTEND_URL}/verificar-email?token={token_bruto}"
    nome_curto = nome.split()[0]
    corpo_html = montar_template_email(
        titulo="Boas-vindas ao Connect Cidade!",
        saudacao=f"Olá, {nome_curto}! Pronto para conectar-se com sua cidade?",
        linhas=[
            "Sua conta foi criada com sucesso. Só falta um passo: confirmar seu e-mail para ativar o acesso.",
            "Clique no botão abaixo para confirmar. O link é válido por <strong>24 horas</strong>.",
        ],
        rotulo_botao="Confirmar e-mail",
        url_botao=link,
        rodape_extra=f'Se preferir, copie e cole este link no navegador:<br><span style="color:#3cb478;font-size:12px;word-break:break-all;">{link}</span>',
        rodape="Este e-mail foi enviado automaticamente. Por favor, não responda.",
    )
    try:
        enviar_email(email, "Boas-vindas ao Connect Cidade — confirme seu e-mail", corpo_html)
    except RuntimeError:
        pass


@router.post("/cadastro", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def cadastro(dados: UsuarioCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not validar_cpf(dados.cpf):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="CPF inválido.")

    if get_usuario_por_cpf(db, dados.cpf):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CPF já cadastrado.")

    if get_usuario_por_email(db, dados.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado.")

    usuario = create_usuario(db, dados)
    background_tasks.add_task(_enviar_email_verificacao, usuario.id_usuario, usuario.nome_usuario, usuario.email, db)
    return usuario


@router.post("/login", response_model=TokenResponse)
def login(dados: LoginInput, db: Session = Depends(get_db)):
    usuario = get_usuario_por_cpf(db, dados.cpf)
    if not usuario or not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="CPF ou senha incorretos.")

    if usuario.status_conta == StatusConta.PENDENTE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "email_nao_confirmado", "email": usuario.email},
        )

    if usuario.status_conta == StatusConta.BLOQUEADO:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sua conta foi bloqueada. Entre em contato com o suporte.")

    token = criar_token_acesso({"sub": usuario.cpf, "tipo": usuario.tipo_usuario.value})
    return TokenResponse(access_token=token, tipo_usuario=usuario.tipo_usuario.value)


@router.get("/me", response_model=UsuarioResponse)
def me(usuario_atual=Depends(get_usuario_atual)):
    return usuario_atual


# ---------------------------------------------------------------------------
# Schemas locais para recuperação e redefinição de senha
# ---------------------------------------------------------------------------

class RecuperarSenhaInput(BaseModel):
    cpf: str


class RedefinirSenhaInput(BaseModel):
    token: str
    nova_senha: str


# ---------------------------------------------------------------------------
# Endpoints de recuperação de senha
# ---------------------------------------------------------------------------

def _processar_recuperacao(cpf: str, db: Session) -> None:
    usuario = get_usuario_por_cpf(db, cpf)
    if not usuario:
        return

    token_bruto = token_recuperacao.criar_token(db, usuario.id_usuario)
    link = f"{settings.FRONTEND_URL}/redefinir-senha?token={token_bruto}"

    nome_curto = usuario.nome_usuario.split()[0]
    corpo_html = montar_template_email(
        titulo="Redefinição de senha",
        saudacao=f"Olá, {nome_curto}!",
        linhas=[
            "Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Connect Cidade</strong>.",
            "Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>30 minutos</strong>.",
        ],
        rotulo_botao="Redefinir minha senha",
        url_botao=link,
        rodape_extra=f'Se preferir, copie e cole este link no navegador:<br><span style="color:#3cb478;font-size:12px;word-break:break-all;">{link}</span>',
    )

    try:
        enviar_email(usuario.email, "Redefinição de senha — Connect Cidade", corpo_html)
    except RuntimeError:
        pass


@router.post("/recuperar-senha", status_code=status.HTTP_200_OK)
def recuperar_senha(body: RecuperarSenhaInput, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(_processar_recuperacao, body.cpf, db)
    return {"mensagem": "Se houver uma conta com esse CPF, enviaremos o link de redefinição para o e-mail cadastrado."}


@router.get("/validar-token-recuperacao", status_code=status.HTTP_200_OK)
def validar_token_recuperacao(token: str, db: Session = Depends(get_db)):
    if not token_recuperacao.buscar_token_valido(db, token):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido ou expirado.")
    return {"valido": True}


@router.post("/redefinir-senha", status_code=status.HTTP_200_OK)
def redefinir_senha(body: RedefinirSenhaInput, db: Session = Depends(get_db)):
    token_obj = token_recuperacao.buscar_token_valido(db, body.token)
    if token_obj is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado.",
        )

    # Valida complexidade da nova senha usando a função centralizada em auth_utils
    try:
        validar_complexidade_senha(body.nova_senha)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(e),
        )

    # Atualiza a senha do usuário com o hash da nova senha
    token_obj.usuario.senha_hash = hashear_senha(body.nova_senha)
    db.commit()

    token_recuperacao.invalidar_token(db, token_obj)

    return {"mensagem": "Senha redefinida com sucesso."}


# ---------------------------------------------------------------------------
# Verificação de e-mail
# ---------------------------------------------------------------------------

class ReenviarVerificacaoInput(BaseModel):
    cpf: str


@router.get("/verificar-email", status_code=status.HTTP_200_OK)
def verificar_email(token: str, db: Session = Depends(get_db)):
    token_obj = crud_verif.buscar_token_valido(db, token)
    if token_obj is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link inválido ou expirado.")

    usuario = token_obj.usuario
    usuario.status_conta = StatusConta.ATIVO
    db.commit()
    crud_verif.invalidar_token(db, token_obj)
    return {"mensagem": "E-mail confirmado com sucesso."}


@router.post("/reenviar-verificacao", status_code=status.HTTP_200_OK)
def reenviar_verificacao(body: ReenviarVerificacaoInput, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    usuario = get_usuario_por_cpf(db, body.cpf)
    if usuario and usuario.status_conta == StatusConta.PENDENTE:
        background_tasks.add_task(_enviar_email_verificacao, usuario.id_usuario, usuario.nome_usuario, usuario.email, db)
    return {"mensagem": "Se houver uma conta pendente com esse CPF, reenviaremos o e-mail de confirmação."}
