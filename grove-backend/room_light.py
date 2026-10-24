"""Room light levels and whether a plant suits them.

Rooms are only a text label on each plant, so a room's light lives in its own small record.
The four levels match the species guide's `default_light_level`.
"""

LEVELS = ["low", "medium", "bright_indirect", "bright_direct"]
_RANK = {level: i for i, level in enumerate(LEVELS)}


def normalize_light(value):
    """A valid level, or None (which clears the room's light)."""
    return value if value in _RANK else None


def light_fit(room_level, plant_level):
    """How a plant's light need compares with what the room offers.

    'good'       the room matches, or is one step brighter (most plants cope with that)
    'dim'        one step darker than the plant likes
    'too_dim'    two or more steps darker
    'too_bright' two or more steps brighter
    None         unknown: the room has no light set, or the plant's species is not known
    """
    if room_level not in _RANK or plant_level not in _RANK:
        return None
    diff = _RANK[room_level] - _RANK[plant_level]
    if diff in (0, 1):
        return "good"
    if diff == -1:
        return "dim"
    return "too_dim" if diff < 0 else "too_bright"
