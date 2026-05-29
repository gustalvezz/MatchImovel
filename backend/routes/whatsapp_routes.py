"""
WhatsApp webhook receiver and conversation state machine.

Flows:
  A — buyer_capture   : new lead collection for buyers
  B — match_feedback  : post-match notification + buyer feedback
  C — agent_property  : agent registers property, AI discovers buyers, creates match
  V — visit           : confirm / reschedule / cancel (buyer & agent)
"""
from fastapi import APIRouter, Request, Query, BackgroundTasks
from datetime import datetime, timezone
import logging
import uuid
import re
import os
import secrets

from database import db
import services.whatsapp_service as ws

router = APIRouter(tags=["whatsapp"])
logger = logging.getLogger(__name__)

GREETINGS = {
    "oi", "olá", "ola", "oie", "opa",
    "bom dia", "boa tarde", "boa noite",
    "start", "iniciar", "comecar", "começar",
    "hello", "hi", "hey",
}


# ── Webhook verification ───────────────────────────────────────────────────────

@router.get("/webhooks/whatsapp")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    verify_token = os.environ.get("WHATSAPP_VERIFY_TOKEN", "")
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return int(hub_challenge)
    return {"status": "forbidden"}


# ── Inbound handler ────────────────────────────────────────────────────────────

@router.post("/webhooks/whatsapp")
async def receive_message(request: Request, background_tasks: BackgroundTasks):
    """Meta requires HTTP 200 within 5 s; actual processing runs in background."""
    try:
        body = await request.json()
        entry = body.get("entry", [{}])[0]
        change = entry.get("changes", [{}])[0]
        value = change.get("value", {})

        if "messages" not in value:
            return {"status": "ok"}

        msg = value["messages"][0]
        phone: str = msg["from"]
        msg_type: str = msg.get("type", "text")

        content = ""
        if msg_type == "text":
            content = msg.get("text", {}).get("body", "").strip()
        elif msg_type == "interactive":
            interactive = msg.get("interactive", {})
            if interactive.get("type") == "button_reply":
                content = interactive["button_reply"]["id"]
            elif interactive.get("type") == "list_reply":
                content = interactive["list_reply"]["id"]

        session = await ws.get_session(phone)
        background_tasks.add_task(_dispatch, phone, msg_type, content, session)

    except Exception as e:
        logger.error(f"WhatsApp receive error: {e}")

    return {"status": "ok"}


# ── Dispatcher ─────────────────────────────────────────────────────────────────

async def _dispatch(phone: str, msg_type: str, content: str, session: dict | None):
    try:
        if session:
            flow = session.get("flow")
            if flow == "buyer_capture":
                await _handle_buyer(phone, content, session)
            elif flow == "match_feedback":
                await _handle_match_feedback(phone, content, session)
            elif flow == "agent_property":
                await _handle_agent(phone, content, session)
            elif flow == "visit":
                await _handle_visit(phone, content, session)
            else:
                await ws.close_session(phone)
                await _start_identification(phone)
            return

        if content.lower().strip() in GREETINGS or not content.strip():
            await _start_identification(phone)
        else:
            await ws.send_text(phone, "Envie *Oi* para começar. 😊")

    except Exception as e:
        logger.error(f"Dispatch error for {phone}: {e}")
        await ws.send_text(phone,
            "Ocorreu um erro inesperado. Envie *Oi* para tentar novamente.")


async def _start_identification(phone: str):
    user, role = await ws.identify_user(phone)

    if user:
        visits = await _get_scheduled_visits(user["id"], role or "buyer")
        if visits:
            await ws.upsert_session(phone, {
                "flow": "visit",
                "state": "V_SHOW_VISITS",
                "user_id": user["id"],
                "role": role or "buyer",
                "data": {},
            })
            await _show_visits(phone, visits)
            return

        if role == "agent":
            await ws.upsert_session(phone, {
                "flow": "agent_property",
                "state": "C_START",
                "user_id": user["id"],
                "role": "agent",
                "data": {},
            })
            await ws.send_text(phone,
                f"Olá, *{user.get('name', 'Corretor')}*! 👋\n\n"
                "Me descreva o imóvel que você quer apresentar a compradores. "
                "Inclua localização, diferenciais, área, quartos e qualquer detalhe importante."
            )
            return

    # Unknown user or buyer → start capture
    await ws.upsert_session(phone, {
        "flow": "buyer_capture",
        "state": "A_START",
        "user_id": user["id"] if user else None,
        "role": role,
        "data": {"phone": phone},
    })
    await ws.send_text(phone,
        "Olá! Sou o assistente do *MatchImovel* 🏠\n\n"
        "Vou te ajudar a cadastrar seu interesse para encontrarmos o imóvel ideal.\n\n"
        "Qual é o seu *nome*?"
    )


async def _get_scheduled_visits(user_id: str, role: str) -> list[dict]:
    match_field = "buyer_id" if role == "buyer" else "agent_id"
    matches = await db.matches.find(
        {match_field: user_id, "status": "visit_scheduled"},
        {"_id": 0, "id": 1, "property_info": 1},
    ).to_list(20)
    if not matches:
        return []

    match_map = {m["id"]: m for m in matches}
    visits = await db.visits.find(
        {"match_id": {"$in": list(match_map)}, "status": "scheduled"},
        {"_id": 0},
    ).to_list(10)

    for v in visits:
        pi = (match_map.get(v["match_id"]) or {}).get("property_info") or {}
        v["property_address"] = pi.get("address", "Endereço a confirmar")

    return visits


# ── Flow A — Buyer capture ─────────────────────────────────────────────────────

