"""Light rules for Grove's window lesson and Pip's nook.

Pure functions only, with no database access, so they can be unit tested.
Directions are written for the northern hemisphere. A southern-hemisphere
user's direction is swapped with `effective_direction` before anything else.
"""
from datetime import datetime
from typing import Dict, Iterable, List, Optional

LEVELS = ("low", "medium", "bright_indirect", "bright_direct")
DIRECTIONS = ("N", "NE", "E", "SE", "S", "SW", "W", "NW")
SUNS = ("morning", "midday", "afternoon", "none", "nowindow")
VIEWS = ("open", "tree", "building")
HEMISPHERES = ("north", "south")
READINGS = ("crisp", "soft", "faint")

_SUN_TO_DIRECTION = {"morning": "E", "midday": "S", "afternoon": "W", "none": "N"}
_DIRECTION_TO_SUN = {
    "N": "none", "NE": "morning", "E": "morning", "SE": "morning",
    "S": "midday", "SW": "afternoon", "W": "afternoon", "NW": "afternoon",
}
_SOUTH_SWAP = {"N": "S", "S": "N", "NE": "SE", "SE": "NE", "SW": "NW", "NW": "SW", "E": "E", "W": "W"}

# (summer level, winter level) for a plant by the window, northern hemisphere, open view.
_BASE_LEVEL = {
    "N": ("medium", "low"),
    "NE": ("bright_indirect", "medium"),
    "E": ("bright_indirect", "bright_indirect"),
    "SE": ("bright_direct", "bright_direct"),
    "S": ("bright_direct", "bright_direct"),
    "SW": ("bright_direct", "bright_direct"),
    "W": ("bright_direct", "bright_direct"),
    "NW": ("bright_indirect", "medium"),
}

_ARRIVES = {
    "N": "No direct sun. Steady, even light.",
    "NE": "Gentle sun in the early morning.",
    "E": "Sun in the morning, then bright light.",
    "SE": "Strong sun from morning to midday.",
    "S": "The most direct sun, all day.",
    "SW": "Hot sun from midday into the evening.",
    "W": "Hot, low sun in the afternoon, with glare.",
    "NW": "Weak sun late in the day.",
}
_NO_WINDOW = "No window here. A lamp or grow light will do the work."


def direction_for_sun(sun: str) -> Optional[str]:
    return _SUN_TO_DIRECTION.get(sun)


def sun_for_direction(direction: str) -> str:
    return _DIRECTION_TO_SUN[direction]


def effective_direction(direction: str, hemisphere: str) -> str:
    return _SOUTH_SWAP[direction] if hemisphere == "south" else direction


def season_for(now: datetime, hemisphere: str) -> str:
    northern_summer = 4 <= now.month <= 9
    if hemisphere == "south":
        northern_summer = not northern_summer
    return "summer" if northern_summer else "winter"


def level_for(direction: str, view: str, season: str, hemisphere: str = "north") -> str:
    summer, winter = _BASE_LEVEL[effective_direction(direction, hemisphere)]
    index = LEVELS.index(summer if season == "summer" else winter)
    if view in ("tree", "building"):
        index = max(index - 1, 0)
    return LEVELS[index]


def arrives(direction: str, hemisphere: str = "north") -> str:
    return _ARRIVES[effective_direction(direction, hemisphere)]


def window_summary(sun, direction, view, hemisphere, now) -> Optional[Dict]:
    """What the nook and the lesson need to know about the person's window, or None."""
    if not sun and not direction:
        return None
    view = view if view in VIEWS else "open"
    hemisphere = hemisphere if hemisphere in HEMISPHERES else "north"
    season = season_for(now, hemisphere)
    if sun == "nowindow":
        return {
            "sun": "nowindow", "direction": None, "draw_direction": None, "view": view,
            "hemisphere": hemisphere, "season": season, "level": "low",
            "arrives": _NO_WINDOW, "lamp": True,
        }
    chosen = direction or direction_for_sun(sun)
    if chosen not in DIRECTIONS:
        return None
    return {
        "sun": sun or sun_for_direction(chosen), "direction": chosen,
        "draw_direction": effective_direction(chosen, hemisphere), "view": view,
        "hemisphere": hemisphere, "season": season,
        "level": level_for(chosen, view, season, hemisphere),
        "arrives": arrives(chosen, hemisphere), "lamp": False,
    }


def guide(hemisphere: str, view: str) -> List[Dict]:
    """Every direction in both seasons, for the lesson's room chips."""
    return [
        {
            "direction": direction, "draw_direction": effective_direction(direction, hemisphere),
            "season": season,
            "level": level_for(direction, view, season, hemisphere),
            "arrives": arrives(direction, hemisphere),
        }
        for direction in DIRECTIONS
        for season in ("summer", "winter")
    ]


def fits_species(species: Iterable[dict], level: str, limit: int = 6) -> List[dict]:
    """Species whose preferred light is this level or the one below it, by name."""
    index = LEVELS.index(level)
    wanted = {LEVELS[index]} | ({LEVELS[index - 1]} if index else set())
    matches = [s for s in species if s.get("default_light_level") in wanted]
    matches.sort(key=lambda s: s.get("common_name") or "")
    return matches[:limit]


def suit(plant_level: str, spot_level: str) -> str:
    gap = LEVELS.index(plant_level) - LEVELS.index(spot_level)
    if gap > 0:
        return "prefers_brighter"
    if gap < -1:
        return "prefers_dimmer"
    return "suits"
