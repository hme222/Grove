"""Suggest a better watering interval from what the person has told us.

Pure functions, no database access. Nothing here changes a schedule. It only builds a suggestion
that the person can accept or dismiss, so the schedule never moves without their say.

Two signals, in this order:

1. Soil checks. A soil check logged near or after the due date that found damp soil means the schedule
   is probably too short. One logged well before the due date that found dry soil means it is probably
   too long. Two agreeing checks in a row make a suggestion. This is the person's own evidence, so it
   wins over any estimate.
2. Room light. If the plant's room is brighter or dimmer than its species prefers, the soil may dry
   faster or slower than the schedule assumes. This is a rule of thumb (one day per light step, at most
   two), not a measurement, and it has no recorded horticultural source yet. Do not describe it as
   verified. It is offered only for plants whose schedule the person has not set themselves.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from ai_service import MAX_WATERING_DAYS, MIN_WATERING_DAYS
from room_light import LEVELS, light_band

# A soil check this close to (or past) the due date counts as "when it was due".
DUE_FRACTION = 0.8
# Two checks in a row must agree before we suggest anything.
CHECKS_NEEDED = 2
# A water log within an hour of a soil check is part of the same care sweep, not the previous watering.
SAME_SWEEP = timedelta(hours=1)
MAX_LIGHT_STEPS = 2

_LEVEL_WORDS = {
    "low": "low light",
    "medium": "medium light",
    "bright_indirect": "bright, indirect light",
    "bright_direct": "direct sun",
}


def _when(value) -> Optional[datetime]:
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str) and value:
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _clamp(days: int) -> int:
    return max(MIN_WATERING_DAYS, min(MAX_WATERING_DAYS, int(days)))


def soil_signals(logs: List[dict], interval: int, since: Optional[datetime] = None) -> List[str]:
    """'longer' or 'shorter' for each soil check that says something about the schedule, newest first.

    A damp check at or after 80% of the interval says the interval is too short, so the answer is 'longer'.
    A dry check before 80% of the interval (and at least a day after watering) says it is too long: 'shorter'.
    Checks that match the schedule (damp early, dry late) say nothing and are skipped.
    """
    waters = sorted(
        (t for t in (_when(l.get("logged_at")) for l in logs if l.get("action") == "water") if t),
    )
    out = []
    checks = [l for l in logs if l.get("action") == "soil_check" and l.get("soil_outcome") in ("dry", "damp")]
    checks.sort(key=lambda l: _when(l.get("logged_at")) or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    for check in checks:
        at = _when(check.get("logged_at"))
        if not at or (since and at <= since):
            continue
        before = [w for w in waters if w <= at - SAME_SWEEP]
        if not before:
            continue
        elapsed = (at - before[-1]).total_seconds() / 86400
        if check["soil_outcome"] == "damp" and elapsed >= interval * DUE_FRACTION:
            out.append("longer")
        elif check["soil_outcome"] == "dry" and 1 <= elapsed < interval * DUE_FRACTION:
            out.append("shorter")
    return out


def _step(interval: int) -> int:
    return max(1, round(interval * 0.25))


def suggest_from_soil(logs: List[dict], interval: int, since: Optional[datetime]) -> Optional[dict]:
    signals = soil_signals(logs, interval, since)[:CHECKS_NEEDED]
    if len(signals) < CHECKS_NEEDED or len(set(signals)) != 1:
        return None
    if signals[0] == "longer":
        days = _clamp(interval + _step(interval))
        reason = "Your last two soil checks found the soil still damp when watering was due."
    else:
        days = _clamp(interval - _step(interval))
        reason = "Your last two soil checks found dry soil before watering was due."
    if days == interval:
        return None
    return {"days": days, "basis": "soil", "reason": reason}


def suggest_from_light(room_level: Optional[str], species: Optional[dict], interval: int,
                       plant_name: str, room: str) -> Optional[dict]:
    band = light_band(species)
    if room_level not in LEVELS or band is None:
        return None
    delta = LEVELS.index(room_level) - LEVELS.index(band[1])
    if delta == 0:
        return None
    steps = min(abs(delta), MAX_LIGHT_STEPS)
    if delta > 0:
        days = _clamp(interval - steps)
        reason = (f"{room} gets {_LEVEL_WORDS[room_level]}, which is more than {plant_name} needs, "
                  "so the soil may dry out sooner than the schedule expects.")
    else:
        days = _clamp(interval + steps)
        reason = (f"{room} gets {_LEVEL_WORDS[room_level]}, which is less than {plant_name} needs, "
                  "so the soil may stay damp longer than the schedule expects.")
    if days == interval:
        return None
    return {"days": days, "basis": "light", "reason": reason}


def suggest(plant: dict, logs: List[dict], room_level: Optional[str], species: Optional[dict]) -> Optional[dict]:
    """One suggestion for a plant, or None. Always 'try this', never applied automatically.

    Hidden when the person already dismissed this exact number.
    """
    interval = plant.get("watering_frequency_days") or 7
    if plant.get("grow_medium") in ("propagation_jar", "water"):
        return None
    since = _when(plant.get("watering_frequency_set_at")) or _when(plant.get("created_at"))
    found = suggest_from_soil(logs, interval, since)
    if not found and plant.get("watering_frequency_source") != "user":
        name = plant.get("nickname") or plant.get("common_name") or "this plant"
        room = plant.get("room") or "This room"
        found = suggest_from_light(room_level, species, interval, name, room)
    if not found:
        return None
    if plant.get("schedule_suggestion_dismissed_days") == found["days"]:
        return None
    found["current_days"] = interval
    return found
