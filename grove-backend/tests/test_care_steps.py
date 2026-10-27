import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from care_steps import GROUPS, STEPS, STEP_BY_SLUG, care_step_for  # noqa: E402
from curated_species import CURATED_SPECIES  # noqa: E402

SLUGS = {s["slug"] for s in CURATED_SPECIES}


def group_of(slug):
    return next(g for g, slugs in GROUPS.items() if slug in slugs)


def test_every_slug_is_in_exactly_one_group_and_is_a_real_species():
    seen = [s for slugs in GROUPS.values() for s in slugs]
    assert len(seen) == len(set(seen))
    assert set(seen) <= SLUGS
    assert set(GROUPS) == set(STEPS)


def test_dry_down_groups_match_how_each_plant_is_grown():
    for slug in ("zamioculcas-zamiifolia", "dracaena-trifasciata", "beaucarnea-recurvata", "aloe-vera"):
        assert group_of(slug) == "fully_dry", slug
    for slug in ("schlumbergera-buckleyi", "hedera-helix", "spathiphyllum-wallisii"):
        assert group_of(slug) == "evenly_moist", slug
    assert group_of("dracaena-fragrans") == "top_two_inches"
    assert care_step_for("hedera-helix") == STEPS["evenly_moist"]
    assert care_step_for("nope") is None
    assert "whole pot" in STEP_BY_SLUG["dracaena-trifasciata"]
