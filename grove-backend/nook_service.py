"""The database side of Pip's nook.

It gathers the signals Grove already records and builds the nook state. The
rules themselves live in nook.py. Plant status and health come in as functions,
so this module never imports server.py.
"""
import uuid
from datetime import datetime
from typing import Awaitable, Callable, Dict, List

import light
import nook
import tracks

CARE_KINDS = {"soil_check": "soil_check", "light_check": "light_check", "clean": "leaves_wiped"}
MAX_PLANTS = 30
MAX_SHELF_PLANTS = 4


class NookError(Exception):
    """A problem the caller should report as an HTTP error."""

    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


async def gather_events(db, user_id: str, user: dict) -> List[dict]:
    """Every signal that can grow the nook, as plain event dicts."""
    events: List[dict] = []

    stamps = user.get("lesson_completed_at") or {}
    for lesson_id in tracks.completed_lessons(user.get("tutorials_seen")):
        events.append({"kind": "lesson", "key": lesson_id, "at": stamps.get(lesson_id)})

    logs = await db.care_logs.find({"user_id": user_id, "action": {"$in": list(CARE_KINDS)}}).to_list(5000)
    for log in logs:
        events.append({"kind": CARE_KINDS[log["action"]], "plant_id": log.get("plant_id"), "at": log.get("logged_at")})

    for step_id, when in ((user.get("readiness_plant") or {}).get("steps") or {}).items():
        events.append({"kind": "readiness_step", "key": step_id, "at": when})

    missions = await db.user_missions.find({"user_id": user_id, "completed_at": {"$ne": None}}).to_list(1000)
    for mission in missions:
        events.append({
            "kind": "mission",
            "key": mission.get("id"),
            "at": mission.get("completed_at"),
            "points": mission.get("xp_awarded") or 0,
        })

    for earned in await db.user_badges.find({"user_id": user_id}).to_list(500):
        events.append({"kind": "badge", "key": earned.get("badge_slug"), "at": earned.get("earned_at")})
    return events


async def activity_stamps(db, user_id: str, user: dict) -> List[str]:
    """Every time the user showed up: any care log, a lesson, or a readiness step."""
    stamps = [log.get("logged_at") for log in await db.care_logs.find({"user_id": user_id}).to_list(5000)]
    stamps.extend((user.get("lesson_completed_at") or {}).values())
    stamps.extend(((user.get("readiness_plant") or {}).get("steps") or {}).values())
    return stamps


async def current_growth(db, user_id: str) -> int:
    user = await db.users.find_one({"id": user_id}) or {}
    return nook.compute_growth(await gather_events(db, user_id, user))


async def build_state(
    db,
    user_id: str,
    now: datetime,
    status_fn: Callable[[dict], str],
    scores_fn: Callable[[dict], Awaitable[List[int]]],
) -> dict:
    """Everything the nook screen needs. It never includes the growth number."""
    user = await db.users.find_one({"id": user_id}) or {}
    growth = nook.compute_growth(await gather_events(db, user_id, user))
    info = nook.level_info(growth)
    level = info["level"]

    plants = await db.plants.find({"user_id": user_id, "is_archived": {"$ne": True}}).to_list(200)
    plants.sort(key=lambda plant: plant.get("created_at") or "")
    rows: List[Dict] = []
    for plant in plants:
        condition = nook.plant_condition(status_fn(plant), bool(plant.get("looks_off")), await scores_fn(plant))
        rows.append({
            "id": plant["id"],
            "name": plant.get("nickname") or plant.get("common_name") or "Plant",
            "group": nook.species_group(plant.get("common_name"), plant.get("latin_name")),
            "condition": condition,
            "looks_off": bool(plant.get("looks_off")),
            # The plant's cover photo, the same field the Plants API returns.
            "photo_url": plant.get("photo_url") or None,
        })

    # Quiet mode looks at every active plant. Only the list the page shows is capped.
    quiet = nook.is_quiet(row["condition"] for row in rows)
    rows = rows[:MAX_PLANTS]

    chosen = user.get("nook_hero_plant_id")
    hero = next((row for row in rows if row["id"] == chosen), None) or (rows[0] if rows else None)
    shelf = [row for row in rows if hero and row["id"] != hero["id"]][:MAX_SHELF_PLANTS]

    readiness = None
    started = user.get("readiness_plant")
    if started:
        done = started.get("steps") or {}
        count = sum(1 for step in nook.READINESS_STEPS if step in done)
        readiness = {
            "species_id": started.get("species_id"),
            "species_name": started.get("species_name"),
            "watering_days": started.get("watering_days") or 7,
            "group": nook.species_group(started.get("species_name")),
            "steps": [{"id": step, "done": step in done} for step in nook.READINESS_STEPS],
            "state": nook.readiness_state(count),
        }

    enabled = bool(user.get("nook_enabled"))
    return {
        "enabled": enabled,
        "offered": bool(user.get("nook_offered_at")),
        "level": level,
        "level_name": info["name"],
        "next_unlock": info["next_unlock"],
        "unlocked": nook.unlocked_slots(level),
        "grew": growth > (user.get("nook_seen_growth") or 0),
        "level_up": level > (user.get("nook_seen_level") or 1),
        "pip": {"form": nook.pip_form(level), "location": nook.pip_location(level)},
        "hero": hero,
        "shelf_plants": shelf,
        "plants": rows,
        "readiness": readiness,
        "quiet": quiet,
        "weekly_days": nook.weekly_days(await activity_stamps(db, user_id, user), now),
        "catalog_open": nook.catalog_open(user.get("created_at"), now, enabled),
        "window": light.window_summary(
            user.get("window_sun"), user.get("window_direction"),
            user.get("window_view") or "open", user.get("hemisphere") or "north", now,
        ),
    }


