import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from curated_species import CURATED_SPECIES  # noqa: E402
from trivia_seed import TRIVIA_CARDS  # noqa: E402

TEXT = " ".join(f"{c['headline']} {c['body']}" for c in TRIVIA_CARDS).lower()


def test_trivia_links_only_to_curated_species():
    slugs = {s["slug"] for s in CURATED_SPECIES}
    for c in TRIVIA_CARDS:
        if c["linked_species_slug"]:
            assert c["linked_species_slug"] in slugs, c["linked_species_slug"]


def test_standing_water_is_not_said_to_remove_fluoride():
    assert "removes fluoride" not in TEXT
    assert "chlorine only" in TEXT


def test_no_unsourced_light_figures_or_book_test():
    assert "without a lamp" not in TEXT
    assert "25%" not in TEXT and "ppfd" not in TEXT


def test_trivia_softened_claims_stay_softened():
    assert "cinnamon can help keep a cut from rotting" in TEXT
    assert "makes a decent rooting hormone" not in TEXT
    assert "most insects can't see" not in TEXT
    assert "free, free" not in TEXT
    assert "one reason a thriving plant" not in TEXT
    assert "nutrient lock-out" not in TEXT
    assert "succulents want the whole pot dry" in TEXT
    assert "south-facing in the southern hemisphere" in TEXT
    assert "within about 3 feet (1 meter)" in TEXT
