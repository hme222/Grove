"""
Daily Missions for Grove (Phase 11C)

Smart-rotation across four mission types:
  - water_streak     → Water at least 1 plant today
  - photo_log        → Log a care action with a photo, OR upload a plant photo
  - health_check     → Open a plant's health panel today (or trigger /missions/daily/complete)
  - community_engage → React, comment, or post in the feed

Rules:
- One mission per (user, mission_date) — date is the user's UTC day.
- Deterministic: same user & date returns the same mission unless state precludes the chosen one.
- Smart selection adapts to user state (zero-plant users skip plant-action missions, etc).
- Completion is one-time per (user, mission_date) and awards XP idempotently.
"""

from __future__ import annotations
import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List

# Order matters for fallback rotation; "primary" candidates considered first.
MISSION_TYPES = ["water_streak", "photo_log", "health_check", "community_engage"]

MISSION_COPY: Dict[str, Dict[str, str]] = {
    "water_streak": {
        "title": "Water one plant",
        "subtitle": "Even one plant tended today keeps the rhythm going.",
        "cta": "Open Care",
        "cta_path": "/care",
        "xp": 10,
        "icon": "droplet",
    },
    "photo_log": {
        "title": "Capture today's growth",
        "subtitle": "Log a care action with a photo, or upload a fresh plant photo.",
        "cta": "Add a photo",
        "cta_path": "/collection",
        "xp": 15,
        "icon": "camera",
    },
    "health_check": {
        "title": "Check in on a plant",
        "subtitle": "Open one plant and look at its health panel today.",
        "cta": "Open a plant",
        "cta_path": "/collection",
        "xp": 10,
        "icon": "leaf",
    },
    "community_engage": {
        "title": "Spend a moment in the grove",
        "subtitle": "React, comment, or share something in the feed.",
        "cta": "Open the feed",
        "cta_path": "/feed",
        "xp": 10,
        "icon": "sparkles",
    },
}


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
        # Zero-plant users — push them toward simple wins
        return ["community_engage", "photo_log", "health_check"]
    return MISSION_TYPES[:]  # all four feasible


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
        "xp_awarded": 0,
        "metadata": {},
    }
    await db.user_missions.insert_one(doc.copy())
    return await _enrich(db, user_id, doc)


async def _enrich(db, user_id: str, doc: Dict[str, Any]) -> Dict[str, Any]:
    mtype = doc.get("mission_type")
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
        "xp": copy.get("xp", 10),
        "completed": bool(doc.get("completed_at")),
        "completed_at": doc.get("completed_at"),
        "xp_awarded": doc.get("xp_awarded", 0),
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

    xp = MISSION_COPY.get(existing.get("mission_type"), {}).get("xp", 10)
    await db.user_missions.update_one(
        {"id": existing["id"]},
        {"$set": {
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "xp_awarded": xp,
            "completion_reason": reason,
        }},
    )
    refreshed = await db.user_missions.find_one({"id": existing["id"]})
    return await _enrich(db, user_id, refreshed)


# ----- event hooks (called from server.py after side-effects) -----

async def on_care_log(db, user_id: str, log: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Care log created — try to complete water_streak / photo_log."""
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
    mtype = existing.get("mission_type")
    if mtype == "water_streak":
        # any care log counts; watering family explicit check is generous
        return await _complete(db, user_id, "care_log")
    if mtype == "photo_log" and (log or {}).get("photo_url"):
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


async def manual_complete(db, user_id: str) -> Optional[Dict[str, Any]]:
    """Force-complete today's mission (used by frontend explicit CTA)."""
    return await _complete(db, user_id, "manual")
