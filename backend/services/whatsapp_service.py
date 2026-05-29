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

# Template name resolvers — read env at call time so tests can override
_TPL_MATCH_APROVADO      = lambda: os.environ.get("WHATSAPP_TPL_MATCH_APROVADO",      "match_aprovado")
_TPL_MATCH_APROVADO_CORT = lambda: os.environ.get("WHATSAPP_TPL_MATCH_APROVADO_CORT", "match_aprovado_corretor")
_TPL_VISITA_AGENDADA     = lambda: os.environ.get("WHATSAPP_TPL_VISITA_AGENDADA",     "visita_agendada")
_TPL_LEMBRETE_VISITA     = lambda: os.environ.get("WHATSAPP_TPL_LEMBRETE_VISITA",     "lembrete_visita")
_TPL_FEEDBACK_VISITA     = lambda: os.environ.get("WHATSAPP_TPL_FEEDBACK_VISITA",     "feedback_visita")
_TPL_MATCH_REJEITADO     = lambda: os.environ.get("WHATSAPP_TPL_MATCH_REJEITADO",     "match_rejeitado")
_TPL_INTERESSE_CAD       = lambda: os.environ.get("WHATSAPP_TPL_INTERESSE_CAD",       "interesse_cadastrado")
_TPL_CRECI_VERIFICADO    = lambda: os.environ.get("WHATSAPP_TPL_CRECI_VERIFICADO",    "creci_verificado")
_TPL_CRECI_BLOQUEADO     = lambda: os.environ.get("WHATSAPP_TPL_CRECI_BLOQUEADO",     "creci_bloqueado")
_TPL_BUSCA_RESULTADOS    = lambda: os.environ.get("WHATSAPP_TPL_BUSCA_RESULTADOS",    "busca_resultados")
_TPL_NOVOS_INTERESSES    = lambda: os.environ.get("WHATSAPP_TPL_NOVOS_INTERESSES",    "novos_interesses")
_TPL_CURADOR_EXCLUSAO    = lambda: os.environ.get("WHATSAPP_TPL_CURADOR_EXCLUSAO",    "curador_exclusao")
_TPL_CURADOR_CONFIRM     = lambda: os.environ.get("WHATSAPP_TPL_CURADOR_CONFIRM",     "curador_visita_confirmada")
_TPL_REAGENDAMENTO       = lambda: os.environ.get("WHATSAPP_TPL_REAGENDAMENTO",       "curador_reagendamento")
_TPL_RESET_SENHA         = lambda: os.environ.get("WHATSAPP_TPL_RESET_SENHA",         "reset_senha")
_TPL_NOVO_CORRETOR       = lambda: os.environ.get("WHATSAPP_TPL_NOVO_CORRETOR",       "novo_corretor")


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
        template_name=_TPL_MATCH_APROVADO(),
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
            template_name=_TPL_VISITA_AGENDADA(),
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


async def notify_agent_match_approved(
    agent_phone: str,
    agent_name: str,
    buyer_name: str,
    score: str,
    location: str,
) -> bool:
    """Notify agent that their match was approved by curator."""
    return await send_template(
        to=agent_phone,
        template_name=_TPL_MATCH_APROVADO_CORT(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": agent_name},
                {"type": "text", "text": buyer_name},
                {"type": "text", "text": score},
                {"type": "text", "text": location[:50] or "a confirmar"},
            ],
        }],
    )


async def notify_visit_reminder(
    buyer_phone: str | None,
    buyer_name: str,
    agent_phone: str | None,
    agent_name: str,
    visit_date: str,
    visit_time: str,
    property_address: str,
) -> None:
    """Send 2-hour visit reminder template to buyer and agent."""
    date_display = format_visit_date(visit_date)
    for phone, name in [(buyer_phone, buyer_name), (agent_phone, agent_name)]:
        if not phone:
            continue
        await send_template(
            to=phone,
            template_name=_TPL_LEMBRETE_VISITA(),
            components=[{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": name},
                    {"type": "text", "text": property_address[:50]},
                    {"type": "text", "text": f"{date_display} às {visit_time}"},
                ],
            }],
        )


async def notify_buyer_feedback_request(
    buyer_phone: str,
    buyer_name: str,
    match_id: str,
    buyer_id: str,
    property_address: str,
) -> bool:
    """Send post-visit feedback request to buyer and open a Flow B session."""
    await upsert_session(buyer_phone, {
        "flow": "match_feedback",
        "state": "B_FEEDBACK_ASK",
        "user_id": buyer_id,
        "role": "buyer",
        "data": {"match_id": match_id},
    })
    return await send_template(
        to=buyer_phone,
        template_name=_TPL_FEEDBACK_VISITA(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": buyer_name},
                {"type": "text", "text": property_address[:50]},
            ],
        }],
    )


async def notify_agent_match_rejected(
    agent_phone: str,
    agent_name: str,
    buyer_name: str,
    property_address: str,
) -> bool:
    """Notify agent that buyer rejected the match after visiting."""
    return await send_template(
        to=agent_phone,
        template_name=_TPL_MATCH_REJEITADO(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": agent_name},
                {"type": "text", "text": buyer_name},
                {"type": "text", "text": property_address[:50] or "imóvel do match"},
            ],
        }],
    )


