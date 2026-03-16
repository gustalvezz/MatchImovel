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
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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

# SMTP Configuration
SMTP_HOST = os.environ.get('SMTP_HOST')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL')
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'MatchImovel')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Email sending function
async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via SMTP"""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        logger.warning("SMTP not configured, skipping email send")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

# ============ EMAIL NOTIFICATION FUNCTIONS ============

async def send_interest_registered_email(buyer_email: str, buyer_name: str, interest_data: dict) -> bool:
    """Send email to buyer when interest is registered"""
    
    property_type_labels = {
        'apartamento': 'Apartamento',
        'casa': 'Casa',
        'casa_condominio': 'Casa de condomínio',
        'terreno': 'Terreno',
        'terreno_condominio': 'Terreno de condomínio',
        'sala_comercial': 'Sala comercial',
        'predio_comercial': 'Prédio comercial',
        'studio_loft': 'Studio/Loft'
    }
    
    budget_labels = {
        'ate_400k': 'Até R$ 400 mil',
        '400k_550k': 'R$ 400 a 550 mil',
        '550k_700k': 'R$ 550 a 700 mil',
        '700k_800k': 'R$ 700 a 800 mil',
        '800k_1500k': 'R$ 800 mil a 1,5 milhão',
        'acima_1500k': 'Acima de R$ 1,5 milhão'
    }
    
    property_type = interest_data.get('property_type', 'Imóvel')
    if property_type in property_type_labels:
        property_type = property_type_labels[property_type]
    
    budget = budget_labels.get(interest_data.get('budget_range', ''), 'A definir')
    location = interest_data.get('location', 'A definir')
    
    subject = "Seu interesse foi cadastrado com sucesso! - MatchImovel"
    
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
            .header p {{ color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .info-card {{ background: #f0f4ff; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #6366f1; }}
            .info-card h3 {{ margin: 0 0 16px 0; color: #4f46e5; font-size: 18px; }}
            .info-row {{ display: flex; margin: 8px 0; }}
            .info-label {{ font-weight: 600; color: #64748b; min-width: 120px; }}
            .info-value {{ color: #1e293b; }}
            .next-steps {{ background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; }}
            .next-steps h3 {{ margin: 0 0 16px 0; color: #92400e; font-size: 18px; }}
            .next-steps ul {{ margin: 0; padding-left: 20px; color: #78350f; }}
            .next-steps li {{ margin: 8px 0; }}
            .highlight {{ background: #e0e7ff; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center; }}
            .highlight p {{ margin: 0; color: #4338ca; font-weight: 500; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
            .emoji {{ font-size: 24px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MatchImovel</h1>
                <p>Seu interesse foi cadastrado com sucesso!</p>
            </div>
            <div class="content">
                <p class="greeting">Olá, {buyer_name}! <span class="emoji">👋</span></p>
                
                <p>Parabéns! Seu interesse de compra foi registrado em nossa plataforma. Agora nossa equipe de especialistas vai trabalhar para encontrar o imóvel ideal para você.</p>
                
                <div class="info-card">
                    <h3>📋 Resumo do seu interesse</h3>
                    <div class="info-row">
                        <span class="info-label">Tipo de imóvel:</span>
                        <span class="info-value">{property_type}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Localização:</span>
                        <span class="info-value">{location}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Investimento:</span>
                        <span class="info-value">{budget}</span>
                    </div>
                </div>
                
                <div class="next-steps">
                    <h3>📞 Próximos passos</h3>
                    <ul>
                        <li><strong>Um curador especialista da equipe MatchImovel entrará em contato pelo telefone cadastrado</strong> para confirmar e detalhar ainda mais seu perfil.</li>
                        <li>Esse contato é muito importante para que possamos <strong>filtrar as ofertas</strong> e enviar apenas opções que realmente façam sentido para você.</li>
                        <li>O curador é um <strong>corretor habilitado</strong> que irá acompanhá-lo em todo o processo de compra, desde a busca até a assinatura do contrato.</li>
                    </ul>
                </div>
                
                <div class="highlight">
                    <p><span class="emoji">🎯</span> Nosso objetivo é conectar você ao imóvel perfeito, sem perda de tempo com opções que não fazem sentido!</p>
                </div>
                
                <p>Enquanto isso, fique tranquilo! Corretores parceiros já podem visualizar seu perfil e enviar ofertas compatíveis com o que você busca.</p>
                
                <p>Qualquer dúvida, estamos à disposição!</p>
                
                <p>Abraços,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
                <p>Este é um email automático, por favor não responda.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(buyer_email, subject, html_content)


async def send_match_approved_buyer_email(buyer_email: str, buyer_name: str) -> bool:
    """Send email to buyer when a match is approved"""
    
    subject = "Wohoo! Um novo match foi encontrado! - MatchImovel"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 32px; }}
            .celebration {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; text-align: center; }}
            .greeting {{ font-size: 22px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .message-box {{ background: linear-gradient(135deg, #ecfdf5, #d1fae5); padding: 30px; border-radius: 16px; margin: 24px 0; }}
            .message-box p {{ margin: 0; font-size: 18px; color: #065f46; }}
            .whatsapp-info {{ background: #dcfce7; padding: 20px; border-radius: 12px; margin: 24px 0; border: 2px solid #22c55e; }}
            .whatsapp-info p {{ margin: 0; color: #166534; font-weight: 500; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="celebration">🎉</div>
                <h1>Wohoo!</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {buyer_name}!</p>
                
                <div class="message-box">
                    <p><strong>Um novo match foi encontrado para você!</strong></p>
                    <p style="margin-top: 16px;">Um corretor parceiro encontrou um imóvel que pode ser perfeito para o que você procura! 🏠</p>
                </div>
                
                <div class="whatsapp-info">
                    <p>📱 <strong>Seu curador irá enviar mais detalhes do imóvel via WhatsApp em breve!</strong></p>
                </div>
                
                <p>Fique de olho no seu celular e prepare-se para conhecer essa oportunidade!</p>
                
                <p style="margin-top: 30px;">Abraços,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(buyer_email, subject, html_content)


async def send_match_approved_agent_email(agent_email: str, agent_name: str, buyer_name: str) -> bool:
    """Send email to agent when their match is approved"""
    
    subject = "Seu match foi aprovado! - MatchImovel"
    
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
            .checkmark {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .success-box {{ background: #f0fdf4; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #22c55e; }}
            .success-box p {{ margin: 0; color: #166534; }}
            .info-box {{ background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0; }}
            .info-box p {{ margin: 0; color: #1e40af; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="checkmark">✅</div>
                <h1>Match Aprovado!</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {agent_name}!</p>
                
                <div class="success-box">
                    <p><strong>Ótima notícia!</strong> Seu match com <strong>{buyer_name}</strong> foi aprovado pela nossa equipe de curadoria!</p>
                </div>
                
                <div class="info-box">
                    <p>📋 <strong>Próximos passos:</strong></p>
                    <p style="margin-top: 12px;">Aguarde o contato da equipe MatchImovel. Nosso curador irá intermediar a comunicação entre você e o comprador para agendar uma visita ao imóvel.</p>
                </div>
                
                <p>Obrigado por fazer parte da nossa rede de corretores parceiros!</p>
                
                <p style="margin-top: 30px;">Abraços,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(agent_email, subject, html_content)


async def send_deletion_notification_curator(
    curator_email: str, 
    curator_name: str, 
    deletion_type: str,  # 'interest' or 'match'
    deleted_by_name: str,
    deleted_by_email: str,
    deleted_by_phone: str,
    reason: str,
    description: str
) -> bool:
    """Send email to curator when an interest or match is deleted"""
    
    reason_labels = {
        'ja_comprei': 'Já comprei um imóvel',
        'mudei_planos': 'Mudei de planos',
        'nao_interessado': 'Não tenho mais interesse',
        'imovel_vendido': 'Imóvel já vendeu',
        'proprietario_desistiu': 'Proprietário desistiu da venda',
        'outro': 'Outro motivo'
    }
    
    reason_text = reason_labels.get(reason, reason)
    
    if deletion_type == 'interest':
        subject = "⚠️ Interesse excluído por comprador - MatchImovel"
        title = "Um comprador excluiu seu interesse"
        person_type = "Comprador"
    else:
        subject = "⚠️ Match excluído por corretor - MatchImovel"
        title = "Um corretor excluiu um match"
        person_type = "Corretor"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0; }}
            .header h1 {{ color: white; margin: 0; font-size: 24px; }}
            .warning {{ font-size: 48px; margin-bottom: 10px; }}
            .content {{ background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; }}
            .greeting {{ font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }}
            .info-card {{ background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b; }}
            .info-card h3 {{ margin: 0 0 16px 0; color: #92400e; font-size: 16px; }}
            .info-row {{ margin: 8px 0; }}
            .info-label {{ font-weight: 600; color: #78350f; }}
            .info-value {{ color: #451a03; }}
            .reason-box {{ background: #fee2e2; padding: 20px; border-radius: 12px; margin: 24px 0; }}
            .reason-box h4 {{ margin: 0 0 12px 0; color: #991b1b; }}
            .reason-box p {{ margin: 0; color: #7f1d1d; }}
            .footer {{ text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="warning">⚠️</div>
                <h1>{title}</h1>
            </div>
            <div class="content">
                <p class="greeting">Olá, {curator_name}!</p>
                
                <p>Informamos que um {deletion_type} vinculado a você foi excluído. Veja os detalhes abaixo:</p>
                
                <div class="info-card">
                    <h3>👤 Dados do {person_type}</h3>
                    <div class="info-row">
                        <span class="info-label">Nome:</span>
                        <span class="info-value">{deleted_by_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">{deleted_by_email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Telefone:</span>
                        <span class="info-value">{deleted_by_phone or 'Não informado'}</span>
                    </div>
                </div>
                
                <div class="reason-box">
                    <h4>📝 Motivo da exclusão</h4>
                    <p><strong>{reason_text}</strong></p>
                    {f'<p style="margin-top: 12px;">{description}</p>' if description else ''}
                </div>
                
                <p>Se necessário, entre em contato com a pessoa para entender melhor a situação.</p>
                
                <p style="margin-top: 30px;">Atenciosamente,<br><strong>Equipe MatchImovel</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(curator_email, subject, html_content)

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
    min_price: float = 0
    max_price: float = 0
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spaces: Optional[int] = None
    features: List[str] = []  # piscina, churrasqueira, elevador, etc
    additional_notes: Optional[str] = None
    status: str = "active"  # active, matched, inactive
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # New fields from comprehensive form
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
    """New comprehensive interest form"""
    profile_type: str  # primeiro_imovel, sair_aluguel, melhor_localizacao, familia_cresceu, investidor
    urgency: str  # 3_meses, 12_meses, sem_prazo
    location: str  # Free text - city and neighborhoods
    budget_range: str  # ate_400k, 400k_550k, 550k_700k, 700k_800k, 800k_1500k, acima_1500k
    property_type: Optional[str] = None  # apartamento, casa, casa_condominio, terreno, etc.
    indispensable: List[str] = []  # Multiple selection
    indispensable_other: Optional[str] = None
    ambiance: str  # aconchegante, amplo_moderno, minimalista, casa_campo, alto_padrao
    deal_breakers: List[str] = []  # 1-3 selections
    proximity_needs: List[str] = []  # 1-3 selections
    experience_fears: Optional[str] = None
    name: str
    phone: str
    email: Optional[str] = None

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str
    agent_id: str
    interest_id: str
    status: str = "pending_info"  # pending_info, pending_approval, approved, rejected, visit_scheduled, completed
    property_info: Optional[dict] = None  # Property details from agent
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

class PropertyInfo(BaseModel):
    """Property information when creating a match"""
    description: str  # Required
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_m2: Optional[float] = None
    address: Optional[str] = None
    price: Optional[float] = None
    link: Optional[str] = None  # Optional link to listing

class MatchCreateWithProperty(BaseModel):
    buyer_id: str
    interest_id: str
    property_info: PropertyInfo

class ScheduleVisitRequest(BaseModel):
    visit_date: str  # ISO format date
    visit_time: str  # HH:MM format
    notes: Optional[str] = None

class Visit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str
    scheduled_by: str  # curator_id
    visit_date: str
    visit_time: str
    notes: Optional[str] = None
    status: str = "scheduled"  # scheduled, completed, cancelled
    reminder_sent: bool = False
    reminder_2h_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    
    # Get buyer info for notification
    buyer = await db.buyers.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    buyer_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    
    # Find matches related to this interest and notify curators
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

# PUBLIC ENDPOINT - Create interest from form (no auth required)
async def generate_ai_profile(form_data: dict) -> str:
    """Generate a buyer profile using AI based on form responses"""
    try:
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
        
        # Build context
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
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return f"{profile_base.upper()} - Perfil em análise"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"profile-{uuid.uuid4()}",
            system_message="Você é um especialista em criar perfis curtos de compradores de imóveis."
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Clean response
        profile = response.strip().strip('"').strip("'")
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

@api_router.post("/interests/create-full")
async def create_full_interest(form_data: FullInterestCreate):
    """Create interest from the full multi-step form (public endpoint)"""
    
    # Check if user already exists with this email or phone
    existing_user = None
    if form_data.email:
        existing_user = await db.users.find_one({"email": form_data.email}, {"_id": 0})
    if not existing_user:
        existing_user = await db.buyers.find_one({"phone": form_data.phone}, {"_id": 0})
    
    # Create or get user
    if existing_user:
        user_id = existing_user.get('id') or existing_user.get('user_id')
    else:
        # Create new buyer user (without password - they can set it later)
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
        
        # Create buyer profile
        buyer_profile = {
            "user_id": user_id,
            "name": form_data.name,
            "email": form_data.email,
            "phone": form_data.phone,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.buyers.insert_one(buyer_profile)
    
    # Convert budget_range to price values
    budget_map = {
        'ate_400k': (0, 400000),
        '400k_550k': (400000, 550000),
        '550k_700k': (550000, 700000),
        '700k_800k': (700000, 800000),
        '800k_1500k': (800000, 1500000),
        'acima_1500k': (1500000, 10000000)
    }
    min_price, max_price = budget_map.get(form_data.budget_range, (0, 1000000))
    
    # Use property_type directly from form (new field)
    property_type = form_data.property_type if hasattr(form_data, 'property_type') and form_data.property_type else 'casa'
    
    # Map property_type values to display labels
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
    bedrooms = None
    if 'Pelo menos 3 quartos' in form_data.indispensable:
        bedrooms = 3
    elif 'Pelo menos 2 quartos' in form_data.indispensable:
        bedrooms = 2
    
    # Generate AI profile
    ai_profile = await generate_ai_profile(form_data.model_dump())
    
    # Create the interest record
    interest_id = str(uuid.uuid4())
    interest = {
        "id": interest_id,
        "buyer_id": user_id,
        "property_type": property_type_display,  # Display label
        "property_type_key": property_type,  # Original key for filtering
        "location": form_data.location,
        "neighborhoods": [],  # Will be extracted by AI search later
        "min_price": min_price,
        "max_price": max_price,
        "bedrooms": bedrooms,
        "features": form_data.indispensable,
        "additional_notes": form_data.indispensable_other,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        # New fields from comprehensive form
        "profile_type": form_data.profile_type,
        "urgency": form_data.urgency,
        "budget_range": form_data.budget_range,
        "ambiance": form_data.ambiance,
        "deal_breakers": form_data.deal_breakers,
        "proximity_needs": form_data.proximity_needs,
        "experience_fears": form_data.experience_fears,
        "ai_profile": ai_profile,  # AI-generated profile for brokers
        "form_version": "v3"  # Updated form version
    }
    
    await db.interests.insert_one(interest)
    
    # Send email notification to buyer
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

@api_router.get("/agents/smart-search")
async def smart_search_buyers(
    query: str = "",
    current_user: dict = Depends(get_current_user)
):
    """Smart search for buyers using AI to match location queries"""
    if current_user["role"] not in ["agent", "curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get all active interests
    interests = await db.interests.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    if not query:
        # Return all if no query
        for interest in interests:
            if isinstance(interest.get('created_at'), str):
                interest['created_at'] = datetime.fromisoformat(interest['created_at'])
            buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
            if buyer:
                interest['buyer_name'] = buyer.get("name")
        return interests
    
    # Normalize query for comparison
    query_lower = query.lower().strip()
    query_words = set(query_lower.replace(',', ' ').replace('-', ' ').split())
    
    results = []
    for interest in interests:
        location = interest.get('location', '').lower()
        location_words = set(location.replace(',', ' ').replace('-', ' ').split())
        
        # Calculate match score
        score = 0
        
        # Direct substring match (highest score)
        if query_lower in location:
            score += 100
        
        # Word intersection
        common_words = query_words & location_words
        score += len(common_words) * 30
        
        # Partial word matching (for typos/variations)
        for qw in query_words:
            for lw in location_words:
                if len(qw) > 2 and len(lw) > 2:
                    if qw in lw or lw in qw:
                        score += 15
        
        # Budget range matching (if query contains price keywords)
        budget_keywords = ['400', '500', '550', '600', '700', '800']
        for bk in budget_keywords:
            if bk in query_lower:
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
    
    # Sort by score
    results.sort(key=lambda x: x.get('search_score', 0), reverse=True)
    
    return results

@api_router.post("/agents/match", response_model=Match)
async def create_match(match_data: MatchCreateWithProperty, current_user: dict = Depends(get_current_user)):
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
        status="pending_approval",
        property_info=match_data.property_info.model_dump() if match_data.property_info else None
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
    
    # Get agent info for notification
    agent = await db.agents.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    agent_user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    
    # Notify curator if exists
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
        
        # Get buyer info with phone
        buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
        buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0, "password": 0})
        if buyer:
            # Ensure phone is included from user record if not in buyer profile
            if not buyer.get("phone") and buyer_user and buyer_user.get("phone"):
                buyer["phone"] = buyer_user["phone"]
            match['buyer'] = buyer
        
        # Get agent info with phone
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0, "password": 0})
        if agent:
            # Ensure phone is included from user record if not in agent profile
            if not agent.get("phone") and agent_user and agent_user.get("phone"):
                agent["phone"] = agent_user["phone"]
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
    
    # Send email notifications if approved
    if decision.approved:
        # Get buyer info
        buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
        buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0})
        
        if buyer and (buyer.get("email") or buyer_user.get("email")):
            await send_match_approved_buyer_email(
                buyer_email=buyer.get("email") or buyer_user.get("email"),
                buyer_name=buyer.get("name", "Comprador")
            )
        
        # Get agent info
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0})
        
        if agent and (agent.get("email") or agent_user.get("email")):
            await send_match_approved_agent_email(
                agent_email=agent.get("email") or agent_user.get("email"),
                agent_name=agent.get("name", "Corretor"),
                buyer_name=buyer.get("name", "Comprador") if buyer else "Comprador"
            )
    
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

@api_router.get("/admin/analytics")
async def get_admin_analytics(current_user: dict = Depends(get_current_user)):
    """Dashboard de Analytics completo para administradores"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Estatísticas gerais
    total_buyers = await db.buyers.count_documents({})
    total_agents = await db.agents.count_documents({})
    total_curators = await db.users.count_documents({"role": "curator"})
    total_interests = await db.interests.count_documents({})
    active_interests = await db.interests.count_documents({"status": "active"})
    
    # Estatísticas de matches
    total_matches = await db.matches.count_documents({})
    pending_matches = await db.matches.count_documents({"status": "pending_approval"})
    approved_matches = await db.matches.count_documents({"status": "approved"})
    rejected_matches = await db.matches.count_documents({"status": "rejected"})
    
    # Taxa de conversão
    conversion_rate = (approved_matches / total_matches * 100) if total_matches > 0 else 0
    
    # Estatísticas de follow-ups
    total_followups = await db.followups.count_documents({})
    followups_corretor = await db.followups.count_documents({"contact_type": "corretor"})
    followups_comprador = await db.followups.count_documents({"contact_type": "comprador"})
    
    # Estatísticas de exclusões (motivos)
    interest_deletions = await db.interest_deletions.find({}, {"_id": 0}).to_list(1000)
    deletion_reasons = {}
    for deletion in interest_deletions:
        reason = deletion.get("reason", "outro")
        deletion_reasons[reason] = deletion_reasons.get(reason, 0) + 1
    
    # Performance dos curadores
    curators = await db.users.find({"role": "curator"}, {"_id": 0, "password": 0}).to_list(100)
    curator_performance = []
    for curator in curators:
        matches_curated = await db.matches.count_documents({"curator_id": curator["id"]})
        matches_approved = await db.matches.count_documents({"curator_id": curator["id"], "status": "approved"})
        followups_count = await db.followups.count_documents({"curator_id": curator["id"]})
        
        curator_performance.append({
            "id": curator["id"],
            "name": curator["name"],
            "email": curator["email"],
            "matches_curated": matches_curated,
            "matches_approved": matches_approved,
            "followups_count": followups_count,
            "approval_rate": (matches_approved / matches_curated * 100) if matches_curated > 0 else 0
        })
    
    # Top corretores (por matches)
    agents = await db.agents.find({}, {"_id": 0}).to_list(100)
    agent_performance = []
    for agent in agents:
        matches_created = await db.matches.count_documents({"agent_id": agent["user_id"]})
        matches_approved = await db.matches.count_documents({"agent_id": agent["user_id"], "status": "approved"})
        
        agent_performance.append({
            "id": agent["user_id"],
            "name": agent.get("name"),
            "email": agent.get("email"),
            "company": agent.get("company"),
            "matches_created": matches_created,
            "matches_approved": matches_approved,
            "success_rate": (matches_approved / matches_created * 100) if matches_created > 0 else 0
        })
    
    # Ordenar por matches criados
    agent_performance.sort(key=lambda x: x["matches_created"], reverse=True)
    
    # Distribuição por tipo de imóvel
    interests = await db.interests.find({}, {"_id": 0, "property_type": 1}).to_list(1000)
    property_type_distribution = {}
    for interest in interests:
        ptype = interest.get("property_type", "outro")
        property_type_distribution[ptype] = property_type_distribution.get(ptype, 0) + 1
    
    # Distribuição por localização
    interests_location = await db.interests.find({}, {"_id": 0, "location": 1}).to_list(1000)
    location_distribution = {}
    for interest in interests_location:
        loc = interest.get("location", "outro")
        location_distribution[loc] = location_distribution.get(loc, 0) + 1
    
    # Faixa de preço média
    interests_price = await db.interests.find({}, {"_id": 0, "min_price": 1, "max_price": 1}).to_list(1000)
    if interests_price:
        avg_min_price = sum(i.get("min_price", 0) for i in interests_price) / len(interests_price)
        avg_max_price = sum(i.get("max_price", 0) for i in interests_price) / len(interests_price)
    else:
        avg_min_price = 0
        avg_max_price = 0
    
    return {
        "overview": {
            "total_buyers": total_buyers,
            "total_agents": total_agents,
            "total_curators": total_curators,
            "total_interests": total_interests,
            "active_interests": active_interests
        },
        "matches": {
            "total": total_matches,
            "pending": pending_matches,
            "approved": approved_matches,
            "rejected": rejected_matches,
            "conversion_rate": round(conversion_rate, 1)
        },
        "followups": {
            "total": total_followups,
            "with_broker": followups_corretor,
            "with_buyer": followups_comprador
        },
        "deletion_reasons": deletion_reasons,
        "curator_performance": curator_performance,
        "agent_performance": agent_performance[:10],  # Top 10
        "distributions": {
            "property_types": property_type_distribution,
            "locations": location_distribution
        },
        "price_range": {
            "average_min": round(avg_min_price, 2),
            "average_max": round(avg_max_price, 2)
        }
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
        
        # Get buyer info with phone
        buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
        buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0, "password": 0})
        if buyer:
            if not buyer.get("phone") and buyer_user and buyer_user.get("phone"):
                buyer["phone"] = buyer_user["phone"]
            match['buyer'] = buyer
        
        # Get agent info with phone
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0, "password": 0})
        if agent:
            if not agent.get("phone") and agent_user and agent_user.get("phone"):
                agent["phone"] = agent_user["phone"]
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
    
    # Check if pending curator with same email exists
    existing_pending = await db.pending_curators.find_one({"email": curator_data.email, "status": "pending"}, {"_id": 0})
    if existing_pending:
        raise HTTPException(status_code=400, detail="Já existe um convite pendente para este email")
    
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
    
    # Send registration email
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
    
    # Include registration link in response only if email failed (for manual sending)
    if not email_sent:
        response["message"] = "Curador criado. Email não enviado - use o link abaixo."
        response["registration_link"] = registration_link
    
    return response

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

