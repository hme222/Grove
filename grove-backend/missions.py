"""
Daily Missions for Grove (Phase 11C), reworked for weekly check-ins.

Mission types:
  - plant_check_in   -> A 20-second soil check on one plant. Most days.
                        Only a real soil check (or another "looked at it" log) completes it.
                        Watering never does, so watering more earns nothing.
  - photo_log        -> Log a care action with a photo, OR upload a plant photo
  - health_check     -> Open a plant's health panel today
  - community_engage -> React, comment, or post in the feed
  - first_plant      -> For someone with no plants yet: add one

Rules:
- One mission per (user, mission_date). The date is the user's UTC day.
- Deterministic: same user and date returns the same mission unless state precludes the chosen one.
- Every mission completes from something that really happened. There is no
  self-attest "mark done".
- No points or currency. Nothing is awarded for completing a mission; the card
  just says "Nice work".
- Old stored missions keep working: the retired id `water_streak` is read as
  `plant_check_in`.
"""

from __future__ import annotations
import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

from check_ins import LOOKED_ACTIONS

MISSION_TYPES = ["plant_check_in", "photo_log", "health_check", "community_engage"]

# Before this rework the check-one-plant mission was stored as `water_streak`.
LEGACY_MISSION_TYPES = {"water_streak": "plant_check_in"}

MISSION_COPY: Dict[str, Dict[str, str]] = {
    "plant_check_in": {
        "title": "Plant check-in",
        "subtitle": "A 20-second soil check on one plant. Press a finger into the soil, then decide whether to water or wait.",
        "cta": "Check a plant",
        "cta_path": "/care",
        "icon": "droplet",
    },
    "photo_log": {
        "title": "Capture today's growth",
        "subtitle": "Log a care action with a photo, or upload a fresh plant photo.",
        "cta": "Add a photo",
        "cta_path": "/collection",
        "icon": "camera",
    },
    "health_check": {
        "title": "Check in on a plant",
        "subtitle": "Open one plant and look at its health panel today.",
        "cta": "Open a plant",
        "cta_path": "/collection",
        "icon": "leaf",
    },
    "community_engage": {
        "title": "Spend a moment in the grove",
        "subtitle": "React, comment, or share something in the feed.",
        "cta": "Open the feed",
        "cta_path": "/feed",
        "icon": "sparkles",
    },
    "first_plant": {
        "title": "Add your first plant",
        "subtitle": "It takes under a minute. Photos can come later.",
        "cta": "Add a plant",
        "cta_path": "/add-plant",
        "icon": "leaf",
    },
}

# People with plants get the plant check-in on 7 of every 10 days. The rest
# rotate through the other missions. Deterministic per (user, day).
PLANT_OWNER_ROTATION = (
    ["plant_check_in"] * 7 + ["photo_log", "health_check", "community_engage"]
)


def canonical_type(mission_type: Optional[str]) -> Optional[str]:
    return LEGACY_MISSION_TYPES.get(mission_type, mission_type)


def today_str() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _deterministic_index(user_id: str, mission_date: str, n: int) -> int:
    """Stable per (user, day) index in [0, n)."""
    if n <= 0:
        return 0
    h = hashlib.sha1(f"{user_id}|{mission_date}".encode("utf-8")).hexdigest()
    return int(h, 16) % n


async def _has_any_plants(db, user_id: str) -> bool:
    return (await db.plants.count_documents({"user_id": user_id, "is_archived": {"$ne": True}})) > 0


async def _has_logged_care_today(db, user_id: str) -> bool:
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    return (await db.care_logs.count_documents({
        "user_id": user_id, "logged_at": {"$gte": start}
    })) > 0


async def _has_photo_today(db, user_id: str) -> bool:
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    care_with_photo = await db.care_logs.count_documents({
        "user_id": user_id, "logged_at": {"$gte": start}, "photo_url": {"$nin": ["", None]}
    })
    return care_with_photo > 0


async def _candidate_missions(db, user_id: str) -> List[str]:
    """Return mission types feasible given user state (in priority order)."""
    has_plants = await _has_any_plants(db, user_id)
    if not has_plants:
        # Nothing to check yet, so the one honest mission is adding a plant.
        return ["first_plant"]
    return PLANT_OWNER_ROTATION[:]


