"""
Curator routes
Handles curation decisions, follow-ups, and visit scheduling
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
import uuid
import logging
import os

from database import db
from auth import get_current_user
from models.schemas import (
    CurationDecision, FollowUpCreate, FollowUp,
    Visit, ScheduleVisitRequest
)
from services.email_service import (
    send_match_approved_buyer_email,
    send_match_approved_agent_email,
    send_visit_notification
)

router = APIRouter(tags=["curator"])
logger = logging.getLogger(__name__)


@router.get("/curator/pending-matches")
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
        buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0, "password": 0})
        if buyer:
            if not buyer.get("phone") and buyer_user and buyer_user.get("phone"):
                buyer["phone"] = buyer_user["phone"]
            match['buyer'] = buyer
        
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0, "password": 0})
        if agent:
            if not agent.get("phone") and agent_user and agent_user.get("phone"):
                agent["phone"] = agent_user["phone"]
            match['agent'] = agent
    
    return matches


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
        {
            "$set": {
                "status": new_status,
                "curator_id": current_user["user_id"],
                "curator_notes": decision.notes,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if decision.approved:
        buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        
        email_results = {"buyer": False, "agent": False}
        
        if buyer and buyer.get("email"):
            email_results["buyer"] = await send_match_approved_buyer_email(
                buyer_email=buyer["email"],
                buyer_name=buyer.get("name", "Comprador"),
                ai_compatibility=match.get("ai_compatibility"),
                property_info=match.get("property_info")
            )
        
        if agent and agent.get("email"):
            email_results["agent"] = await send_match_approved_agent_email(
                agent_email=agent["email"],
                agent_name=agent.get("name", "Corretor"),
                buyer_name=buyer.get("name", "Comprador") if buyer else "Comprador"
            )
        
        return {
            "status": "success",
            "match_status": new_status,
            "emails_sent": email_results
        }
    
    return {"status": "success", "match_status": new_status}


@router.get("/curator/my-matches")
async def get_curator_matches(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if current_user["role"] == "admin":
        matches = await db.matches.find({"status": {"$in": ["approved", "visit_scheduled", "completed"]}}, {"_id": 0}).to_list(1000)
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
        buyer_user = await db.users.find_one({"id": match["buyer_id"]}, {"_id": 0, "password": 0})
        if buyer:
            if not buyer.get("phone") and buyer_user and buyer_user.get("phone"):
                buyer["phone"] = buyer_user["phone"]
            match['buyer'] = buyer
        
        agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
        agent_user = await db.users.find_one({"id": match["agent_id"]}, {"_id": 0, "password": 0})
        if agent:
            if not agent.get("phone") and agent_user and agent_user.get("phone"):
                agent["phone"] = agent_user["phone"]
            match['agent'] = agent
        
        visits = await db.visits.find({"match_id": match["id"]}, {"_id": 0}).to_list(10)
        match['visits'] = visits
    
    return matches


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
    doc['created_at'] = doc['created_at'].isoformat()
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
    
    if current_user["role"] == "admin":
        followups = await db.followups.find({"match_id": match_id}, {"_id": 0}).to_list(100)
    else:
        followups = await db.followups.find(
            {"match_id": match_id, "curator_id": current_user["user_id"]},
            {"_id": 0}
        ).to_list(100)
    
    for followup in followups:
        if isinstance(followup.get('created_at'), str):
            followup['created_at'] = datetime.fromisoformat(followup['created_at'])
        
        curator = await db.users.find_one({"id": followup["curator_id"]}, {"_id": 0})
        if curator:
            followup['curator_name'] = curator.get('name')
    
    return followups


@router.post("/curator/schedule-visit/{match_id}")
async def schedule_visit(match_id: str, visit_data: ScheduleVisitRequest, current_user: dict = Depends(get_current_user)):
    """Schedule a property visit and notify buyer and agent"""
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
    doc['created_at'] = doc['created_at'].isoformat()
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


@router.get("/curator/visits/{match_id}")
async def get_match_visits(match_id: str, current_user: dict = Depends(get_current_user)):
    """Get all visits for a match"""
    if current_user["role"] not in ["curator", "admin"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    visits = await db.visits.find({"match_id": match_id}, {"_id": 0}).to_list(100)
    
    for visit in visits:
        if isinstance(visit.get('created_at'), str):
            visit['created_at'] = datetime.fromisoformat(visit['created_at'])
        
        scheduler = await db.users.find_one({"id": visit["scheduled_by"]}, {"_id": 0})
        if scheduler:
            visit['scheduled_by_name'] = scheduler.get('name')
    
    return visits


@router.delete("/curator/visits/{visit_id}")
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


@router.patch("/curator/matches/{match_id}/sold")
async def mark_match_as_sold(
    match_id: str,
    sold_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a match as sold through the platform.
    Only curators and admins can access this endpoint.
    """
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
    
    await db.matches.update_one(
        {"id": match_id},
        {"$set": update_data}
    )
    
    logger.info(f"Match {match_id} marked as sold_through_platform={sold_through_platform} by {current_user['user_id']}")
    
    return {
        "status": "success", 
        "message": "Venda registrada com sucesso" if sold_through_platform else "Marcação de venda removida"
    }



