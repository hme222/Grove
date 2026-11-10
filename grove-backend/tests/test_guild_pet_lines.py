import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from curated_companions import COMPANIONS  # noqa: E402
from curated_guilds import CURATED_GUILDS  # noqa: E402

BY_SLUG = {g["slug"]: g for g in CURATED_GUILDS}


def text(slug):
    g = BY_SLUG[slug]
    return (g["description"] + " " + g["design_notes"]).replace("\n", " ")


def test_guild_pet_lines_only_make_sourced_claims():
    for slug in ("tropical-humidity-cluster", "cut-flower-border", "low-light-hallway"):
        t = text(slug)
        assert "ASPCA" in t and "toxic and non-toxic plant list" in t, slug
    # Unsourced species-by-species claims were removed; only Cast Iron Plant has an ASPCA page in the library.
    for gone in ("Peace Lily and Anthurium are toxic", "eucalyptus is toxic", "all four are toxic", "irritate the mouth and skin"):
        for slug in BY_SLUG:
            assert gone not in text(slug), (slug, gone)
    hall = text("low-light-hallway")
    assert "pets cannot reach" in hall and "Cast Iron Plant, which the ASPCA lists as non-toxic to cats and dogs" in hall
    assert "console" not in hall


def test_guild_claims_stay_inside_what_is_known():
    t = text("tropical-humidity-cluster")
    assert "70%" not in t and "10–20%" not in t and "chlorine" not in t
    assert "fluoride and minerals" in t
    cut = text("cut-flower-border")
    assert "zones 7–10" in cut and "roughly 8–9" in cut
    assert "every two to four weeks" in text("low-light-hallway")


def test_companion_reasons_have_no_fixed_day_counts_or_humidifier_claims():
    for items in COMPANIONS.values():
        for item in items:
            r = item["reasoning"].lower()
            assert "14-day" not in r and "living humidifier" not in r, r
    pothos_snake = next(i for i in COMPANIONS["epipremnum-aureum"] if i["slug"] == "dracaena-trifasciata")
    assert "water each by its own check" in pothos_snake["reasoning"].lower()
    snake_pothos = next(i for i in COMPANIONS["dracaena-trifasciata"] if i["slug"] == "epipremnum-aureum")
    assert "water each by its own check" in snake_pothos["reasoning"].lower()
