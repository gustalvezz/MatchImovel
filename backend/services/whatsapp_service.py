"""
WhatsApp Cloud API service
Handles Meta API calls, session management and outbound notifications.
"""
import httpx
import os
import logging
from datetime import datetime, timezone, timedelta

from database import db

logger = logging.getLogger(__name__)

GRAPH_BASE = "https://graph.facebook.com/v19.0"

_TOKEN = lambda: os.environ.get("WHATSAPP_TOKEN", "")
_PHONE_NUMBER_ID = lambda: os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
_MATCH_TEMPLATE = lambda: os.environ.get("WHATSAPP_MATCH_TEMPLATE_NAME", "match_aprovado")
_VISIT_TEMPLATE = lambda: os.environ.get("WHATSAPP_VISIT_TEMPLATE_NAME", "visita_agendada")


def _headers() -> dict:
    return {"Authorization": f"Bearer {_TOKEN()}", "Content-Type": "application/json"}


async def _post_message(payload: dict) -> bool:
    url = f"{GRAPH_BASE}/{_PHONE_NUMBER_ID()}/messages"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=_headers())
            if resp.status_code not in (200, 201):
                logger.error(f"WhatsApp API error {resp.status_code}: {resp.text[:200]}")
                return False
            return True
    except Exception as e:
        logger.error(f"WhatsApp send error: {e}")
        return False


# ── Low-level senders ──────────────────────────────────────────────────────────

async def send_text(to: str, body: str) -> bool:
    return await _post_message({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": body},
    })


async def send_template(to: str, template_name: str, lang: str = "pt_BR",
                        components: list = None) -> bool:
    payload: dict = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {"name": template_name, "language": {"code": lang}},
    }
    if components:
        payload["template"]["components"] = components
    return await _post_message(payload)


async def send_interactive_buttons(to: str, body: str, buttons: list[dict]) -> bool:
    """buttons: [{"id": str, "title": str}, ...]  max 3"""
    return await _post_message({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"][:20]}}
                    for b in buttons[:3]
                ]
            },
        },
    })


async def send_interactive_list(to: str, body: str, button_label: str,
                                sections: list[dict]) -> bool:
    """sections: [{"title": str, "rows": [{"id": str, "title": str, "description"?: str}]}]"""
    return await _post_message({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {"text": body},
            "action": {"button": button_label, "sections": sections},
        },
    })


# ── Session helpers ────────────────────────────────────────────────────────────

async def get_session(phone: str) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()
    session = await db.whatsapp_sessions.find_one(
        {"phone": phone, "expires_at": {"$gt": now}}, {"_id": 0}
    )
    return session


async def upsert_session(phone: str, updates: dict) -> None:
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(hours=24)).isoformat()
    await db.whatsapp_sessions.update_one(
        {"phone": phone},
        {
            "$set": {
                **updates,
                "phone": phone,
                "last_message_at": now.isoformat(),
                "expires_at": expires_at,
            },
            "$setOnInsert": {"created_at": now.isoformat()},
        },
        upsert=True,
    )


async def close_session(phone: str) -> None:
    await db.whatsapp_sessions.delete_one({"phone": phone})


# ── User identification ────────────────────────────────────────────────────────

async def identify_user(phone: str) -> tuple[dict | None, str | None]:
    """Returns (user_doc, role). Checks db.users by phone (with/without country code)."""
    candidates = [phone]
    if phone.startswith("55") and len(phone) > 10:
        candidates.append(phone[2:])

    for p in candidates:
        user = await db.users.find_one(
            {"phone": {"$in": [p, f"+{p}", f"+55{p}"]}},
            {"_id": 0, "password": 0},
        )
        if user:
            return user, user.get("role")
    return None, None


# ── Formatting helpers ─────────────────────────────────────────────────────────

def format_visit_date(date_str: str) -> str:
    """Convert YYYY-MM-DD → DD/MM/YYYY for display."""
    try:
        parts = date_str.split("-")
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    except Exception:
        return date_str


# ── Outbound notifications ─────────────────────────────────────────────────────

async def notify_buyer_match_approved(match: dict, buyer: dict, buyer_phone: str) -> bool:
    """Send match-approved template to buyer and prime B_NOTIFY session."""
    pi = match.get("property_info") or {}
    ai = match.get("ai_compatibility") or {}
    location = pi.get("address") or ai.get("property_description") or "localização a confirmar"
    score = str(ai.get("score", 0))

    await upsert_session(buyer_phone, {
        "flow": "match_feedback",
        "state": "B_NOTIFY",
        "user_id": buyer.get("user_id") or match.get("buyer_id", ""),
        "role": "buyer",
        "data": {"match_id": match.get("id", "")},
    })

    return await send_template(
        to=buyer_phone,
        template_name=_MATCH_TEMPLATE(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": buyer.get("name", "Comprador")},
                {"type": "text", "text": location[:50]},
                {"type": "text", "text": score},
            ],
        }],
    )


async def notify_visit_scheduled(
    buyer_phone: str | None,
    buyer_name: str,
    buyer_id: str,
    agent_phone: str | None,
    agent_name: str,
    agent_id: str,
    visit: dict,
    property_address: str,
) -> None:
    """Send visit-scheduled template to buyer and agent; prime V_ACTION_MENU sessions."""
    template_name = _VISIT_TEMPLATE()
    visit_id = visit.get("id", "")
    visit_date = visit.get("visit_date", "")
    visit_time = visit.get("visit_time", "")
    date_display = format_visit_date(visit_date)

    for phone, name, user_id, role in [
        (buyer_phone, buyer_name, buyer_id, "buyer"),
        (agent_phone, agent_name, agent_id, "agent"),
    ]:
        if not phone:
            continue
        await upsert_session(phone, {
            "flow": "visit",
            "state": "V_ACTION_MENU",
            "user_id": user_id,
            "role": role,
            "data": {"visit_id": visit_id, "property_address": property_address},
        })
        await send_template(
            to=phone,
            template_name=template_name,
            components=[{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": name},
                    {"type": "text", "text": property_address[:50]},
                    {"type": "text", "text": date_display},
                    {"type": "text", "text": visit_time},
                ],
            }],
        )
