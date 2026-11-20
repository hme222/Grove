"""Artwork is served only when its license was checked against the source's own record."""
import species_art
from species_safety import scrub_species

MONSTERA_PLATE = "https://upload.wikimedia.org/wikipedia/commons/e/e8/Monstera_deliciosa_libostrom_zpror%C3%A1%C5%BEen%C3%BD_Vesm%C3%ADr_1875.jpg"
BHL = [{"page_id": 4468818, "full_image_url": "https://x/full.jpg", "thumbnail_url": "https://x/thumb.jpg"}]


def test_a_verified_commons_plate_is_kept_with_its_license_and_credit():
    out = scrub_species({"slug": "monstera-deliciosa", "botanical_illustration": MONSTERA_PLATE, "botanical_illustration_license": None})
    assert out["botanical_illustration"] == MONSTERA_PLATE
    assert out["botanical_illustration_license"] == "Public domain"
    assert "Wikimedia Commons" in out["botanical_illustration_credit"]


def test_a_plate_that_is_not_the_verified_file_is_removed():
    out = scrub_species({"slug": "monstera-deliciosa", "botanical_illustration": "https://upload.wikimedia.org/x/Other.jpg",
                         "botanical_illustration_thumb": "t", "botanical_illustration_license": "Public domain"})
    assert "botanical_illustration" not in out and "botanical_illustration_thumb" not in out
    out = scrub_species({"slug": "ficus-lyrata", "botanical_illustration": "https://upload.wikimedia.org/x/Fig.jpg"})
    assert "botanical_illustration" not in out


def test_the_share_alike_plate_names_its_author():
    name, license_, author = species_art.VERIFIED_PLATES["aloe-vera"]
    assert license_ == "CC BY-SA 4.0" and author == "Rawpixel"


def test_no_bhl_plate_is_served_until_its_page_is_verified(monkeypatch):
    out = scrub_species({"slug": "spathiphyllum-wallisii", "bhl_illustrations": BHL, "bhl_primary_illustration": "https://x/full.jpg", "bhl_primary_thumbnail": "https://x/thumb.jpg"})
    assert out["bhl_illustrations"] == [] and out["bhl_primary_illustration"] is None and out["bhl_primary_thumbnail"] is None
    monkeypatch.setattr(species_art, "VERIFIED_BHL_PAGES", frozenset({4468818}))
    out = scrub_species({"slug": "spathiphyllum-wallisii", "bhl_illustrations": BHL})
    assert out["bhl_primary_thumbnail"] == "https://x/thumb.jpg" and out["bhl_illustration_count"] == 1


def test_a_species_with_no_credited_photo_gets_no_photo():
    out = scrub_species({"slug": "rosa-juliet-ausjameson", "wiki_image": "https://upload.wikimedia.org/x/Rose.jpg", "wiki_thumbnail": "t"})
    assert "wiki_image" not in out and "wiki_thumbnail" not in out
    out = scrub_species({"slug": "monstera-deliciosa", "wiki_image": "old"})
    assert out["wiki_image"] != "old" and out["wiki_image_credit"]["author"]
