"""Room light levels and whether a plant suits them.

Rooms are only a text label on each plant, so a room's light lives in its own small record.
The four levels match the species guide's `default_light_level`.

Each species has a light band: `light_min` (the lowest light it survives in) and `light_ideal` (the
light it grows best in). The band values are professional horticultural judgment, see curated_species.py.
"""

LEVELS = ["low", "medium", "bright_indirect", "bright_direct"]
_RANK = {level: i for i, level in enumerate(LEVELS)}


def normalize_light(value):
    """A valid level, or None (which clears the room's light)."""
    return value if value in _RANK else None


def light_band(species):
    """(light_min, light_ideal, sun_sensitive) for a species doc, or None when its light is unknown.

    Older records only have `default_light_level`, which then stands in for both ends of the band.
    """
    if not species:
        return None
    ideal = species.get("light_ideal") or species.get("default_light_level")
    if ideal not in _RANK:
        return None
    low = species.get("light_min")
    if low not in _RANK or _RANK[low] > _RANK[ideal]:
        low = ideal
    return low, ideal, bool(species.get("sun_sensitive"))


def light_fit(room_level, plant):
    """How a room's light compares with a plant's band.

    `plant` is a species-like dict (light_min, light_ideal, sun_sensitive) or a single level name.

    'good'       the room is inside the band [light_min, light_ideal], or one step brighter than the
                 ideal in indirect light (tolerant plants cope with that)
    'too_dim'    the room is below light_min
    'bright'     direct sun for a tolerant plant that does not need it: fine with some filtering
    'too_bright' direct sun for a sun-sensitive plant, or two or more steps above the ideal
    None         unknown: the room has no light set, or the plant's species is not known
    """
    band = light_band({"light_ideal": plant} if isinstance(plant, str) else plant)
    if room_level not in _RANK or band is None:
        return None
    low, ideal, sensitive = band
    room, lo, hi = _RANK[room_level], _RANK[low], _RANK[ideal]
    if room < lo:
        return "too_dim"
    if room <= hi:
        return "good"
    if room - hi >= 2 or (sensitive and room_level == "bright_direct"):
        return "too_bright"
    # One step above the ideal. Direct sun is only 'good' for plants whose ideal is direct sun.
    return "bright" if room_level == "bright_direct" else "good"
