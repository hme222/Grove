import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from care_steps import STEP_BY_SLUG  # noqa: E402
from curated_companions import COMPANIONS  # noqa: E402
from curated_species import CURATED_SPECIES  # noqa: E402

BY_SLUG = {s["slug"]: s for s in CURATED_SPECIES}


def pairs():
    for slug, items in COMPANIONS.items():
        for item in items:
            text = item["reasoning"].lower().replace("-", " ")
            yield BY_SLUG[slug], BY_SLUG[item["slug"]], text


def test_every_companion_is_a_curated_species():
    for slug, items in COMPANIONS.items():
        assert slug in BY_SLUG
        for item in items:
            assert item["slug"] in BY_SLUG, item["slug"]


def test_a_reason_never_claims_a_light_the_species_data_contradicts():
    for a, b, text in pairs():
        if "low light" in text:
            assert a["light_min"] == b["light_min"] == "low", (a["slug"], b["slug"])
        if "bright direct" in text:
            assert a["light_ideal"] == b["light_ideal"] == "bright_direct", (a["slug"], b["slug"])
        if "bright indirect" in text and "less" not in text and "slightly back" not in text and "more direct sun" not in text:
            assert a["light_ideal"] == b["light_ideal"] == "bright_indirect", (a["slug"], b["slug"], text)
        if "medium light" in text:
            assert a["light_ideal"] == b["light_ideal"] == "medium", (a["slug"], b["slug"])


def test_a_reason_never_claims_a_water_rhythm_the_dry_down_groups_contradict():
    for a, b, text in pairs():
        if "evenly moist" in text and "wants even" not in text and "steadier" not in text:
            assert STEP_BY_SLUG[a["slug"]] == STEP_BY_SLUG[b["slug"]], (a["slug"], b["slug"])
        if "dry then soak" in text or "14 day" in text:
            assert STEP_BY_SLUG[a["slug"]] == STEP_BY_SLUG[b["slug"]], (a["slug"], b["slug"])
            assert a["default_watering_days"] == b["default_watering_days"]


def test_no_reason_calls_a_succulent_a_desert_plant():
    for a, b, text in pairs():
        assert "desert" not in text, (a["slug"], b["slug"])