async def send_visit_reminders(request: Request):
    """
    Internal endpoint to send 2h visit reminders - call this from an external scheduler.
    
    Security: Validates INTERNAL_API_KEY header to prevent unauthorized access.
    
    Usage with cron (example using curl):
    */15 * * * * curl -X POST https://your-domain.com/api/internal/send-visit-reminders -H "X-Internal-Key: your-secret-key"
    
    Or use services like:
    - cron-job.org (free)
    - EasyCron
    - AWS EventBridge + Lambda
    - Google Cloud Scheduler
    """
    # Validate internal API key (optional security layer)
    internal_key = request.headers.get("X-Internal-Key")
    expected_key = os.environ.get("INTERNAL_API_KEY")
    
    if expected_key and internal_key != expected_key:
        logger.warning("Unauthorized attempt to call send-visit-reminders endpoint")
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    now = datetime.now(timezone.utc)
    logger.info(f"Starting visit reminders check at {now.isoformat()}")
    
    # Find visits scheduled that haven't received 2h reminder yet
    visits = await db.visits.find({
        "status": "scheduled",
        "reminder_2h_sent": {"$ne": True}
    }, {"_id": 0}).to_list(100)
    
    logger.info(f"Found {len(visits)} scheduled visits to check")
    
    reminders_sent = 0
    errors = 0
    
    for visit in visits:
        try:
            visit_datetime_str = f"{visit['visit_date']} {visit['visit_time']}"
            visit_datetime = datetime.strptime(visit_datetime_str, "%Y-%m-%d %H:%M")
            visit_datetime = visit_datetime.replace(tzinfo=timezone.utc)
            
            time_diff = visit_datetime - now
            
            # Send reminder if visit is between now and 2h15m from now
            if timedelta(hours=0) <= time_diff <= timedelta(hours=2, minutes=15):
                match = await db.matches.find_one({"id": visit["match_id"]}, {"_id": 0})
                if match:
                    buyer = await db.buyers.find_one({"user_id": match["buyer_id"]}, {"_id": 0})
                    agent = await db.agents.find_one({"user_id": match["agent_id"]}, {"_id": 0})
                    
                    property_address = match.get("property_info", {}).get("address", "Endereço a confirmar")
                    
                    buyer_sent = False
                    agent_sent = False
                    
                    if buyer and buyer.get("email"):
                        buyer_sent = await send_visit_notification(
                            to_email=buyer["email"],
                            to_name=buyer.get("name", "Comprador"),
                            visit_date=visit["visit_date"],
                            visit_time=visit["visit_time"],
                            property_address=property_address,
                            is_2h_reminder=True
                        )
                    
                    if agent and agent.get("email"):
                        agent_sent = await send_visit_notification(
                            to_email=agent["email"],
                            to_name=agent.get("name", "Corretor"),
                            visit_date=visit["visit_date"],
                            visit_time=visit["visit_time"],
                            property_address=property_address,
                            is_2h_reminder=True
                        )
                    
                    # Mark as sent if at least one email was successful
                    if buyer_sent or agent_sent:
                        await db.visits.update_one(
                            {"id": visit["id"]},
                            {"$set": {"reminder_2h_sent": True, "reminder_sent_at": now.isoformat()}}
                        )
                        reminders_sent += 1
                        logger.info(f"Sent 2h reminder for visit {visit['id']} - buyer: {buyer_sent}, agent: {agent_sent}")
        except Exception as e:
            errors += 1
            logger.error(f"Error sending reminder for visit {visit.get('id', 'unknown')}: {str(e)}")
    
    result = {
        "status": "success",
        "checked_at": now.isoformat(),
        "visits_checked": len(visits),
        "reminders_sent": reminders_sent,
        "errors": errors
    }
    
    logger.info(f"Visit reminders completed: {result}")
    return result
