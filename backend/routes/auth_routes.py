"""
Authentication routes
Handles login, registration, and CRECI validation
"""
from fastapi import APIRouter, HTTPException, Request
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
async def register(user_data: UserRegister, request: Request):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Capture client IP for terms acceptance
    client_ip = request.client.host if request.client else "unknown"
    
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
            "created_at": datetime.now(timezone.utc).isoformat(),
            # Terms acceptance
            "terms_accepted": user_data.terms_accepted or False,
            "terms_accepted_at": user_data.terms_accepted_at,
            "terms_accepted_ip": client_ip if user_data.terms_accepted else None
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


# ============ PASSWORD RESET ============

from pydantic import BaseModel, EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


async def send_password_reset_email(to_email: str, user_name: str, reset_link: str) -> bool:
    """Send password reset email"""
    subject = "Redefinição de Senha - MatchImovel"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .message {{ margin: 20px 0; color: #475569; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 24px 0; }}
            .warning {{ background: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; color: #92400e; font-size: 14px; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
            .link-text {{ word-break: break-all; font-size: 12px; color: #64748b; margin-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MatchImovel</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {user_name}!</p>
                
                <p class="message">Recebemos uma solicitação para redefinir a senha da sua conta no MatchImovel.</p>
                
                <p class="message">Clique no botão abaixo para criar uma nova senha:</p>
                
                <center>
                    <a href="{reset_link}" class="button">Redefinir Minha Senha</a>
                </center>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Este link expira em 24 horas. Se você não solicitou a redefinição de senha, ignore este email - sua conta permanece segura.
                </div>
                
                <p class="link-text">Se o botão não funcionar, copie e cole este link no navegador:<br>{reset_link}</p>
                
                <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)


async def send_password_changed_email(to_email: str, user_name: str) -> bool:
    """Send confirmation email when password is changed"""
    subject = "Sua senha foi alterada - MatchImovel"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .checkmark {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .success-box {{ background: #ecfdf5; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #10b981; }}
            .success-box p {{ margin: 0; color: #065f46; }}
            .warning {{ background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; color: #991b1b; font-size: 14px; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="checkmark">✅</div>
                <h1>Senha Alterada</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {user_name}!</p>
                
                <div class="success-box">
                    <p><strong>Sua senha foi alterada com sucesso!</strong></p>
                    <p style="margin-top: 12px;">Você já pode acessar sua conta com a nova senha.</p>
                </div>
                
                <div class="warning">
                    <strong>🔒 Não foi você?</strong><br>
                    Se você não fez essa alteração, entre em contato imediatamente com nosso suporte em suporte@matchimovel.com.br
                </div>
                
                <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, html_content)


@router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset - sends email with reset link"""
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    success_message = {
        "status": "success",
        "message": "Se o email estiver cadastrado, você receberá um link para redefinir sua senha."
    }
    
    if not user:
        return success_message
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    # Store reset token
    reset_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "email": request.email,
        "token": reset_token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove any existing reset tokens for this user
    await db.password_resets.delete_many({"user_id": user["id"]})
    
    # Insert new reset token
    await db.password_resets.insert_one(reset_doc)
    
    # Build reset link
    frontend_url = FRONTEND_URL
    if not frontend_url:
        logger.error("FRONTEND_URL not configured")
        return success_message
    
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    # Send email
    await send_password_reset_email(
        to_email=request.email,
        user_name=user.get("name", "Usuário"),
        reset_link=reset_link
    )
    
    return success_message


@router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token from email"""
    # Find valid reset token
    reset_record = await db.password_resets.find_one({
        "token": request.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Link inválido ou expirado")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reset_record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Link expirado. Solicite uma nova redefinição de senha.")
    
    # Validate password
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 6 caracteres")
    
    # Update password
    hashed_password = hash_password(request.new_password)
    await db.users.update_one(
        {"id": reset_record["user_id"]},
        {"$set": {"password": hashed_password}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": request.token},
        {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Get user for email
    user = await db.users.find_one({"id": reset_record["user_id"]}, {"_id": 0})
    
    # Send confirmation email
    if user:
        await send_password_changed_email(
            to_email=user["email"],
            user_name=user.get("name", "Usuário")
        )
    
    return {
        "status": "success",
        "message": "Senha redefinida com sucesso! Você já pode fazer login."
    }


@router.get("/auth/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verify if reset token is valid (for frontend validation)"""
    reset_record = await db.password_resets.find_one({
        "token": token,
        "used": False
    }, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Link inválido ou expirado")
    
    expires_at = datetime.fromisoformat(reset_record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Link expirado")
    
    return {"valid": True}
