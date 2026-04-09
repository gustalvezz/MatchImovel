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


# ============ AI DISCOVERY ENDPOINT ============

from pydantic import BaseModel
from typing import List, Optional
import json

class AIDiscoveryRequest(BaseModel):
    property_description: str
    property_price: Optional[float] = None  # Preço do imóvel para pré-filtro
    property_type: Optional[str] = None     # Tipo do imóvel para pré-filtro (apartamento, casa, etc)

class BuyerMatch(BaseModel):
    comprador_id: str
    buyer_id: str
    buyer_name: str
    score: int
    justificativa: str
    property_type: str
    location: str
    budget_range: Optional[str] = None
    ai_profile: Optional[str] = None

class AIDiscoveryResponse(BaseModel):
    matches: List[BuyerMatch]
    total_evaluated: int
    # Pre-filter metrics
    total_before_prefilter: int = 0
    filtered_by_budget: int = 0
    filtered_by_type: int = 0
    sent_to_ai: int = 0


@router.post("/agents/ai-discovery", response_model=AIDiscoveryResponse)
async def ai_discovery(request: AIDiscoveryRequest, current_user: dict = Depends(get_current_user)):
    """
    AI-powered buyer discovery. Takes a property description and returns
    compatible buyers scored by Claude AI.
    """
    from openai import AsyncOpenAI
    
    if current_user["role"] != "agent":
        raise HTTPException(status_code=403, detail="Apenas corretores podem usar esta funcionalidade")
    
    if not request.property_description or len(request.property_description.strip()) < 20:
        raise HTTPException(
            status_code=400, 
            detail="Por favor, descreva o imóvel com mais detalhes (mínimo 20 caracteres)"
        )
    
    # Get API key
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Serviço de IA não configurado")
    
    # Get all active interests
    interests = await db.interests.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    if not interests:
        return AIDiscoveryResponse(matches=[], total_evaluated=0, total_before_prefilter=0)
    
    # Get agent's existing matches to exclude
    existing_matches = await db.matches.find(
        {"agent_id": current_user["user_id"]}, 
        {"interest_id": 1, "_id": 0}
    ).to_list(1000)
    matched_interest_ids = {m["interest_id"] for m in existing_matches}
    
    # Filter out already matched interests
    available_interests = [i for i in interests if i["id"] not in matched_interest_ids]
    
    if not available_interests:
        return AIDiscoveryResponse(matches=[], total_evaluated=0, total_before_prefilter=len(interests))
    
    # ========== PRE-FILTER TO REDUCE AI TOKEN USAGE ==========
    total_before_prefilter = len(available_interests)
    filtered_by_budget = 0
    filtered_by_type = 0
    
    # Property type mapping for comparison
    property_type_groups = {
        'apartamento': ['apartamento', 'studio', 'loft', 'studio/loft', 'flat'],
        'casa': ['casa', 'casa de condomínio', 'casa_condominio', 'sobrado', 'village'],
        'terreno': ['terreno', 'terreno de condomínio', 'terreno_condominio', 'lote'],
        'comercial': ['sala comercial', 'sala_comercial', 'prédio comercial', 'predio_comercial', 'loja', 'galpão']
    }
    
    def get_type_group(prop_type: str) -> str:
        """Return the group a property type belongs to"""
        if not prop_type:
            return None
        prop_type_lower = prop_type.lower().strip()
        for group, types in property_type_groups.items():
            if prop_type_lower in types or any(t in prop_type_lower for t in types):
                return group
        return None
    
    prefiltered_interests = []
    
    for interest in available_interests:
        exclude = False
        
        # BUDGET PRE-FILTER: Exclude if max_price < 75% of property price
        if request.property_price and request.property_price > 0:
            buyer_max_price = interest.get('max_price', 0)
            threshold = request.property_price * 0.75
            if buyer_max_price > 0 and buyer_max_price < threshold:
                filtered_by_budget += 1
                exclude = True
                logger.debug(f"Pre-filter: Excluded interest {interest['id']} - budget {buyer_max_price} < threshold {threshold}")
        
        # TYPE PRE-FILTER: Exclude if property types are incompatible
        if not exclude and request.property_type:
            offered_type_group = get_type_group(request.property_type)
            desired_type = interest.get('property_type') or interest.get('property_type_key')
            desired_type_group = get_type_group(desired_type)
            
            # Only exclude if both types are clearly defined and incompatible
            if offered_type_group and desired_type_group and offered_type_group != desired_type_group:
                filtered_by_type += 1
                exclude = True
                logger.debug(f"Pre-filter: Excluded interest {interest['id']} - type mismatch: {offered_type_group} vs {desired_type_group}")
        
        if not exclude:
            prefiltered_interests.append(interest)
    
    # Log pre-filter results
    sent_to_ai = len(prefiltered_interests)
    logger.info(f"AI Discovery Pre-filter: {total_before_prefilter} available -> {filtered_by_budget} filtered by budget, {filtered_by_type} filtered by type -> {sent_to_ai} sent to AI")
    
    if not prefiltered_interests:
        return AIDiscoveryResponse(
            matches=[], 
            total_evaluated=0,
            total_before_prefilter=total_before_prefilter,
            filtered_by_budget=filtered_by_budget,
            filtered_by_type=filtered_by_type,
            sent_to_ai=0
        )
    
    # ========== END PRE-FILTER ==========
    
    # Enrich with buyer names
    for interest in prefiltered_interests:
        buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
        interest['buyer_name'] = buyer.get("name", "Comprador") if buyer else "Comprador"
    
    # Build buyer profiles for AI
    buyer_profiles = []
    for interest in prefiltered_interests:
        # Map ambiance codes to descriptions
        ambiance_map = {
            'aconchegante': 'Busca ambiente aconchegante com plantas e madeira',
            'amplo_moderno': 'Quer ambiente amplo e moderno com luz natural',
            'minimalista': 'Prefere estilo minimalista e funcional',
            'casa_campo': 'Sonha com tranquilidade tipo casa de campo',
            'alto_padrao': 'Busca sofisticação e alto padrão'
        }
        
        # Map profile types
        profile_map = {
            'primeiro_imovel': 'Comprando primeiro imóvel',
            'sair_aluguel': 'Quer sair do aluguel',
            'melhor_localizacao': 'Busca melhor localização',
            'familia_cresceu': 'Família cresceu, precisa de mais espaço',
            'investidor': 'Investidor'
        }
        
        # Map budget ranges
        budget_map = {
            'ate_400k': 'Até R$ 400 mil',
            '400k_550k': 'R$ 400 a 550 mil',
            '550k_700k': 'R$ 550 a 700 mil',
            '700k_800k': 'R$ 700 a 800 mil',
            '800k_1500k': 'R$ 800 mil a 1,5 milhão',
            'acima_1500k': 'Acima de R$ 1,5 milhão'
        }
        
        profile = {
            "id": interest["id"],
            "buyer_id": interest["buyer_id"],
            "nome": interest.get("buyer_name", "Comprador"),
            "tipo_imovel_desejado": interest.get("property_type", "Não especificado"),
            "localizacao_desejada": interest.get("location", "Não especificada"),
            "orcamento": budget_map.get(interest.get("budget_range", ""), f"R$ {interest.get('min_price', 0):,.0f} - R$ {interest.get('max_price', 0):,.0f}"),
            "quartos_minimos": interest.get("bedrooms"),
            "perfil_comprador": profile_map.get(interest.get("profile_type", ""), interest.get("profile_type", "")),
            "ambiente_ideal": ambiance_map.get(interest.get("ambiance", ""), interest.get("ambiance", "")),
            "caracteristicas_desejaveis": interest.get("features", []),
            "o_que_nao_aceita": interest.get("deal_breakers", []),
            "precisa_proximidade_de": interest.get("proximity_needs", []),
            "perfil_ia": interest.get("ai_profile", "")
        }
        buyer_profiles.append(profile)
    
    # Build prompt for Claude
    profiles_json = json.dumps(buyer_profiles, ensure_ascii=False, indent=2)
    
    prompt = f"""Você é um especialista em mercado imobiliário. Analise a compatibilidade entre um imóvel e vários perfis de compradores.

## IMÓVEL OFERECIDO PELO CORRETOR:
{request.property_description}

## PERFIS DOS COMPRADORES CADASTRADOS:
{profiles_json}

## INSTRUÇÕES DE AVALIAÇÃO:

1. **FILTROS ELIMINATÓRIOS** (campos estruturados):
   - Se o tipo de imóvel é incompatível (ex: comprador quer apartamento, imóvel é casa): score máximo 30
   - Se a localização é claramente incompatível: reduza 20-40 pontos
   - Se o orçamento parece muito abaixo do padrão do imóvel descrito: reduza 30 pontos

2. **DIFERENCIADORES POSITIVOS** (campos qualitativos):
   - Ambiente ideal combina com descrição do imóvel: +15 pontos
   - Características desejáveis presentes no imóvel: +5 pontos cada (máx 20)
   - Nenhum deal breaker presente: +10 pontos
   - Proximidades necessárias atendidas: +10 pontos

3. **JUSTIFICATIVA**:
   - Cite elementos ESPECÍFICOS do perfil do comprador
   - Cite elementos ESPECÍFICOS da descrição do imóvel
   - Explique por que combinam ou não em 2-3 frases

## FORMATO DE RESPOSTA:
Responda APENAS com um JSON válido, sem markdown, no formato:
[
  {{
    "comprador_id": "id do interest",
    "score": 0-100,
    "justificativa": "2-3 frases explicando a compatibilidade"
  }}
]

Inclua TODOS os compradores na resposta, mesmo os com score baixo."""

    try:

        # Build messages list from conversation history
        messages = [{"role": "system", "content": "Você é um especialista em matching imobiliário. Sempre responda em JSON válido."}]
        for msg in conversation.get("messages", []):
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": request.message})

        client = AsyncOpenAI(api_key=api_key)
        completion = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
        )
        response = completion.choices[0].message.content

        # Parse response
        try:
            # Clean response - remove markdown if present
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            clean_response = clean_response.strip()
            
            ai_results = json.loads(clean_response)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI response: {response[:500]}")
            raise HTTPException(
                status_code=500, 
                detail="Erro ao processar resposta da IA. Tente novamente."
            )
        
        # Filter and enrich results
        matches = []
        for result in ai_results:
            if result.get("score", 0) >= 50:
                # Find the original interest data
                interest_data = next(
                    (i for i in prefiltered_interests if i["id"] == result["comprador_id"]), 
                    None
                )
                if interest_data:
                    matches.append(BuyerMatch(
                        comprador_id=result["comprador_id"],
                        buyer_id=interest_data["buyer_id"],
                        buyer_name=interest_data.get("buyer_name", "Comprador"),
                        score=result["score"],
                        justificativa=result["justificativa"],
                        property_type=interest_data.get("property_type", ""),
                        location=interest_data.get("location", ""),
                        budget_range=interest_data.get("budget_range"),
                        ai_profile=interest_data.get("ai_profile")
                    ))
        
        # Sort by score descending
        matches.sort(key=lambda x: x.score, reverse=True)
        
        return AIDiscoveryResponse(
            matches=matches,
            total_evaluated=sent_to_ai,
            total_before_prefilter=total_before_prefilter,
            filtered_by_budget=filtered_by_budget,
            filtered_by_type=filtered_by_type,
            sent_to_ai=sent_to_ai
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI Discovery error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar busca inteligente. Por favor, tente novamente."
        )


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
        property_info=match_data.property_info.model_dump() if match_data.property_info else None,
        ai_compatibility=match_data.ai_compatibility
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
    from openai import AsyncOpenAI
    
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
    
    api_key = os.environ.get('OPENAI_API_KEY')
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

    messages = [{"role": "system", "content": f"""Você é um assistente especializado em conectar corretores com compradores de imóveis.

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

Seja direto e objetivo. Quando tiver informações suficientes, confirme os dados com o corretor."""}]

    for msg in conversation.get('messages', []):
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": request.message})

    client = AsyncOpenAI(api_key=api_key)
    completion = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    )
    response = completion.choices[0].message.content
    
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
