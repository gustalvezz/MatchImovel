"""
API Routes
"""
from routes.auth_routes import router as auth_router
from routes.buyer_routes import router as buyer_router
from routes.agent_routes import router as agent_router
from routes.curator_routes import router as curator_router
from routes.admin_routes import router as admin_router

__all__ = ['auth_router', 'buyer_router', 'agent_router', 'curator_router', 'admin_router']
