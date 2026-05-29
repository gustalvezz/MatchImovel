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
WHATSAPP_MATCH_TEMPLATE_NAME = os.environ.get('WHATSAPP_MATCH_TEMPLATE_NAME', 'match_aprovado')
WHATSAPP_VISIT_TEMPLATE_NAME = os.environ.get('WHATSAPP_VISIT_TEMPLATE_NAME', 'visita_agendada')
