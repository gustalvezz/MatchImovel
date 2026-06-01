"""
Curator routes
Handles curation decisions, follow-ups, visit scheduling and post-visit flow
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import logging
import os

from database import db
from auth import get_current_user
from models.schemas import (
    CurationDecision, FollowUpCreate, FollowUp,
    Visit, ScheduleVisitRequest, VisitOutcomeRequest,
    VisitFeedbackSubmit, CuratorFeedbackOverride,
    ApproveRescheduleRequest, VisitTokenActionRequest
)
from services.email_service import (
    send_match_approved_buyer_email,
    send_match_approved_agent_email,
    send_visit_scheduled_with_actions,
    send_visit_confirmed_to_curator,
    send_reschedule_request_notification,
    send_post_visit_feedback_request,
    send_match_rejection_to_agent,
)

router = APIRouter(tags=["curator"])
logger = logging.getLogger(__name__)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "")


# ─── helpers ──────────────────────────────────────────────────────────────────

async def _enrich_match(match: dict) -> dict:
    """Attach interest, buyer, agent and visits to a match dict."""
    if isinstance(match.get("created_at"), str):
        match["created_at"] = datetime.fromisoformat(match["created_at"])
    if isinstance(match.get("updated_at"), str):
        match["updated_at"] = datetime.fromisoformat(match["updated_at"])

    match["interest"] = await db.interests.find_one({"id": match["interest_id"]}, {"_id": 0})

    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
    buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0, "password": 0})
    if buyer:
        if not buyer.get("phone") and buyer_user and buyer_user.get("phone"):
            buyer["phone"] = buyer_user["phone"]
        match["buyer"] = buyer

    agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
    agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0, "password": 0})
    if agent:
        if not agent.get("phone") and agent_user and agent_user.get("phone"):
            agent["phone"] = agent_user["phone"]
        match["agent"] = agent

    visits = await db.visits.find({"match_id": match["id"]}, {"_id": 0}).to_list(10)
    # Attach feedback to each visit
    for v in visits:
        fb = await db.visit_feedback.find_one({"visit_id": v["id"]}, {"_id": 0})
        v["feedback"] = fb
    match["visits"] = visits
    return match


async def _create_visit_action_tokens(visit_id: str, match_id: str, buyer_id: str, agent_id: str) -> dict:
    """Generate confirm/reschedule/cancel tokens for buyer and agent, stored in DB."""
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    tokens = {}
    combos = [
        ("buyer_confirm", buyer_id, "buyer", "confirm"),
        ("buyer_reschedule", buyer_id, "buyer", "reschedule"),
        ("buyer_cancel", buyer_id, "buyer", "cancel"),
        ("agent_confirm", agent_id, "agent", "confirm"),
        ("agent_reschedule", agent_id, "agent", "reschedule"),
        ("agent_cancel", agent_id, "agent", "cancel"),
    ]
    for key, actor_id, actor_type, action in combos:
        token = secrets.token_urlsafe(32)
        await db.visit_actions.insert_one({
            "token": token,
            "visit_id": visit_id,
            "match_id": match_id,
            "actor_id": actor_id,
            "actor_type": actor_type,
            "action": action,
            "expires_at": expires_at,
            "used": False,
        })
        tokens[key] = token
    return tokens


def _action_url(token: str, action: str) -> str:
    return f"{FRONTEND_URL}/visit-action?token={token}&action={action}"


def _feedback_url(token: str) -> str:
    return f"{FRONTEND_URL}/visit-feedback?token={token}"


# ─── match endpoints ───────────────────────────────────────────────────────────

@router.get("/curator/pending-matches")
async def get_pending_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    matches = await db.matches.find({"status": "pending_approval"}, {"_id": 0}).to_list(100)
    return [await _enrich_match(m) for m in matches]


@router.post("/curator/matches/{match_id}/decision")
async def decide_match(match_id: str, decision: CurationDecision, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")

    new_status = "approved" if decision.approved else "rejected"

    await db.matches.update_one(
        {"id": match_id},
        {"$set": {
            "status": new_status,
            "curator_id": current_user["user_id"],
            "curator_notes": decision.notes,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    if decision.approved:
        buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        interest = await db.interests.find_one({"id": match["interest_id"]}, {"_id": 0})

        email_results = {"buyer": False, "agent": False}

        if buyer and buyer.get("email"):
            email_results["buyer"] = await send_match_approved_buyer_email(
                buyer_email=buyer["email"],
                buyer_name=buyer.get("name", "Comprador"),
                ai_compatibility=match.get("ai_compatibility"),
                property_info=match.get("property_info")
            )

        if agent and agent.get("email"):
            buyer_info = {
                "property_type": interest.get("property_type") if interest else None,
                "location": interest.get("location") if interest else None,
                "budget_range": interest.get("budget_range") if interest else None,
                "interpretacaoIA": interest.get("interpretacaoIA") if interest else None
            }
            email_results["agent"] = await send_match_approved_agent_email(
                agent_email=agent["email"],
                agent_name=agent.get("name", "Corretor"),
                buyer_name=buyer.get("name", "Comprador") if buyer else "Comprador",
                buyer_info=buyer_info,
                ai_compatibility=match.get("ai_compatibility")
            )

        # WhatsApp notification to buyer
        try:
            from services.whatsapp_service import notify_buyer_match_approved
            buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0})
            buyer_phone = (buyer or {}).get("phone") or (buyer_user or {}).get("phone")
            if buyer_phone:
                await notify_buyer_match_approved(
                    match=await db.matches.find_one({"id": match_id}, {"_id": 0}),
                    buyer=buyer or {},
                    buyer_phone=buyer_phone,
                )
        except Exception as e:
            logger.error(f"WhatsApp match notification failed: {e}")

        # WhatsApp notification to agent
        try:
            from services.whatsapp_service import notify_agent_match_approved
            agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0})
            agent_phone = (agent or {}).get("phone") or (agent_user or {}).get("phone")
            if agent_phone:
                await notify_agent_match_approved(
                    agent_phone=agent_phone,
                    agent_name=(agent or {}).get("name", "Corretor"),
                    buyer_name=(buyer or {}).get("name", "Comprador"),
                    score=str((match.get("ai_compatibility") or {}).get("score", 0)),
                    location=(match.get("property_info") or {}).get("address", ""),
                )
        except Exception as e:
            logger.error(f"WhatsApp agent match notification failed: {e}")

        return {"status": "success", "match_status": new_status, "emails_sent": email_results}

    return {"status": "success", "match_status": new_status}


@router.get("/curator/my-matches")
async def get_curator_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    if current_user["role"] == "admin":
        matches = await db.matches.find(
            {"status": {"$in": ["approved", "visit_scheduled", "completed"]}}, {"_id": 0}
        ).to_list(1000)
    else:
        matches = await db.matches.find({"curator_id": current_user["user_id"]}, {"_id": 0}).to_list(1000)

    return [await _enrich_match(m) for m in matches]


# ─── follow-ups ───────────────────────────────────────────────────────────────

@router.post("/matches/{match_id}/followup")
async def create_followup(match_id: str, followup_data: FollowUpCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")

    if current_user["role"] == "curator" and match.get("curator_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este match")

    followup = FollowUp(
        match_id=match_id,
        curator_id=current_user["user_id"],
        content=followup_data.content,
        contact_type=followup_data.contact_type
    )
    doc = followup.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.followups.insert_one(doc)
    return {"status": "success", "followup_id": followup.id}


@router.get("/matches/{match_id}/followups")
async def get_followups(match_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")

    if current_user["role"] == "curator" and match.get("curator_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este match")

    query = {"match_id": match_id}
    if current_user["role"] != "admin":
        query["curator_id"] = current_user["user_id"]

    followups = await db.followups.find(query, {"_id": 0}).to_list(100)
    for f in followups:
        if isinstance(f.get("created_at"), str):
            f["created_at"] = datetime.fromisoformat(f["created_at"])
        curator = await db.users.find_one({"id": f["curator_id"]}, {"_id": 0})
        if curator:
            f["curator_name"] = curator.get("name")
    return followups


# ─── visit scheduling ─────────────────────────────────────────────────────────

@router.post("/curator/schedule-visit/{match_id}")
async def schedule_visit(match_id: str, visit_data: ScheduleVisitRequest, current_user: dict = Depends(get_current_user)):
    """Schedule a visit, generate action tokens, notify buyer and agent."""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")

    if current_user["role"] == "curator" and match.get("curator_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este match")

    visit = Visit(
        match_id=match_id,
        scheduled_by=current_user["user_id"],
        visit_date=visit_data.visit_date,
        visit_time=visit_data.visit_time,
        notes=visit_data.notes
    )
    doc = visit.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.visits.insert_one(doc)

    await db.matches.update_one(
        {"id": match_id},
        {"$set": {"status": "visit_scheduled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
    buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0})
    agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
    agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0})

    property_address = "Endereço a confirmar"
    if match.get("property_info") and match["property_info"].get("address"):
        property_address = match["property_info"]["address"]

    tokens = await _create_visit_action_tokens(
        visit.id, match_id, match["buyer_id"], match["agent_id"]
    )

    notifications_sent = {"buyer": False, "agent": False}

    buyer_email = (buyer or {}).get("email") or (buyer_user or {}).get("email")
    if buyer_email:
        notifications_sent["buyer"] = await send_visit_scheduled_with_actions(
            to_email=buyer_email,
            to_name=(buyer or {}).get("name", "Comprador"),
            visit_date=visit_data.visit_date,
            visit_time=visit_data.visit_time,
            property_address=property_address,
            confirm_url=_action_url(tokens["buyer_confirm"], "confirm"),
            reschedule_url=_action_url(tokens["buyer_reschedule"], "reschedule"),
            cancel_url=_action_url(tokens["buyer_cancel"], "cancel"),
        )

    agent_email = (agent or {}).get("email") or (agent_user or {}).get("email")
    if agent_email:
        notifications_sent["agent"] = await send_visit_scheduled_with_actions(
            to_email=agent_email,
            to_name=(agent or {}).get("name", "Corretor"),
            visit_date=visit_data.visit_date,
            visit_time=visit_data.visit_time,
            property_address=property_address,
            confirm_url=_action_url(tokens["agent_confirm"], "confirm"),
            reschedule_url=_action_url(tokens["agent_reschedule"], "reschedule"),
            cancel_url=_action_url(tokens["agent_cancel"], "cancel"),
        )

    # WhatsApp notification to buyer and agent
    try:
        from services.whatsapp_service import notify_visit_scheduled as _wa_visit
        buyer_phone = (buyer or {}).get("phone") or (buyer_user or {}).get("phone")
        agent_phone = (agent or {}).get("phone") or (agent_user or {}).get("phone")
        await _wa_visit(
            buyer_phone=buyer_phone,
            buyer_name=(buyer or {}).get("name", "Comprador"),
            buyer_id=match["buyer_id"],
            agent_phone=agent_phone,
            agent_name=(agent or {}).get("name", "Corretor"),
            agent_id=match["agent_id"],
            visit=doc,
            property_address=property_address,
        )
    except Exception as e:
        logger.error(f"WhatsApp visit notification failed: {e}")

    return {"status": "success", "visit_id": visit.id, "notifications_sent": notifications_sent}


@router.get("/curator/visits/{match_id}")
async def get_match_visits(match_id: str, current_user: dict = Depends(get_current_user)):
    """Get all visits for a match (with feedback attached)."""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    visits = await db.visits.find({"match_id": match_id}, {"_id": 0}).to_list(100)
    for v in visits:
        if isinstance(v.get("created_at"), str):
            v["created_at"] = datetime.fromisoformat(v["created_at"])
        scheduler = await db.users.find_one({"id": v["scheduled_by"]}, {"_id": 0})
        if scheduler:
            v["scheduled_by_name"] = scheduler.get("name")
        v["feedback"] = await db.visit_feedback.find_one({"visit_id": v["id"]}, {"_id": 0})
    return visits


@router.delete("/curator/visits/{visit_id}")
async def cancel_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    await db.visits.update_one({"id": visit_id}, {"$set": {"status": "cancelled"}})
    return {"status": "success", "message": "Visita cancelada"}


# ─── visit outcome ────────────────────────────────────────────────────────────

@router.post("/curator/visits/{visit_id}/outcome")
async def record_visit_outcome(
    visit_id: str,
    outcome_data: VisitOutcomeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mark visit as completed/no_show/cancelled and trigger feedback email if completed."""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    now = datetime.now(timezone.utc).isoformat()
    await db.visits.update_one(
        {"id": visit_id},
        {"$set": {
            "outcome": outcome_data.outcome,
            "outcome_notes": outcome_data.notes,
            "outcome_recorded_by": current_user["user_id"],
            "outcome_recorded_at": now,
        }}
    )

    feedback_sent = False
    if outcome_data.outcome == "completed":
        feedback_sent = await _send_feedback_request(visit)

    return {"status": "success", "feedback_email_sent": feedback_sent}


