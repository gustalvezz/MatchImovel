from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, role: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: Literal["buyer", "agent", "curator", "admin"]
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user_id: str
    role: str
    name: str

class BuyerInterest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    property_type: str  # apartamento, casa, terreno, comercial
    location: str
    neighborhoods: List[str] = []
    min_price: float
    max_price: float
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spaces: Optional[int] = None
    features: List[str] = []  # piscina, churrasqueira, elevador, etc
    additional_notes: Optional[str] = None
    status: str = "active"  # active, matched, inactive
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BuyerInterestCreate(BaseModel):
    property_type: str
    location: str
    neighborhoods: List[str] = []
    min_price: float
    max_price: float
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spaces: Optional[int] = None
    features: List[str] = []
    additional_notes: Optional[str] = None

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    agent_id: str
    interest_id: str
    status: str = "pending_info"  # pending_info, pending_approval, approved, rejected, visit_scheduled, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatchCreate(BaseModel):
    buyer_id: str
    interest_id: str

class BotMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BotConversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str
    messages: List[BotMessage] = []
    property_info: Optional[dict] = None
    status: str = "active"  # active, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SendMessageRequest(BaseModel):
    message: str

class CurationDecision(BaseModel):
    approved: bool
    notes: Optional[str] = None

class CreateCuratorRequest(BaseModel):
    email: EmailStr
    name: str
    phone: str

class CompleteCuratorRegistration(BaseModel):
    token: str
    password: str

class FollowUpCreate(BaseModel):
    content: str
    contact_type: str  # "corretor" ou "comprador"

