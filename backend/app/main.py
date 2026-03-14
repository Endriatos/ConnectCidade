from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.categorias import router as categorias_router
from app.routers.solicitacoes import router as solicitacoes_router

app = FastAPI(
    title="Connect Cidade",
    version="0.1.0",
    description="API para reporte de problemas urbanos",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health Check"])
def health_check():
    return {"status": "online"}

app.include_router(auth_router)
app.include_router(categorias_router)
app.include_router(solicitacoes_router)



