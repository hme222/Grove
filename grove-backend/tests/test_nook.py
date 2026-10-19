from datetime import datetime, timezone

import pytest

import nook


def at(day, hour=9, month=10):
    return datetime(2026, month, day, hour, 0, tzinfo=timezone.utc).isoformat()


def soil(day, plant="p1"):
    return {"kind": "soil_check", "plant_id": plant, "at": at(day)}


# ---------- growth ----------

def test_no_events_means_no_growth():
    assert nook.compute_growth([]) == 0
    assert nook.compute_growth(None) == 0


def test_each_signal_earns_its_points():
    assert nook.compute_growth([{"kind": "lesson", "key": "plant-er", "at": at(1)}]) == 15
    assert nook.compute_growth([soil(1)]) == 15
    assert nook.compute_growth([{"kind": "light_check", "plant_id": "p1", "at": at(1)}]) == 10
    assert nook.compute_growth([{"kind": "leaves_wiped", "plant_id": "p1", "at": at(1)}]) == 5
    assert nook.compute_growth([{"kind": "readiness_step", "key": "drainage", "at": at(1)}]) == 10
    assert nook.compute_growth([{"kind": "badge", "key": "streak_7", "at": at(1)}]) == 20


def test_a_mission_brings_its_own_xp():
    assert nook.compute_growth([{"kind": "mission", "key": "m1", "at": at(1), "points": 10}]) == 10
    assert nook.compute_growth([{"kind": "mission", "key": "m2", "at": at(1), "points": 15}]) == 15
    assert nook.compute_growth([{"kind": "mission", "key": "m3", "at": at(1), "points": 0}]) == 0


def test_unknown_kinds_earn_nothing():
    assert nook.compute_growth([{"kind": "made_up", "at": at(1)}]) == 0


def test_a_lesson_counts_once_however_often_it_appears():
    events = [{"kind": "lesson", "key": "plant-er", "at": at(1)}, {"kind": "lesson", "key": "plant-er", "at": at(5)}]
    assert nook.compute_growth(events) == 15


def test_a_soil_test_counts_once_per_plant_per_day():
    assert nook.compute_growth([soil(1), soil(1)]) == 15
    assert nook.compute_growth([soil(1), soil(2)]) == 30
    assert nook.compute_growth([soil(1, "p1"), soil(1, "p2")]) == 30


def test_a_light_check_counts_once_per_plant_per_14_days():
    def light(day, plant="p1"):
        return {"kind": "light_check", "plant_id": plant, "at": at(day)}
    assert nook.compute_growth([light(1), light(10)]) == 10
    assert nook.compute_growth([light(1), light(15)]) == 20
    assert nook.compute_growth([light(1, "p1"), light(1, "p2")]) == 20
    assert nook.compute_growth([light(1), light(14)]) == 10
    assert nook.compute_growth([light(1), light(15), light(20)]) == 20


def test_leaf_wipes_follow_the_same_14_day_rule():
    wipes = [{"kind": "leaves_wiped", "plant_id": "p1", "at": at(d)} for d in (1, 5, 16)]
    assert nook.compute_growth(wipes) == 10


def test_a_day_never_counts_more_than_30():
    events = [
        soil(3, "p1"), soil(3, "p2"), soil(3, "p3"),
        {"kind": "lesson", "key": "plant-er", "at": at(3)},
        {"kind": "mission", "key": "m1", "at": at(3), "points": 10},
    ]
    assert nook.compute_growth(events) == 30


def test_the_cap_is_per_day_not_overall():
    events = [soil(3, "p1"), soil(3, "p2"), soil(3, "p3"), soil(4, "p1"), soil(4, "p2")]
    assert nook.compute_growth(events) == 30 + 30


def test_the_cap_trims_the_last_event_instead_of_dropping_it():
    events = [
        {"kind": "lesson", "key": "a", "at": at(3, 8)},
        {"kind": "lesson", "key": "b", "at": at(3, 9)},
        {"kind": "mission", "key": "m1", "at": at(3, 10), "points": 10},
    ]
    assert nook.compute_growth(events) == 30


def test_events_with_no_readable_time_count_once_and_skip_the_cap():
    events = [
        {"kind": "lesson", "key": "a", "at": None},
        {"kind": "lesson", "key": "b"},
        {"kind": "lesson", "key": "c", "at": "not a date"},
        {"kind": "lesson", "key": "d", "at": ""},
        {"kind": "lesson", "key": "a", "at": None},
    ]
    assert nook.compute_growth(events) == 15 * 4


def test_a_lesson_with_a_time_and_the_same_lesson_without_one_counts_once():
    events = [{"kind": "lesson", "key": "a", "at": at(1)}, {"kind": "lesson", "key": "a", "at": None}]
    assert nook.compute_growth(events) == 15


def test_level_badges_never_feed_growth():
    assert nook.compute_growth([{"kind": "badge", "key": "nook_level_2", "at": at(1)}]) == 0
    assert nook.compute_growth([{"kind": "badge", "key": "nook_level_4", "at": None}]) == 0


def test_event_order_does_not_change_the_result():
    events = [soil(5), soil(2), {"kind": "lesson", "key": "x", "at": at(2)}, soil(5, "p2")]
    assert nook.compute_growth(events) == nook.compute_growth(list(reversed(events)))


def test_timestamps_with_a_z_suffix_or_no_zone_are_read():
    assert nook.compute_growth([{"kind": "lesson", "key": "a", "at": "2026-10-01T09:00:00Z"}]) == 15
    assert nook.compute_growth([{"kind": "lesson", "key": "a", "at": "2026-10-01T09:00:00"}]) == 15


# ---------- levels ----------