class FollowUp(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str
    curator_id: str
    content: str
    contact_type: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeleteReason(BaseModel):
    reason: str  # já_comprei, imovel_vendido, mudei_planos, outro
    other_reason: Optional[str] = None

class BuyerInterestUpdate(BaseModel):
    property_type: Optional[str] = None
    location: Optional[str] = None
    neighborhoods: Optional[List[str]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spaces: Optional[int] = None
    features: Optional[List[str]] = None
    additional_notes: Optional[str] = None

class BuyerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AgentProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    creci: Optional[str] = None
    company: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# AUTH ENDPOINTS
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserRegister):
    # Check if user exists
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
    
    # Create profile based on role
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
            "creci": None,
            "company": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.agents.insert_one(profile_doc)
    
    token = create_access_token(user_id, user_data.role)
    return AuthResponse(token=token, user_id=user_id, role=user_data.role, name=user_data.name)

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = create_access_token(user["id"], user["role"])
    return AuthResponse(token=token, user_id=user["id"], role=user["role"], name=user["name"])

# BUYER ENDPOINTS
@api_router.post("/buyers/interests", response_model=BuyerInterest)
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

@api_router.get("/buyers/my-interests", response_model=List[BuyerInterest])
async def get_my_interests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    interests = await db.interests.find({"buyer_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    
    for interest in interests:
        if isinstance(interest.get('created_at'), str):
            interest['created_at'] = datetime.fromisoformat(interest['created_at'])
    
    return interests

@api_router.put("/buyers/interests/{interest_id}")
async def update_interest(interest_id: str, update_data: BuyerInterestUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Apenas compradores podem editar interesses")
    
    # Check if interest exists and belongs to user
    interest = await db.interests.find_one({"id": interest_id, "buyer_id": current_user["user_id"]}, {"_id": 0})
    if not interest:
        raise HTTPException(status_code=404, detail="Interesse não encontrado")
    
    # Build update dict with only provided fields
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.interests.update_one(
            {"id": interest_id},
            {"$set": update_dict}
        )
    
    return {"status": "success", "message": "Interesse atualizado com sucesso"}

@api_router.delete("/buyers/interests/{interest_id}")
async def delete_interest(interest_id: str, reason_data: DeleteReason, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Apenas compradores podem excluir interesses")
    
    # Check if interest exists and belongs to user
    interest = await db.interests.find_one({"id": interest_id, "buyer_id": current_user["user_id"]}, {"_id": 0})
    if not interest:
        raise HTTPException(status_code=404, detail="Interesse não encontrado")
    
    # Store deletion record
    deletion_record = {
        "id": str(uuid.uuid4()),
        "interest_id": interest_id,
        "buyer_id": current_user["user_id"],
        "reason": reason_data.reason,
        "other_reason": reason_data.other_reason,
        "deleted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.interest_deletions.insert_one(deletion_record)
    
    # Delete interest
    await db.interests.delete_one({"id": interest_id})
    
    return {"status": "success", "message": "Interesse excluído com sucesso"}

@api_router.get("/buyers/my-matches")
async def get_my_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    matches = await db.matches.find({"buyer_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Enrich with interest and agent data
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

# AGENT ENDPOINTS
@api_router.get("/agents/buyers")
async def search_buyers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["agent", "curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get all active interests with buyer info
    interests = await db.interests.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    for interest in interests:
        if isinstance(interest.get('created_at'), str):
            interest['created_at'] = datetime.fromisoformat(interest['created_at'])
        
        buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
        if buyer:
            interest['buyer_name'] = buyer.get("name")
    
    return interests

@api_router.post("/agents/match", response_model=Match)
async def create_match(match_data: MatchCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "agent":
        raise HTTPException(status_code=403, detail="Apenas corretores podem criar matches")
    
    # Check if interest exists
    interest = await db.interests.find_one({"id": match_data.interest_id}, {"_id": 0})
    if not interest:
        raise HTTPException(status_code=404, detail="Interesse não encontrado")
    
    # Check if match already exists
    existing_match = await db.matches.find_one({
        "agent_id": current_user["user_id"],
        "interest_id": match_data.interest_id
    }, {"_id": 0})
    
    if existing_match:
        raise HTTPException(status_code=400, detail="Você já deu match neste comprador")
    
    # Match starts with pending_approval status (needs curator approval)
    match = Match(
        buyer_id=match_data.buyer_id,
        agent_id=current_user["user_id"],
        interest_id=match_data.interest_id,
        status="pending_approval"
    )
    
    doc = match.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.matches.insert_one(doc)
    
    # Create bot conversation
    conversation = BotConversation(match_id=match.id)
    conv_doc = conversation.model_dump()
    conv_doc['created_at'] = conv_doc['created_at'].isoformat()
    for msg in conv_doc['messages']:
        msg['timestamp'] = msg['timestamp'].isoformat()
    await db.bot_conversations.insert_one(conv_doc)
    
    return match

@api_router.delete("/agents/match/{match_id}")
async def delete_match(match_id: str, reason_data: DeleteReason, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "agent":
        raise HTTPException(status_code=403, detail="Apenas corretores podem excluir matches")
    
    # Check if match exists and belongs to user
    match = await db.matches.find_one({"id": match_id, "agent_id": current_user["user_id"]}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    # Store deletion record
    deletion_record = {
        "id": str(uuid.uuid4()),
        "match_id": match_id,
        "agent_id": current_user["user_id"],
        "reason": reason_data.reason,
        "other_reason": reason_data.other_reason,
        "deleted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.match_deletions.insert_one(deletion_record)
    
    # Delete match and related conversation
    await db.matches.delete_one({"id": match_id})
    await db.bot_conversations.delete_one({"match_id": match_id})
    
    return {"status": "success", "message": "Match excluído com sucesso"}

@api_router.get("/agents/my-matches")
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

# BOT ENDPOINTS
@api_router.post("/bot/conversation/{match_id}")
async def send_bot_message(match_id: str, request: SendMessageRequest, current_user: dict = Depends(get_current_user)):
    # Get match and verify agent owns it
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    if match["agent_id"] != current_user["user_id"] and current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get or create conversation
    conversation = await db.bot_conversations.find_one({"match_id": match_id}, {"_id": 0})
    if not conversation:
        conversation = {
            "id": str(uuid.uuid4()),
            "match_id": match_id,
            "messages": [],
            "property_info": None,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.bot_conversations.insert_one(conversation)
    
    # Add user message
    user_message = {
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Get interest details for context
    interest = await db.interests.find_one({"id": match["interest_id"]}, {"_id": 0})
    
    # Initialize LLM chat
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    system_message = f"""Você é um assistente especializado em coletar informações sobre imóveis.
O comprador está interessado em: {interest.get('property_type')} em {interest.get('location')}
Orçamento: R$ {interest.get('min_price'):,.2f} - R$ {interest.get('max_price'):,.2f}

Sua função é coletar as seguintes informações do corretor sobre o imóvel:
1. Endereço completo
2. Tipo do imóvel
3. Área total e área construída
4. Número de quartos, banheiros e vagas
5. Valor do imóvel
6. Características especiais (piscina, churrasqueira, etc)
7. Estado de conservação
8. Disponibilidade para visita

Seja educado, objetivo e faça uma pergunta de cada vez. Quando tiver todas as informações, confirme os dados."""
    
    chat = LlmChat(
        api_key=api_key,
        session_id=match_id,
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    # Send message to LLM
    user_msg = UserMessage(text=request.message)
    response = await chat.send_message(user_msg)
    
    # Add assistant message
    assistant_message = {
        "role": "assistant",
        "content": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Update conversation
    await db.bot_conversations.update_one(
        {"match_id": match_id},
        {"$push": {"messages": {"$each": [user_message, assistant_message]}}}
    )
    
    return {"response": response}

@api_router.get("/bot/conversation/{match_id}")
async def get_bot_conversation(match_id: str, current_user: dict = Depends(get_current_user)):
    # Get match and verify access
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    if match["agent_id"] != current_user["user_id"] and match["buyer_id"] != current_user["user_id"] and current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    conversation = await db.bot_conversations.find_one({"match_id": match_id}, {"_id": 0})
    if not conversation:
        return {"messages": []}
    
    return conversation

# CURATOR ENDPOINTS
@api_router.get("/curator/pending-matches")
async def get_pending_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    matches = await db.matches.find({"status": "pending_approval"}, {"_id": 0}).to_list(100)
    
    for match in matches:
        if isinstance(match.get('created_at'), str):
            match['created_at'] = datetime.fromisoformat(match['created_at'])
        if isinstance(match.get('updated_at'), str):
            match['updated_at'] = datetime.fromisoformat(match['updated_at'])
        
        interest = await db.interests.find_one({"id": match["interest_id"]}, {"_id": 0})
        match['interest'] = interest
        
        buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        
        if buyer:
            match['buyer'] = buyer
        if agent:
            match['agent'] = agent
        
        conversation = await db.bot_conversations.find_one({"match_id": match["id"]}, {"_id": 0})
        match['conversation'] = conversation
    
    return matches

@api_router.post("/curator/curate/{match_id}")
async def curate_match(match_id: str, decision: CurationDecision, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    new_status = "approved" if decision.approved else "rejected"
    
    # Store curator_id who approved/rejected
    await db.matches.update_one(
        {"id": match_id},
        {"$set": {
            "status": new_status,
            "curator_id": current_user["user_id"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create curation record
    curation_doc = {
        "id": str(uuid.uuid4()),
        "match_id": match_id,
        "curator_id": current_user["user_id"],
        "approved": decision.approved,
        "notes": decision.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.curations.insert_one(curation_doc)
    
    return {"status": "success", "new_status": new_status}

# ADMIN ENDPOINTS
@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    total_buyers = await db.buyers.count_documents({})
    total_agents = await db.agents.count_documents({})
    total_interests = await db.interests.count_documents({})
    total_matches = await db.matches.count_documents({})
    pending_matches = await db.matches.count_documents({"status": "pending_approval"})
    approved_matches = await db.matches.count_documents({"status": "approved"})
    
    return {
        "total_buyers": total_buyers,
        "total_agents": total_agents,
        "total_interests": total_interests,
        "total_matches": total_matches,
        "pending_matches": pending_matches,
        "approved_matches": approved_matches
    }

@api_router.get("/admin/buyers")
async def get_all_buyers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    buyers = await db.buyers.find({}, {"_id": 0}).to_list(1000)
    
    for buyer in buyers:
        # Get user info
        user = await db.users.find_one({"id": buyer["user_id"]}, {"_id": 0, "password": 0})
        buyer['user_info'] = user
        
        # Count interests
        interest_count = await db.interests.count_documents({"buyer_id": buyer["user_id"]})
        buyer['interest_count'] = interest_count
        
        # Count matches
        match_count = await db.matches.count_documents({"buyer_id": buyer["user_id"]})
        buyer['match_count'] = match_count
    
    return buyers

@api_router.get("/admin/agents")
async def get_all_agents(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    agents = await db.agents.find({}, {"_id": 0}).to_list(1000)
    
    for agent in agents:
        # Get user info
        user = await db.users.find_one({"id": agent["user_id"]}, {"_id": 0, "password": 0})
        agent['user_info'] = user
        
        # Count matches
        match_count = await db.matches.count_documents({"agent_id": agent["user_id"]})
        agent['match_count'] = match_count
    
    return agents

@api_router.get("/admin/interests")
async def get_all_interests(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    interests = await db.interests.find({}, {"_id": 0}).to_list(1000)
    
    for interest in interests:
        if isinstance(interest.get('created_at'), str):
            interest['created_at'] = datetime.fromisoformat(interest['created_at'])
        
        buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
        if buyer:
            interest['buyer_name'] = buyer.get("name")
            interest['buyer_email'] = buyer.get("email")
    
    return interests

@api_router.get("/admin/matches")
async def get_all_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "curator"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Admin sees all, curator only sees their approved matches
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
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        
        if buyer:
            match['buyer'] = buyer
        if agent:
            match['agent'] = agent
        
        # Get curator name if exists
        if match.get('curator_id'):
            curator = await db.users.find_one({"id": match['curator_id']}, {"_id": 0})
            if curator:
                match['curator_name'] = curator.get('name')
    
    return matches

# CURATOR MANAGEMENT (Admin only)
@api_router.post("/admin/create-curator")
async def create_curator(curator_data: CreateCuratorRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar curadores")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": curator_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Generate registration token
    registration_token = secrets.token_urlsafe(32)
    
    # Create pending curator
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
    
    # Get frontend URL from environment - REQUIRED for production
    frontend_url = os.environ.get('FRONTEND_URL')
    if not frontend_url:
        raise HTTPException(status_code=500, detail="FRONTEND_URL não configurado no servidor")
    registration_link = f"{frontend_url}/complete-registration?token={registration_token}"
    
    return {
        "status": "success",
        "message": "Curador criado. Link de registro enviado por email.",
        "registration_link": registration_link  # Remove this in production
    }

@api_router.post("/auth/complete-curator-registration")
async def complete_curator_registration(registration_data: CompleteCuratorRegistration):
    # Find pending curator
    pending = await db.pending_curators.find_one({"registration_token": registration_data.token}, {"_id": 0})
    if not pending:
        raise HTTPException(status_code=404, detail="Token inválido ou expirado")
    
    # Check if token expired
    if datetime.fromisoformat(pending["token_expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expirado")
    
    if pending["status"] != "pending":
        raise HTTPException(status_code=400, detail="Registro já completado")
    
    # Create user
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
    
    # Update pending curator status
    await db.pending_curators.update_one(
        {"id": pending["id"]},
        {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Create token for immediate login
    token = create_access_token(pending["id"], "curator")
    
    return {
        "status": "success",
        "message": "Cadastro completado com sucesso!",
        "token": token,
        "user_id": pending["id"],
        "role": "curator",
        "name": pending["name"]
    }

# FOLLOW-UP SYSTEM (CRM)
@api_router.post("/matches/{match_id}/followup")
async def create_followup(match_id: str, followup_data: FollowUpCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Check if match exists
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    # Check if user has access to this match
    if current_user["role"] == "curator" and match.get("curator_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este match")
    
    followup = FollowUp(
        match_id=match_id,
        curator_id=current_user["user_id"],
        content=followup_data.content,
        contact_type=followup_data.contact_type
    )
    
    doc = followup.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.followups.insert_one(doc)
    
    return {"status": "success", "followup_id": followup.id}

@api_router.get("/matches/{match_id}/followups")
async def get_followups(match_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Check if match exists and user has access
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    if current_user["role"] == "curator" and match.get("curator_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este match")
    
    # Get followups
    if current_user["role"] == "admin":
        # Admin sees all followups for this match
        followups = await db.followups.find({"match_id": match_id}, {"_id": 0}).to_list(100)
    else:
        # Curator only sees their own followups
        followups = await db.followups.find(
            {"match_id": match_id, "curator_id": current_user["user_id"]},
            {"_id": 0}
        ).to_list(100)
    
    for followup in followups:
        if isinstance(followup.get('created_at'), str):
            followup['created_at'] = datetime.fromisoformat(followup['created_at'])
        
        # Get curator name
        curator = await db.users.find_one({"id": followup["curator_id"]}, {"_id": 0})
        if curator:
            followup['curator_name'] = curator.get('name')
    
    return followups

@api_router.get("/admin/curators")
async def get_all_curators(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    curators = await db.users.find({"role": "curator"}, {"_id": 0, "password": 0}).to_list(100)
    
    for curator in curators:
        # Count matches curated
        match_count = await db.matches.count_documents({"curator_id": curator["id"]})
        curator['curated_matches'] = match_count
    
    return curators

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
