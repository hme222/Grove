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


def _sp(slug):
    return next(s for s in CURATED_SPECIES if s["slug"] == slug)


def test_entry_text_has_no_native_to_cultivar_grammar_and_no_doubled_names():
    from seed import build_encyclopedia_entry
    for slug in ("philodendron-pink-princess", "rosa-juliet-ausjameson", "dahlia-cafe-au-lait"):
        text = build_encyclopedia_entry(_sp(slug))
        assert "Cultivar:" in text and "native to Cultivar" not in text.lower(), slug
    aloe = build_encyclopedia_entry(_sp("aloe-vera"))
    assert aloe.startswith("Aloe vera belongs to") and "(Aloe vera)" not in aloe
    assert "Native to Arabian Peninsula." in aloe
    for s in CURATED_SPECIES:
        assert "native to hybrid" not in build_encyclopedia_entry(s).lower(), s["slug"]


def test_origin_text_for_hybrid_and_uncertain_species():
    assert _sp("schlumbergera-buckleyi")["native_range"].startswith("Hybrid of two southeastern Brazilian rainforest species")
    assert "S. truncata" in _sp("schlumbergera-buckleyi")["native_range"]
    assert _sp("aspidistra-elatior")["native_range"] == "Origin uncertain; long cultivated in China and Japan"


def test_garden_plants_do_not_get_a_houseplant_cycle_and_say_so():
    for slug in ("rosa-juliet-ausjameson", "dahlia-cafe-au-lait"):
        s = _sp(slug)
        assert s["default_watering_days"] == 7
        assert "garden plant" in s["care_summary"] and "rot" in s["care_summary"]
    for slug in ("rudbeckia-hirta", "echinacea-purpurea"):
        s = _sp(slug)
        assert s["default_watering_days"] == 21
        assert "drought tolerant, so water only in long dry spells" in s["care_summary"]
    assert "Leave the spent seed heads" in _sp("echinacea-purpurea")["care_summary"]


def test_anthurium_is_flagged_not_for_a_first_plant():
    a = _sp("anthurium-warocqueanum")
    assert a["beginner_friendly"] is False and "Not a beginner plant" in a["care_summary"]


def test_corrected_care_claims():
    text = {s["slug"]: s["care_summary"] for s in CURATED_SPECIES}
    assert "Pearls shrivel and flatten when dry" in text["curio-rowleyanus"]
    assert "mushy pearls mean overwatering" in text["curio-rowleyanus"]
    assert "humidity problem" not in text["nephrolepis-exaltata"] and "dry root ball or dry air" in text["nephrolepis-exaltata"]
    assert "less often in winter" in text["nephrolepis-exaltata"]
    assert "water freely" not in text["sedum-morganianum"] and "dry out completely" in text["sedum-morganianum"]
    assert "not at all" not in text["echeveria-elegans"] and "stop shrivelling" in text["echeveria-elegans"]
    assert "curl" not in text["strelitzia-reginae"] and "top few inches dry" in text["strelitzia-reginae"]
    assert "forgets-to-water" not in text["zamioculcas-zamiifolia"] and "missed waterings" in text["zamioculcas-zamiifolia"]
    assert "Adapts to almost any" not in text["epipremnum-aureum"] and "not a windowless room" in text["epipremnum-aureum"]
    assert "prune back to a pink node" in text["philodendron-pink-princess"]
    assert "wilts" not in text["spathiphyllum-wallisii"] and "before it droops" in text["spathiphyllum-wallisii"]
    assert "Provides a moss pole" not in text["monstera-deliciosa"] and "light matters too" in text["monstera-deliciosa"]


def test_every_species_has_synonyms_and_the_snake_plant_keeps_its_old_name():
    for s in CURATED_SPECIES:
        assert s["synonyms"], s["slug"]
    assert "Sansevieria trifasciata" in _sp("dracaena-trifasciata")["synonyms"]
    assert "Haworthia fasciata" in _sp("haworthiopsis-fasciata")["synonyms"]
    assert "Senecio rowleyanus" in _sp("curio-rowleyanus")["synonyms"]
