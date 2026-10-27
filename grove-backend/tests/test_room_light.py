import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from curated_species import CURATED_SPECIES  # noqa: E402
from room_light import LEVELS, light_fit, normalize_light  # noqa: E402


def test_levels_run_from_dark_to_bright():
    assert LEVELS == ["low", "medium", "bright_indirect", "bright_direct"]


def test_normalize_accepts_only_known_levels():
    assert normalize_light("medium") == "medium"
    assert normalize_light("sunny") is None
    assert normalize_light("") is None
    assert normalize_light(None) is None


def plant(slug):
    return next(sp for sp in CURATED_SPECIES if sp["slug"] == slug)


def test_a_plain_level_still_works_as_a_one_point_band():
    assert light_fit("medium", "medium") == "good"
    assert light_fit("low", "bright_indirect") == "too_dim"
    assert light_fit("bright_indirect", "medium") == "good"


def test_inside_the_band_is_good_below_the_minimum_is_too_dim():
    snake = plant("dracaena-trifasciata")  # low to bright_indirect
    for room in ("low", "medium", "bright_indirect"):
        assert light_fit(room, snake) == "good", room
    monstera = plant("monstera-deliciosa")  # medium to bright_indirect
    assert light_fit("low", monstera) == "too_dim"
    assert light_fit("medium", monstera) == "good"
    aloe = plant("aloe-vera")  # bright_indirect to bright_direct
    assert light_fit("medium", aloe) == "too_dim"
    assert light_fit("low", aloe) == "too_dim"
    assert light_fit("bright_direct", aloe) == "good"


def test_tolerant_plants_are_never_too_bright_in_bright_indirect_light():
    for slug in ("dracaena-trifasciata", "zamioculcas-zamiifolia", "aspidistra-elatior", "epipremnum-aureum"):
        assert light_fit("bright_indirect", plant(slug)) == "good", slug


def test_direct_sun_is_good_only_when_the_ideal_is_direct_sun():
    for sp in CURATED_SPECIES:
        verdict = light_fit("bright_direct", sp)
        if sp["light_ideal"] == "bright_direct":
            assert verdict == "good", sp["slug"]
        else:
            assert verdict != "good", sp["slug"]


def test_direct_sun_is_too_bright_for_sun_sensitive_plants_and_two_steps_over():
    assert light_fit("bright_direct", plant("phalaenopsis")) == "too_bright"
    assert light_fit("bright_direct", plant("schlumbergera-buckleyi")) == "too_bright"
    assert light_fit("bright_direct", plant("goeppertia-orbifolia")) == "too_bright"
    # ZZ's ideal is medium, so direct sun is two steps over it.
    assert light_fit("bright_direct", plant("zamioculcas-zamiifolia")) == "too_bright"


def test_direct_sun_for_a_tolerant_plant_one_step_over_is_a_soft_note_not_too_bright():
    assert light_fit("bright_direct", plant("dracaena-trifasciata")) == "bright"
    # Pothos scorches in direct sun, so it is flagged sun-sensitive and direct sun is too bright for it.
    assert light_fit("bright_direct", plant("epipremnum-aureum")) == "too_bright"


def test_a_species_with_no_band_falls_back_to_its_default_level():
    legacy = {"default_light_level": "bright_indirect"}
    assert light_fit("bright_indirect", legacy) == "good"
    assert light_fit("medium", legacy) == "too_dim"


def test_unknown_when_either_side_is_missing():
    assert light_fit(None, "medium") is None
    assert light_fit("medium", None) is None
    assert light_fit("medium", "unknown") is None
    assert light_fit("medium", {}) is None


def test_every_species_has_a_valid_band():
    for sp in CURATED_SPECIES:
        assert sp["light_min"] in LEVELS and sp["light_ideal"] in LEVELS, sp["slug"]
        assert LEVELS.index(sp["light_min"]) <= LEVELS.index(sp["light_ideal"]), sp["slug"]
    for slug in ("phalaenopsis", "schlumbergera-buckleyi", "haworthiopsis-fasciata", "chamaedorea-elegans",
                 "chlorophytum-comosum", "hoya-carnosa", "goeppertia-orbifolia", "peperomia-obtusifolia",
                 "anthurium-warocqueanum", "philodendron-pink-princess", "epipremnum-aureum"):
        assert plant(slug)["sun_sensitive"] is True, slug
    assert plant("dracaena-trifasciata")["default_light_level"] == "medium"
    assert plant("zamioculcas-zamiifolia")["default_light_level"] == "medium"
