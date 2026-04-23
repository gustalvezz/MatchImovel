"""
Buyer routes
Handles buyer interests and matches
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import List
import uuid
import secrets
import os
import logging

from database import db
from auth import get_current_user, hash_password
from models.schemas import (
    BuyerInterest, BuyerInterestCreate,
    FullInterestCreate, DeleteReason
)
from services.email_service import send_interest_registered_email, send_deletion_notification_curator

router = APIRouter(tags=["buyers"])
logger = logging.getLogger(__name__)


async def generate_ai_profile(form_data: dict) -> str:
    """Generate a buyer profile using AI based on form responses"""
    try:
        from openai import AsyncOpenAI
        
        profile_labels = {
            'primeiro_imovel': 'Primeiro Imóvel',
            'sair_aluguel': 'Sair do Aluguel',
            'melhor_localizacao': 'Mudança por Localização',
            'familia_cresceu': 'Mais Espaço para Família',
            'investidor': 'Investidor'
        }
        
        urgency_labels = {
            '3_meses': 'urgente (3 meses)',
            '12_meses': 'planejando (12 meses)',
            'sem_prazo': 'pesquisando'
        }
        
        ambiance_labels = {
            'aconchegante': 'quer aconchego e natureza',
            'amplo_moderno': 'quer amplitude e luz',
            'minimalista': 'quer simplicidade funcional',
            'casa_campo': 'quer tranquilidade rural',
            'alto_padrao': 'quer sofisticação moderna'
        }
        
        property_type_labels = {
            'apartamento': 'apartamento',
            'casa': 'casa',
            'casa_condominio': 'casa de condomínio',
            'terreno': 'terreno',
            'terreno_condominio': 'terreno de condomínio',
            'sala_comercial': 'sala comercial',
            'predio_comercial': 'prédio comercial',
            'studio_loft': 'studio/loft'
        }
        
        profile_base = profile_labels.get(form_data.get('profile_type', ''), 'Comprador')
        urgency = urgency_labels.get(form_data.get('urgency', ''), '')
        ambiance = ambiance_labels.get(form_data.get('ambiance', ''), '')
        property_type = property_type_labels.get(form_data.get('property_type', ''), '')
        
        prompt = f"""Baseado nas respostas de um comprador de imóvel, crie um PERFIL CURTO (máximo 6 palavras) que descreva esse comprador.

Dados:
- Tipo: {profile_base}
- Urgência: {urgency}
- Localização desejada: {form_data.get('location', '')}
- Orçamento: {form_data.get('budget_range', '')}
- Tipo de imóvel: {property_type}
- Ambiente ideal: {ambiance}
- O que incomoda: {', '.join(form_data.get('deal_breakers', [])[:2])}
- Precisa perto: {', '.join(form_data.get('proximity_needs', [])[:2])}

Exemplos de perfis:
- "INVESTIDOR - Busca retorno rápido"
- "PRIMEIRO IMÓVEL - Família jovem"
- "UPGRADE - Mais espaço com conforto"
- "LIFESTYLE - Minimalista urbano"
- "FAMÍLIA - Busca segurança e escola"

