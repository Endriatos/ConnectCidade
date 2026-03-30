from sqlalchemy.orm import Session

from app.models import TipoUsuario, Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate
from app.utils.auth_utils import hashear_senha


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
