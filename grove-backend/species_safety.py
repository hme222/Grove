"""Pet safety is shown only when a recorded source backs it.

A species' `toxicity` counts only if it is "non_toxic" or "toxic" AND the species record cites an ASPCA Toxic and
Non-Toxic Plants page (the source Grove uses). Anything else (no value, "mild", a stale value on an old record) is
unknown, and the app tells people to check before bringing the plant home. Grove does not grade toxicity itself.
"""
import json
from pathlib import Path

SOURCED_LEVELS = {"non_toxic", "toxic"}
SOURCE_HOST = "aspca.org"


def has_toxicity_source(species):
    citations = (species or {}).get("citations") or []
    return any(isinstance(c, dict) and SOURCE_HOST in (c.get("url") or "") for c in citations)


def sourced_toxicity(species):
    """The species' toxicity, or None when it is unsourced or not a level an ASPCA listing supports."""
    value = (species or {}).get("toxicity")
    return value if value in SOURCED_LEVELS and has_toxicity_source(species) else None


_PHOTOS = None


def species_photo(slug):
    """The Wikimedia Commons photo and credit for a species, from species_photos.json (made by fetch_species_photo_credits.py)."""
    global _PHOTOS
    if _PHOTOS is None:
        path = Path(__file__).with_name("species_photos.json")
        _PHOTOS = json.loads(path.read_text()).get("photos", {}) if path.exists() else {}
    return _PHOTOS.get(slug)


def scrub_species(species):
    """Return the species with any unsourced toxicity removed and its credited photo added (a copy; None passes through)."""
    if not isinstance(species, dict):
        return species
    out = dict(species)
    out["toxicity"] = sourced_toxicity(species)
    slug = species.get("slug") or str(species.get("id", "")).removeprefix("sp_")
    photo = species_photo(slug)
    if photo:
        out["wiki_thumbnail"] = photo["thumb_url"]
        out["wiki_image"] = photo["photo_url"]
        out["wiki_image_credit"] = {k: photo[k] for k in ("author", "license", "license_url", "page_url")}
        out["wiki_image_credit"]["source"] = photo.get("source") or "Wikimedia Commons"
    return out
