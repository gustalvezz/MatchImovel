"""
Admin routes
Handles admin dashboard, user management, and CRECI verification
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import logging

from database import db
from auth import get_current_user, hash_password
from config import FRONTEND_URL
from models.schemas import CreateCuratorRequest
from services.email_service import (
    send_email,
    send_creci_verified_email,
    send_creci_blocked_email
)

router = APIRouter(tags=["admin"])
logger = logging.getLogger(__name__)


@router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "curator"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    stats = {
        "total_buyers": await db.buyers.count_documents({}),
        "total_agents": await db.agents.count_documents({}),
        "total_interests": await db.interests.count_documents({}),
        "active_interests": await db.interests.count_documents({"status": "active"}),
        "total_matches": await db.matches.count_documents({}),
        "pending_matches": await db.matches.count_documents({"status": "pending_approval"}),
        "approved_matches": await db.matches.count_documents({"status": "approved"}),
        "total_curators": await db.users.count_documents({"role": "curator"}),
        "total_visits": await db.visits.count_documents({}),
        "scheduled_visits": await db.visits.count_documents({"status": "scheduled"})
    }
    
    return stats


@router.get("/admin/buyers")
async def get_all_buyers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "curator"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    buyers = await db.buyers.find({}, {"_id": 0}).to_list(1000)
    
    for buyer in buyers:
        user = await db.users.find_one({"id": buyer.get("user_id")}, {"_id": 0, "password": 0})
        if user:
            buyer['user'] = user
        
        interest_count = await db.interests.count_documents({"buyer_id": buyer.get("user_id")})
        buyer['interest_count'] = interest_count
    
    return buyers


@router.get("/admin/agents")
async def get_all_agents(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    agents = await db.agents.find({}, {"_id": 0}).to_list(1000)
    
    for agent in agents:
        user = await db.users.find_one({"id": agent.get("user_id")}, {"_id": 0, "password": 0})
        if user:
            agent['user'] = user
        
        match_count = await db.matches.count_documents({"agent_id": agent.get("user_id")})
        agent['match_count'] = match_count
    
    return agents


@router.post("/admin/agents/{agent_id}/verify-creci")
async def verify_agent_creci(agent_id: str, current_user: dict = Depends(get_current_user)):
    """Mark agent's CRECI as verified"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    agent = await db.agents.find_one({"user_id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")
    
    await db.agents.update_one(
        {"user_id": agent_id},
        {"$set": {"creci_verified": True, "creci_blocked": False}}
    )
    
    creci_display = f"{agent.get('creci_uf', '')}-{agent.get('creci', '')}"
    if agent.get("email"):
        await send_creci_verified_email(
            agent_email=agent["email"],
            agent_name=agent.get("name", "Corretor"),
            creci=creci_display
        )
    
    return {"status": "success", "message": "CRECI verificado com sucesso"}


@router.post("/admin/agents/{agent_id}/block-creci")
async def block_agent_creci(agent_id: str, blocked: bool = True, current_user: dict = Depends(get_current_user)):
    """Block or unblock agent's CRECI (prevents login if blocked)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    agent = await db.agents.find_one({"user_id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")
    
    await db.agents.update_one(
        {"user_id": agent_id},
        {"$set": {"creci_blocked": blocked, "creci_verified": False if blocked else agent.get("creci_verified", False)}}
    )
    
    creci_display = f"{agent.get('creci_uf', '')}-{agent.get('creci', '')}"
    if blocked and agent.get("email"):
        await send_creci_blocked_email(
            agent_email=agent["email"],
            agent_name=agent.get("name", "Corretor"),
            creci=creci_display
        )
    
    action = "bloqueado" if blocked else "desbloqueado"
    return {"status": "success", "message": f"CRECI {action} com sucesso"}


class CreciStatusUpdate(BaseModel):
    creci_verified: bool
    creci_blocked: bool


@router.put("/admin/agents/{agent_id}/creci-status")
async def update_creci_status(agent_id: str, status: CreciStatusUpdate, current_user: dict = Depends(get_current_user)):
    """Update agent's CRECI verification/block status"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    agent = await db.agents.find_one({"user_id": agent_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Corretor não encontrado")
    
    # Get previous status for email notifications
    was_verified = agent.get("creci_verified", False)
    was_blocked = agent.get("creci_blocked", False)
    
    # Update status
    await db.agents.update_one(
        {"user_id": agent_id},
        {"$set": {"creci_verified": status.creci_verified, "creci_blocked": status.creci_blocked}}
    )
    
    creci_display = f"{agent.get('creci_uf', '')}-{agent.get('creci', '')}"
    
    # Send email notifications based on status changes
    if agent.get("email"):
        # If newly verified (was not verified before, now is verified and not blocked)
        if status.creci_verified and not status.creci_blocked and not was_verified:
            await send_creci_verified_email(
                agent_email=agent["email"],
                agent_name=agent.get("name", "Corretor"),
                creci=creci_display
            )
        # If newly blocked (was not blocked before, now is blocked)
        elif status.creci_blocked and not was_blocked:
            await send_creci_blocked_email(
                agent_email=agent["email"],
                agent_name=agent.get("name", "Corretor"),
                creci=creci_display
            )
    
    return {"status": "success", "message": "Status do CRECI atualizado com sucesso"}


