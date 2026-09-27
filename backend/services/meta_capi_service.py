"""
Meta Conversions API (CAPI) — server-side event tracking.

Complements the client-side Meta Pixel: the same `event_id` is used on both
sides so Meta deduplicates the two signals into a single event. Should only
go live after the cookie-consent banner (Fase 2) is published and verified —
firing this without real user consent duplicates the same problem CAPI is
meant to make more reliable, just on the server instead of the browser.
"""
import httpx
import hashlib
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

GRAPH_BASE = "https://graph.facebook.com/v19.0"

_PIXEL_ID = lambda: os.environ.get("META_PIXEL_ID", "")
_ACCESS_TOKEN = lambda: os.environ.get("META_CAPI_ACCESS_TOKEN", "")


def _hash(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()


async def send_capi_event(
    event_name: str,
    event_id: str,
    client_ip: str = None,
    user_agent: str = None,
    email: str = None,
    phone: str = None,
    custom_data: dict = None,
) -> bool:
    """Send a server-side event to the Meta Conversions API.

    `event_id` must match the client-side Pixel event's `eventID` for the
    same conversion, so Meta deduplicates them.
    """
    pixel_id = _PIXEL_ID()
    access_token = _ACCESS_TOKEN()
    if not pixel_id or not access_token:
        logger.info("Meta CAPI not configured (missing META_PIXEL_ID/META_CAPI_ACCESS_TOKEN) — skipping")
        return False

    user_data = {}
    if email:
        user_data["em"] = [_hash(email)]
    if phone:
        user_data["ph"] = [_hash(phone)]
    if client_ip:
        user_data["client_ip_address"] = client_ip
    if user_agent:
        user_data["client_user_agent"] = user_agent

    payload = {
        "data": [{
            "event_name": event_name,
            "event_time": int(datetime.now(timezone.utc).timestamp()),
            "event_id": event_id,
            "action_source": "website",
            "user_data": user_data,
            **({"custom_data": custom_data} if custom_data else {}),
        }]
    }

    url = f"{GRAPH_BASE}/{pixel_id}/events"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, params={"access_token": access_token})
            if resp.status_code not in (200, 201):
                logger.error(f"Meta CAPI error {resp.status_code}: {resp.text[:300]}")
                return False
            return True
    except Exception as e:
        logger.error(f"Meta CAPI send error: {e}")
        return False
