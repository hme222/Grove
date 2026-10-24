import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from curated_species import CURATED_SPECIES  # noqa: E402
from room_light import LEVELS  # noqa: E402

REQUIRED = ["slug", "common_name", "latin_name", "family", "native_range", "default_watering_days",
            "default_light_level", "default_grow_medium", "toxicity", "care_summary", "flags", "citations"]


def test_every_species_has_the_fields_the_app_reads():
    for s in CURATED_SPECIES:
        for key in REQUIRED:
            assert s.get(key) not in (None, "", []), f"{s.get('slug')} is missing {key}"


def test_slugs_and_latin_names_are_unique():
    assert len({s["slug"] for s in CURATED_SPECIES}) == len(CURATED_SPECIES)
    assert len({s["latin_name"] for s in CURATED_SPECIES}) == len(CURATED_SPECIES)


def test_light_levels_match_the_room_light_levels():
    for s in CURATED_SPECIES:
        assert s["default_light_level"] in LEVELS, s["slug"]


def test_toxicity_is_a_known_level_and_pet_safe_means_non_toxic():
    for s in CURATED_SPECIES:
        assert s["toxicity"] in ("non_toxic", "mild", "toxic"), s["slug"]
        if s["flags"].get("pet_safe"):
            assert s["toxicity"] == "non_toxic", f"{s['slug']} is flagged pet-safe but is {s['toxicity']}"


def test_every_citation_is_a_labelled_web_link():
    for s in CURATED_SPECIES:
        for c in s["citations"]:
            assert c["label"] and c["url"].startswith(("http://", "https://")), s["slug"]


def test_new_species_cite_https_sources_for_care_and_pet_safety():
    new = ["phalaenopsis", "chamaedorea-elegans", "aglaonema-modestum", "dracaena-fragrans",
           "schlumbergera-buckleyi", "haworthiopsis-fasciata"]
    for s in CURATED_SPECIES:
        if s["slug"] in new:
            urls = [c["url"] for c in s["citations"]]
            assert all(u.startswith("https://") for u in urls), s["slug"]
            assert any("rhs.org.uk" in u for u in urls), s["slug"]
            assert any("aspca.org" in u for u in urls), s["slug"]


def test_the_cactus_is_not_flagged_pet_safe_because_its_spines_injure():
    cactus = next(s for s in CURATED_SPECIES if s["slug"] == "opuntia-microdasys")
    assert not cactus["flags"].get("pet_safe")
    assert "spines" in cactus["care_summary"].lower()


def test_the_money_tree_warns_that_the_jade_plant_is_the_toxic_one():
    money = next(s for s in CURATED_SPECIES if s["slug"] == "pachira-aquatica")
    assert "jade" in money["care_summary"].lower()


def test_common_houseplants_that_were_missing_are_now_covered():
    names = {s["common_name"] for s in CURATED_SPECIES}
    for expected in ["Moth Orchid", "Parlor Palm", "Chinese Evergreen", "Corn Plant", "Christmas Cactus", "Zebra Haworthia",
                     "Echeveria", "Burro's Tail", "Ponytail Palm", "Money Tree", "Cast Iron Plant", "Baby Rubber Plant",
                     "Madagascar Dragon Tree", "Flaming Katy", "Bunny Ears Cactus"]:
        assert expected in names
