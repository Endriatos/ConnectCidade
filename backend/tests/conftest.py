import io
from datetime import date
from unittest.mock import patch

import pytest
from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.main import app
from app.utils.deps import get_db


def _gerar_cpf(seed: int) -> str:
    """
    Gera um CPF válido deterministicamente a partir de um inteiro (seed).

    Os 9 primeiros dígitos são derivados do seed (preenchido com zeros à esquerda via zfill).
    Os dois dígitos verificadores são calculados pelo algoritmo da Receita Federal:
    - 1º dígito: soma ponderada com pesos 10 a 2, mod 11; resto < 2 → 0, senão 11 - resto.
    - 2º dígito: soma ponderada com pesos 11 a 2 (incluindo o 1º dígito), mod 11; mesmo critério.

    Validação: se todos os 11 dígitos forem iguais (ex: "00000000000"), o CPF é inválido
    pelo critério da Receita Federal — nesse caso um ValueError é lançado para alertar
    que o seed escolhido não pode ser usado.
    """
    base = str(seed).zfill(9)[:9]
    digits = [int(d) for d in base]

    # Calcula o primeiro dígito verificador
    soma1 = sum(d * (10 - i) for i, d in enumerate(digits))
    resto1 = soma1 % 11
    d1 = 0 if resto1 < 2 else 11 - resto1

    # Calcula o segundo dígito verificador (inclui o primeiro na ponderação)
    soma2 = sum(d * (11 - i) for i, d in enumerate(digits + [d1]))
    resto2 = soma2 % 11
    d2 = 0 if resto2 < 2 else 11 - resto2

    todos = digits + [d1, d2]

    # Rejeita CPFs com todos os dígitos iguais, que são inválidos pela Receita Federal
    if len(set(todos)) == 1:
        raise ValueError(f"Seed {seed} gera um CPF inválido (todos os dígitos iguais). Escolha outro seed.")

    return "".join(str(d) for d in todos)


# Dados fixos usados por _criar_solicitacao para garantir consistência entre os testes
_SOLICITACAO_BASE = {
    "id_categoria": 1,
    "descricao": "Problema reportado via teste",
    "endereco_referencia": "Rua dos Testes, 1",
    "latitude": -29.1678,
    "longitude": -51.1794,
    "confirmar_duplicata": True,
}


def _cadastrar_e_logar(client, cpf: str, email: str) -> str:
    """
    Cadastra um usuário com os dados fornecidos (ignora erro se já existir)
    e retorna o access token JWT obtido via login.
    """
    client.post(
        "/auth/cadastro",
        json={
            "cpf": cpf,
            "nome_usuario": f"Usuário {cpf}",
            "email": email,
            "senha": "senha123",
            "data_nascimento": str(date(1998, 3, 10)),
        },
    )
    # Realiza login e extrai o token de acesso da resposta
    resp = client.post("/auth/login", json={"cpf": cpf, "senha": "senha123"})
    return resp.json()["access_token"]


def _jpeg_teste_bytes() -> bytes:
    img = Image.new("RGB", (8, 8), color=(200, 30, 30))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _criar_solicitacao(client, token: str) -> int:
    data = {
        "id_categoria": str(_SOLICITACAO_BASE["id_categoria"]),
        "descricao": _SOLICITACAO_BASE["descricao"],
        "endereco_referencia": _SOLICITACAO_BASE["endereco_referencia"],
        "latitude": str(_SOLICITACAO_BASE["latitude"]),
        "longitude": str(_SOLICITACAO_BASE["longitude"]),
        "confirmar_duplicata": "true" if _SOLICITACAO_BASE.get("confirmar_duplicata") else "false",
    }
    with patch("app.routers.solicitacoes.garantir_bucket_publico"), patch(
        "app.routers.solicitacoes.fazer_upload_foto", return_value="http://minio-fake/foto.jpg"
    ):
        resp = client.post(
            "/solicitacoes",
            data=data,
            files=[("fotos", ("t.jpg", _jpeg_teste_bytes(), "image/jpeg"))],
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 201
    return resp.json()["id_solicitacao"]


SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db(test_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
