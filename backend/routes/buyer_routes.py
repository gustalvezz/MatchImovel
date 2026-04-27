"""
Buyer routes
Handles buyer interests and matches
"""
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from datetime import datetime, timezone
from typing import List
import uuid
import secrets
import os
import logging
import asyncio

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


async def process_ai_interpretation_background(interest_id: str, form_data: dict, buyer_email: str, buyer_name: str):
    """
    Background task to generate AI interpretation and send email.
    This runs after the HTTP response is sent to avoid Vercel timeout.
    """
    try:
        logger.info(f"Starting background AI interpretation for interest {interest_id}")
        
        # Generate AI interpretation
        ai_interpretation = await generate_ai_interpretation(form_data)
        
        # Generate simple AI profile
        property_type = form_data.get('property_type', 'casa')
        ai_profile = await generate_ai_profile({
            'profile_type': form_data.get('profile_type'),
            'urgency': form_data.get('urgency'),
            'location': form_data.get('location'),
            'budget_range': form_data.get('budget_range'),
            'property_type': property_type,
            'ambiance': form_data.get('ambiance'),
            'deal_breakers': form_data.get('deal_breakers', []),
            'proximity_needs': form_data.get('proximity_needs', [])
        })
        
        # Update interest with AI interpretation and profile
        update_data = {
            "ai_profile": ai_profile,
            "ai_processing_status": "completed"
        }
        
        if ai_interpretation:
            update_data["interpretacaoIA"] = ai_interpretation
            
        await db.interests.update_one(
            {"id": interest_id},
            {"$set": update_data}
        )
        logger.info(f"AI interpretation saved for interest {interest_id}")
        
        # Send confirmation email with AI interpretation
        if buyer_email:
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
            
            await send_interest_registered_email(
                buyer_email=buyer_email,
                buyer_name=buyer_name,
                interest_data={
                    'property_type': property_type_display,
                    'budget_range': form_data.get('budget_range'),
                    'location': form_data.get('location')
                },
                ai_interpretation=ai_interpretation
            )
            logger.info(f"Confirmation email sent to {buyer_email}")
            
    except Exception as e:
        logger.error(f"Error in background AI processing for interest {interest_id}: {str(e)}")
        # Update status to failed
        try:
            await db.interests.update_one(
                {"id": interest_id},
                {"$set": {"ai_processing_status": "failed"}}
            )
        except Exception:
            pass


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


@router.get("/buyers/my-interests")
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
    
    # Check for pending or approved matches
    blocking_matches = await db.matches.find({
        "interest_id": interest_id,
        "status": {"$in": ["pending_approval", "pending_info", "approved", "visit_scheduled"]}
    }, {"_id": 0}).to_list(100)
    
    if blocking_matches:
        raise HTTPException(
            status_code=400, 
            detail="Não é possível excluir este interesse pois existem matches pendentes ou aprovados. Entre em contato com seu curador para solicitar a exclusão."
        )
    
    buyer = await db.buyers.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    buyer_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    
    # Get any remaining matches (rejected/completed) for notification
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
    
    # Delete any remaining matches (rejected/completed) and related data
    for match in related_matches:
        await db.bot_conversations.delete_many({"match_id": match["id"]})
        await db.visits.delete_many({"match_id": match["id"]})
        await db.followups.delete_many({"match_id": match["id"]})
    await db.matches.delete_many({"interest_id": interest_id})
    
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