async def notify_buyer_interest_registered(
    buyer_phone: str,
    buyer_name: str,
    property_type: str,
    location: str,
) -> bool:
    """Notify buyer that their interest was successfully registered (app/web path only)."""
    return await send_template(
        to=buyer_phone,
        template_name=_TPL_INTERESSE_CAD(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": buyer_name},
                {"type": "text", "text": property_type or "imóvel"},
                {"type": "text", "text": location[:50] or "localização indicada"},
            ],
        }],
    )


async def notify_agent_creci_verified(
    agent_phone: str,
    agent_name: str,
    creci: str,
) -> bool:
    """Notify agent that their CRECI was verified."""
    return await send_template(
        to=agent_phone,
        template_name=_TPL_CRECI_VERIFICADO(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": agent_name},
                {"type": "text", "text": creci},
            ],
        }],
    )


async def notify_agent_creci_blocked(
    agent_phone: str,
    agent_name: str,
    creci: str,
) -> bool:
    """Notify agent that their CRECI was blocked."""
    return await send_template(
        to=agent_phone,
        template_name=_TPL_CRECI_BLOQUEADO(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": agent_name},
                {"type": "text", "text": creci},
            ],
        }],
    )


async def notify_agent_search_results(
    agent_phone: str,
    agent_name: str,
    n_matches: int,
    search_location: str,
) -> bool:
    """Notify agent of new compatible buyers found by the weekly cron."""
    return await send_template(
        to=agent_phone,
        template_name=_TPL_BUSCA_RESULTADOS(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": agent_name},
                {"type": "text", "text": str(n_matches)},
                {"type": "text", "text": search_location[:60] or "busca ativa"},
            ],
        }],
    )


async def notify_agent_new_interests(
    agent_phone: str,
    agent_name: str,
    new_interests: list[dict],
) -> bool:
    """Notify agent of new buyer interests not covered by their active searches.

    new_interests: [{"property_type": "apartamento", "count": 3}, ...]
    """
    if not new_interests:
        return False
    total = sum(i.get("count", 0) for i in new_interests)
    breakdown = ", ".join(
        f"{i['count']} {i['property_type']}" for i in new_interests
    )
    return await send_template(
        to=agent_phone,
        template_name=_TPL_NOVOS_INTERESSES(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": agent_name},
                {"type": "text", "text": str(total)},
                {"type": "text", "text": breakdown[:60]},
            ],
        }],
    )


async def notify_curator_deletion(
    curator_phone: str,
    curator_name: str,
    deletion_type: str,
    deleted_by_name: str,
    item_description: str,
) -> bool:
    """Notify curator that an interest or match was deleted."""
    type_label = "Interesse" if deletion_type == "interest" else "Match"
    item_text = f"{type_label} de {item_description[:40]}" if item_description else type_label
    return await send_template(
        to=curator_phone,
        template_name=_TPL_CURADOR_EXCLUSAO(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": curator_name},
                {"type": "text", "text": item_text},
                {"type": "text", "text": deleted_by_name},
            ],
        }],
    )


async def notify_curator_visit_confirmed(
    curator_phone: str,
    curator_name: str,
    actor_name: str,
    actor_type: str,
    visit_date: str,
    visit_time: str,
    property_address: str,
) -> bool:
    """Notify curator that buyer or agent confirmed visit attendance."""
    date_display = format_visit_date(visit_date)
    return await send_template(
        to=curator_phone,
        template_name=_TPL_CURADOR_CONFIRM(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": actor_name},
                {"type": "text", "text": date_display},
                {"type": "text", "text": visit_time},
                {"type": "text", "text": property_address[:50]},
            ],
        }],
    )


async def notify_reschedule_requested(
    phones_names: list[tuple],
    requester_name: str,
    reason: str,
    proposed_date: str | None,
    property_address: str,
) -> None:
    """Notify curator and other party about a reschedule request.

    phones_names: [(phone, name), ...]
    """
    reason_text = (reason[:50] if reason else "não informado")
    for phone, _name in phones_names:
        if not phone:
            continue
        await send_template(
            to=phone,
            template_name=_TPL_REAGENDAMENTO(),
            components=[{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": requester_name},
                    {"type": "text", "text": property_address[:50]},
                    {"type": "text", "text": reason_text},
                ],
            }],
        )


async def notify_password_reset(
    user_phone: str,
    user_name: str,
    reset_link: str,
) -> bool:
    """Send password reset link via WhatsApp."""
    return await send_template(
        to=user_phone,
        template_name=_TPL_RESET_SENHA(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": user_name},
                {"type": "text", "text": reset_link},
            ],
        }],
    )


async def notify_admin_new_agent(
    admin_phone: str,
    agent_name: str,
    creci: str,
) -> bool:
    """Notify admin via WhatsApp of a new agent registration."""
    return await send_template(
        to=admin_phone,
        template_name=_TPL_NOVO_CORRETOR(),
        components=[{
            "type": "body",
            "parameters": [
                {"type": "text", "text": agent_name},
                {"type": "text", "text": creci or "não informado"},
            ],
        }],
    )
