"""
Consent routes
Logs cookie-consent choices (anonymous) for LGPD accountability.
"""
from fastapi import APIRouter, Request
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid
import logging

from database import db

router = APIRouter(tags=["consent"])
logger = logging.getLogger(__name__)


class ConsentCategories(BaseModel):
    analytics: bool = False
    marketing: bool = False


class ConsentLogPayload(BaseModel):
    consent_id: str
    categories: ConsentCategories
    banner_version: str = "v1"


@router.post("/consent-log")
async def log_consent(payload: ConsentLogPayload, request: Request):
    """Best-effort log of a cookie-consent choice. Never blocks the banner UX."""
    try:
        client_ip = request.client.host if request.client else "unknown"
        doc = {
            "id": str(uuid.uuid4()),
            "consent_id": payload.consent_id,
            "categories": payload.categories.model_dump(),
            "banner_version": payload.banner_version,
            "ip": client_ip,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.consent_logs.insert_one(doc)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Failed to log consent: {str(e)}")
        return {"status": "error"}
