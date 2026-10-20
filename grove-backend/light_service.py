"""Saves the person's answers to the light lessons and builds the "what fits" list.

Reads and writes the database, and leaves every light rule to `light.py`.
"""
from datetime import datetime
from typing import Dict, Optional

import light
import nook_service
import tracks


class LightError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


async def save_window(db, user_id: str, sun: Optional[str], direction: Optional[str],
                      view: Optional[str], hemisphere: Optional[str], now_iso: str) -> Dict:
    """Save the window for the person's first plant. Returns the window summary."""
    if direction is None and sun is None:
        raise LightError(422, "Pick when the sun reaches the window, or its direction.")
    if sun is not None and sun not in light.SUNS:
        raise LightError(422, "Unknown sun timing.")
    if direction is not None and direction not in light.DIRECTIONS:
        raise LightError(422, "Unknown direction.")
    if view is not None and view not in light.VIEWS:
        raise LightError(422, "Unknown view.")
    if hemisphere is not None and hemisphere not in light.HEMISPHERES:
        raise LightError(422, "Unknown hemisphere.")

    user = await db.users.find_one({"id": user_id}) or {}
    chosen_view = view or user.get("window_view") or "open"
    chosen_hemisphere = hemisphere or user.get("hemisphere") or "north"
    if sun == "nowindow":
        direction = None
    saved_sun = sun or light.sun_for_direction(direction)

    fields = {
        "window_sun": saved_sun,
        "window_view": chosen_view,
        "hemisphere": chosen_hemisphere,
        "light_prompt_pending": False,
        "light_prompt_dismissed": True,
        "updated_at": now_iso,
    }
    update = {"$set": fields}
    if direction:
        fields["window_direction"] = direction
    else:
        update["$unset"] = {"window_direction": ""}
    await db.users.update_one({"id": user_id}, update)

    # A saved window counts as the nook's "find a light spot" readiness step, if one was started.
    try:
        await nook_service.complete_readiness_step(db, user_id, "light-spot", now_iso)
    except nook_service.NookError as error:
        if error.status != 409:
            raise

    return light.window_summary(saved_sun, direction, chosen_view, chosen_hemisphere, datetime.fromisoformat(now_iso))


async def save_reading(db, user_id: str, reading: str, now_iso: str) -> Dict:
    if reading not in light.READINGS:
        raise LightError(422, "Unknown light reading.")
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"light_reading": reading, "light_prompt_pending": False,
                  "light_prompt_dismissed": True, "updated_at": now_iso}},
    )
    return {"light_reading": reading}


async def save_progress(db, user_id: str, lesson_id: str, card: int, now_iso: str) -> Dict:
    if lesson_id not in tracks.LIBRARY_LESSON_IDS:
        raise LightError(404, "Lesson not found")
    if card < 0:
        raise LightError(422, "Card number cannot be negative.")
    user = await db.users.find_one({"id": user_id}) or {}
    progress = dict(user.get("lesson_progress") or {})
    progress[lesson_id] = card
    await db.users.update_one({"id": user_id}, {"$set": {"lesson_progress": progress, "updated_at": now_iso}})
    return {"lesson_progress": progress}


async def set_prompt(db, user_id: str, action: str, now_iso: str) -> Dict:
    """The one-time midday prompt on Care Today. Once dismissed it never comes back."""
    if action not in ("later", "dismiss"):
        raise LightError(422, "Unknown action.")
    user = await db.users.find_one({"id": user_id}) or {}
    dismissed = bool(user.get("light_prompt_dismissed"))
    if action == "dismiss":
        pending, dismissed = False, True
    else:
        pending = not dismissed
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"light_prompt_pending": pending, "light_prompt_dismissed": dismissed, "updated_at": now_iso}},
    )
    return {"light_prompt_pending": pending, "light_prompt_dismissed": dismissed}


async def fits_for(db, user_id: str, now_iso: str) -> Dict:
    """Which of the person's plants suit their window, and which species would."""
    user = await db.users.find_one({"id": user_id}) or {}
    window = light.window_summary(
        user.get("window_sun"), user.get("window_direction"),
        user.get("window_view") or "open", user.get("hemisphere") or "north",
        datetime.fromisoformat(now_iso),
    )
    if not window:
        return {"has_window": False, "level": None, "plants": [], "species": []}
    level = window["level"]

    plants = await db.plants.find({"user_id": user_id, "is_archived": {"$ne": True}}).to_list(200)
    owned = []
    for plant in plants:
        if not plant.get("species_id"):
            continue
        species = await db.species.find_one({"id": plant["species_id"]})
        plant_level = (species or {}).get("default_light_level")
        if plant_level not in light.LEVELS:
            continue
        owned.append({
            "id": plant["id"],
            "name": plant.get("nickname") or plant.get("common_name") or "Plant",
            "suit": light.suit(plant_level, level),
        })

    every_species = await db.species.find({}).to_list(500)
    matches = light.fits_species(every_species, level)
    return {
        "has_window": True,
        "level": level,
        "plants": owned,
        "species": [{"id": s.get("id"), "slug": s.get("slug"), "common_name": s.get("common_name")} for s in matches],
    }