async def generate_ai_interpretation(form_data: dict) -> dict:
    """Generate comprehensive AI interpretation of buyer profile using GPT-4o"""
    try:
        from openai import AsyncOpenAI
        
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            logger.warning("OPENAI_API_KEY not configured, skipping AI interpretation")
            return None
        
        # Format all responses for the prompt
        responses_text = f"""
BLOCO 1 - QUEM É VOCÊ:
- Faixa etária: {form_data.get('age_range', 'Não informado')}
- Por que busca imóvel: {form_data.get('profile_type', 'Não informado')} {form_data.get('profile_type_other', '')}
- Quem vai morar: {', '.join(form_data.get('who_will_live', [])) or 'Não informado'}
- Quantidade de filhos: {form_data.get('children_count', 'N/A')}
- Faixa etária dos filhos: {', '.join(form_data.get('children_ages', [])) or 'N/A'}
- Urgência: {form_data.get('urgency', 'Não informado')}

BLOCO 2 - O QUE VOCÊ BUSCA:
- Tipo de imóvel: {form_data.get('property_type', 'Não informado')}
- Preferência de andar: {form_data.get('floor_preference', 'N/A')}
- Prioridades no terreno: {', '.join(form_data.get('land_priorities', [])) or 'N/A'}
- Localização desejada: {form_data.get('location', 'Não informado')}
- Orçamento máximo: {form_data.get('budget_range', 'Não informado')}
- Forma de pagamento: {', '.join(form_data.get('payment_method', [])) or 'Não informado'}
- Situação do imóvel atual: {form_data.get('current_property_status', 'N/A')}

BLOCO 3 - COMO DEVE SER:
- Indispensáveis: {', '.join(form_data.get('indispensable', [])) or 'Não informado'} {form_data.get('indispensable_other', '')}
- Tamanho do espaço: {form_data.get('space_size', 'Não informado')}
- Condição do imóvel: {', '.join(form_data.get('property_condition', [])) or 'Não informado'}
- Ambiente ideal: {form_data.get('ambiance', 'Não informado')}

BLOCO 4 - COMO VOCÊ VIVE:
- Pets: {form_data.get('has_pets', 'Não informado')}
- Rotina em casa: {', '.join(form_data.get('daily_routine', [])) or 'Não informado'}
- Locomoção: {', '.join(form_data.get('transportation', [])) or 'Não informado'}

BLOCO 5 - O QUE VOCÊ REJEITA:
- O que mais incomoda: {', '.join(form_data.get('deal_breakers', [])) or 'Não informado'}

BLOCO 6 - ENTORNO:
- O que precisa estar perto: {', '.join(form_data.get('proximity_needs', [])) or 'Não informado'}

BLOCO 7 - OBSERVAÇÕES ADICIONAIS:
{form_data.get('additional_notes', 'Nenhuma observação adicional')}
"""

        prompt = f"""Você é um especialista em mercado imobiliário brasileiro com profundo conhecimento em perfil de compradores.

Com base nas respostas do formulário abaixo, gere uma interpretação completa deste comprador em JSON com exatamente quatro campos:

1. "perfil_narrativo": texto corrido de 4 a 6 linhas descrevendo quem é este comprador, o que busca, como vive, suas prioridades reais e seu momento de vida. Escreva como se estivesse apresentando este comprador a um corretor experiente. Não omita nenhuma informação relevante.

2. "criterios_inegociaveis": lista dos deal-breakers reais, inferidos tanto das respostas diretas quanto da leitura cruzada entre elas. Inclua o que está explícito E o que está implícito nas respostas. Sem limite de itens.

3. "perfil_do_imovel_ideal": descrição objetiva do imóvel que melhor atende este comprador, cruzando tipo, localização, orçamento, estilo de vida e indispensáveis declarados.

4. "alertas": inconsistências, contradições ou combinações muito restritivas detectadas entre as respostas. Se não houver, retornar array vazio.

Este texto será lido por um corretor antes de apresentar um imóvel. Seja preciso, completo e direto.
Responda APENAS com o JSON, sem texto adicional, sem markdown, sem explicações.

RESPOSTAS DO COMPRADOR:
{responses_text}"""

        client = AsyncOpenAI(api_key=api_key)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Você é um especialista em mercado imobiliário brasileiro. Responda apenas com JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean markdown if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        import json
        interpretation = json.loads(response_text)
        logger.info("AI interpretation generated successfully")
        return interpretation
        
    except Exception as e:
        logger.error(f"Error generating AI interpretation: {str(e)}")
        return None


