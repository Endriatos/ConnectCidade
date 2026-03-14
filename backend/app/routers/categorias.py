from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models import Categoria
from app.schemas.categoria import CategoriaResponse
from app.utils.deps import get_db

router = APIRouter(prefix="/categorias", tags=["Categorias"])


@router.get("", response_model=List[CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):
    # Retorna todas as categorias disponíveis — endpoint público, sem autenticação
    return db.query(Categoria).all()
