"""Pip's nook: the rules that turn Grove's existing signals into nook state.

Pure functions only, with no database access, so they can be unit tested.
Growth is always derived from the event log. It is never a stored counter.
The interface never shows these numbers; it only says the nook grew.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Iterable, List, Optional

DAILY_CAP = 30
ROLLING_DAYS = 14
LOW_HEALTH_SCORE = 30
CATALOG_DAYS = 30

# (level, name, growth needed)
LEVELS = (
    (1, "Bare", 0),
    (2, "Settling in", 100),
    (3, "Lived in", 200),
    (4, "In bloom", 300),
)

# What each level adds to the nook.
UNLOCKS = {
    1: ["window", "table", "sill", "floor"],
    2: ["shelf"],
    3: ["rug", "lamp"],
    4: ["hanging", "wall-art"],
}

# Shown as "Next: ..." so the interface can name the next unlock without numbers.
NEXT_UNLOCK_TEXT = {
    2: "the shelf",
    3: "a rug and a lamp",
    4: "a hanging plant and a botanical print",
}

# Growth per signal. Missions bring their own XP.
POINTS = {
    "lesson": 15,
    "soil_check": 15,
    "light_check": 10,
    "leaves_wiped": 5,
    "readiness_step": 10,
    "badge": 20,
}

READINESS_STEPS = ("light-spot", "drainage", "soil-mix")
NOOK_BADGE_PREFIX = "nook_level_"

PIP_FORMS = {1: "seed", 2: "sprout", 3: "leafy", 4: "bloom"}

SPECIES_GROUPS = (
    ("pothos", ("pothos", "epipremnum")),
    ("monstera", ("monstera",)),
    ("succulent", ("succulent", "echeveria", "aloe", "jade", "crassula", "haworthia", "sedum")),
    ("snake", ("snake plant", "sansevieria", "trifasciata")),
)


def _parse(value) -> Optional[datetime]:
    """Parse an ISO timestamp to an aware UTC datetime. Anything unreadable is None."""
    if not value or not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def compute_growth(events: Iterable[dict]) -> int:
    """Total nook growth from a list of events.

    Each event is a dict with `kind`, optional `at` (ISO time), `key`,
    `plant_id`, and `points`. Limits:
      - lessons, readiness steps, missions, and badges count once each;
      - a soil test counts once per plant per day;
      - a light check or leaf wipe counts once per plant per 14 days;
      - no more than 30 growth counts on any one day.
    Events with no readable time ("undated") count once, outside the daily cap.
    Nook level badges never count, so levels cannot feed themselves.
    """
    dated = []
    undated = []
    for event in events or []:
        when = _parse(event.get("at"))
        (dated if when else undated).append((when, event))
    dated.sort(key=lambda pair: pair[0])

    seen_once = set()
    soil_days = set()
    last_counted: Dict[tuple, Optional[datetime]] = {}

    def points_for(event: dict) -> int:
        if event.get("points") is not None:
            return max(0, int(event["points"]))
        return POINTS.get(event.get("kind"), 0)

    def accept(event: dict, when: Optional[datetime]) -> bool:
        kind = event.get("kind")
        if kind == "badge" and str(event.get("key") or "").startswith(NOOK_BADGE_PREFIX):
            return False
        if kind in ("lesson", "readiness_step", "badge", "mission"):
            marker = (kind, event.get("key"))
            if marker in seen_once:
                return False
            seen_once.add(marker)
            return True
        if kind == "soil_check":
            marker = (event.get("plant_id"), when.date() if when else None)
            if marker in soil_days:
                return False
            soil_days.add(marker)
            return True
        if kind in ("light_check", "leaves_wiped"):
            marker = (kind, event.get("plant_id"))
            last = last_counted.get(marker)
            if last is not None and when is not None and when - last < timedelta(days=ROLLING_DAYS):
                return False
            last_counted[marker] = when
            return True
        return False

    per_day: Dict = {}
    for when, event in dated:
        if not accept(event, when):
            continue
        day = when.date()
        room = DAILY_CAP - per_day.get(day, 0)
        per_day[day] = per_day.get(day, 0) + max(0, min(points_for(event), room))

    total = sum(per_day.values())
    for when, event in undated:
        if accept(event, None):
            total += points_for(event)
    return total


def level_info(growth: int) -> dict:
    """The level for a growth total, with a plain-words name for what comes next."""
    level, name = LEVELS[0][0], LEVELS[0][1]
    for number, label, needed in LEVELS:
        if growth >= needed:
            level, name = number, label
    return {"level": level, "name": name, "next_unlock": NEXT_UNLOCK_TEXT.get(level + 1)}


def unlocked_slots(level: int) -> List[str]:
    """Every slot unlocked at or below a level, in unlock order."""
    slots: List[str] = []
    for number in sorted(UNLOCKS):
        if number <= level:
            slots.extend(UNLOCKS[number])
    return slots


def pip_form(level: int) -> str:
    return PIP_FORMS.get(level, "seed")


def pip_location(level: int) -> str:
    """Pip starts on the windowsill and moves to the shelf at level 2."""
    return "sill" if level < 2 else "shelf"


def plant_condition(status: Optional[str], looks_off: bool = False, health_scores: Optional[Iterable[int]] = None) -> str:
    """The sprite state for a real plant: fine, due-soon, or needs-attention.

    It comes from the plant's schedule status, the user's "looks off" flag, and
    Grove's health check. It never comes from nook growth.
    """
    if looks_off or status == "urgent":
        return "needs-attention"
    if any(score < LOW_HEALTH_SCORE for score in (health_scores or [])):
        return "needs-attention"
    if status == "needs_water":
        return "due-soon"
    return "fine"


def is_quiet(conditions: Iterable[str]) -> bool:
    """Pip goes quiet and supportive while any real plant needs attention."""
    return any(condition == "needs-attention" for condition in conditions)


def species_group(common_name: Optional[str], latin_name: Optional[str] = None) -> str:
    """Which sprite template a species uses. Anything unrecognised gets the generic one."""
    text = f"{common_name or ''} {latin_name or ''}".lower()
    for group, words in SPECIES_GROUPS:
        if any(word in text for word in words):
            return group
    return "generic"


def weekly_days(timestamps: Iterable[str], now: datetime) -> int:
    """How many different days this week (Monday to Sunday, UTC) the user showed up."""
    today = now.astimezone(timezone.utc).date()
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=6)
    days = set()
    for stamp in timestamps or []:
        when = _parse(stamp)
        if when and start <= when.date() <= end:
            days.add(when.date())
    return len(days)


def catalog_open(created_at: Optional[str], now: datetime, enabled: bool) -> bool:
    """The choose-your-own decor catalog opens 30 days after signup, for users with the nook on."""
    created = _parse(created_at)
    if not enabled or created is None:
        return False
    return now - created >= timedelta(days=CATALOG_DAYS)


def readiness_state(steps_done: int) -> str:
    """The readiness plant's only states: seed, sprouting, and ready. It never has a need."""
    if steps_done <= 0:
        return "seed"
    if steps_done >= len(READINESS_STEPS):
        return "ready"
    return "sprouting"


def visible_badges(badges: List[dict], nook_enabled: bool, earned_slugs: Iterable[str]) -> List[dict]:
    """Hide the nook's level badges from the gallery until the user opts in, unless already earned."""
    earned = set(earned_slugs or [])
    if nook_enabled:
        return list(badges)
    return [
        badge for badge in badges
        if not str(badge.get("slug") or "").startswith(NOOK_BADGE_PREFIX) or badge.get("slug") in earned
    ]