async def award_level_badges(db, user_id: str, level: int, now_iso: str) -> List[str]:
    """Give the level badges the user has reached. Safe to call again."""
    awarded: List[str] = []
    for number in range(2, level + 1):
        slug = f"{nook.NOOK_BADGE_PREFIX}{number}"
        if await db.user_badges.find_one({"user_id": user_id, "badge_slug": slug}):
            continue
        badge = await db.badges.find_one({"slug": slug})
        if not badge:
            continue
        await db.user_badges.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "badge_id": badge["id"],
            "badge_slug": slug,
            "earned_at": now_iso,
        })
        awarded.append(slug)
    return awarded


async def mark_seen(db, user_id: str, now_iso: str) -> None:
    """Remember what the user has seen, so "your nook grew" shows once."""
    user = await db.users.find_one({"id": user_id}) or {}
    growth = nook.compute_growth(await gather_events(db, user_id, user))
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "nook_seen_growth": growth,
            "nook_seen_level": nook.level_info(growth)["level"],
            "updated_at": now_iso,
        }},
    )


async def update_settings(db, user_id: str, enabled, hero_plant_id, now_iso: str) -> dict:
    """Turn the nook on or off and choose the hero plant. Returns the saved fields."""
    user = await db.users.find_one({"id": user_id}) or {}
    updates: Dict = {}
    if hero_plant_id is not None:
        if not await db.plants.find_one({"id": hero_plant_id, "user_id": user_id}):
            raise NookError(404, "Plant not found")
        updates["nook_hero_plant_id"] = hero_plant_id
    if enabled is not None:
        updates["nook_enabled"] = bool(enabled)
        # The offer is recorded once, so it is never made again.
        if not user.get("nook_offered_at"):
            updates["nook_offered_at"] = now_iso
    if updates:
        updates["updated_at"] = now_iso
        await db.users.update_one({"id": user_id}, {"$set": updates})
    saved = await db.users.find_one({"id": user_id}) or {}
    return {
        "nook_enabled": bool(saved.get("nook_enabled")),
        "nook_offered_at": saved.get("nook_offered_at"),
        "nook_hero_plant_id": saved.get("nook_hero_plant_id"),
    }


async def start_readiness(db, user_id: str, species_id: str, now_iso: str) -> None:
    """Pick the species the user is getting ready for. Steps already done are kept."""
    species = await db.species.find_one({"id": species_id})
    if not species:
        raise NookError(404, "Species not found")
    user = await db.users.find_one({"id": user_id}) or {}
    existing = user.get("readiness_plant") or {}
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "readiness_plant": {
                "species_id": species_id,
                "species_name": species.get("common_name"),
                "watering_days": species.get("default_watering_days") or 7,
                "started_at": existing.get("started_at") or now_iso,
                "steps": existing.get("steps") or {},
            },
            "updated_at": now_iso,
        }},
    )


async def complete_readiness_step(db, user_id: str, step_id: str, now_iso: str) -> None:
    """Mark a readiness step done. Safe to call twice."""
    if step_id not in nook.READINESS_STEPS:
        raise NookError(404, "Step not found")
    user = await db.users.find_one({"id": user_id}) or {}
    started = user.get("readiness_plant")
    if not started:
        raise NookError(409, "Pick a plant to get ready for first.")
    if step_id in (started.get("steps") or {}):
        return
    await db.users.update_one(
        {"id": user_id},
        {"$set": {f"readiness_plant.steps.{step_id}": now_iso, "updated_at": now_iso}},
    )


async def set_looks_off(db, user_id: str, plant_id: str, looks_off: bool, now_iso: str) -> None:
    """Flag a plant as looking off, or clear the flag."""
    if not await db.plants.find_one({"id": plant_id, "user_id": user_id}):
        raise NookError(404, "Plant not found")
    await db.plants.update_one(
        {"id": plant_id},
        {"$set": {"looks_off": bool(looks_off), "updated_at": now_iso}},
    )
