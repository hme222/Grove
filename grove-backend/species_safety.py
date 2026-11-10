"""Pet safety is shown only when a recorded source backs it.

A species' `toxicity` counts only if it is "non_toxic" or "toxic" AND the species record cites an ASPCA Toxic and
Non-Toxic Plants page (the source Grove uses). Anything else (no value, "mild", a stale value on an old record) is
unknown, and the app tells people to check before bringing the plant home. Grove does not grade toxicity itself.
"""

SOURCED_LEVELS = {"non_toxic", "toxic"}
SOURCE_HOST = "aspca.org"


def has_toxicity_source(species):
    citations = (species or {}).get("citations") or []
    return any(isinstance(c, dict) and SOURCE_HOST in (c.get("url") or "") for c in citations)


def sourced_toxicity(species):
    """The species' toxicity, or None when it is unsourced or not a level an ASPCA listing supports."""
    value = (species or {}).get("toxicity")
    return value if value in SOURCED_LEVELS and has_toxicity_source(species) else None


def scrub_species(species):
    """Return the species with any unsourced toxicity removed (a copy; None passes through)."""
    if not isinstance(species, dict):
        return species
    out = dict(species)
    out["toxicity"] = sourced_toxicity(species)
    return out