_PT_LABELS = {
    "apartamento": "Apartamento", "casa": "Casa",
    "casa_condominio": "Casa de condomínio", "terreno": "Terreno",
    "studio_loft": "Studio/Loft", "sala_comercial": "Sala comercial",
}
_BUDGET_LABELS = {
    "ate_400k": "até R$ 400k", "400k_550k": "R$ 400–550k",
    "550k_700k": "R$ 550–700k", "700k_800k": "R$ 700–800k",
    "800k_1500k": "R$ 800k–1,5mi", "acima_1500k": "acima R$ 1,5mi",
}
_URGENCY_LABELS = {
    "3_meses": "Urgente (3 meses)",
    "12_meses": "Planejando (12 meses)",
    "sem_prazo": "Pesquisando",
}


async def _handle_buyer(phone: str, content: str, session: dict):
    state = session.get("state")
    data: dict = session.get("data", {})

    if state == "A_START":
        if not content.strip():
            await ws.send_text(phone, "Por favor, me diga seu nome.")
            return
        data["name"] = content.strip()
        await ws.upsert_session(phone, {"state": "A_LOCATION", "data": data})
        await ws.send_text(phone,
            f"Prazer, *{data['name']}*! 😊\n\n"
            "Em qual *cidade ou bairro* você quer comprar?"
        )

    elif state == "A_LOCATION":
        data["location"] = content.strip()
        await ws.upsert_session(phone, {"state": "A_PROPERTY_TYPE", "data": data})
        await ws.send_interactive_list(
            phone, body="Que tipo de imóvel você procura?",
            button_label="Selecionar",
            sections=[{"title": "Tipo de imóvel", "rows": [
                {"id": "apartamento", "title": "Apartamento"},
                {"id": "casa", "title": "Casa"},
                {"id": "casa_condominio", "title": "Casa de condomínio"},
                {"id": "terreno", "title": "Terreno"},
                {"id": "studio_loft", "title": "Studio / Loft"},
                {"id": "sala_comercial", "title": "Sala comercial"},
            ]}],
        )

    elif state == "A_PROPERTY_TYPE":
        if content not in _PT_LABELS:
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")
            return
        data["property_type"] = content
        await ws.upsert_session(phone, {"state": "A_BUDGET", "data": data})
        await ws.send_interactive_list(
            phone, body="Qual é seu orçamento máximo?",
            button_label="Selecionar",
            sections=[{"title": "Faixa de preço", "rows": [
                {"id": "ate_400k",     "title": "Até R$ 400 mil"},
                {"id": "400k_550k",   "title": "R$ 400 – 550 mil"},
                {"id": "550k_700k",   "title": "R$ 550 – 700 mil"},
                {"id": "700k_800k",   "title": "R$ 700 – 800 mil"},
                {"id": "800k_1500k",  "title": "R$ 800 mil – 1,5 mi"},
                {"id": "acima_1500k", "title": "Acima de R$ 1,5 mi"},
            ]}],
        )

    elif state == "A_BUDGET":
        if content not in _BUDGET_LABELS:
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")
            return
        data["budget_range"] = content
        await ws.upsert_session(phone, {"state": "A_URGENCY", "data": data})
        await ws.send_interactive_buttons(
            phone, body="Qual é sua urgência para comprar?",
            buttons=[
                {"id": "3_meses",   "title": "Urgente (3 meses)"},
                {"id": "12_meses",  "title": "Planejando (12 meses)"},
                {"id": "sem_prazo", "title": "Pesquisando"},
            ],
        )

    elif state == "A_URGENCY":
        if content not in _URGENCY_LABELS:
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")
            return
        data["urgency"] = content
        await ws.upsert_session(phone, {"state": "A_PROFILE_TYPE", "data": data})
        await ws.send_interactive_list(
            phone, body="Por que você está buscando um imóvel?",
            button_label="Selecionar",
            sections=[{"title": "Motivo principal", "rows": [
                {"id": "primeiro_imovel",    "title": "Primeiro imóvel"},
                {"id": "sair_aluguel",       "title": "Sair do aluguel"},
                {"id": "melhor_localizacao", "title": "Melhor localização"},
                {"id": "familia_cresceu",    "title": "Família cresceu"},
                {"id": "investidor",         "title": "Investimento"},
            ]}],
        )

    elif state == "A_PROFILE_TYPE":
        valid = {"primeiro_imovel", "sair_aluguel", "melhor_localizacao",
                 "familia_cresceu", "investidor"}
        if content not in valid:
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")
            return
        data["profile_type"] = content
        await ws.upsert_session(phone, {"state": "A_AMBIANCE", "data": data})
        await ws.send_interactive_list(
            phone, body="Qual estilo melhor descreve o imóvel que você sonha?",
            button_label="Selecionar",
            sections=[{"title": "Estilo", "rows": [
                {"id": "aconchegante",  "title": "Aconchegante e natural"},
                {"id": "amplo_moderno", "title": "Amplo e moderno"},
                {"id": "minimalista",   "title": "Minimalista e funcional"},
                {"id": "casa_campo",    "title": "Tranquilo, casa de campo"},
                {"id": "alto_padrao",   "title": "Sofisticado, alto padrão"},
            ]}],
        )

    elif state == "A_AMBIANCE":
        valid = {"aconchegante", "amplo_moderno", "minimalista",
                 "casa_campo", "alto_padrao"}
        if content not in valid:
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")
            return
        data["ambiance"] = content
        await ws.upsert_session(phone, {"state": "A_INDISPENSABLE", "data": data})
        await ws.send_text(phone,
            "Quais características são *indispensáveis* para você?\n\n"
            "_Exemplos: 3 quartos, garagem, área gourmet, piscina_\n\n"
            "Separe por vírgula."
        )

    elif state == "A_INDISPENSABLE":
        data["indispensable"] = [x.strip() for x in content.split(",") if x.strip()]
        await ws.upsert_session(phone, {"state": "A_DEAL_BREAKERS", "data": data})
        await ws.send_text(phone,
            "O que você definitivamente *não aceita* num imóvel?\n\n"
            "_Exemplos: barulho de rua, sem garagem, condomínio caro_\n\n"
            "Separe por vírgula, ou responda *nenhum*."
        )

    elif state == "A_DEAL_BREAKERS":
        if content.lower().strip() in ("nenhum", "nenhuma", "nada"):
            data["deal_breakers"] = []
        else:
            data["deal_breakers"] = [x.strip() for x in content.split(",") if x.strip()]
        await ws.upsert_session(phone, {"state": "A_EMAIL", "data": data})
        await ws.send_text(phone,
            "Qual é o seu *e-mail*? (enviaremos o resumo do cadastro)\n\n"
            "Ou responda *pular* para continuar sem e-mail."
        )

    elif state == "A_EMAIL":
        if content.lower().strip() in ("pular", "skip", "não", "nao", "n"):
            data["email"] = None
        else:
            data["email"] = content.strip().lower()
        data.setdefault("proximity_needs", [])

        await ws.upsert_session(phone, {"state": "A_CONFIRM", "data": data})
        summary = (
            "*Resumo do seu interesse:*\n\n"
            f"📍 Localização: {data.get('location', '–')}\n"
            f"🏠 Tipo: {_PT_LABELS.get(data.get('property_type', ''), '–')}\n"
            f"💰 Orçamento: {_BUDGET_LABELS.get(data.get('budget_range', ''), '–')}\n"
            f"⏱ Urgência: {_URGENCY_LABELS.get(data.get('urgency', ''), '–')}\n"
            f"✅ Indispensável: {', '.join(data.get('indispensable', [])) or '–'}\n"
            f"❌ Não aceita: {', '.join(data.get('deal_breakers', [])) or 'nenhum'}\n"
        )
        await ws.send_interactive_buttons(
            phone, body=summary,
            buttons=[
                {"id": "confirm_yes", "title": "✅ Confirmar"},
                {"id": "confirm_no",  "title": "✏️ Corrigir"},
            ],
        )

    elif state == "A_CONFIRM":
        if content == "confirm_no":
            await ws.upsert_session(phone, {"state": "A_START",
                                            "data": {"phone": phone}})
            await ws.send_text(phone, "Tudo bem! Vamos recomeçar. Qual é o seu *nome*?")
            return

        if content != "confirm_yes":
            await ws.send_text(phone, "Por favor, toque em *Confirmar* ou *Corrigir*.")
            return

        try:
            from routes.buyer_routes import _insert_interest_from_data
            from auth import hash_password

            user_id = session.get("user_id")
            if not user_id:
                existing = await db.users.find_one(
                    {"phone": {"$in": [phone, f"+{phone}"]}}, {"_id": 0}
                )
                if existing:
                    user_id = existing["id"]
                else:
                    user_id = str(uuid.uuid4())
                    await db.users.insert_one({
                        "id": user_id,
                        "email": data.get("email") or f"temp_{user_id}@matchimob.com",
                        "password": hash_password(secrets.token_urlsafe(16)),
                        "role": "buyer",
                        "name": data.get("name", ""),
                        "phone": phone,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "needs_password_setup": True,
                    })
                    await db.buyers.insert_one({
                        "user_id": user_id,
                        "name": data.get("name", ""),
                        "email": data.get("email"),
                        "phone": phone,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    })

            interest_id = await _insert_interest_from_data(user_id, data,
                                                            client_ip="whatsapp")

            if data.get("email"):
                try:
                    from services.email_service import send_interest_registered_email
                    await send_interest_registered_email(
                        buyer_email=data["email"],
                        buyer_name=data.get("name", ""),
                        interest_data={
                            "property_type": data.get("property_type"),
                            "budget_range": data.get("budget_range"),
                            "location": data.get("location"),
                        },
                    )
                except Exception:
                    pass

            await ws.close_session(phone)
            await ws.send_text(phone,
                "✅ *Cadastro realizado com sucesso!*\n\n"
                "Seu perfil já está visível para os corretores da plataforma. "
                "Você será notificado aqui pelo WhatsApp quando encontrarmos um match!\n\n"
                f"_(Referência: {interest_id[:8]}...)_"
            )
        except Exception as e:
            logger.error(f"Interest creation error for {phone}: {e}")
            await ws.send_text(phone,
                "Ocorreu um erro ao salvar seu cadastro. "
                "Por favor, tente novamente enviando *Oi*."
            )
            await ws.close_session(phone)


# ── Flow B — Match Feedback ────────────────────────────────────────────────────

async def _handle_match_feedback(phone: str, content: str, session: dict):
    state = session.get("state")
    data: dict = session.get("data", {})
    match_id: str = data.get("match_id", "")

    if state == "B_NOTIFY":
        match = await db.matches.find_one({"id": match_id}, {"_id": 0}) if match_id else None
        if not match:
            await ws.close_session(phone)
            return
        pi = match.get("property_info") or {}
        ai = match.get("ai_compatibility") or {}
        details = (
            "🏠 *Detalhes do imóvel:*\n\n"
            f"📍 Endereço: {pi.get('address', 'A confirmar')}\n"
            f"💰 Preço: R$ {pi.get('price', 0):,.0f}\n"
            f"🛏 Quartos: {pi.get('bedrooms', '–')}\n"
            f"📐 Área: {pi.get('area_m2', '–')} m²\n"
            f"🎯 Compatibilidade: {ai.get('score', '–')}%\n\n"
            f"_{ai.get('justificativa', '')}_"
        )
        await ws.upsert_session(phone, {"state": "B_FEEDBACK_ASK", "data": data})
        await ws.send_text(phone, details)
        await ws.send_interactive_buttons(
            phone, body="O que você achou deste imóvel?",
            buttons=[
                {"id": "interested_yes", "title": "✅ Tenho interesse"},
                {"id": "interested_no",  "title": "❌ Não tenho interesse"},
            ],
        )

    elif state == "B_FEEDBACK_ASK":
        if content == "interested_yes":
            await _save_match_feedback(match_id, session.get("user_id"),
                                       "interested", None)
            await ws.close_session(phone)
            await ws.send_text(phone,
                "Ótimo! 🎉 Nossa equipe de curadoria vai entrar em contato "
                "para agendar uma visita."
            )
        elif content == "interested_no":
            await ws.upsert_session(phone, {"state": "B_REJECTION", "data": data})
            await ws.send_interactive_list(
                phone, body="Qual o motivo principal?",
                button_label="Selecionar",
                sections=[{"title": "Motivo", "rows": [
                    {"id": "reject_price",    "title": "Preço alto"},
                    {"id": "reject_location", "title": "Localização"},
                    {"id": "reject_size",     "title": "Tamanho"},
                    {"id": "reject_other",    "title": "Outro motivo"},
                ]}],
            )
        else:
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")

    elif state == "B_REJECTION":
        reason_map = {
            "reject_price":    "Preço alto",
            "reject_location": "Localização inadequada",
            "reject_size":     "Tamanho não adequado",
            "reject_other":    "Outro motivo",
        }
        reason = reason_map.get(content, content)
        await _save_match_feedback(match_id, session.get("user_id"),
                                   "not_interested", reason)
        await ws.close_session(phone)
        await ws.send_text(phone,
            "Obrigado pelo feedback! 🙏 "
            "Continuamos buscando imóveis compatíveis com seu perfil."
        )


