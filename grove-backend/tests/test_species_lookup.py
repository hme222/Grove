import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from species_lookup import lookup, name_index  # noqa: E402

SPECIES = [
    {"latin_name": "Ficus elastica", "common_name": "Rubber Plant", "toxicity": "toxic", "default_light_level": "bright_indirect"},
    {"latin_name": "Chamaedorea elegans", "common_name": "Parlor Palm", "toxicity": "non_toxic", "default_light_level": "bright_indirect"},
]


def test_matches_by_latin_name_then_by_common_name_ignoring_case():
    idx = name_index(SPECIES, "toxicity")
    assert lookup({"latin_name": "FICUS ELASTICA"}, idx) == "toxic"
    assert lookup({"latin_name": "", "common_name": "parlor palm"}, idx) == "non_toxic"
    assert lookup({"common_name": " Rubber Plant "}, idx) == "toxic"


def test_a_plant_with_only_a_common_name_still_matches():
    # This is the case for plants added by typing a name: no latin name, no species link.
    idx = name_index(SPECIES, "toxicity")
    assert lookup({"nickname": "Rudy", "common_name": "Rubber Plant"}, idx) == "toxic"


def test_an_unknown_plant_is_none_not_a_guess():
    idx = name_index(SPECIES, "toxicity")
    assert lookup({"common_name": "Mystery fern"}, idx) is None
    assert lookup({}, idx) is None


def test_can_index_any_field():
    assert lookup({"common_name": "Rubber Plant"}, name_index(SPECIES, "default_light_level")) == "bright_indirect"
