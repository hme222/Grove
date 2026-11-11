from datetime import datetime, timedelta, timezone

import schedule_tuning as st

NOW = datetime(2026, 11, 1, 12, tzinfo=timezone.utc)


def at(days_ago):
    return (NOW - timedelta(days=days_ago)).isoformat()


def water(days_ago):
    return {"action": "water", "logged_at": at(days_ago)}


def soil(days_ago, outcome):
    return {"action": "soil_check", "soil_outcome": outcome, "logged_at": at(days_ago)}


PLANT = {"watering_frequency_days": 7, "watering_frequency_source": "ai", "created_at": at(90), "room": "Living room", "common_name": "Pothos"}
POTHOS = {"light_min": "low", "light_ideal": "medium", "default_light_level": "medium"}


def test_two_damp_checks_when_due_suggest_a_longer_interval():
    logs = [water(30), soil(23, "damp"), water(22), soil(14, "damp")]  # damp after 7 and 8 days
    s = st.suggest(PLANT, logs, None, None)
    assert s["basis"] == "soil" and s["days"] == 9 and s["current_days"] == 7
    assert "damp" in s["reason"]


def test_two_dry_checks_well_before_due_suggest_a_shorter_interval():
    logs = [water(20), soil(15, "dry"), water(14), soil(9, "dry")]  # dry after 5 days
    s = st.suggest(PLANT, logs, None, None)
    assert s["basis"] == "soil" and s["days"] == 5


def test_one_check_is_not_enough():
    assert st.suggest(PLANT, [water(10), soil(2, "damp")], None, None) is None


def test_checks_that_match_the_schedule_say_nothing():
    logs = [water(20), soil(18, "damp"), water(14), soil(7, "dry")]  # damp early, dry on time
    assert st.suggest(PLANT, logs, None, None) is None


def test_mixed_signals_make_no_suggestion():
    logs = [water(30), soil(23, "damp"), water(22), soil(18, "dry")]
    assert st.suggest(PLANT, logs, None, None) is None


def test_a_water_log_in_the_same_sweep_is_not_the_previous_watering():
    logs = [water(8), soil(0, "damp"), {"action": "water", "logged_at": (NOW - timedelta(minutes=1)).isoformat()}]
    assert st.soil_signals([dict(l, logged_at=l["logged_at"]) for l in logs], 7) == ["longer"]


def test_checks_before_the_schedule_last_changed_are_ignored():
    plant = dict(PLANT, watering_frequency_set_at=at(10))
    logs = [water(30), soil(23, "damp"), water(22), soil(14, "damp")]
    assert st.suggest(plant, logs, None, None) is None


def test_suggestions_stay_inside_three_to_twenty_eight_days():
    plant = dict(PLANT, watering_frequency_days=28)
    logs = [water(70), soil(42, "damp"), water(40), soil(12, "damp")]
    assert st.suggest(plant, logs, None, None) is None  # already at the limit
    plant = dict(PLANT, watering_frequency_days=3)
    logs = [water(20), soil(18, "dry"), water(17), soil(15, "dry")]
    assert st.suggest(plant, logs, None, None) is None


def test_a_dismissed_number_is_not_suggested_again():
    logs = [water(30), soil(23, "damp"), water(22), soil(14, "damp")]
    assert st.suggest(dict(PLANT, schedule_suggestion_dismissed_days=9), logs, None, None) is None
    assert st.suggest(dict(PLANT, schedule_suggestion_dismissed_days=8), logs, None, None)["days"] == 9


def test_a_bright_room_suggests_a_shorter_interval():
    s = st.suggest(PLANT, [], "bright_direct", POTHOS)
    assert s["basis"] == "light" and s["days"] == 5  # two steps brighter than medium
    assert "direct sun" in s["reason"] and "Living room" in s["reason"]


def test_a_dim_room_suggests_a_longer_interval():
    s = st.suggest(PLANT, [], "low", POTHOS)
    assert s["basis"] == "light" and s["days"] == 8


def test_a_room_that_matches_the_species_suggests_nothing():
    assert st.suggest(PLANT, [], "medium", POTHOS) is None


def test_light_needs_a_room_light_and_a_known_species():
    assert st.suggest(PLANT, [], None, POTHOS) is None
    assert st.suggest(PLANT, [], "low", None) is None


def test_light_is_not_suggested_when_the_person_set_the_schedule():
    assert st.suggest(dict(PLANT, watering_frequency_source="user"), [], "bright_direct", POTHOS) is None


def test_the_persons_own_soil_checks_win_over_light():
    logs = [water(30), soil(23, "damp"), water(22), soil(14, "damp")]
    assert st.suggest(PLANT, logs, "bright_direct", POTHOS)["basis"] == "soil"


def test_jar_plants_get_no_suggestion():
    assert st.suggest(dict(PLANT, grow_medium="propagation_jar"), [], "low", POTHOS) is None
