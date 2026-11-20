"""Pet safety is shown only when a recorded source backs it.

A species' `toxicity` counts only if it is "non_toxic" or "toxic" AND the species record cites an ASPCA Toxic and
Non-Toxic Plants page (the source Grove uses). Anything else (no value, "mild", a stale value on an old record) is
unknown, and the app tells people to check before bringing the plant home. Grove does not grade toxicity itself.
"""
import json
import os
import re
from pathlib import Path

from species_art import scrub_art

SOURCED_LEVELS = {"non_toxic", "toxic"}
SOURCE_HOST = "aspca.org"

# Pet-safety labels are held back: the ASPCA's terms limit its site to personal, non-commercial use, so Grove does
# not show its toxic / non-toxic listings until the ASPCA gives written permission. While this is off, every plant
# reads as "check the ASPCA list" (a link, no rating) and care text does not repeat an ASPCA listing.
# Turn on with PET_SAFETY_LABELS=on once permission is on file. The sourced values stay in the species records.
LABELS_ENABLED = os.environ.get("PET_SAFETY_LABELS") == "on"

_LISTING_ADVICE = re.compile(r"The ASPCA lists it as toxic to cats and dogs, so [^.]*\.")
_LISTING_SENTENCE = re.compile(r"\s*The ASPCA lists it as [^.]*\.")
_LISTING_CLAUSE = re.compile(r",? which the ASPCA lists as [^.,]*")


def shown_toxicity(species):
    """The pet-safety value the app may show: the sourced value when labels are on, otherwise None (unknown)."""
    return sourced_toxicity(species) if LABELS_ENABLED else None


def shown_safety_text(text):
    """Care or design text as the app may show it. With labels off, a sentence that repeats an ASPCA listing becomes
    plain keep-out-of-reach advice (for a toxic listing) or is dropped (for a non-toxic one)."""
    if LABELS_ENABLED or not isinstance(text, str) or "ASPCA lists" not in text:
        return text
    text = _LISTING_ADVICE.sub("Keep it out of reach of pets and children.", text)
    text = _LISTING_SENTENCE.sub("", text)
    return _LISTING_CLAUSE.sub("", text).strip()


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
    """Return the species with any toxicity the app may not show removed, unverified artwork removed, and its credited photo added (a copy; None passes through)."""
    if not isinstance(species, dict):
        return species
    out = dict(species)
    out["toxicity"] = shown_toxicity(species)
    if "care_summary" in out:
        out["care_summary"] = shown_safety_text(out["care_summary"])
    slug = species.get("slug") or str(species.get("id", "")).removeprefix("sp_")
    photo = species_photo(slug)
    scrub_art(out, slug, has_credited_photo=bool(photo))
    if photo:
        out["wiki_thumbnail"] = photo["thumb_url"]
        out["wiki_image"] = photo["photo_url"]
        out["wiki_image_credit"] = {k: photo[k] for k in ("author", "license", "license_url", "page_url")}
        out["wiki_image_credit"]["source"] = photo.get("source") or "Wikimedia Commons"
    return out
