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
CORS_ORIGIN_REGEX = os.environ.get('CORS_ORIGIN_REGEX', r'https://.*\.vercel\.app')