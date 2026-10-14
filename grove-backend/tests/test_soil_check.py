import pytest

import soil_check


def test_non_soil_actions_return_no_fields():
    assert soil_check.soil_fields("water", "dry", "water") == {}
    assert soil_check.soil_fields("check", None, None) == {}


def test_valid_soil_check_returns_fields():
    assert soil_check.soil_fields("soil_check", "dry", "water") == {
        "soil_outcome": "dry",
        "soil_decision": "water",
    }
    assert soil_check.soil_fields("soil_check", "damp", None) == {
        "soil_outcome": "damp",
        "soil_decision": None,
    }


@pytest.mark.parametrize("bad_outcome", [None, "", "wet", "DRY", 5])
def test_soil_check_needs_a_valid_outcome(bad_outcome):
    with pytest.raises(soil_check.SoilCheckError):
        soil_check.soil_fields("soil_check", bad_outcome, "water")


@pytest.mark.parametrize("bad_decision", ["", "drown", "WATER", 3])
def test_soil_check_rejects_an_invalid_decision(bad_decision):
    with pytest.raises(soil_check.SoilCheckError):
        soil_check.soil_fields("soil_check", "dry", bad_decision)


def test_error_messages_are_plain():
    with pytest.raises(soil_check.SoilCheckError) as err:
        soil_check.soil_fields("soil_check", None, None)
    assert str(err.value) == "A soil test needs an outcome: dry or damp."


def test_coaching_exists_for_every_outcome_and_decision():
    for outcome in soil_check.SOIL_OUTCOMES:
        for decision in soil_check.SOIL_DECISIONS + (None,):
            text = soil_check.soil_coaching(outcome, decision)
            assert text
            assert text.endswith(".")


def test_coaching_for_a_mismatch_suggests_waiting_or_watering():
    assert "good spot to wait" in soil_check.soil_coaching("damp", "water")
    assert "ready for a drink" in soil_check.soil_coaching("dry", "wait")


def test_coaching_never_blames_the_user():
    for outcome in soil_check.SOIL_OUTCOMES:
        for decision in soil_check.SOIL_DECISIONS + (None,):
            text = soil_check.soil_coaching(outcome, decision).lower()
            assert "wrong" not in text
            assert "mistake" not in text


def test_coaching_for_unknown_outcome_is_empty():
    assert soil_check.soil_coaching("wet", "water") == ""
    assert soil_check.soil_coaching(None, None) == ""
