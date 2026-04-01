"""
Authentication routes
Handles login, registration, and CRECI validation
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import httpx
import asyncio
import logging

from database import db
from auth import hash_password, verify_password, create_access_token
from config import BUSCACRECI_API, FRONTEND_URL
from models.schemas import (
    UserRegister, UserLogin, AuthResponse,
    CreciValidationRequest, CreciValidationResponse,
    CompleteCuratorRegistration
)
from services.email_service import send_email

router = APIRouter(tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/validate-creci", response_model=CreciValidationResponse)
async def validate_creci(data: CreciValidationRequest):
    """Validate CRECI using BuscaCRECI API."""
    creci = data.creci.strip().upper()
    uf = data.uf.strip().upper()
    
    if creci.endswith('J'):
        return CreciValidationResponse(
            valid=False,
            error="CRECI de Pessoa Jurídica (J) não é aceito. Apenas CRECI de Pessoa Física (F)."
        )
    
    creci_formatted = f"{uf}{creci}"
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(f"{BUSCACRECI_API}/?creci={creci_formatted}")
            
            if response.status_code != 200:
                return CreciValidationResponse(valid=False, error="Erro ao consultar CRECI. Tente novamente.")
            
            result = response.json()
            codigo_solicitacao = result.get("codigo_solicitacao")
            
            if not codigo_solicitacao:
                return CreciValidationResponse(valid=False, error="Não foi possível iniciar a consulta do CRECI.")
            
            creci_id = None
            creci_completo = None
            max_attempts = 15
            
            for _ in range(max_attempts):
                await asyncio.sleep(2)
                status_response = await client.get(
                    f"{BUSCACRECI_API}/status",
                    params={"codigo_solicitacao": codigo_solicitacao}
                )
                
                if status_response.status_code != 200:
                    continue
                
                status_data = status_response.json()
                status = status_data.get("status")
                
                if status == "FINALIZADO":
                    creci_id = status_data.get("creciID")
                    creci_completo = status_data.get("creciCompleto")
                    break
                elif status == "ERRO":
                    return CreciValidationResponse(
                        valid=False,
                        error=status_data.get("mensagem", "Erro na consulta do CRECI.")
                    )
            
            if not creci_id:
                return CreciValidationResponse(valid=False, error="Tempo limite excedido. Tente novamente.")
            
            details_response = await client.get(f"{BUSCACRECI_API}/creci", params={"id": creci_id})
            
            if details_response.status_code != 200:
                return CreciValidationResponse(valid=False, error="Erro ao obter detalhes do CRECI.")
            
            details = details_response.json()
            situacao = details.get("situacao", "").strip()
            nome_completo = details.get("nomeCompleto", "")
            
            if situacao.lower() != "ativo":
                return CreciValidationResponse(
                    valid=False,
                    creci_completo=creci_completo,
                    nome_completo=nome_completo,
                    situacao=situacao,
                    error=f"CRECI não está ativo. Situação atual: {situacao}"
                )
            
            return CreciValidationResponse(
                valid=True,
                creci_completo=creci_completo,
                nome_completo=nome_completo,
                situacao=situacao
            )
            
    except httpx.TimeoutException:
        return CreciValidationResponse(valid=False, error="Tempo limite excedido na consulta. Tente novamente.")
    except Exception as e:
        logger.error(f"Error validating CRECI: {str(e)}")
        return CreciValidationResponse(valid=False, error="Erro interno ao validar CRECI. Tente novamente.")


@router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "role": user_data.role,
        "name": user_data.name,
        "phone": user_data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    if user_data.role == "buyer":
        profile_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "phone": user_data.phone,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.buyers.insert_one(profile_doc)
    elif user_data.role == "agent":
        profile_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "phone": user_data.phone,
            "creci": user_data.creci,
            "creci_uf": user_data.creci_uf,
            "creci_verified": False,
            "creci_blocked": False,
            "company": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.agents.insert_one(profile_doc)
    
    token = create_access_token(user_id, user_data.role)
    return AuthResponse(token=token, user_id=user_id, role=user_data.role, name=user_data.name)


@router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if user["role"] == "agent":
        agent = await db.agents.find_one({"user_id": user["id"]}, {"_id": 0})
        if agent and agent.get("creci_blocked"):
            raise HTTPException(
                status_code=403, 
                detail="Seu cadastro está temporariamente bloqueado devido a pendências com seu CRECI. Entre em contato com o suporte para regularizar sua situação."
            )
    
    token = create_access_token(user["id"], user["role"])
    return AuthResponse(token=token, user_id=user["id"], role=user["role"], name=user["name"])


@router.post("/auth/complete-curator-registration")
async def complete_curator_registration(registration_data: CompleteCuratorRegistration):
    pending = await db.pending_curators.find_one({"registration_token": registration_data.token}, {"_id": 0})
    if not pending:
        raise HTTPException(status_code=404, detail="Token inválido ou expirado")
    
    if datetime.fromisoformat(pending["token_expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expirado")
    
    if pending["status"] != "pending":
        raise HTTPException(status_code=400, detail="Registro já completado")
    
    user_doc = {
        "id": pending["id"],
        "email": pending["email"],
        "password": hash_password(registration_data.password),
        "role": "curator",
        "name": pending["name"],
        "phone": pending["phone"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    await db.pending_curators.update_one(
        {"id": pending["id"]},
        {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_access_token(pending["id"], "curator")
    
    return {
        "status": "success",
        "message": "Cadastro completado com sucesso!",
        "token": token,
        "user_id": pending["id"],
        "role": "curator",
        "name": pending["name"]
    }
