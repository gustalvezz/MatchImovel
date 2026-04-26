"""
Pydantic schema definitions for all models
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid


# ============ AUTH MODELS ============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: Literal["buyer", "agent", "curator", "admin"]
    name: str
    phone: Optional[str] = None
    creci: Optional[str] = None
    creci_uf: Optional[str] = None
    # Terms acceptance for agents
    terms_accepted: Optional[bool] = None
    terms_accepted_at: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user_id: str
    role: str
    name: str

class CreateCuratorRequest(BaseModel):
    email: EmailStr
    name: str
    phone: str

class CompleteCuratorRegistration(BaseModel):
    token: str
    password: str


# ============ CRECI MODELS ============

class CreciValidationRequest(BaseModel):
    creci: str
    uf: str

class CreciValidationResponse(BaseModel):
    valid: bool
    creci_completo: Optional[str] = None
    nome_completo: Optional[str] = None
    situacao: Optional[str] = None
    error: Optional[str] = None


# ============ BUYER MODELS ============

class AIInterpretation(BaseModel):
    """AI-generated interpretation of buyer profile"""
    model_config = ConfigDict(extra="ignore")
    perfil_narrativo: Optional[str] = None
    criterios_inegociaveis: List[str] = []
    perfil_do_imovel_ideal: Optional[str] = None
    alertas: List[str] = []


class BuyerInterest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    property_type: str
    location: str
    neighborhoods: List[str] = []
    min_price: float = 0
    max_price: float = 0
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spaces: Optional[int] = None
    features: List[str] = []
    additional_notes: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    profile_type: Optional[str] = None
    urgency: Optional[str] = None
    budget_range: Optional[str] = None
    ambiance: Optional[str] = None
    deal_breakers: List[str] = []
    proximity_needs: List[str] = []
    personal_style: Optional[str] = None
    experience_fears: Optional[str] = None
    ai_profile: Optional[str] = None
    form_version: Optional[str] = None
    interpretacaoIA: Optional[AIInterpretation] = None

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

class FullInterestCreate(BaseModel):
    """Comprehensive interest form"""
    profile_type: str
    urgency: str
    location: str
    budget_range: str
    property_type: Optional[str] = None
    indispensable: List[str] = []
    indispensable_other: Optional[str] = None
    ambiance: str
    deal_breakers: List[str] = []
    proximity_needs: List[str] = []
    experience_fears: Optional[str] = None
    name: str
    phone: str
    email: Optional[str] = None
    # Terms of Use acceptance
    terms_accepted: bool = False
    terms_accepted_at: Optional[str] = None

class BuyerProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeleteReason(BaseModel):
    reason: str
    other_reason: Optional[str] = None


# ============ AGENT MODELS ============

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


# ============ MATCH MODELS ============

class PropertyInfo(BaseModel):
    """Property information when creating a match"""
    description: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_m2: Optional[float] = None
    address: Optional[str] = None
    price: Optional[float] = None
    link: Optional[str] = None

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    agent_id: str
    interest_id: str
    status: str = "pending_info"
    property_info: Optional[dict] = None
    ai_compatibility: Optional[dict] = None  # {score: int, justificativa: str, property_description: str}
    sold_through_platform: bool = False  # Only curator can set this
    sold_at: Optional[datetime] = None  # Automatically set when sold_through_platform is True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatchCreate(BaseModel):
    buyer_id: str
    interest_id: str

class MatchCreateWithProperty(BaseModel):
    buyer_id: str
    interest_id: str
    property_info: PropertyInfo
    ai_compatibility: Optional[dict] = None  # {score: int, justificativa: str, property_description: str}


# ============ VISIT MODELS ============

class Visit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str
    scheduled_by: str
    visit_date: str
    visit_time: str
    notes: Optional[str] = None
    status: str = "scheduled"
    reminder_sent: bool = False
    reminder_2h_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScheduleVisitRequest(BaseModel):
    visit_date: str
    visit_time: str
    notes: Optional[str] = None


# ============ BOT MODELS ============

class BotMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BotConversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str
    messages: List[BotMessage] = []
    property_info: Optional[dict] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SendMessageRequest(BaseModel):
    message: str


# ============ CURATOR MODELS ============

class CurationDecision(BaseModel):
    approved: bool
    notes: Optional[str] = None

class FollowUpCreate(BaseModel):
    content: str
    contact_type: str

class FollowUp(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str
    curator_id: str
    content: str
    contact_type: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))



# ============ AGENT SEARCHES MODELS ============

class AgentSearchCreate(BaseModel):
    """Created automatically when agent uses ai-discovery"""
    property_type: str
    property_price: float
    property_description: str

class AgentSearchDeactivate(BaseModel):
    """Request to deactivate a saved search"""
    deactivation_reason: str

class AgentSearchResponse(BaseModel):
    """Response model for saved searches"""
    id: str
    agent_id: str
    property_type: str
    property_price: float
    property_description: str
    status: str  # "active" | "inactive"
    last_checked_at: Optional[str] = None
    created_at: str
    deactivation_reason: Optional[str] = None
    deactivated_at: Optional[str] = None
    days_until_auto_deactivation: Optional[int] = None