# VISIT SCHEDULING ENDPOINTS
async def send_visit_notification(
    to_email: str,
    to_name: str,
    visit_date: str,
    visit_time: str,
    property_address: str,
    is_reminder: bool = False,
    is_2h_reminder: bool = False
) -> bool:
    """Send visit notification email"""
    
    if is_2h_reminder:
        subject = "⏰ Lembrete: Visita em 2 horas - MatchImovel"
        title = "Sua visita é em 2 horas!"
        message = f"Lembrando que você tem uma visita agendada para <strong>hoje às {visit_time}</strong>."
    elif is_reminder:
        subject = "📅 Lembrete: Visita agendada - MatchImovel"
        title = "Lembrete de visita agendada"
        message = f"Você tem uma visita agendada para <strong>{visit_date} às {visit_time}</strong>."
    else:
        subject = "🏠 Visita agendada - MatchImovel"
        title = "Nova visita agendada!"
        message = f"Uma visita foi agendada para <strong>{visit_date} às {visit_time}</strong>."
    
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
            .info-box {{ background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 15px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .highlight {{ color: #6366f1; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MatchImovel</h1>
            </div>
            <div class="content">
                <h2>{title}</h2>
                <p>Olá, <strong>{to_name}</strong>!</p>
                <p>{message}</p>
                
                <div class="info-box">
                    <p><strong>📍 Endereço:</strong> {property_address}</p>
                    <p><strong>📅 Data:</strong> {visit_date}</p>
                    <p><strong>🕐 Horário:</strong> {visit_time}</p>
                </div>
                
                <p>Em caso de dúvidas ou necessidade de reagendamento, entre em contato com nossa equipe de curadoria.</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 MatchImovel - Todos os direitos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, subject, email_html)

@api_router.post("/curator/schedule-visit/{match_id}")
async def schedule_visit(match_id: str, visit_data: ScheduleVisitRequest, current_user: dict = Depends(get_current_user)):
    """Schedule a property visit and notify buyer and agent"""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get match
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")
    
    # Check if curator has access
    if current_user["role"] == "curator" and match.get("curator_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este match")
    
    # Create visit record
    visit = Visit(
        match_id=match_id,
        scheduled_by=current_user["user_id"],
        visit_date=visit_data.visit_date,
        visit_time=visit_data.visit_time,
        notes=visit_data.notes
    )
    
    doc = visit.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.visits.insert_one(doc)
    
    # Update match status
    await db.matches.update_one(
        {"id": match_id},
        {"$set": {"status": "visit_scheduled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Get buyer and agent info for notifications
    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
    buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0})
    agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
    agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0})
    
    # Get property address from match property_info
    property_address = "Endereço a confirmar"
    if match.get("property_info") and match["property_info"].get("address"):
        property_address = match["property_info"]["address"]
    
    # Send notifications
    notifications_sent = {"buyer": False, "agent": False}
    
    if buyer and buyer.get("email"):
        notifications_sent["buyer"] = await send_visit_notification(
            to_email=buyer.get("email") or buyer_user.get("email"),
            to_name=buyer.get("name", "Comprador"),
            visit_date=visit_data.visit_date,
            visit_time=visit_data.visit_time,
            property_address=property_address
        )
    
    if agent and agent.get("email"):
        notifications_sent["agent"] = await send_visit_notification(
            to_email=agent.get("email") or agent_user.get("email"),
            to_name=agent.get("name", "Corretor"),
            visit_date=visit_data.visit_date,
            visit_time=visit_data.visit_time,
            property_address=property_address
        )
    
    return {
        "status": "success",
        "visit_id": visit.id,
        "notifications_sent": notifications_sent
    }

@api_router.get("/curator/visits/{match_id}")
async def get_match_visits(match_id: str, current_user: dict = Depends(get_current_user)):
    """Get all visits for a match"""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    visits = await db.visits.find({"match_id": match_id}, {"_id": 0}).to_list(100)
    
    for visit in visits:
        if isinstance(visit.get('created_at'), str):
            visit['created_at'] = datetime.fromisoformat(visit['created_at'])
        
        # Get scheduler name
        scheduler = await db.users.find_one({"id": visit["scheduled_by"]}, {"_id": 0})
        if scheduler:
            visit['scheduled_by_name'] = scheduler.get('name')
    
    return visits

@api_router.delete("/curator/visits/{visit_id}")
async def cancel_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a scheduled visit"""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    await db.visits.update_one(
        {"id": visit_id},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"status": "success", "message": "Visita cancelada"}

# Background task to send 2h reminder - would need a scheduler like APScheduler in production
@api_router.post("/internal/send-visit-reminders")
async def send_visit_reminders():
    """Internal endpoint to send 2h visit reminders - call this from a scheduler"""
    now = datetime.now(timezone.utc)
    
    # Find visits scheduled in the next 2 hours that haven't had reminder sent
    visits = await db.visits.find({
        "status": "scheduled",
        "reminder_2h_sent": False
    }, {"_id": 0}).to_list(100)
    
    reminders_sent = 0
    
    for visit in visits:
        try:
            visit_datetime_str = f"{visit['visit_date']} {visit['visit_time']}"
            visit_datetime = datetime.strptime(visit_datetime_str, "%Y-%m-%d %H:%M")
            visit_datetime = visit_datetime.replace(tzinfo=timezone.utc)
            
            # Check if visit is within 2 hours
            time_diff = visit_datetime - now
            if timedelta(hours=0) <= time_diff <= timedelta(hours=2, minutes=15):
                # Get match info
                match = await db.matches.find_one({"id": visit["match_id"]}, {"_id": 0})
                if match:
                    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
                    agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
                    
                    property_address = match.get("property_info", {}).get("address", "Endereço a confirmar")
                    
                    if buyer and buyer.get("email"):
                        await send_visit_notification(
                            to_email=buyer["email"],
                            to_name=buyer.get("name", "Comprador"),
                            visit_date=visit["visit_date"],
                            visit_time=visit["visit_time"],
                            property_address=property_address,
                            is_2h_reminder=True
                        )
                    
                    if agent and agent.get("email"):
                        await send_visit_notification(
                            to_email=agent["email"],
                            to_name=agent.get("name", "Corretor"),
                            visit_date=visit["visit_date"],
                            visit_time=visit["visit_time"],
                            property_address=property_address,
                            is_2h_reminder=True
                        )
                    
                    await db.visits.update_one(
                        {"id": visit["id"]},
                        {"$set": {"reminder_2h_sent": True}}
                    )
                    reminders_sent += 1
        except Exception as e:
            logger.error(f"Error sending reminder for visit {visit['id']}: {str(e)}")
    
    return {"reminders_sent": reminders_sent}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
