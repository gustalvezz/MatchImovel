"""
MatchImovel API Server
Main entry point that imports and configures all routes
"""
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging

from config import CORS_ORIGINS, CORS_ORIGIN_REGEX
from database import close_db_connection
from routes.auth_routes import router as auth_router
from routes.buyer_routes import router as buyer_router
from routes.agent_routes import router as agent_router
from routes.curator_routes import router as curator_router
from routes.admin_routes import router as admin_router

# Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(
    title="MatchImovel API",
    description="API para plataforma de conexão entre compradores e corretores de imóveis",
    version="2.0.0"
)

# Include all routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(buyer_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(curator_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db_connection()
