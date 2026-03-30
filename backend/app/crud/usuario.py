from sqlalchemy.orm import Session

from app.models import TipoUsuario, Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate
from app.utils.auth_utils import hashear_senha, verificar_senha


def get_usuario_por_cpf(db: Session, cpf: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.cpf == cpf).first()


def get_usuario_por_email(db: Session, email: str) -> Usuario | None:
    return db.query(Usuario).filter(Usuario.email == email).first()


def atualizar_usuario(db: Session, usuario: Usuario, dados: UsuarioUpdate) -> Usuario:
    """
    Atualiza apenas os campos não-nulos de dados no objeto usuario.

    Usa model_dump(exclude_none=True) para ignorar campos não informados,
    evitando sobrescrever valores existentes com None acidentalmente.
    """
    # Itera somente os campos que foram explicitamente fornecidos na requisição
    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return usuario


def alterar_senha(db: Session, usuario: Usuario, senha_atual: str, senha_nova: str) -> None:
    """
    Verifica a senha atual e, se correta, salva o hash da nova senha.

    Lança ValueError se a senha atual não conferir com o hash armazenado.
    """
    # Rejeita a operação imediatamente se a senha atual estiver errada
    if not verificar_senha(senha_atual, usuario.senha_hash):
        raise ValueError("Senha atual incorreta.")

    # Armazena apenas o hash da nova senha — nunca o texto puro
    usuario.senha_hash = hashear_senha(senha_nova)
    db.commit()


def anonimizar_usuario(db: Session, usuario: Usuario) -> None:
    """
    Anonimiza os dados pessoais do usuário conforme a LGPD (Lei 13.709/2018),
    substituindo informações identificáveis por valores genéricos irreversíveis.

    Após a anonimização o usuário não consegue mais autenticar-se, pois o
    senha_hash recebe um valor que nunca passa na verificação bcrypt.
    """
    # CPF substituído por identificador não rastreável baseado no id interno
    usuario.cpf = f"excluido_{usuario.id_usuario}"
    # Nome removido — valor genérico que não identifica a pessoa
    usuario.nome_usuario = "Usuário Removido"
    # E-mail substituído por endereço inválido no domínio .invalid (RFC 2606)
    usuario.email = f"excluido_{usuario.id_usuario}@removido.invalid"
    # Telefone apagado — campo opcional, basta setar None
    usuario.telefone = None
    # Hash inválido: "*" nunca satisfaz a verificação bcrypt, bloqueando qualquer login
    usuario.senha_hash = "*"
    # Desativa a conta para impedir qualquer forma de acesso futuro
    usuario.status_ativo = False

    db.commit()


def create_usuario(db: Session, dados: UsuarioCreate) -> Usuario:
    usuario = Usuario(
        tipo_usuario=TipoUsuario.CIDADAO,
        cpf=dados.cpf,
        nome_usuario=dados.nome_usuario,
        email=dados.email,
        senha_hash=hashear_senha(dados.senha),
        telefone=dados.telefone,
        data_nascimento=dados.data_nascimento,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario
