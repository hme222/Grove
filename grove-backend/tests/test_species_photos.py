"""Every species photo carries its author, license and a Wikimedia Commons page, and belongs to a real species."""
import json
from pathlib import Path

from curated_species import CURATED_SPECIES
from species_safety import scrub_species

DATA = json.loads((Path(__file__).parent.parent / "species_photos.json").read_text())["photos"]
SLUGS = {s["slug"] for s in CURATED_SPECIES}


def test_every_photo_is_for_a_curated_species():
    assert set(DATA) <= SLUGS


def test_every_photo_has_a_credit_and_an_open_license():
    for slug, p in DATA.items():
        assert p["author"].strip(), slug
        assert p["license"].startswith(("CC BY", "CC0", "Public domain")), (slug, p["license"])
        assert p["thumb_url"].startswith(("https://upload.wikimedia.org/", "https://thumb.wikimedia.org/")), slug
        assert p["photo_url"].startswith(("https://upload.wikimedia.org/", "https://thumb.wikimedia.org/")), slug
        assert p["page_url"].startswith("https://commons.wikimedia.org/wiki/File:"), slug


def test_scrub_species_adds_the_photo_and_its_credit():
    sp = next(s for s in CURATED_SPECIES if s["slug"] == "epipremnum-aureum")
    out = scrub_species(sp)
    assert out["wiki_thumbnail"] == DATA["epipremnum-aureum"]["thumb_url"]
    assert out["wiki_image_credit"]["author"] == "Mokkie"
    assert out["wiki_image_credit"]["license"].startswith("CC BY")


def test_species_without_a_photo_get_none():
    sp = next(s for s in CURATED_SPECIES if s["slug"] == "rosa-juliet-ausjameson")
    assert "wiki_image_credit" not in scrub_species(sp)
