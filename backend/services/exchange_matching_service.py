"""
Exchange (permuta) cycle-matching service.

Detects multi-party property swap cycles ("Top Trading Cycles" style) among
buyer interests that offer an asset as part of payment (exchange_offer) and
agent property listings that accept exchange (accepts_exchange).

This is a manual, on-demand admin tool — not wired into any cron or the
regular 1:1 matching flow. Volume today is low; the goal is to have the data
model and the detection logic ready for when volume grows.
"""
import logging
from typing import List, Optional

from database import db

logger = logging.getLogger(__name__)

MAX_CYCLE_LENGTH = 4
BUDGET_THRESHOLD = 0.75  # buyer's covering funds (asset + cash) must reach at least this % of the property price

TYPE_GROUPS = {
    "apartamento": ["apartamento", "studio_loft", "cobertura"],
    "casa": ["casa", "casa_condominio"],
    "terreno": ["terreno"],
    "comercial": ["sala_comercial"],
}


def _type_group(prop_type: Optional[str]) -> Optional[str]:
    if not prop_type:
        return None
    t = prop_type.lower().strip()
    for group, types in TYPE_GROUPS.items():
        if t in types or any(x in t for x in types):
            return group
    return None


def _location_matches(desired: Optional[str], offered: Optional[str]) -> bool:
    if not desired or not offered:
        return True  # missing data shouldn't block a potential match, just can't confirm
    d, o = desired.lower().strip(), offered.lower().strip()
    return d in o or o in d


def _asset_type_label(asset_type: Optional[str]) -> Optional[str]:
    return {"imovel": "Imóvel", "veiculo": "Veículo", "outro": "Outro bem"}.get(asset_type)


async def _build_interest_nodes() -> List[dict]:
    """Buyer interests that offer an asset as part of payment."""
    interests = await db.interests.find(
        {"status": "active", "exchange_offer": {"$ne": None}}, {"_id": 0}
    ).to_list(500)

    nodes = []
    for interest in interests:
        offer = interest.get("exchange_offer") or {}
        if not offer.get("asset_type"):
            continue
        buyer = await db.buyers.find_one({"user_id": interest["buyer_id"]}, {"_id": 0})
        nodes.append({
            "node_type": "interest",
            "ref_id": interest["id"],
            "label": f"Comprador — quer {interest.get('property_type', 'imóvel')} em {interest.get('location', 'N/A')}",
            "contact": {
                "name": buyer.get("name") if buyer else None,
                "phone": buyer.get("phone") if buyer else None,
                "email": buyer.get("email") if buyer else None,
            },
            "wants_type": interest.get("property_type_key") or interest.get("property_type"),
            "wants_location": interest.get("location"),
            "wants_max_budget": interest.get("max_price") or 0,
            "gives_asset_type": offer.get("asset_type"),
            "gives_asset_description": offer.get("asset_description"),
            "gives_asset_value": offer.get("asset_value") or 0,
            "gives_cash_complement": offer.get("cash_complement") or 0,
        })
    return nodes


async def _build_property_nodes() -> List[dict]:
    """Active agent searches (property listings) that accept exchange."""
    searches = await db.agent_searches.find(
        {"status": "active"}, {"_id": 0}
    ).to_list(500)

    nodes = []
    for search in searches:
        property_data = search.get("property_data") or {}
        accepts = property_data.get("accepts_exchange")
        if accepts not in ("Sim", "Parcial", True, "parcial"):
            continue
        agent = await db.agents.find_one({"user_id": search["agent_id"]}, {"_id": 0})
        nodes.append({
            "node_type": "property",
            "ref_id": search["id"],
            "label": f"Imóvel ({search.get('property_type', 'N/A')}) — {property_data.get('location', 'N/A')}",
            "contact": {
                "name": agent.get("name") if agent else None,
                "phone": agent.get("phone") if agent else None,
                "email": agent.get("email") if agent else None,
            },
            "gives_property_type": search.get("property_type"),
            "gives_location": property_data.get("location"),
            "gives_price": search.get("property_price") or 0,
            "wants_asset_types": property_data.get("exchange_accepted_types") or [],
            "wants_max_asset_value": property_data.get("exchange_max_value"),
        })
    return nodes


def _edge_exists(from_node: dict, to_node: dict) -> bool:
    """True if what `to_node` gives satisfies what `from_node` wants."""
    if from_node["node_type"] == "interest" and to_node["node_type"] == "property":
        want_group = _type_group(from_node["wants_type"])
        give_group = _type_group(to_node["gives_property_type"])
        if want_group and give_group and want_group != give_group:
            return False
        if not _location_matches(from_node["wants_location"], to_node["gives_location"]):
            return False
        price = to_node["gives_price"] or 0
        if price <= 0:
            return True
        covering_funds = from_node["wants_max_budget"] or 0
        if covering_funds <= 0:
            covering_funds = (from_node["gives_asset_value"] or 0) + (from_node["gives_cash_complement"] or 0)
        return covering_funds >= price * BUDGET_THRESHOLD

    if from_node["node_type"] == "property" and to_node["node_type"] == "interest":
        accepted = from_node["wants_asset_types"] or []
        asset_label = _asset_type_label(to_node["gives_asset_type"])
        if accepted and asset_label not in accepted:
            return False
        max_value = from_node["wants_max_asset_value"]
        if max_value:
            return (to_node["gives_asset_value"] or 0) <= max_value
        return True

    if from_node["node_type"] == "property" and to_node["node_type"] == "property":
        # Coarse heuristic: property owner generically accepts "Imóvel" in exchange
        return "Imóvel" in (from_node["wants_asset_types"] or [])

    return False  # interest -> interest not modeled


def _find_cycles(nodes: List[dict]) -> List[List[dict]]:
    """Bounded-depth DFS to enumerate elementary cycles of length 3-4."""
    cycles = []
    seen_signatures = set()

    def dfs(start_idx: int, path: List[int]):
        current = nodes[path[-1]]
        for idx, candidate in enumerate(nodes):
            if idx == start_idx and len(path) >= 3:
                signature = tuple(sorted(path))
                if signature not in seen_signatures and _edge_exists(current, nodes[start_idx]):
                    seen_signatures.add(signature)
                    cycles.append([nodes[i] for i in path])
                continue
            if idx in path or len(path) >= MAX_CYCLE_LENGTH:
                continue
            if _edge_exists(current, candidate):
                dfs(start_idx, path + [idx])

    for i in range(len(nodes)):
        dfs(i, [i])

    return cycles


async def find_exchange_cycles() -> List[dict]:
    """Return all found exchange cycles (3-4 participants) as plain dicts for the API."""
    interest_nodes = await _build_interest_nodes()
    property_nodes = await _build_property_nodes()
    all_nodes = interest_nodes + property_nodes

    if len(interest_nodes) == 0 or len(property_nodes) == 0:
        return []

    raw_cycles = _find_cycles(all_nodes)

    result = []
    for cycle in raw_cycles:
        result.append({
            "participants": [
                {
                    "node_type": n["node_type"],
                    "ref_id": n["ref_id"],
                    "label": n["label"],
                    "contact": n["contact"],
                }
                for n in cycle
            ],
            "size": len(cycle),
        })

    logger.info(f"Exchange cycle detection: {len(interest_nodes)} interest nodes, "
                f"{len(property_nodes)} property nodes, {len(result)} cycles found")
    return result