Responda APENAS com o perfil, nada mais. Use formato: "CATEGORIA - Descrição curta"
"""
        
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            return f"{profile_base.upper()} - Perfil em análise"
        
        client = AsyncOpenAI(api_key=api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você é um especialista em criar perfis curtos de compradores de imóveis."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=50
        )
        
        profile = response.choices[0].message.content.strip().strip('"').strip("'")
        if len(profile) > 60:
            profile = profile[:60]
        
        return profile
        
    except Exception as e:
        logger.error(f"Error generating AI profile: {str(e)}")
        profile_base = {
            'primeiro_imovel': 'PRIMEIRO IMÓVEL',
            'sair_aluguel': 'SAIR DO ALUGUEL',
            'melhor_localizacao': 'MUDANÇA',
            'familia_cresceu': 'FAMÍLIA',
            'investidor': 'INVESTIDOR'
        }.get(form_data.get('profile_type', ''), 'COMPRADOR')
        return f"{profile_base} - Perfil em análise"


@router.post("/buyers/interests", response_model=BuyerInterest)
async def create_interest(interest_data: BuyerInterestCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Apenas compradores podem criar interesses")
    
    interest = BuyerInterest(
        buyer_id=current_user["user_id"],
        **interest_data.model_dump()
    )
    
    doc = interest.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.interests.insert_one(doc)
    
    return interest


@router.get("/buyers/my-interests", response_model=List[BuyerInterest])
async def get_my_interests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    interests = await db.interests.find({"buyer_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    
    for interest in interests:
        if isinstance(interest.get('created_at'), str):
            interest['created_at'] = datetime.fromisoformat(interest['created_at'])
    
    return interests


@router.delete("/buyers/interests/{interest_id}")
async def delete_interest(interest_id: str, reason_data: DeleteReason, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Apenas compradores podem excluir interesses")
    
    interest = await db.interests.find_one({"id": interest_id, "buyer_id": current_user["user_id"]}, {"_id": 0})
    if not interest:
        raise HTTPException(status_code=404, detail="Interesse não encontrado")
    
    buyer = await db.buyers.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    buyer_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    
    related_matches = await db.matches.find({"interest_id": interest_id}, {"_id": 0}).to_list(100)
    
    for match in related_matches:
        if match.get("curator_id"):
            curator = await db.users.find_one({"id": match["curator_id"]}, {"_id": 0})
            if curator and curator.get("email"):
                await send_deletion_notification_curator(
                    curator_email=curator["email"],
                    curator_name=curator.get("name", "Curador"),
                    deletion_type="interest",
                    deleted_by_name=buyer.get("name") if buyer else buyer_user.get("name", "Comprador"),
                    deleted_by_email=buyer.get("email") if buyer else buyer_user.get("email", ""),
                    deleted_by_phone=buyer.get("phone") if buyer else buyer_user.get("phone", ""),
                    reason=reason_data.reason,
                    description=reason_data.other_reason or ""
                )
    
    deletion_record = {
        "id": str(uuid.uuid4()),
        "interest_id": interest_id,
        "buyer_id": current_user["user_id"],
        "reason": reason_data.reason,
        "other_reason": reason_data.other_reason,
        "deleted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.interest_deletions.insert_one(deletion_record)
    
    await db.interests.delete_one({"id": interest_id})
    
    return {"status": "success", "message": "Interesse excluído com sucesso"}


@router.get("/buyers/my-matches")
async def get_my_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    matches = await db.matches.find({"buyer_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    
    for match in matches:
        if isinstance(match.get('created_at'), str):
            match['created_at'] = datetime.fromisoformat(match['created_at'])
        if isinstance(match.get('updated_at'), str):
            match['updated_at'] = datetime.fromisoformat(match['updated_at'])
        
        interest = await db.interests.find_one({"id": match["interest_id"]}, {"_id": 0})
        match['interest'] = interest
        
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        if agent:
            match['agent'] = {"name": agent.get("name"), "company": agent.get("company")}
    
    return matches


@router.post("/interests/create-full")
async def create_full_interest(form_data: FullInterestCreate, request: Request):
    """Create interest from the full multi-step form (public endpoint)"""
    
    # Capture client IP for Terms of Use
    client_ip = request.client.host if request.client else "unknown"
    
    existing_user = None
    if form_data.email:
        existing_user = await db.users.find_one({"email": form_data.email}, {"_id": 0})
    if not existing_user:
        existing_user = await db.buyers.find_one({"phone": form_data.phone}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user.get('id') or existing_user.get('user_id')
    else:
        user_id = str(uuid.uuid4())
        temp_password = secrets.token_urlsafe(16)
        
        new_user = {
            "id": user_id,
            "email": form_data.email or f"temp_{user_id}@matchimob.com",
            "password": hash_password(temp_password),
            "role": "buyer",
            "name": form_data.name,
            "phone": form_data.phone,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "needs_password_setup": True
        }
        await db.users.insert_one(new_user)
        
        buyer_profile = {
            "user_id": user_id,
            "name": form_data.name,
            "email": form_data.email,
            "phone": form_data.phone,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.buyers.insert_one(buyer_profile)
    
    budget_map = {
        'ate_400k': (0, 400000),
        '400k_550k': (400000, 550000),
        '550k_700k': (550000, 700000),
        '700k_800k': (700000, 800000),
        '800k_1500k': (800000, 1500000),
        'acima_1500k': (1500000, 10000000)
    }
    min_price, max_price = budget_map.get(form_data.budget_range, (0, 1000000))
    
    property_type = form_data.property_type if hasattr(form_data, 'property_type') and form_data.property_type else 'casa'
    
    property_type_display = {
        'apartamento': 'Apartamento',
        'casa': 'Casa',
        'casa_condominio': 'Casa de condomínio',
        'terreno': 'Terreno',
        'terreno_condominio': 'Terreno de condomínio',
        'sala_comercial': 'Sala comercial',
        'predio_comercial': 'Prédio comercial',
        'studio_loft': 'Studio/Loft'
    }.get(property_type, property_type)
    
    bedrooms = None
    if 'Pelo menos 3 quartos' in form_data.indispensable:
        bedrooms = 3
    elif 'Pelo menos 2 quartos' in form_data.indispensable:
        bedrooms = 2
    
    ai_profile = await generate_ai_profile(form_data.model_dump())
    
    interest_id = str(uuid.uuid4())
    interest = {
        "id": interest_id,
        "buyer_id": user_id,
        "property_type": property_type_display,
        "property_type_key": property_type,
        "location": form_data.location,
        "neighborhoods": [],
        "min_price": min_price,
        "max_price": max_price,
        "bedrooms": bedrooms,
        "features": form_data.indispensable,
        "additional_notes": form_data.indispensable_other,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "profile_type": form_data.profile_type,
        "urgency": form_data.urgency,
        "budget_range": form_data.budget_range,
        "ambiance": form_data.ambiance,
        "deal_breakers": form_data.deal_breakers,
        "proximity_needs": form_data.proximity_needs,
        "experience_fears": form_data.experience_fears,
        "ai_profile": ai_profile,
        "form_version": "v3",
        # Terms of Use acceptance
        "terms_accepted": form_data.terms_accepted,
        "terms_accepted_at": form_data.terms_accepted_at,
        "terms_accepted_ip": client_ip
    }
    
    await db.interests.insert_one(interest)
    
    if form_data.email:
        await send_interest_registered_email(
            buyer_email=form_data.email,
            buyer_name=form_data.name,
            interest_data={
                'property_type': form_data.property_type,
                'budget_range': form_data.budget_range,
                'location': form_data.location
            }
        )
    
    return {
        "status": "success",
        "message": "Interesse cadastrado com sucesso!",
        "interest_id": interest_id,
        "ai_profile": ai_profile
    }
