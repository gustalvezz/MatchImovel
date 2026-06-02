"""
MatchImovel API Server
Main entry point that imports and configures all routes
"""
import os
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
import logging

from config import CORS_ORIGINS
from database import close_db_connection
from routes.auth_routes import router as auth_router
from routes.buyer_routes import router as buyer_router
from routes.agent_routes import router as agent_router
from routes.curator_routes import router as curator_router
from routes.admin_routes import router as admin_router
from routes.whatsapp_routes import router as whatsapp_router
from routes.blog_routes import router as blog_router

# Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

_is_prod = os.environ.get("ENVIRONMENT") == "production"

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        h = response.headers
        h["X-Content-Type-Options"]       = "nosniff"
        h["X-Frame-Options"]              = "DENY"
        h["X-XSS-Protection"]             = "1; mode=block"
        h["Referrer-Policy"]              = "strict-origin-when-cross-origin"
        h["Cross-Origin-Resource-Policy"] = "cross-origin"
        h["Cross-Origin-Opener-Policy"]   = "same-origin"
        h["Permissions-Policy"]           = "camera=(), microphone=(), geolocation=()"
        h["Content-Security-Policy"]      = "default-src 'none'"
        if request.url.scheme == "https":
            h["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

# Create the main app
app = FastAPI(
    title="MatchImovel API",
    description="API para plataforma de conexão entre compradores e corretores de imóveis",
    version="2.0.0",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
)

# Include all routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(buyer_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(curator_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(whatsapp_router, prefix="/api")
app.include_router(blog_router, prefix="/api")

# Middleware (Starlette é LIFO — SecurityHeaders fica mais externo que CORS)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db_connection()
