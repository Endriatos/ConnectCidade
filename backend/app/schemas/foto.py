from pydantic import BaseModel, ConfigDict


class FotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_foto: int
    id_solicitacao: int
    caminho_arquivo: str
    ordem: int