async def _send_feedback_request(visit: dict) -> bool:
    """Create feedback record and email buyer for post-visit impressions."""
    existing = await db.visit_feedback.find_one({"visit_id": visit["id"]}, {"_id": 0})
    if existing and existing.get("feedback_email_sent_to_buyer"):
        return False

    match = await db.matches.find_one({"id": visit["match_id"]}, {"_id": 0})
    if not match:
        return False

    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
    if not buyer or not buyer.get("email"):
        return False

    feedback_token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    property_address = (match.get("property_info") or {}).get("address", "Endereço do imóvel")

    if not existing:
        await db.visit_feedback.insert_one({
            "id": str(uuid.uuid4()),
            "visit_id": visit["id"],
            "match_id": visit["match_id"],
            "buyer_id": match["buyer_id"],
            "feedback_token": feedback_token,
            "feedback_token_expires_at": expires_at,
            "feedback_email_sent_to_buyer": False,
            "submitted_by_buyer": False,
            "impressions": None,
            "interest_level": None,
            "rejection_reason": None,
            "curator_notes": None,
            "curator_decision": None,
            "curator_decided_at": None,
            "curator_decided_by": None,
            "agent_rejection_email_sent": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        feedback_token = existing.get("feedback_token", feedback_token)

    sent = await send_post_visit_feedback_request(
        buyer_email=buyer["email"],
        buyer_name=buyer.get("name", "Comprador"),
        visit_date=visit["visit_date"],
        visit_time=visit["visit_time"],
        property_address=property_address,
        feedback_url=_feedback_url(feedback_token),
    )

    if sent:
        await db.visit_feedback.update_one(
            {"visit_id": visit["id"]},
            {"$set": {"feedback_email_sent_to_buyer": True}}
        )
        await db.visits.update_one({"id": visit["id"]}, {"$set": {"feedback_email_sent": True}})

    # WhatsApp feedback request (opens Flow B session)
    try:
        from services.whatsapp_service import notify_buyer_feedback_request
        buyer_user = await db.users.find_one({"user_id": match["buyer_id"]}, {"_id": 0}) if match else None
        buyer_phone = buyer.get("phone") or (buyer_user or {}).get("phone")
        if buyer_phone:
            await notify_buyer_feedback_request(
                buyer_phone=buyer_phone,
                buyer_name=buyer.get("name", "Comprador"),
                match_id=visit["match_id"],
                buyer_id=match["buyer_id"] if match else "",
                property_address=property_address,
            )
    except Exception as e:
        logger.error(f"WhatsApp feedback request failed: {e}")

    return sent


# ─── reschedule approval ──────────────────────────────────────────────────────

@router.put("/curator/visits/{visit_id}/approve-reschedule")
async def approve_reschedule(
    visit_id: str,
    data: ApproveRescheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Curator confirms new date → creates new visit, cancels old one, notifies parties."""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    old_visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not old_visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    match = await db.matches.find_one({"id": old_visit["match_id"]}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")

    # Cancel old visit
    await db.visits.update_one({"id": visit_id}, {"$set": {"status": "cancelled"}})

    # Create new visit
    new_visit = Visit(
        match_id=old_visit["match_id"],
        scheduled_by=current_user["user_id"],
        visit_date=data.new_date,
        visit_time=data.new_time,
        notes=data.notes,
    )
    new_doc = new_visit.model_dump()
    new_doc["created_at"] = new_doc["created_at"].isoformat()
    await db.visits.insert_one(new_doc)

    property_address = (match.get("property_info") or {}).get("address", "Endereço a confirmar")

    # Generate new tokens for the new visit
    tokens = await _create_visit_action_tokens(
        new_visit.id, old_visit["match_id"], match["buyer_id"], match["agent_id"]
    )

    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
    agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})

    notified = {"buyer": False, "agent": False}

    buyer_email = (buyer or {}).get("email")
    if buyer_email:
        notified["buyer"] = await send_visit_scheduled_with_actions(
            to_email=buyer_email,
            to_name=(buyer or {}).get("name", "Comprador"),
            visit_date=data.new_date,
            visit_time=data.new_time,
            property_address=property_address,
            confirm_url=_action_url(tokens["buyer_confirm"], "confirm"),
            reschedule_url=_action_url(tokens["buyer_reschedule"], "reschedule"),
            cancel_url=_action_url(tokens["buyer_cancel"], "cancel"),
        )

    agent_email = (agent or {}).get("email")
    if agent_email:
        notified["agent"] = await send_visit_scheduled_with_actions(
            to_email=agent_email,
            to_name=(agent or {}).get("name", "Corretor"),
            visit_date=data.new_date,
            visit_time=data.new_time,
            property_address=property_address,
            confirm_url=_action_url(tokens["agent_confirm"], "confirm"),
            reschedule_url=_action_url(tokens["agent_reschedule"], "reschedule"),
            cancel_url=_action_url(tokens["agent_cancel"], "cancel"),
        )

    # WhatsApp notification to buyer and agent (reagendamento aprovado)
    try:
        from services.whatsapp_service import notify_visit_scheduled as _wa_visit
        buyer_phone = (buyer or {}).get("phone")
        agent_phone = (agent or {}).get("phone")
        if not buyer_phone:
            buyer_u = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0})
            buyer_phone = (buyer_u or {}).get("phone")
        if not agent_phone:
            agent_u = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0})
            agent_phone = (agent_u or {}).get("phone")
        await _wa_visit(
            buyer_phone=buyer_phone,
            buyer_name=(buyer or {}).get("name", "Comprador"),
            buyer_id=match["buyer_id"],
            agent_phone=agent_phone,
            agent_name=(agent or {}).get("name", "Corretor"),
            agent_id=match["agent_id"],
            visit=new_doc,
            property_address=property_address,
        )
    except Exception as e:
        logger.error(f"WhatsApp reschedule approval notification failed: {e}")

    return {"status": "success", "new_visit_id": new_visit.id, "notifications_sent": notified}


# ─── feedback endpoints (curator view / override) ─────────────────────────────

@router.post("/curator/visits/{visit_id}/curator-feedback")
async def curator_feedback_override(
    visit_id: str,
    data: CuratorFeedbackOverride,
    current_user: dict = Depends(get_current_user)
):
    """Curator fills in buyer feedback when buyer hasn't submitted it."""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    now = datetime.now(timezone.utc).isoformat()
    existing = await db.visit_feedback.find_one({"visit_id": visit_id}, {"_id": 0})

    update = {
        "curator_notes": data.impressions,
        "interest_level": data.interest_level,
        "rejection_reason": data.rejection_reason,
        "curator_decided_at": now,
        "curator_decided_by": current_user["user_id"],
    }

    if existing:
        await db.visit_feedback.update_one({"visit_id": visit_id}, {"$set": update})
    else:
        match = await db.matches.find_one({"id": visit["match_id"]}, {"_id": 0})
        await db.visit_feedback.insert_one({
            "id": str(uuid.uuid4()),
            "visit_id": visit_id,
            "match_id": visit["match_id"],
            "buyer_id": (match or {}).get("buyer_id", ""),
            "submitted_by_buyer": False,
            "feedback_email_sent_to_buyer": False,
            "agent_rejection_email_sent": False,
            "created_at": now,
            **update,
        })

    return {"status": "success"}


@router.post("/curator/visits/{visit_id}/approve-rejection")
async def approve_buyer_rejection(
    visit_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve buyer rejection → notify agent."""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    feedback = await db.visit_feedback.find_one({"visit_id": visit_id}, {"_id": 0})
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")
    if feedback.get("interest_level") != "not_interested":
        raise HTTPException(status_code=400, detail="Comprador não rejeitou o match")
    if feedback.get("agent_rejection_email_sent"):
        raise HTTPException(status_code=400, detail="Notificação já enviada ao corretor")

    match = await db.matches.find_one({"id": visit["match_id"]}, {"_id": 0})
    agent = await db.agents.find_one({"user_id": (match or {}).get("agent_id", "")}, {"_id": 0})
    buyer = await db.buyers.find_one({"user_id": (match or {}).get("buyer_id", "")}, {"_id": 0})

    now = datetime.now(timezone.utc).isoformat()
    await db.visit_feedback.update_one(
        {"visit_id": visit_id},
        {"$set": {
            "curator_decision": "approved_rejection",
            "curator_decided_at": now,
            "curator_decided_by": current_user["user_id"],
        }}
    )

    property_address = (match.get("property_info") or {}).get("address", "Imóvel do match") if match else "Imóvel do match"
    email_sent = False

    if agent and agent.get("email"):
        email_sent = await send_match_rejection_to_agent(
            agent_email=agent["email"],
            agent_name=agent.get("name", "Corretor"),
            buyer_name=(buyer or {}).get("name", "Comprador"),
            rejection_reason=feedback.get("rejection_reason") or feedback.get("impressions", ""),
            property_address=property_address,
        )
        if email_sent:
            await db.visit_feedback.update_one(
                {"visit_id": visit_id},
                {"$set": {"agent_rejection_email_sent": True}}
            )

    # WhatsApp notification to agent
    try:
        from services.whatsapp_service import notify_agent_match_rejected
        agent_user = await db.users.find_one({"id": (match or {}).get("agent_id", "")}, {"_id": 0})
        agent_phone = (agent or {}).get("phone") or (agent_user or {}).get("phone")
        if agent_phone:
            await notify_agent_match_rejected(
                agent_phone=agent_phone,
                agent_name=(agent or {}).get("name", "Corretor"),
                buyer_name=(buyer or {}).get("name", "Comprador"),
                property_address=property_address,
            )
    except Exception as e:
        logger.error(f"WhatsApp agent rejection notification failed: {e}")

    return {"status": "success", "agent_notified": email_sent}


# ─── sold ─────────────────────────────────────────────────────────────────────

@router.patch("/curator/matches/{match_id}/sold")
async def mark_match_as_sold(
    match_id: str,
    sold_data: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Apenas curadores podem marcar vendas")

    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match não encontrado")

    sold_through_platform = sold_data.get("sold_through_platform", False)
    update_data = {
        "sold_through_platform": sold_through_platform,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if sold_through_platform:
        update_data["sold_at"] = datetime.now(timezone.utc).isoformat()
    else:
        update_data["sold_at"] = None

    await db.matches.update_one({"id": match_id}, {"$set": update_data})
    logger.info(f"Match {match_id} sold_through_platform={sold_through_platform} by {current_user['user_id']}")
    return {"status": "success", "message": "Venda registrada com sucesso" if sold_through_platform else "Marcação removida"}


# ─── public token-action endpoint (no auth) ───────────────────────────────────

@router.get("/visits/token-info/{token}")
async def get_visit_token_info(token: str):
    """Return visit context for a given action token (no auth, used by public pages)."""
    token_doc = await db.visit_actions.find_one({"token": token}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Link inválido ou expirado")
    if token_doc["used"]:
        raise HTTPException(status_code=400, detail="Este link já foi utilizado")
    if datetime.fromisoformat(token_doc["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expirado")

    visit = await db.visits.find_one({"id": token_doc["visit_id"]}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    match = await db.matches.find_one({"id": token_doc["match_id"]}, {"_id": 0})
    property_address = (match.get("property_info") or {}).get("address", "Endereço a confirmar") if match else "Endereço a confirmar"

    return {
        "action": token_doc["action"],
        "actor_type": token_doc["actor_type"],
        "visit_date": visit["visit_date"],
        "visit_time": visit["visit_time"],
        "property_address": property_address,
        "visit_status": visit["status"],
        "visit_id": visit["id"],
    }


@router.post("/visits/token-action")
async def process_visit_token_action(action_data: VisitTokenActionRequest):
    """Process confirm/cancel/reschedule via token — no auth required."""
    token_doc = await db.visit_actions.find_one({"token": action_data.token}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=404, detail="Link inválido ou expirado")
    if token_doc["used"]:
        raise HTTPException(status_code=400, detail="Este link já foi utilizado")
    if datetime.fromisoformat(token_doc["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expirado")
    if token_doc["action"] != action_data.action:
        raise HTTPException(status_code=400, detail="Ação inválida para este link")

    visit = await db.visits.find_one({"id": token_doc["visit_id"]}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    match = await db.matches.find_one({"id": token_doc["match_id"]}, {"_id": 0})
    actor_type = token_doc["actor_type"]
    now = datetime.now(timezone.utc).isoformat()

    if action_data.action == "confirm":
        if actor_type == "buyer":
            await db.visits.update_one(
                {"id": visit["id"]},
                {"$set": {"buyer_confirmed": True, "buyer_confirmed_at": now}}
            )
        else:
            await db.visits.update_one(
                {"id": visit["id"]},
                {"$set": {"agent_confirmed": True, "agent_confirmed_at": now}}
            )

        # Notify curator
        if match:
            curator_user = await db.users.find_one({"id": match.get("curator_id", "")}, {"_id": 0})
            if curator_user and curator_user.get("email"):
                actor_name = ""
                if actor_type == "buyer":
                    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
                    actor_name = (buyer or {}).get("name", "Comprador")
                else:
                    agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
                    actor_name = (agent or {}).get("name", "Corretor")

                property_address = (match.get("property_info") or {}).get("address", "Endereço a confirmar")
                await send_visit_confirmed_to_curator(
                    curator_email=curator_user["email"],
                    curator_name=curator_user.get("name", "Curador"),
                    actor_name=actor_name,
                    actor_type=actor_type,
                    visit_date=visit["visit_date"],
                    visit_time=visit["visit_time"],
                    property_address=property_address,
                )

                # WhatsApp notification to curator
                try:
                    from services.whatsapp_service import notify_curator_visit_confirmed
                    curator_phone = curator_user.get("phone")
                    if curator_phone:
                        await notify_curator_visit_confirmed(
                            curator_phone=curator_phone,
                            curator_name=curator_user.get("name", "Curador"),
                            actor_name=actor_name,
                            actor_type=actor_type,
                            visit_date=visit["visit_date"],
                            visit_time=visit["visit_time"],
                            property_address=property_address,
                        )
                except Exception as e:
                    logger.error(f"WhatsApp curator confirmation notification failed: {e}")

    elif action_data.action == "cancel":
        await db.visits.update_one({"id": visit["id"]}, {"$set": {"status": "cancelled"}})

    elif action_data.action == "reschedule":
        reschedule_request = {
            "requested_by_type": actor_type,
            "requested_by_id": token_doc["actor_id"],
            "reason": action_data.reason or "",
            "proposed_date": action_data.proposed_date,
            "proposed_time": action_data.proposed_time,
            "requested_at": now,
        }
        await db.visits.update_one(
            {"id": visit["id"]},
            {"$set": {"status": "rescheduling", "reschedule_request": reschedule_request}}
        )

        # Notify curator + the other party
        if match:
            property_address = (match.get("property_info") or {}).get("address", "Endereço a confirmar")

            to_emails = []
            to_names = []

            curator_user = await db.users.find_one({"id": match.get("curator_id", "")}, {"_id": 0})
            if curator_user and curator_user.get("email"):
                to_emails.append(curator_user["email"])
                to_names.append(curator_user.get("name", "Curador"))

            requester_name = ""
            if actor_type == "buyer":
                buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
                requester_name = (buyer or {}).get("name", "Comprador")
                # Also notify agent
                agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
                if agent and agent.get("email"):
                    to_emails.append(agent["email"])
                    to_names.append(agent.get("name", "Corretor"))
            else:
                agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
                requester_name = (agent or {}).get("name", "Corretor")
                # Also notify buyer
                buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
                if buyer and buyer.get("email"):
                    to_emails.append(buyer["email"])
                    to_names.append(buyer.get("name", "Comprador"))

            if to_emails:
                await send_reschedule_request_notification(
                    to_emails=to_emails,
                    to_names=to_names,
                    requester_name=requester_name,
                    requester_type=actor_type,
                    visit_date=visit["visit_date"],
                    visit_time=visit["visit_time"],
                    property_address=property_address,
                    reason=action_data.reason or "",
                    proposed_date=action_data.proposed_date,
                    proposed_time=action_data.proposed_time,
                )

            # WhatsApp notification for reschedule request
            try:
                from services.whatsapp_service import notify_reschedule_requested
                wa_targets = []
                if curator_user and curator_user.get("phone"):
                    wa_targets.append((curator_user["phone"], curator_user.get("name", "Curador")))
                if actor_type == "buyer" and agent and agent.get("phone"):
                    wa_targets.append((agent["phone"], agent.get("name", "Corretor")))
                elif actor_type == "agent" and buyer and buyer.get("phone"):
                    wa_targets.append((buyer["phone"], buyer.get("name", "Comprador")))
                if wa_targets:
                    await notify_reschedule_requested(
                        phones_names=wa_targets,
                        requester_name=requester_name,
                        reason=action_data.reason or "",
                        proposed_date=action_data.proposed_date,
                        property_address=property_address,
                    )
            except Exception as e:
                logger.error(f"WhatsApp reschedule notification failed: {e}")

    # Mark token as used
    await db.visit_actions.update_one(
        {"token": action_data.token},
        {"$set": {"used": True, "used_at": now}}
    )

    return {"status": "success", "action": action_data.action}


# ─── feedback token endpoint (public) ─────────────────────────────────────────

@router.get("/visits/feedback-info/{token}")
async def get_feedback_token_info(token: str):
    """Return context for feedback form (no auth)."""
    feedback = await db.visit_feedback.find_one({"feedback_token": token}, {"_id": 0})
    if not feedback:
        raise HTTPException(status_code=404, detail="Link inválido ou expirado")

    expires_at = feedback.get("feedback_token_expires_at")
    if expires_at and datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expirado")

    if feedback.get("submitted_by_buyer"):
        raise HTTPException(status_code=400, detail="Feedback já enviado")

    visit = await db.visits.find_one({"id": feedback["visit_id"]}, {"_id": 0})
    match = await db.matches.find_one({"id": feedback["match_id"]}, {"_id": 0})
    property_address = (match.get("property_info") or {}).get("address", "Imóvel visitado") if match else "Imóvel visitado"

    return {
        "visit_date": (visit or {}).get("visit_date", ""),
        "visit_time": (visit or {}).get("visit_time", ""),
        "property_address": property_address,
        "already_submitted": False,
    }


@router.post("/visits/feedback/{token}")
async def submit_visit_feedback(token: str, data: VisitFeedbackSubmit):
    """Buyer submits post-visit feedback (no auth, via token)."""
    feedback = await db.visit_feedback.find_one({"feedback_token": token}, {"_id": 0})
    if not feedback:
        raise HTTPException(status_code=404, detail="Link inválido ou expirado")

    expires_at = feedback.get("feedback_token_expires_at")
    if expires_at and datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expirado")

    if feedback.get("submitted_by_buyer"):
        raise HTTPException(status_code=400, detail="Feedback já enviado")

    now = datetime.now(timezone.utc).isoformat()
    await db.visit_feedback.update_one(
        {"feedback_token": token},
        {"$set": {
            "impressions": data.impressions,
            "interest_level": data.interest_level,
            "rejection_reason": data.rejection_reason,
            "submitted_by_buyer": True,
            "buyer_submitted_at": now,
        }}
    )
    return {"status": "success"}


# ─── visits for buyer/agent dashboards ───────────────────────────────────────

@router.get("/buyer/my-visits")
async def buyer_my_visits(current_user: dict = Depends(get_current_user)):
    """Return all visits for the logged-in buyer with match and feedback context."""
    if current_user["role"] != "buyer":
        raise HTTPException(status_code=403, detail="Acesso negado")

    matches = await db.matches.find({"buyer_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    result = []
    for match in matches:
        visits = await db.visits.find({"match_id": match["id"]}, {"_id": 0}).to_list(10)
        for v in visits:
            v["match_id"] = match["id"]
            v["property_info"] = match.get("property_info")
            v["agent"] = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
            v["feedback"] = await db.visit_feedback.find_one({"visit_id": v["id"]}, {"_id": 0})
            result.append(v)
    return result


@router.get("/agent/my-visits")
async def agent_my_visits(current_user: dict = Depends(get_current_user)):
    """Return all visits for the logged-in agent with match and feedback context."""
    if current_user["role"] != "agent":
        raise HTTPException(status_code=403, detail="Acesso negado")

    matches = await db.matches.find({"agent_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    result = []
    for match in matches:
        visits = await db.visits.find({"match_id": match["id"]}, {"_id": 0}).to_list(10)
        for v in visits:
            v["match_id"] = match["id"]
            v["property_info"] = match.get("property_info")
            buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
            v["buyer"] = buyer
            v["feedback"] = await db.visit_feedback.find_one({"visit_id": v["id"]}, {"_id": 0})
            result.append(v)
    return result


# ─── cron: visit reminders ────────────────────────────────────────────────────

@router.post("/internal/send-visit-reminders")
async def send_visit_reminders(request: Request):
    """Internal: send 2h reminders and post-visit feedback emails."""
    internal_key = request.headers.get("X-Internal-Key")
    expected_key = os.environ.get("INTERNAL_API_KEY")

    if expected_key and internal_key != expected_key:
        logger.warning("Unauthorized attempt to call send-visit-reminders")
        raise HTTPException(status_code=401, detail="Unauthorized")

    from services.email_service import send_visit_notification

    now = datetime.now(timezone.utc)

    # Silencia notificações fora do horário 07h–21h (horário de Brasília, UTC-3)
    brasilia_hour = now.astimezone(timezone(timedelta(hours=-3))).hour
    if not (7 <= brasilia_hour < 21):
        logger.info(f"Skipping reminders — outside quiet hours (Brasília {brasilia_hour}h)")
        return {"status": "skipped", "reason": "outside_quiet_hours", "brasilia_hour": brasilia_hour}

    logger.info(f"Starting visit reminders check at {now.isoformat()}")

    visits = await db.visits.find({
        "status": "scheduled",
        "reminder_2h_sent": {"$ne": True}
    }, {"_id": 0}).to_list(100)

    reminders_sent = 0
    errors = 0

    for visit in visits:
        try:
            visit_datetime_str = f"{visit['visit_date']} {visit['visit_time']}"
            visit_datetime = datetime.strptime(visit_datetime_str, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            time_diff = visit_datetime - now

            if timedelta(hours=0) <= time_diff <= timedelta(hours=2, minutes=15):
                match = await db.matches.find_one({"id": visit["match_id"]}, {"_id": 0})
                if match:
                    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
                    agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
                    property_address = (match.get("property_info") or {}).get("address", "Endereço a confirmar")

                    buyer_sent = agent_sent = False
                    if buyer and buyer.get("email"):
                        buyer_sent = await send_visit_notification(
                            buyer["email"], buyer.get("name", "Comprador"),
                            visit["visit_date"], visit["visit_time"], property_address, is_2h_reminder=True
                        )
                    if agent and agent.get("email"):
                        agent_sent = await send_visit_notification(
                            agent["email"], agent.get("name", "Corretor"),
                            visit["visit_date"], visit["visit_time"], property_address, is_2h_reminder=True
                        )

                    if buyer_sent or agent_sent:
                        await db.visits.update_one(
                            {"id": visit["id"]},
                            {"$set": {"reminder_2h_sent": True, "reminder_sent_at": now.isoformat()}}
                        )
                        reminders_sent += 1

                    # WhatsApp 2h reminder
                    try:
                        from services.whatsapp_service import notify_visit_reminder
                        await notify_visit_reminder(
                            buyer_phone=(buyer or {}).get("phone"),
                            buyer_name=(buyer or {}).get("name", "Comprador"),
                            agent_phone=(agent or {}).get("phone"),
                            agent_name=(agent or {}).get("name", "Corretor"),
                            visit_date=visit["visit_date"],
                            visit_time=visit["visit_time"],
                            property_address=property_address,
                        )
                    except Exception as e:
                        logger.error(f"WhatsApp visit reminder failed: {e}")
        except Exception as e:
            errors += 1
            logger.error(f"Error processing visit {visit.get('id', '?')}: {e}")

    # Post-visit feedback: send email if visit passed 24h and no feedback email sent yet
    past_visits = await db.visits.find({
        "status": "scheduled",
        "feedback_email_sent": {"$ne": True},
    }, {"_id": 0}).to_list(200)

    feedback_sent_count = 0
    for visit in past_visits:
        try:
            visit_datetime_str = f"{visit['visit_date']} {visit['visit_time']}"
            visit_dt = datetime.strptime(visit_datetime_str, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            if now - visit_dt >= timedelta(hours=24):
                sent = await _send_feedback_request(visit)
                if sent:
                    feedback_sent_count += 1
        except Exception as e:
            logger.error(f"Error sending feedback email for visit {visit.get('id', '?')}: {e}")

    result = {
        "status": "success",
        "checked_at": now.isoformat(),
        "reminders_sent": reminders_sent,
        "feedback_emails_sent": feedback_sent_count,
        "errors": errors,
    }
    logger.info(f"Reminders completed: {result}")
    return result