async def _save_match_feedback(match_id: str, buyer_id: str | None,
                                interest_level: str, rejection_reason: str | None):
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.visit_feedback.find_one({"match_id": match_id}, {"_id": 0})
    update = {
        "interest_level": interest_level,
        "rejection_reason": rejection_reason,
        "submitted_by_buyer": True,
        "buyer_submitted_at": now,
        "impressions": "Via WhatsApp",
    }
    if existing:
        await db.visit_feedback.update_one({"match_id": match_id}, {"$set": update})
    else:
        await db.visit_feedback.insert_one({
            "id": str(uuid.uuid4()),
            "match_id": match_id,
            "buyer_id": buyer_id or "",
            "created_at": now,
            **update,
        })


# ── Flow C — Agent property registration ──────────────────────────────────────

async def _handle_agent(phone: str, content: str, session: dict):
    state = session.get("state")
    data: dict = session.get("data", {})
    agent_id: str = session.get("user_id", "")

    if state == "C_START":
        data["raw_description"] = content
        await ws.upsert_session(phone, {"state": "C_GET_PRICE", "data": data})
        await ws.send_text(phone,
            "Ótimo! Qual é o *valor de venda* do imóvel?\n\n"
            "_Responda apenas o número. Ex: 850000_"
        )

    elif state == "C_GET_PRICE":
        price_str = re.sub(r"[^\d]", "", content)
        if not price_str:
            await ws.send_text(phone,
                "Por favor, informe o valor em reais (apenas números). Ex: 850000")
            return
        data["property_price"] = float(price_str)
        await ws.upsert_session(phone, {"state": "C_GET_TYPE", "data": data})
        await ws.send_interactive_list(
            phone, body="Qual é o *tipo* do imóvel?",
            button_label="Selecionar",
            sections=[{"title": "Tipo", "rows": [
                {"id": "apartamento",   "title": "Apartamento"},
                {"id": "casa",          "title": "Casa"},
                {"id": "casa_condominio", "title": "Casa de condomínio"},
                {"id": "terreno",       "title": "Terreno"},
                {"id": "studio_loft",   "title": "Studio / Loft"},
                {"id": "sala_comercial","title": "Sala comercial"},
            ]}],
        )

    elif state == "C_GET_TYPE":
        if content not in _PT_LABELS:
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")
            return
        data["property_type"] = content
        await ws.upsert_session(phone, {"state": "C_AI_EXTRACT", "data": data})
        await ws.send_text(phone, "⏳ Analisando o imóvel com IA...")
        await _run_ai_extraction(phone, data)

    elif state == "C_CONFIRM_FIELDS":
        if content == "fields_fix":
            await ws.upsert_session(phone, {"state": "C_CORRECT_FIELDS", "data": data})
            await ws.send_text(phone,
                "Corrija os dados no formato:\n\n"
                "_campo: valor_\n\n"
                "Exemplo:\n"
                "bedrooms: 4\n"
                "price: 900000\n"
                "location: Savassi, BH"
            )
        elif content == "fields_ok":
            await ws.upsert_session(phone, {"state": "C_FIND_MATCHES", "data": data})
            await ws.send_text(phone,
                "🔍 Buscando compradores compatíveis na plataforma...")
            await _run_agent_discovery(phone, data, agent_id)
        else:
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")

    elif state == "C_CORRECT_FIELDS":
        fields = data.get("extracted_fields", {})
        for line in content.split("\n"):
            if ":" in line:
                k, _, v = line.partition(":")
                k = k.strip().lower()
                v = v.strip()
                try:
                    fields[k] = float(v) if v.replace(".", "").isdigit() else v
                except Exception:
                    fields[k] = v
        data["extracted_fields"] = fields
        await ws.upsert_session(phone, {"state": "C_CONFIRM_FIELDS", "data": data})
        lines = [f"{k}: {v}" for k, v in fields.items()
                 if v not in (None, "", False)][:12]
        await ws.send_interactive_buttons(
            phone,
            body="*Dados atualizados:*\n\n" + "\n".join(lines),
            buttons=[
                {"id": "fields_ok",  "title": "✅ Confirmar"},
                {"id": "fields_fix", "title": "✏️ Corrigir"},
            ],
        )

    elif state == "C_SHOW_MATCHES":
        if not content.startswith("match_"):
            await ws.send_text(phone,
                "Por favor, selecione um dos compradores da lista.")
            return
        try:
            idx = int(content.split("_")[1])
        except Exception:
            await ws.send_text(phone, "Seleção inválida. Por favor, tente novamente.")
            return
        matches_list = data.get("ai_matches", [])
        if idx >= len(matches_list):
            await ws.send_text(phone, "Seleção inválida.")
            return
        selected = matches_list[idx]
        data["selected_match"] = selected
        await ws.upsert_session(phone, {"state": "C_CONFIRM_MATCH", "data": data})
        await ws.send_interactive_buttons(
            phone,
            body=(
                "*Criar match com este comprador?*\n\n"
                f"👤 {selected.get('buyer_name', '–')}\n"
                f"🎯 Score: {selected.get('score', 0)}%\n"
                f"📍 Busca em: {selected.get('location', '–')}\n"
                f"💰 Orçamento: até R$ {selected.get('max_price', 0):,.0f}\n\n"
                f"_{selected.get('justificativa', '')[:200]}_"
            ),
            buttons=[
                {"id": "match_confirm", "title": "✅ Criar match"},
                {"id": "match_back",    "title": "↩️ Ver outros"},
            ],
        )

    elif state == "C_CONFIRM_MATCH":
        if content == "match_back":
            await ws.upsert_session(phone, {"state": "C_SHOW_MATCHES", "data": data})
            await _show_matches(phone, data.get("ai_matches", []))
            return
        if content != "match_confirm":
            await ws.send_text(phone, "Por favor, selecione uma das opções acima.")
            return
        await _create_match_from_selection(phone, data, agent_id)