@router.post("/interests/create-full-v2")
async def create_full_interest_v2(request: Request, background_tasks: BackgroundTasks):
    """Create interest from the new 18-screen form with AI interpretation.
    
    AI interpretation is processed in background to avoid Vercel timeout.
    The interest is saved immediately, and AI profile is updated asynchronously.
    """
    
    form_data = await request.json()
    
    # Capture client IP for Terms of Use
    client_ip = request.client.host if request.client else "unknown"
    
    # Check for existing user
    existing_user = None
    email = form_data.get('email')
    phone = form_data.get('phone')
    name = form_data.get('name')
    
    if email:
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if not existing_user and phone:
        existing_user = await db.buyers.find_one({"phone": phone}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user.get('id') or existing_user.get('user_id')
    else:
        user_id = str(uuid.uuid4())
        temp_password = secrets.token_urlsafe(16)
        
        new_user = {
            "id": user_id,
            "email": email or f"temp_{user_id}@matchimob.com",
            "password": hash_password(temp_password),
            "role": "buyer",
            "name": name,
            "phone": phone,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "needs_password_setup": True
        }
        await db.users.insert_one(new_user)
        
        buyer_profile = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "phone": phone,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.buyers.insert_one(buyer_profile)
    
    # Budget mapping
    budget_map = {
        'ate_400k': (0, 400000),
        'ate_550k': (0, 550000),
        'ate_700k': (0, 700000),
        'ate_800k': (0, 800000),
        'ate_1500k': (0, 1500000),
        'ate_2500k': (0, 2500000),
        'ate_5000k': (0, 5000000),
        'acima_5000k': (5000000, 50000000)
    }
    min_price, max_price = budget_map.get(form_data.get('budget_range', ''), (0, 1000000))
    
    # Property type display
    property_type = form_data.get('property_type', 'casa')
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
    
    # Extract bedrooms from indispensable
    indispensable = form_data.get('indispensable', [])
    bedrooms = None
    if '3+ quartos' in indispensable:
        bedrooms = 3
    elif '2+ quartos' in indispensable:
        bedrooms = 2
    
    # Generate a quick fallback AI profile (sync, fast)
    profile_base = {
        'primeiro_imovel': 'PRIMEIRO IMÓVEL',
        'sair_aluguel': 'SAIR DO ALUGUEL',
        'melhor_localizacao': 'MUDANÇA',
        'familia_cresceu': 'FAMÍLIA',
        'investidor': 'INVESTIDOR'
    }.get(form_data.get('profile_type', ''), 'COMPRADOR')
    quick_ai_profile = f"{profile_base} - Processando perfil..."
    
    interest_id = str(uuid.uuid4())
    interest = {
        "id": interest_id,
        "buyer_id": user_id,
        "property_type": property_type_display,
        "property_type_key": property_type,
        "location": form_data.get('location', ''),
        "neighborhoods": [],
        "min_price": min_price,
        "max_price": max_price,
        "bedrooms": bedrooms,
        "features": indispensable,
        "additional_notes": form_data.get('additional_notes', ''),
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        
        # BLOCO 1 - QUEM É VOCÊ
        "age_range": form_data.get('age_range'),
        "profile_type": form_data.get('profile_type'),
        "profile_type_other": form_data.get('profile_type_other'),
        "who_will_live": form_data.get('who_will_live', []),
        "children_count": form_data.get('children_count'),
        "children_ages": form_data.get('children_ages', []),
        "urgency": form_data.get('urgency'),
        
        # BLOCO 2 - O QUE VOCÊ BUSCA
        "floor_preference": form_data.get('floor_preference'),
        "land_priorities": form_data.get('land_priorities', []),
        "budget_range": form_data.get('budget_range'),
        "payment_method": form_data.get('payment_method', []),
        "current_property_status": form_data.get('current_property_status'),
        
        # BLOCO 3 - COMO DEVE SER
        "indispensable": indispensable,
        "indispensable_other": form_data.get('indispensable_other'),
        "space_size": form_data.get('space_size'),
        "property_condition": form_data.get('property_condition', []),
        "ambiance": form_data.get('ambiance'),
        
        # BLOCO 4 - COMO VOCÊ VIVE
        "has_pets": form_data.get('has_pets'),
        "daily_routine": form_data.get('daily_routine', []),
        "transportation": form_data.get('transportation', []),
        
        # BLOCO 5 - O QUE VOCÊ REJEITA
        "deal_breakers": form_data.get('deal_breakers', []),
        
        # BLOCO 6 - ENTORNO
        "proximity_needs": form_data.get('proximity_needs', []),
        
        # AI Generated - will be updated in background
        "ai_profile": quick_ai_profile,
        "interpretacaoIA": None,  # Will be filled by background task
        "ai_processing_status": "pending",  # Track AI processing status
        
        # Terms of Use
        "terms_accepted": form_data.get('terms_accepted', False),
        "terms_accepted_at": form_data.get('terms_accepted_at'),
        "terms_accepted_ip": client_ip,
        
        # Form version
        "form_version": "v4"
    }
    
    # Save interest immediately (fast response to user)
    await db.interests.insert_one(interest)
    logger.info(f"Interest {interest_id} saved. Scheduling AI processing in background.")
    
    # Schedule AI processing and email in background
    background_tasks.add_task(
        process_ai_interpretation_background,
        interest_id,
        form_data,
        email,
        name
    )
    
    return {
        "status": "success",
        "message": "Interesse cadastrado com sucesso!",
        "interest_id": interest_id,
        "ai_profile": quick_ai_profile,
        "has_ai_interpretation": False,  # Will be processed in background
        "ai_processing": "pending"
    }
