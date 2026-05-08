from datetime import date

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models import Categoria, StatusConta, TipoUsuario, Usuario

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

CATEGORIAS = [
    {
        "nome_categoria": "Coleta de Resíduos",
        "cor_hex": "#66BB6A",
        "descricao": "Recolhimento de lixo, resíduos descartados inadequadamente, galhos e entulhos, e mobiliário para descarte ou doação",
    },
    {
        "nome_categoria": "Iluminação Pública",
        "cor_hex": "#FFCA28",
        "descricao": "Lâmpadas queimadas, postes danificados ou com problemas na fiação em vias e espaços públicos",
    },
    {
        "nome_categoria": "Acessibilidade",
        "cor_hex": "#42A5F5",
        "descricao": "Ausência ou danificação de rampas de acesso, calçadas irregulares e obstáculos que comprometem a locomoção de pedestres e pessoas com deficiência",
    },
    {
        "nome_categoria": "Manutenção de Vias",
        "cor_hex": "#FF7043",
        "descricao": "Buracos e irregularidades no pavimento, obstáculos em vias públicas e problemas com sinalização vertical (placas) e horizontal (pintura no solo)",
    },
]


def seed_categorias(db: Session) -> None:
    for dados in CATEGORIAS:
        existe = db.query(Categoria).filter_by(nome_categoria=dados["nome_categoria"]).first()
        if existe:
            print(f"[CATEGORIA] Já existe: {dados['nome_categoria']}")
        else:
            db.add(Categoria(**dados))
            db.commit()
            print(f"[CATEGORIA] Criada: {dados['nome_categoria']}")


def seed_admin(db: Session) -> None:
    existe = db.query(Usuario).filter_by(cpf=settings.ADMIN_CPF).first()
    if existe:
        print(f"[ADMIN] Já existe: {settings.ADMIN_EMAIL}")
        return

    admin = Usuario(
        tipo_usuario=TipoUsuario.ADMIN,
        cpf=settings.ADMIN_CPF,
        nome_usuario=settings.ADMIN_NOME,
        email=settings.ADMIN_EMAIL,
        senha_hash=pwd_context.hash(settings.ADMIN_SENHA),
        data_nascimento=date(1990, 1, 1),
        status_conta=StatusConta.ATIVO,
    )
    db.add(admin)
    db.commit()
    print(f"[ADMIN] Criado: {settings.ADMIN_EMAIL}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_categorias(db)
        seed_admin(db)
    finally:
        db.close()