async def get_or_assign_daily_mission(db, user_id: str) -> Dict[str, Any]:
    mission_date = today_str()
    existing = await db.user_missions.find_one(
        {"user_id": user_id, "mission_date": mission_date}, {"_id": 0}
    )
    if existing:
        return await _enrich(db, user_id, existing)

    candidates = await _candidate_missions(db, user_id)
    idx = _deterministic_index(user_id, mission_date, len(candidates))
    chosen_type = candidates[idx]

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "mission_date": mission_date,
        "mission_type": chosen_type,
        "assigned_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "metadata": {},
    }
    await db.user_missions.insert_one(doc.copy())
    return await _enrich(db, user_id, doc)


async def _enrich(db, user_id: str, doc: Dict[str, Any]) -> Dict[str, Any]:
    mtype = canonical_type(doc.get("mission_type"))
    copy = MISSION_COPY.get(mtype, {})
    out = {
        "id": doc.get("id"),
        "mission_date": doc.get("mission_date"),
        "mission_type": mtype,
        "title": copy.get("title", "Today's mission"),
        "subtitle": copy.get("subtitle", ""),
        "cta": copy.get("cta", "Begin"),
        "cta_path": copy.get("cta_path", "/care"),
        "icon": copy.get("icon", "leaf"),
        "completed": bool(doc.get("completed_at")),
        "completed_at": doc.get("completed_at"),
    }
    return out


async def _complete(db, user_id: str, reason: str) -> Optional[Dict[str, Any]]:
    """Mark today's mission complete idempotently. Returns enriched mission (or None)."""
    mission_date = today_str()
    existing = await db.user_missions.find_one(
        {"user_id": user_id, "mission_date": mission_date}
    )
    if not existing:
        # Auto-assign if not yet picked, then re-load
        await get_or_assign_daily_mission(db, user_id)
        existing = await db.user_missions.find_one(
            {"user_id": user_id, "mission_date": mission_date}
        )
    if not existing:
        return None
    if existing.get("completed_at"):
        return await _enrich(db, user_id, existing)

    await db.user_missions.update_one(
        {"id": existing["id"]},
        {"$set": {
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "completion_reason": reason,
        }},
    )
    refreshed = await db.user_missions.find_one({"id": existing["id"]})
    return await _enrich(db, user_id, refreshed)


# ----- event hooks (called from server.py after side-effects) -----

async def on_care_log(db, user_id: str, log) -> Optional[Dict[str, Any]]:
    """Care log(s) created. `log` is one log dict or a list of them.

    The plant check-in completes only on a soil check (or another "looked at it"
    action), never on watering. A photo mission completes on a log with a photo.
    """
    logs = log if isinstance(log, list) else [log]
    logs = [entry or {} for entry in logs]
    mission_date = today_str()
    existing = await db.user_missions.find_one(
        {"user_id": user_id, "mission_date": mission_date}
    )
    if not existing:
        await get_or_assign_daily_mission(db, user_id)
        existing = await db.user_missions.find_one(
            {"user_id": user_id, "mission_date": mission_date}
        )
    if not existing or existing.get("completed_at"):
        return None
    mtype = canonical_type(existing.get("mission_type"))
    if mtype == "plant_check_in" and any(entry.get("action") in LOOKED_ACTIONS for entry in logs):
        return await _complete(db, user_id, "soil_check")
    if mtype == "photo_log" and any(entry.get("photo_url") for entry in logs):
        return await _complete(db, user_id, "care_log_with_photo")
    return None


async def on_photo_upload(db, user_id: str) -> Optional[Dict[str, Any]]:
    existing = await db.user_missions.find_one(
        {"user_id": user_id, "mission_date": today_str()}
    )
    if existing and existing.get("mission_type") == "photo_log" and not existing.get("completed_at"):
        return await _complete(db, user_id, "photo_upload")
    return None


async def on_community_action(db, user_id: str, kind: str) -> Optional[Dict[str, Any]]:
    existing = await db.user_missions.find_one(
        {"user_id": user_id, "mission_date": today_str()}
    )
    if existing and existing.get("mission_type") == "community_engage" and not existing.get("completed_at"):
        return await _complete(db, user_id, f"community_{kind}")
    return None


async def on_health_check(db, user_id: str) -> Optional[Dict[str, Any]]:
    existing = await db.user_missions.find_one(
        {"user_id": user_id, "mission_date": today_str()}
    )
    if existing and existing.get("mission_type") == "health_check" and not existing.get("completed_at"):
        return await _complete(db, user_id, "health_panel_view")
    return None


async def on_plant_added(db, user_id: str) -> Optional[Dict[str, Any]]:
    existing = await db.user_missions.find_one(
        {"user_id": user_id, "mission_date": today_str()}
    )
    if existing and existing.get("mission_type") == "first_plant" and not existing.get("completed_at"):
        return await _complete(db, user_id, "plant_added")
    return None
