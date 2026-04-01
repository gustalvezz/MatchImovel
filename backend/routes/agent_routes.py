"""
Agent routes
Handles agent searches, matches, and bot conversations
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid
import unicodedata
import os
import logging

from database import db
from auth import get_current_user
from models.schemas import (
    Match, MatchCreateWithProperty, DeleteReason,
    BotConversation, SendMessageRequest
)
from services.email_service import send_deletion_notification_curator

router = APIRouter(tags=["agents"])
logger = logging.getLogger(__name__)


@router.get("/agents/buyers")
async def search_buyers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["agent", "curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    interests = await db.interests.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    for interest in interests:
        if isinstance(interest.get('created_at'), str):
            interest['created_at'] = datetime.fromisoformat(interest['created_at'])
        
        buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
        if buyer:
            interest['buyer_name'] = buyer.get("name")
    
    return interests


@router.get("/agents/smart-search")
async def smart_search_buyers(query: str = "", current_user: dict = Depends(get_current_user)):
    """Smart search for buyers using AI to match location queries"""
    if current_user["role"] not in ["agent", "curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    def normalize_text(text: str) -> str:
        """Remove accents and normalize text for comparison"""
        normalized = unicodedata.normalize('NFD', text)
        without_accents = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
        return without_accents.lower().strip()
    
    interests = await db.interests.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    if not query:
        for interest in interests:
            if isinstance(interest.get('created_at'), str):
                interest['created_at'] = datetime.fromisoformat(interest['created_at'])
            buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
            if buyer:
                interest['buyer_name'] = buyer.get("name")
        return interests
    
    query_normalized = normalize_text(query)
    query_words = set(query_normalized.replace(',', ' ').replace('-', ' ').split())
    
    results = []
    for interest in interests:
        location = interest.get('location', '')
        location_normalized = normalize_text(location)
        location_words = set(location_normalized.replace(',', ' ').replace('-', ' ').split())
        
        score = 0
        
        if query_normalized in location_normalized:
            score += 100
        
        common_words = query_words & location_words
        score += len(common_words) * 30
        
        for qw in query_words:
            for lw in location_words:
                if len(qw) > 2 and len(lw) > 2:
                    if qw in lw or lw in qw:
                        score += 15
        
        budget_keywords = ['400', '500', '550', '600', '700', '800']
        for bk in budget_keywords:
            if bk in query_normalized:
                budget_range = interest.get('budget_range', '')
                if bk in budget_range:
                    score += 20
        
        if score > 0:
            interest['search_score'] = score
            if isinstance(interest.get('created_at'), str):
                interest['created_at'] = datetime.fromisoformat(interest['created_at'])
            buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
            if buyer:
                interest['buyer_name'] = buyer.get("name")
            results.append(interest)
    
    results.sort(key=lambda x: x.get('search_score', 0), reverse=True)
    
    return results


@router.post("/agents/match", response_model=Match)
async def create_match(match_data: MatchCreateWithProperty, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "agent":
        raise HTTPException(status_code=403, detail="Apenas corretores podem criar matches")
    
    interest = await db.interests.find_one({"id": match_data.interest_id}, {"_id": 0})
    if not interest:
        raise HTTPException(status_code=404, detail="Interesse não encontrado")
    
    existing_match = await db.matches.find_one({
        "agent_id": current_user["user_id"],
        "interest_id": match_data.interest_id
    }, {"_id": 0})
    
    if existing_match:
        raise HTTPException(status_code=400, detail="Você já deu match neste comprador")
    
    match = Match(
        buyer_id=match_data.buyer_id,
        agent_id=current_user["user_id"],
        interest_id=match_data.interest_id,
        status="pending_approval",
        property_info=match_data.property_info.model_dump() if match_data.property_info else None
    )
    
    doc = match.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.matches.insert_one(doc)
    
    conversation = BotConversation(match_id=match.id)
    conv_doc = conversation.model_dump()
    conv_doc['created_at'] = conv_doc['created_at'].isoformat()
    for msg in conv_doc['messages']:
        msg['timestamp'] = msg['timestamp'].isoformat()
    await db.bot_conversations.insert_one(conv_doc)
    
    return match


@router.delete("/agents/match/{match_id}")
async def delete_match(match_id: str, reason_data: DeleteReason, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "agent":
        raise HTTPException(status_code=403, detail="Apenas corretores podem excluir matches")
    
    match = await db.matches.find_one({"id": match_id, "agent_id": current_user["user_id"]}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    agent = await db.agents.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    agent_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    
    if match.get("curator_id"):
        curator = await db.users.find_one({"id": match["curator_id"]}, {"_id": 0})
        if curator and curator.get("email"):
            await send_deletion_notification_curator(
                curator_email=curator["email"],
                curator_name=curator.get("name", "Curador"),
                deletion_type="match",
                deleted_by_name=agent.get("name") if agent else agent_user.get("name", "Corretor"),
                deleted_by_email=agent.get("email") if agent else agent_user.get("email", ""),
                deleted_by_phone=agent.get("phone") if agent else agent_user.get("phone", ""),
                reason=reason_data.reason,
                description=reason_data.other_reason or ""
            )
    
    deletion_record = {
        "id": str(uuid.uuid4()),
        "match_id": match_id,
        "agent_id": current_user["user_id"],
        "reason": reason_data.reason,
        "other_reason": reason_data.other_reason,
        "deleted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.match_deletions.insert_one(deletion_record)
    
    await db.matches.delete_one({"id": match_id})
    await db.bot_conversations.delete_one({"match_id": match_id})
    
    return {"status": "success", "message": "Match excluído com sucesso"}


@router.get("/agents/my-matches")
async def get_agent_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "agent":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    matches = await db.matches.find({"agent_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    
    for match in matches:
        if isinstance(match.get('created_at'), str):
            match['created_at'] = datetime.fromisoformat(match['created_at'])
        if isinstance(match.get('updated_at'), str):
            match['updated_at'] = datetime.fromisoformat(match['updated_at'])
        
        interest = await db.interests.find_one({"id": match["interest_id"]}, {"_id": 0})
        match['interest'] = interest
        
        buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
        if buyer:
            match['buyer'] = {"name": buyer.get("name")}
    
    return matches


@router.get("/matches/{match_id}/conversation")
async def get_match_conversation(match_id: str, current_user: dict = Depends(get_current_user)):
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    if current_user["role"] == "agent" and match["agent_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    if current_user["role"] == "buyer" and match["buyer_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    conversation = await db.bot_conversations.find_one({"match_id": match_id}, {"_id": 0})
    if not conversation:
        conversation = BotConversation(match_id=match_id)
        conv_doc = conversation.model_dump()
        conv_doc['created_at'] = conv_doc['created_at'].isoformat()
        await db.bot_conversations.insert_one(conv_doc)
        return conversation.model_dump()
    
    return conversation


@router.post("/matches/{match_id}/send-message")
async def send_bot_message(match_id: str, request: SendMessageRequest, current_user: dict = Depends(get_current_user)):
    """Process user message with AI and extract property info"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    if current_user["role"] != "agent":
        raise HTTPException(status_code=403, detail="Apenas corretores podem interagir")
    
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    if match["agent_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    conversation = await db.bot_conversations.find_one({"match_id": match_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    interest = await db.interests.find_one({"id": match["interest_id"]}, {"_id": 0})
    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
    
    buyer_context = f"""
    Informações do comprador:
    - Nome: {buyer.get('name', 'Não informado') if buyer else 'Não informado'}
    - Tipo de imóvel desejado: {interest.get('property_type', 'Não especificado') if interest else 'Não especificado'}
    - Localização desejada: {interest.get('location', 'Não especificada') if interest else 'Não especificada'}
    - Faixa de preço: R$ {interest.get('min_price', 0):,.0f} a R$ {interest.get('max_price', 0):,.0f}
    - Quartos desejados: {interest.get('bedrooms', 'Não especificado') if interest else 'Não especificado'}
    - Características desejadas: {', '.join(interest.get('features', [])) if interest else 'Nenhuma'}
    """
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"match-{match_id}",
        system_message=f"""Você é um assistente especializado em conectar corretores com compradores de imóveis.
        
{buyer_context}

Seu objetivo é ajudar o corretor a fornecer informações sobre o imóvel que ele quer oferecer.

Extraia as seguintes informações do imóvel quando fornecidas:
- Tipo (apartamento, casa, etc)
- Endereço/Localização
- Preço
- Área (m²)
- Quartos
- Banheiros
- Vagas de garagem
- Características especiais

Seja direto e objetivo. Quando tiver informações suficientes, confirme os dados com o corretor."""
    ).with_model("openai", "gpt-4o-mini")
    
    for msg in conversation.get('messages', []):
        if msg['role'] == 'user':
            await chat.send_message(UserMessage(text=msg['content']))
    
    response = await chat.send_message(UserMessage(text=request.message))
    
    await db.bot_conversations.update_one(
        {"match_id": match_id},
        {
            "$push": {
                "messages": {
                    "$each": [
                        {"role": "user", "content": request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
                        {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
                    ]
                }
            }
        }
    )
    
    return {"response": response}