@router.get("/admin/interests")
async def get_all_interests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "curator"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    interests = await db.interests.find({}, {"_id": 0}).to_list(1000)
    
    for interest in interests:
        if isinstance(interest.get('created_at'), str):
            interest['created_at'] = datetime.fromisoformat(interest['created_at'])
        
        buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
        if buyer:
            interest['buyer'] = buyer
    
    return interests


@router.get("/admin/matches")
async def get_all_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "curator"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if current_user["role"] == "admin":
        matches = await db.matches.find({}, {"_id": 0}).to_list(1000)
    else:
        matches = await db.matches.find({"curator_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)
    
    for match in matches:
        if isinstance(match.get('created_at'), str):
            match['created_at'] = datetime.fromisoformat(match['created_at'])
        if isinstance(match.get('updated_at'), str):
            match['updated_at'] = datetime.fromisoformat(match['updated_at'])
        
        interest = await db.interests.find_one({"id": match["interest_id"]}, {"_id": 0})
        match['interest'] = interest
        
        buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
        buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0, "password": 0})
        if buyer:
            if not buyer.get("phone") and buyer_user and buyer_user.get("phone"):
                buyer["phone"] = buyer_user["phone"]
            match['buyer'] = buyer
        
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0, "password": 0})
        if agent:
            if not agent.get("phone") and agent_user and agent_user.get("phone"):
                agent["phone"] = agent_user["phone"]
            match['agent'] = agent
        
        if match.get('curator_id'):
            curator = await db.users.find_one({"id": match['curator_id']}, {"_id": 0})
            if curator:
                match['curator_name'] = curator.get('name')
    
    return matches


@router.post("/admin/create-curator")
async def create_curator(curator_data: CreateCuratorRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar curadores")
    
    existing_user = await db.users.find_one({"email": curator_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    existing_pending = await db.pending_curators.find_one({"email": curator_data.email, "status": "pending"}, {"_id": 0})
    if existing_pending:
        raise HTTPException(status_code=400, detail="Já existe um convite pendente para este email")
    
    registration_token = secrets.token_urlsafe(32)
    
    curator_id = str(uuid.uuid4())
    pending_curator = {
        "id": curator_id,
        "email": curator_data.email,
        "name": curator_data.name,
        "phone": curator_data.phone,
        "registration_token": registration_token,
        "token_expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_by": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }
    
    await db.pending_curators.insert_one(pending_curator)
    
    frontend_url = FRONTEND_URL
    if not frontend_url:
        raise HTTPException(status_code=500, detail="FRONTEND_URL não configurado no servidor")
    registration_link = f"{frontend_url}/complete-registration?token={registration_token}"
    
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .info-box {{ background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 15px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MatchImovel</h1>
            </div>
            <div class="content">
                <h2>Olá, {curator_data.name}!</h2>
                <p>Você foi convidado para fazer parte da equipe de <strong>Curadores</strong> da plataforma MatchImovel.</p>
                
                <div class="info-box">
                    <p><strong>O que é um Curador?</strong></p>
                    <p>Como curador, você será responsável por avaliar e aprovar os matches entre compradores e corretores, garantindo a qualidade das conexões em nossa plataforma.</p>
                </div>
                
                <p>Para completar seu cadastro e definir sua senha, clique no botão abaixo:</p>
                
                <center>
                    <a href="{registration_link}" class="button">Completar Cadastro</a>
                </center>
                
                <p><strong>Importante:</strong> Este link expira em 7 dias.</p>
                
                <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <p style="word-break: break-all; font-size: 12px; color: #666;">{registration_link}</p>
            </div>
            <div class="footer">
                <p>Este é um email automático. Por favor, não responda.</p>
                <p>&copy; 2024 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    email_sent = await send_email(
        to_email=curator_data.email,
        subject="Convite para ser Curador - MatchImovel",
        html_content=email_html
    )
    
    response = {
        "status": "success",
        "message": "Curador criado com sucesso!",
        "email_sent": email_sent
    }
    
    if not email_sent:
        response["message"] = "Curador criado. Email não enviado - use o link abaixo."
        response["registration_link"] = registration_link
    
    return response


@router.get("/admin/curators")
async def get_all_curators(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    curators = await db.users.find({"role": "curator"}, {"_id": 0, "password": 0}).to_list(100)
    
    for curator in curators:
        match_count = await db.matches.count_documents({"curator_id": curator["id"]})
        curator['curated_matches'] = match_count
    
    return curators