async def _run_ai_extraction(phone: str, data: dict):
    """Call GPT-4o to extract structured fields, then show confirm screen."""
    try:
        from services.openai_service import extract_property_fields
        extracted = await extract_property_fields(
            description=data.get("raw_description", ""),
            property_type=data.get("property_type", "apartamento"),
        )
        data["extracted_fields"] = extracted
        await ws.upsert_session(phone, {"state": "C_CONFIRM_FIELDS", "data": data})

        label_map = {
            "location": "📍 Localização", "address": "🏠 Endereço",
            "price": "💰 Preço", "area_m2": "📐 Área (m²)",
            "bedrooms": "🛏 Quartos", "bathrooms": "🚿 Banheiros",
            "parking_spots": "🚗 Vagas", "condition": "🔧 Condição",
        }
        lines = []
        for field, label in label_map.items():
            val = extracted.get(field)
            if val is not None and val != "" and val is not False:
                lines.append(f"{label}: {val}")

        await ws.send_interactive_buttons(
            phone,
            body="*Dados extraídos do imóvel:*\n\n" + ("\n".join(lines) or "Nenhum campo extraído"),
            buttons=[
                {"id": "fields_ok",  "title": "✅ Confirmar"},
                {"id": "fields_fix", "title": "✏️ Corrigir"},
            ],
        )
    except Exception as e:
        logger.error(f"AI extraction failed: {e}")
        await ws.send_text(phone,
            "Não consegui extrair os dados automaticamente. "
            "Tente novamente com mais detalhes, ou envie *Oi* para recomeçar."
        )
        await ws.close_session(phone)


async def _run_agent_discovery(phone: str, data: dict, agent_id: str):
    """Pre-filter buyers and call GPT-4o for scoring, then show top matches."""
    try:
        from services.openai_service import evaluate_buyers_with_openai

        extracted = data.get("extracted_fields", {})
        property_type = data.get("property_type", "")
        property_price = data.get("property_price", 0)
        description = data.get("raw_description", "")

        type_groups = {
            'apartamento': ['apartamento', 'studio', 'loft', 'studio/loft', 'studio_loft'],
            'casa': ['casa', 'casa de condomínio', 'casa_condominio'],
            'terreno': ['terreno', 'terreno de condomínio', 'terreno_condominio', 'lote'],
            'comercial': ['sala comercial', 'sala_comercial', 'prédio comercial'],
        }

        def get_group(pt: str) -> str | None:
            if not pt:
                return None
            pt_l = pt.lower().strip()
            for g, types in type_groups.items():
                if pt_l in types or any(t in pt_l for t in types):
                    return g
            return None

        query: dict = {"status": "active"}
        if property_price > 0:
            query["max_price"] = {"$gte": property_price * 0.75}

        interests = await db.interests.find(query, {"_id": 0}).to_list(100)

        offered_group = get_group(property_type)
        if offered_group:
            interests = [
                i for i in interests
                if not get_group(i.get("property_type_key") or i.get("property_type"))
                or get_group(i.get("property_type_key") or i.get("property_type")) == offered_group
            ]
        interests = interests[:50]

        if not interests:
            await ws.send_text(phone,
                "Não encontrei compradores compatíveis no momento. "
                "Envie *Oi* para tentar com outro imóvel."
            )
            await ws.close_session(phone)
            return

        for i in interests:
            buyer = await db.buyers.find_one({"user_id": i["buyer_id"]}, {"_id": 0})
            i["buyer_name"] = (buyer or {}).get("name", "Comprador")

        results = await evaluate_buyers_with_openai(
            property_description=description,
            buyer_profiles=interests,
            property_data=extracted,
        )

        results = sorted(
            [r for r in results if r.get("score", 0) >= 50],
            key=lambda x: x.get("score", 0),
            reverse=True,
        )[:5]

        interest_map = {i["id"]: i for i in interests}
        ai_matches = []
        for r in results:
            interest_data = interest_map.get(r.get("comprador_id", ""), {})
            ai_matches.append({
                **r,
                "buyer_id": interest_data.get("buyer_id", ""),
                "buyer_name": interest_data.get("buyer_name", "Comprador"),
                "location": interest_data.get("location", ""),
                "max_price": interest_data.get("max_price", 0),
            })

        data["ai_matches"] = ai_matches
        await ws.upsert_session(phone, {"state": "C_SHOW_MATCHES", "data": data})

        if not ai_matches:
            await ws.send_text(phone,
                "Não encontrei compradores com pontuação suficiente. "
                "Envie *Oi* para tentar com outro imóvel."
            )
            await ws.close_session(phone)
            return

        await _show_matches(phone, ai_matches)

    except Exception as e:
        logger.error(f"Agent discovery error: {e}")
        await ws.send_text(phone,
            "Erro na busca de compradores. Tente novamente enviando *Oi*.")
        await ws.close_session(phone)


