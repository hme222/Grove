import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ai_service import (  # noqa: E402
    SCHEDULE_REASON, build_schedule_prompt, clamp_watering_days, finish_schedule, normalize_hemisphere,
)

JULY = datetime(2026, 7, 10, tzinfo=timezone.utc)


def test_clamp_keeps_days_between_3_and_28():
    assert clamp_watering_days(1) == 3
    assert clamp_watering_days(0) == 3
    assert clamp_watering_days(90) == 28
    assert clamp_watering_days(10) == 10
    assert clamp_watering_days("12") == 12
    assert clamp_watering_days(6.6) == 7


def test_clamp_falls_back_when_the_model_returns_junk():
    assert clamp_watering_days(None) == 7
    assert clamp_watering_days("often") == 7


def test_hemisphere_defaults_to_north():
    assert normalize_hemisphere(None) == "north"
    assert normalize_hemisphere("") == "north"
    assert normalize_hemisphere("sideways") == "north"
    assert normalize_hemisphere("South") == "south"


def test_prompt_names_the_month_hemisphere_and_range():
    north = build_schedule_prompt("Monstera", "Monstera deliciosa", "soil", "Ohio", None, now=JULY)
    assert "July" in north and "northern hemisphere" in north
    south = build_schedule_prompt("Monstera", "Monstera deliciosa", "soil", "Perth", "south", now=JULY)
    assert "July" in south and "southern hemisphere" in south
    assert "between 3 and 28" in south
    assert "Monstera deliciosa" in south and "soil" in south


def test_finished_schedule_is_clamped_with_the_fixed_reason():
    out = finish_schedule({"days": 60, "reason": "Water every day!", "confidence": "high"})
    assert out["days"] == 28
    assert out["reason"] == SCHEDULE_REASON
    assert out["confidence"] == "high"
    assert "Check the soil first" in out["reason"] and "not a command" in out["reason"]


def test_prompt_anchors_on_the_default_and_names_the_setting():
    indoor = build_schedule_prompt("Pothos", "Epipremnum aureum", "soil", "Ohio", None, now=JULY,
                                   default_days=7, indoors=True)
    assert "about every 7 days" in indoor and "kept indoors in Ohio" in indoor
    garden = build_schedule_prompt("Dahlia", "Dahlia", "soil", "Ohio", None, now=JULY, indoors=False)
    assert "grown in the garden in Ohio" in garden and "about every" not in garden
    unknown = build_schedule_prompt("Pothos", "Epipremnum aureum", "soil", "Ohio", None, now=JULY)
    assert "kept indoors" not in unknown and "in the garden" not in unknown


def test_prompt_asks_succulents_for_a_check_rhythm_not_a_watering_rhythm():
    text = build_schedule_prompt("Aloe", "Aloe vera", "soil", "Ohio", None, now=JULY)
    assert "how often to check, not how often to water" in text
