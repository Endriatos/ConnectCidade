from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.admin.dashboard import router as admin_dashboard_router
from app.routers.admin.usuarios import router as admin_usuarios_router
from app.routers.admin.solicitacoes import router as admin_solicitacoes_router
from app.routers.apoios import router as apoios_router
from app.routers.auth import router as auth_router
from app.routers.avaliacoes import router as avaliacoes_router
from app.routers.categorias import router as categorias_router
from app.routers.fotos import router as fotos_router
from app.routers.mapa import router as mapa_router
from app.routers.notificacoes import router as notificacoes_router
from app.routers.solicitacoes import router as solicitacoes_router
from app.routers.usuarios import router as usuarios_router

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

# Autenticação e usuários
app.include_router(auth_router)
app.include_router(usuarios_router)

# Funcionalidades do cidadão
app.include_router(categorias_router)
app.include_router(solicitacoes_router)
app.include_router(fotos_router)
app.include_router(apoios_router)
app.include_router(avaliacoes_router)
app.include_router(mapa_router)
app.include_router(notificacoes_router)

# Painel admin
app.include_router(admin_solicitacoes_router)
app.include_router(admin_usuarios_router)
app.include_router(admin_dashboard_router)