async def _show_matches(phone: str, ai_matches: list[dict]):
    rows = []
    for i, m in enumerate(ai_matches[:5]):
        rows.append({
            "id": f"match_{i}",
            "title": f"{m.get('buyer_name', '–')[:20]} — {m.get('score', 0)}%",
            "description": (
                f"{m.get('location', '–')[:30]} | "
                f"até R$ {m.get('max_price', 0) / 1000:.0f}k"
            ),
        })
    await ws.send_interactive_list(
        phone,
        body=f"Encontrei *{len(ai_matches)} comprador(es)* compatíveis. "
             "Selecione para criar o match:",
        button_label="Ver comprador",
        sections=[{"title": "Compradores compatíveis", "rows": rows}],
    )


async def _create_match_from_selection(phone: str, data: dict, agent_id: str):
    selected = data.get("selected_match", {})
    try:
        from routes.agent_routes import _insert_match_from_data
        extracted = data.get("extracted_fields", {})
        property_info = {
            "description": data.get("raw_description", ""),
            "bedrooms": extracted.get("bedrooms"),
            "bathrooms": extracted.get("bathrooms"),
            "area_m2": extracted.get("area_m2"),
            "address": extracted.get("address") or extracted.get("location", ""),
            "price": extracted.get("price") or data.get("property_price"),
            "link": extracted.get("link"),
        }
        ai_compatibility = {
            "score": selected.get("score", 0),
            "justificativa": selected.get("justificativa", ""),
            "property_description": data.get("raw_description", "")[:200],
        }
        match_id = await _insert_match_from_data(
            buyer_id=selected.get("buyer_id", ""),
            agent_id=agent_id,
            interest_id=selected.get("comprador_id", ""),
            property_info=property_info,
            ai_compatibility=ai_compatibility,
        )
        await ws.close_session(phone)
        if match_id:
            await ws.send_text(phone,
                "✅ *Match criado com sucesso!*\n\n"
                "O time de curadoria vai revisar e, se aprovado, "
                "o comprador será notificado.\n\n"
                f"_(Referência: {match_id[:8]}...)_"
            )
        else:
            await ws.send_text(phone,
                "Você já possui um match ativo com este comprador.")
    except Exception as e:
        logger.error(f"Match creation error: {e}")
        await ws.send_text(phone,
            "Erro ao criar o match. Tente novamente enviando *Oi*.")
        await ws.close_session(phone)


# ── Flow V — Visit management ──────────────────────────────────────────────────

async def _handle_visit(phone: str, content: str, session: dict):
    state = session.get("state")
    data: dict = session.get("data", {})
    user_id: str = session.get("user_id", "")
    role: str = session.get("role", "buyer")

    if state == "V_SHOW_VISITS":
        visits = await _get_scheduled_visits(user_id, role)
        await _show_visits(phone, visits)

    elif state == "V_ACTION_MENU":
        # Resolve visit_id: may come from pre-set data or from list reply
        visit_id = data.get("visit_id", "")
        if not visit_id and content.startswith("visit_"):
            visit_id = content[len("visit_"):]
            data["visit_id"] = visit_id

        if not visit_id:
            await ws.send_text(phone, "Visita não identificada. Envie *Oi* para tentar novamente.")
            await ws.close_session(phone)
            return

        visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
        if not visit:
            await ws.close_session(phone)
            await ws.send_text(phone, "Visita não encontrada. Envie *Oi* para recomeçar.")
            return

        if content in ("action_confirm", "action_reschedule", "action_cancel"):
            await _process_visit_action(phone, content, data, session, visit)
        else:
            # Show action menu (first message after template or list selection)
            await ws.upsert_session(phone, {
                "state": "V_ACTION_MENU",
                "data": {**data, "visit_id": visit_id},
            })
            date_fmt = ws.format_visit_date(visit.get("visit_date", ""))
            address = data.get("property_address") or visit.get("property_address",
                                                                  "Endereço a confirmar")
            await ws.send_interactive_buttons(
                phone,
                body=(
                    "📅 *Sua visita agendada:*\n\n"
                    f"🏠 {address}\n"
                    f"🗓 {date_fmt} às {visit.get('visit_time', '')}\n\n"
                    "O que deseja fazer?"
                ),
                buttons=[
                    {"id": "action_confirm",    "title": "✅ Confirmar presença"},
                    {"id": "action_reschedule", "title": "📅 Reagendar"},
                    {"id": "action_cancel",     "title": "❌ Cancelar"},
                ],
            )

    elif state in (
        "V_RESCHEDULE_REASON", "V_RESCHEDULE_DATE", "V_RESCHEDULE_TIME",
        "V_RESCHEDULE_CONFIRM", "V_CANCEL_CONFIRM",
    ):
        await _process_visit_action(phone, content, data, session, None)


