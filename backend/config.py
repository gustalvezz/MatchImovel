"""
Application configuration
Loads environment variables and defines app-wide settings
"""
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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

# External APIs
BUSCACRECI_API = "https://api.buscacreci.com.br"

# Frontend URL (for email links)
FRONTEND_URL = os.environ.get('FRONTEND_URL')

# CORS
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

# WhatsApp / Meta Cloud API
WHATSAPP_TOKEN = os.environ.get('WHATSAPP_TOKEN')
WHATSAPP_PHONE_NUMBER_ID = os.environ.get('WHATSAPP_PHONE_NUMBER_ID')
WHATSAPP_VERIFY_TOKEN = os.environ.get('WHATSAPP_VERIFY_TOKEN')
WHATSAPP_ADMIN_PHONE = os.environ.get('WHATSAPP_ADMIN_PHONE')  # opt-in for admin alerts
# Template names (must match Meta-approved template names exactly)
WHATSAPP_TPL_MATCH_APROVADO      = os.environ.get('WHATSAPP_TPL_MATCH_APROVADO',      'match_aprovado')
WHATSAPP_TPL_MATCH_APROVADO_CORT = os.environ.get('WHATSAPP_TPL_MATCH_APROVADO_CORT', 'match_aprovado_corretor')
WHATSAPP_TPL_VISITA_AGENDADA     = os.environ.get('WHATSAPP_TPL_VISITA_AGENDADA',     'visita_agendada')
WHATSAPP_TPL_LEMBRETE_VISITA     = os.environ.get('WHATSAPP_TPL_LEMBRETE_VISITA',     'lembrete_visita')
WHATSAPP_TPL_FEEDBACK_VISITA     = os.environ.get('WHATSAPP_TPL_FEEDBACK_VISITA',     'feedback_visita')
WHATSAPP_TPL_MATCH_REJEITADO     = os.environ.get('WHATSAPP_TPL_MATCH_REJEITADO',     'match_rejeitado')
WHATSAPP_TPL_INTERESSE_CAD       = os.environ.get('WHATSAPP_TPL_INTERESSE_CAD',       'interesse_cadastrado')
WHATSAPP_TPL_CRECI_VERIFICADO    = os.environ.get('WHATSAPP_TPL_CRECI_VERIFICADO',    'creci_verificado')
WHATSAPP_TPL_CRECI_BLOQUEADO     = os.environ.get('WHATSAPP_TPL_CRECI_BLOQUEADO',     'creci_bloqueado')
WHATSAPP_TPL_BUSCA_RESULTADOS    = os.environ.get('WHATSAPP_TPL_BUSCA_RESULTADOS',    'busca_resultados')
WHATSAPP_TPL_NOVOS_INTERESSES    = os.environ.get('WHATSAPP_TPL_NOVOS_INTERESSES',    'novos_interesses')
WHATSAPP_TPL_CURADOR_EXCLUSAO    = os.environ.get('WHATSAPP_TPL_CURADOR_EXCLUSAO',    'curador_exclusao')
WHATSAPP_TPL_CURADOR_CONFIRM     = os.environ.get('WHATSAPP_TPL_CURADOR_CONFIRM',     'curador_visita_confirmada')
WHATSAPP_TPL_REAGENDAMENTO       = os.environ.get('WHATSAPP_TPL_REAGENDAMENTO',       'curador_reagendamento')
WHATSAPP_TPL_RESET_SENHA         = os.environ.get('WHATSAPP_TPL_RESET_SENHA',         'reset_senha')
WHATSAPP_TPL_NOVO_CORRETOR       = os.environ.get('WHATSAPP_TPL_NOVO_CORRETOR',       'novo_corretor')
