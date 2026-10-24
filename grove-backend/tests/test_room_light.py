import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from room_light import LEVELS, light_fit, normalize_light  # noqa: E402


def test_levels_run_from_dark_to_bright():
    assert LEVELS == ["low", "medium", "bright_indirect", "bright_direct"]


def test_normalize_accepts_only_known_levels():
    assert normalize_light("medium") == "medium"
    assert normalize_light("sunny") is None
    assert normalize_light("") is None
    assert normalize_light(None) is None


def test_matching_or_one_step_brighter_is_good():
    assert light_fit("medium", "medium") == "good"
    assert light_fit("bright_indirect", "medium") == "good"


def test_one_step_darker_is_dim_and_more_is_too_dim():
    assert light_fit("medium", "bright_indirect") == "dim"
    assert light_fit("low", "bright_indirect") == "too_dim"
    assert light_fit("low", "bright_direct") == "too_dim"


def test_two_or_more_steps_brighter_is_too_bright():
    assert light_fit("bright_indirect", "low") == "too_bright"
    assert light_fit("bright_direct", "medium") == "too_bright"


def test_unknown_when_either_side_is_missing():
    assert light_fit(None, "medium") is None
    assert light_fit("medium", None) is None
    assert light_fit("medium", "unknown") is None