async def _show_visits(phone: str, visits: list[dict]):
    if not visits:
        await ws.close_session(phone)
        await ws.send_text(phone,
            "Você não tem visitas agendadas no momento. "
            "Envie *Oi* para outras opções.")
        return

    if len(visits) == 1:
        v = visits[0]
        data = {"visit_id": v["id"],
                "property_address": v.get("property_address", "")}
        await ws.upsert_session(phone, {"state": "V_ACTION_MENU", "data": data})
        date_fmt = ws.format_visit_date(v.get("visit_date", ""))
        await ws.send_interactive_buttons(
            phone,
            body=(
                "📅 *Sua visita agendada:*\n\n"
                f"🏠 {v.get('property_address', 'Endereço a confirmar')}\n"
                f"🗓 {date_fmt} às {v.get('visit_time', '')}"
            ),
            buttons=[
                {"id": "action_confirm",    "title": "✅ Confirmar presença"},
                {"id": "action_reschedule", "title": "📅 Reagendar"},
                {"id": "action_cancel",     "title": "❌ Cancelar"},
            ],
        )
    else:
        rows = []
        for v in visits[:10]:
            date_fmt = ws.format_visit_date(v.get("visit_date", ""))
            rows.append({
                "id": f"visit_{v['id']}",
                "title": v.get("property_address", "Visita")[:24],
                "description": f"{date_fmt} às {v.get('visit_time', '')}",
            })
        await ws.upsert_session(phone, {"state": "V_ACTION_MENU", "data": {}})
        await ws.send_interactive_list(
            phone,
            body="Você tem múltiplas visitas agendadas. "
                 "Selecione qual deseja gerenciar:",
            button_label="Ver visita",
            sections=[{"title": "Visitas agendadas", "rows": rows}],
        )


