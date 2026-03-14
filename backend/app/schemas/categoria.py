from typing import Optional

from pydantic import BaseModel, ConfigDict


class CategoriaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_categoria: int
    nome_categoria: str
    descricao: Optional[str] = None
    cor_hex: str