@pytest.mark.parametrize(
    "growth,level",
    [(0, 1), (99, 1), (100, 2), (199, 2), (200, 3), (299, 3), (300, 4), (10_000, 4)],
)
def test_level_thresholds(growth, level):
    assert nook.level_info(growth)["level"] == level


def test_level_names_and_next_unlock():
    assert nook.level_info(0) == {"level": 1, "name": "Bare", "next_unlock": "the shelf"}
    assert nook.level_info(150)["name"] == "Settling in"
    assert nook.level_info(150)["next_unlock"] == "a rug and a lamp"
    assert nook.level_info(250)["next_unlock"] == "a hanging plant and a botanical print"
    assert nook.level_info(400) == {"level": 4, "name": "In bloom", "next_unlock": None}


def test_unlocked_slots_add_up_in_order():
    assert nook.unlocked_slots(1) == ["window", "table", "sill", "floor"]
    assert nook.unlocked_slots(2) == ["window", "table", "sill", "floor", "shelf"]
    assert nook.unlocked_slots(3)[-2:] == ["rug", "lamp"]
    assert nook.unlocked_slots(4)[-2:] == ["hanging", "wall-art"]


def test_pip_grows_with_the_level_and_moves_to_the_shelf_at_level_2():
    assert [nook.pip_form(level) for level in (1, 2, 3, 4)] == ["seed", "sprout", "leafy", "bloom"]
    assert nook.pip_location(1) == "sill"
    assert [nook.pip_location(level) for level in (2, 3, 4)] == ["shelf"] * 3


# ---------- plant condition ----------

@pytest.mark.parametrize(
    "status,looks_off,scores,expected",
    [
        ("healthy", False, [100, 80], "fine"),
        ("propagating", False, [], "fine"),
        (None, False, None, "fine"),
        ("needs_water", False, [100], "due-soon"),
        ("urgent", False, [100], "needs-attention"),
        ("healthy", True, [100], "needs-attention"),
        ("needs_water", True, [100], "needs-attention"),
        ("healthy", False, [100, 29], "needs-attention"),
        ("healthy", False, [100, 30], "fine"),
        ("needs_water", False, [10], "needs-attention"),
    ],
)
def test_plant_condition(status, looks_off, scores, expected):
    assert nook.plant_condition(status, looks_off, scores) == expected


def test_quiet_while_any_plant_needs_attention():
    assert nook.is_quiet(["fine", "due-soon", "needs-attention"]) is True
    assert nook.is_quiet(["fine", "due-soon"]) is False
    assert nook.is_quiet([]) is False


@pytest.mark.parametrize(
    "common,latin,group",
    [
        ("Golden Pothos", "Epipremnum aureum", "pothos"),
        ("Swiss cheese plant", "Monstera deliciosa", "monstera"),
        ("Jade plant", "Crassula ovata", "succulent"),
        ("Aloe vera", None, "succulent"),
        ("Snake Plant", "Dracaena trifasciata", "snake"),
        ("Mother-in-law's tongue", "Sansevieria trifasciata", "snake"),
        ("Fiddle leaf fig", "Ficus lyrata", "generic"),
        (None, None, "generic"),
    ],
)
def test_species_group(common, latin, group):
    assert nook.species_group(common, latin) == group


# ---------- weekly rhythm ----------

NOW = datetime(2026, 10, 14, 12, 0, tzinfo=timezone.utc)  # a Wednesday


def test_weekly_days_counts_distinct_days_this_week():
    stamps = [at(12), at(12, 18), at(13), at(14)]
    assert nook.weekly_days(stamps, NOW) == 3


def test_weekly_days_leaves_out_last_week_and_later_days():
    stamps = [at(11), at(10), at(12), at(18), at(19)]
    assert nook.weekly_days(stamps, NOW) == 2


def test_weekly_days_ignores_unreadable_entries_and_empty_input():
    assert nook.weekly_days([None, "", "nope", at(13)], NOW) == 1
    assert nook.weekly_days([], NOW) == 0
    assert nook.weekly_days(None, NOW) == 0


def test_weekly_days_starts_fresh_each_monday():
    monday = datetime(2026, 10, 19, 8, 0, tzinfo=timezone.utc)
    assert nook.weekly_days([at(14), at(15), at(18)], monday) == 0


# ---------- catalog, readiness, badges ----------

def test_catalog_opens_after_30_days_for_users_with_the_nook_on():
    created = at(1, month=9)
    assert nook.catalog_open(created, datetime(2026, 10, 1, 9, 0, tzinfo=timezone.utc), True) is True
    assert nook.catalog_open(created, datetime(2026, 9, 30, 9, 0, tzinfo=timezone.utc), True) is False
    assert nook.catalog_open(created, datetime(2026, 10, 14, tzinfo=timezone.utc), False) is False
    assert nook.catalog_open(None, NOW, True) is False
    assert nook.catalog_open("bad", NOW, True) is False


def test_readiness_has_only_three_states_and_never_a_need():
    assert nook.readiness_state(0) == "seed"
    assert nook.readiness_state(1) == "sprouting"
    assert nook.readiness_state(2) == "sprouting"
    assert nook.readiness_state(3) == "ready"
    assert nook.readiness_state(9) == "ready"
    assert nook.READINESS_STEPS == ("light-spot", "drainage", "soil-mix")


def test_nook_badges_are_hidden_until_the_nook_is_on_unless_earned():
    badges = [{"slug": "streak_7"}, {"slug": "nook_level_2"}, {"slug": "nook_level_3"}]
    assert [b["slug"] for b in nook.visible_badges(badges, False, [])] == ["streak_7"]
    assert [b["slug"] for b in nook.visible_badges(badges, False, ["nook_level_2"])] == ["streak_7", "nook_level_2"]
    assert len(nook.visible_badges(badges, True, [])) == 3