async def _process_visit_action(phone: str, content: str, data: dict,
                                 session: dict, visit: dict | None):
    state = session.get("state")
    user_id: str = session.get("user_id", "")
    role: str = session.get("role", "buyer")
    visit_id: str = data.get("visit_id", "")
    now = datetime.now(timezone.utc).isoformat()

    # ── Confirm ────────────────────────────────────────────────────────────────
    if content == "action_confirm":
        confirm_field = "buyer_confirmed" if role == "buyer" else "agent_confirmed"
        confirm_at = "buyer_confirmed_at" if role == "buyer" else "agent_confirmed_at"
        await db.visits.update_one(
            {"id": visit_id},
            {"$set": {confirm_field: True, confirm_at: now}},
        )
        try:
            from services.email_service import send_visit_confirmed_to_curator
            visit_doc = visit or await db.visits.find_one({"id": visit_id}, {"_id": 0})
            if visit_doc:
                match = await db.matches.find_one(
                    {"id": visit_doc["match_id"]}, {"_id": 0})
                if match and match.get("curator_id"):
                    curator = await db.users.find_one(
                        {"id": match["curator_id"]}, {"_id": 0})
                    user = await db.users.find_one({"id": user_id}, {"_id": 0})
                    if curator and curator.get("email"):
                        await send_visit_confirmed_to_curator(
                            curator_email=curator["email"],
                            curator_name=curator.get("name", "Curador"),
                            actor_name=(user or {}).get("name", role),
                            actor_type=role,
                            visit_date=visit_doc.get("visit_date", ""),
                            visit_time=visit_doc.get("visit_time", ""),
                            property_address=data.get("property_address", ""),
                        )
        except Exception as e:
            logger.error(f"Curator confirm email failed: {e}")
        await ws.close_session(phone)
        await ws.send_text(phone,
            "✅ *Presença confirmada!* "
            "Nossa equipe de curadoria foi notificada.")

    # ── Request reschedule ─────────────────────────────────────────────────────
    elif content == "action_reschedule":
        await ws.upsert_session(phone, {"state": "V_RESCHEDULE_REASON", "data": data})
        await ws.send_text(phone,
            "Por qual motivo você precisa reagendar?\n\n_Descreva brevemente._")

    # ── Request cancel ─────────────────────────────────────────────────────────
    elif content == "action_cancel":
        await ws.upsert_session(phone, {"state": "V_CANCEL_CONFIRM", "data": data})
        await ws.send_interactive_buttons(
            phone,
            body="⚠️ *Tem certeza que deseja cancelar a visita?*\n\n"
                 "Esta ação não pode ser desfeita.",
            buttons=[
                {"id": "cancel_yes", "title": "Sim, cancelar"},
                {"id": "cancel_no",  "title": "Não, voltar"},
            ],
        )

    # ── Reschedule reason ──────────────────────────────────────────────────────
    elif state == "V_RESCHEDULE_REASON":
        data["reschedule_reason"] = content
        await ws.upsert_session(phone, {"state": "V_RESCHEDULE_DATE", "data": data})
        await ws.send_text(phone,
            "Qual *data* você propõe?\n\n_Ex: 25/06/2026_")

    # ── Reschedule date ────────────────────────────────────────────────────────
    elif state == "V_RESCHEDULE_DATE":
        proposed_date = _parse_date(content)
        if not proposed_date:
            await ws.send_text(phone,
                "Data inválida. Informe no formato *DD/MM/AAAA*.")
            return
        data["proposed_date"] = proposed_date
        await ws.upsert_session(phone, {"state": "V_RESCHEDULE_TIME", "data": data})
        await ws.send_text(phone,
            "Qual *horário* você propõe?\n\n_Ex: 14:00_")

    # ── Reschedule time ────────────────────────────────────────────────────────
    elif state == "V_RESCHEDULE_TIME":
        proposed_time = _parse_time(content)
        if not proposed_time:
            await ws.send_text(phone,
                "Horário inválido. Informe no formato *HH:MM*.")
            return
        data["proposed_time"] = proposed_time
        await ws.upsert_session(phone, {"state": "V_RESCHEDULE_CONFIRM", "data": data})
        date_fmt = ws.format_visit_date(data.get("proposed_date", ""))
        await ws.send_interactive_buttons(
            phone,
            body=(
                "*Confirmar solicitação de reagendamento?*\n\n"
                f"📝 Motivo: {data.get('reschedule_reason', '–')}\n"
                f"📅 Nova data: {date_fmt} às {proposed_time}"
            ),
            buttons=[
                {"id": "reschedule_confirm", "title": "✅ Confirmar"},
                {"id": "reschedule_back",    "title": "↩️ Voltar"},
            ],
        )

    # ── Reschedule confirm ─────────────────────────────────────────────────────
    elif state == "V_RESCHEDULE_CONFIRM":
        if content == "reschedule_back":
            await ws.upsert_session(phone, {"state": "V_ACTION_MENU", "data": data})
            await ws.send_text(phone,
                "Tudo bem! Envie *Oi* para ver as opções novamente.")
            return
        if content != "reschedule_confirm":
            await ws.send_text(phone, "Por favor, selecione uma das opções.")
            return

        await db.visits.update_one(
            {"id": visit_id},
            {"$set": {
                "status": "rescheduling",
                "reschedule_request": {
                    "requested_by_type": role,
                    "requested_by_id": user_id,
                    "reason": data.get("reschedule_reason", ""),
                    "proposed_date": data.get("proposed_date", ""),
                    "proposed_time": data.get("proposed_time", ""),
                    "requested_at": now,
                },
            }},
        )

        try:
            from services.email_service import send_reschedule_request_notification
            visit_doc = await db.visits.find_one({"id": visit_id}, {"_id": 0})
            if visit_doc:
                match = await db.matches.find_one(
                    {"id": visit_doc["match_id"]}, {"_id": 0})
                if match:
                    user = await db.users.find_one({"id": user_id}, {"_id": 0})
                    other_id = (match["agent_id"] if role == "buyer"
                                else match["buyer_id"])
                    other_user = await db.users.find_one(
                        {"id": other_id}, {"_id": 0})
                    curator = (
                        await db.users.find_one(
                            {"id": match["curator_id"]}, {"_id": 0})
                        if match.get("curator_id") else None
                    )
                    emails, names = [], []
                    for u in [curator, other_user]:
                        if u and u.get("email"):
                            emails.append(u["email"])
                            names.append(u.get("name", ""))
                    if emails:
                        await send_reschedule_request_notification(
                            to_emails=emails,
                            to_names=names,
                            requester_name=(user or {}).get("name", role),
                            requester_type=role,
                            visit_date=visit_doc.get("visit_date", ""),
                            visit_time=visit_doc.get("visit_time", ""),
                            property_address=data.get("property_address", ""),
                            reason=data.get("reschedule_reason", ""),
                            proposed_date=data.get("proposed_date"),
                            proposed_time=data.get("proposed_time"),
                        )
        except Exception as e:
            logger.error(f"Reschedule notification email failed: {e}")

        await ws.close_session(phone)
        await ws.send_text(phone,
            "✅ *Solicitação de reagendamento enviada!*\n\n"
            "Nossa equipe de curadoria vai analisar e confirmar a nova data."
        )

    # ── Cancel confirm ─────────────────────────────────────────────────────────
    elif state == "V_CANCEL_CONFIRM":
        if content == "cancel_no":
            await ws.upsert_session(phone, {"state": "V_ACTION_MENU", "data": data})
            await ws.send_text(phone,
                "Tudo bem! Sua visita continua agendada. "
                "Envie *Oi* para ver as opções.")
            return
        if content != "cancel_yes":
            await ws.send_text(phone, "Por favor, selecione uma das opções.")
            return

        await db.visits.update_one(
            {"id": visit_id}, {"$set": {"status": "cancelled"}})
        await ws.close_session(phone)
        await ws.send_text(phone,
            "✅ *Visita cancelada.*\n\n"
            "Nossa equipe de curadoria foi notificada. "
            "Envie *Oi* se quiser explorar outras opções."
        )


# ── Date/time parsing helpers ──────────────────────────────────────────────────

def _parse_date(s: str) -> str | None:
    """DD/MM/AAAA, DD/MM/AA, DD/MM → YYYY-MM-DD."""
    m = re.match(r"(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?", s.strip())
    if not m:
        return None
    day, month = int(m.group(1)), int(m.group(2))
    year_s = m.group(3)
    year = int(year_s) + (2000 if int(year_s) < 100 else 0) if year_s else datetime.now().year
    try:
        return datetime(year, month, day).strftime("%Y-%m-%d")
    except ValueError:
        return None


def _parse_time(s: str) -> str | None:
    """HH:MM, HHh, HH → HH:MM."""
    s = s.strip()
    m = re.match(r"(\d{1,2})[:h](\d{0,2})", s)
    if m:
        h, mm = int(m.group(1)), int(m.group(2)) if m.group(2) else 0
        if 0 <= h <= 23 and 0 <= mm <= 59:
            return f"{h:02d}:{mm:02d}"
    m2 = re.match(r"^(\d{1,2})$", s)
    if m2:
        h = int(m2.group(1))
        if 0 <= h <= 23:
            return f"{h:02d}:00"
    return None
