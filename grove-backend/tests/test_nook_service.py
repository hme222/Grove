import asyncio
from datetime import datetime, timezone

import pytest

import nook_service
from fakes import FakeDb

NOW = datetime(2026, 10, 14, 12, 0, tzinfo=timezone.utc)
NOW_ISO = NOW.isoformat()


def stamp(day, hour=9, month=10):
    return datetime(2026, month, day, hour, 0, tzinfo=timezone.utc).isoformat()


def run(coro):
    return asyncio.run(coro)


async def no_scores(plant):
    return [100]


def status_of(plant):
    return plant.get("status", "healthy")


def make_db(user=None, plants=()):
    db = FakeDb()
    db.users.docs.append({"id": "u1", "created_at": stamp(1, month=8), **(user or {})})
    db.plants.docs.extend({"user_id": "u1", **p} for p in plants)
    return db


def state(db, status_fn=status_of, scores_fn=no_scores):
    return run(nook_service.build_state(db, "u1", NOW, status_fn, scores_fn))


# ---------- gathering signals ----------

def test_gather_events_reads_every_existing_signal():
    db = make_db(user={
        "tutorials_seen": ["collection", "lesson:plant-er", "lesson:not-real"],
        "lesson_completed_at": {"plant-er": stamp(2)},
        "readiness_plant": {"steps": {"drainage": stamp(3)}},
    })
    for action in ("soil_check", "light_check", "clean", "water"):
        db.care_logs.docs.append({"user_id": "u1", "plant_id": "p1", "action": action, "logged_at": stamp(4)})
    db.care_logs.docs.append({"user_id": "u2", "plant_id": "px", "action": "soil_check", "logged_at": stamp(4)})
    db.user_missions.docs.extend([
        {"user_id": "u1", "id": "m1", "completed_at": stamp(5), "xp_awarded": 10},
        {"user_id": "u1", "id": "m2", "completed_at": None, "xp_awarded": 0},
    ])
    db.user_badges.docs.append({"user_id": "u1", "badge_slug": "streak_7", "earned_at": stamp(6)})

    user = db.users.docs[0]
    events = run(nook_service.gather_events(db, "u1", user))
    kinds = sorted(e["kind"] for e in events)
    assert kinds == ["badge", "leaves_wiped", "lesson", "light_check", "mission", "readiness_step", "soil_check"]
    lesson = next(e for e in events if e["kind"] == "lesson")
    assert lesson == {"kind": "lesson", "key": "plant-er", "at": stamp(2)}
    assert next(e for e in events if e["kind"] == "mission")["points"] == 10


def test_a_lesson_finished_before_times_were_recorded_still_counts_undated():
    db = make_db(user={"tutorials_seen": ["lesson:plant-er"]})
    events = run(nook_service.gather_events(db, "u1", db.users.docs[0]))
    assert events == [{"kind": "lesson", "key": "plant-er", "at": None}]


# ---------- the state ----------

def test_a_new_user_has_a_bare_nook_and_the_state_never_carries_the_growth_number():
    result = state(make_db())
    assert result["enabled"] is False
    assert result["offered"] is False
    assert (result["level"], result["level_name"]) == (1, "Bare")
    assert result["next_unlock"] == "the shelf"
    assert result["pip"] == {"form": "seed", "location": "sill"}
    assert result["hero"] is None and result["readiness"] is None
    assert result["quiet"] is False
    assert result["weekly_days"] == 0
    assert result["catalog_open"] is False
    assert not any("growth" in key for key in result)


def test_enough_soil_tests_raise_the_level_and_move_pip_to_the_shelf():
    db = make_db(plants=[{"id": "p1", "created_at": stamp(1)}])
    for day in (1, 2, 3, 4, 5, 6, 7, 12, 13):
        db.care_logs.docs.append({"user_id": "u1", "plant_id": "p1", "action": "soil_check", "logged_at": stamp(day)})
    result = state(db)
    assert result["level"] == 2
    assert "shelf" in result["unlocked"]
    assert result["pip"] == {"form": "sprout", "location": "shelf"}
    assert result["grew"] is True
    assert result["level_up"] is True
    assert result["weekly_days"] == 2


def test_mark_seen_stops_grew_and_level_up_until_something_new_happens():
    db = make_db(plants=[{"id": "p1", "created_at": stamp(1)}])
    for day in range(1, 8):
        db.care_logs.docs.append({"user_id": "u1", "plant_id": "p1", "action": "soil_check", "logged_at": stamp(day)})
    run(nook_service.mark_seen(db, "u1", NOW_ISO))
    result = state(db)
    assert result["grew"] is False and result["level_up"] is False
    db.care_logs.docs.append({"user_id": "u1", "plant_id": "p1", "action": "soil_check", "logged_at": stamp(9)})
    result = state(db)
    assert result["grew"] is True and result["level_up"] is False


def test_the_hero_defaults_to_the_oldest_plant_and_the_rest_go_on_the_shelf():
    plants = [{"id": f"p{i}", "created_at": stamp(i), "common_name": "Pothos"} for i in (3, 1, 2, 4, 5, 6, 7)]
    result = state(make_db(plants=plants))
    assert result["hero"]["id"] == "p1"
    assert len(result["shelf_plants"]) == 4
    assert [p["id"] for p in result["shelf_plants"]] == ["p2", "p3", "p4", "p5"]
    assert len(result["plants"]) == 7


def test_a_chosen_hero_wins_and_a_stale_choice_falls_back():
    plants = [{"id": "p1", "created_at": stamp(1)}, {"id": "p2", "created_at": stamp(2)}]
    assert state(make_db(user={"nook_hero_plant_id": "p2"}, plants=plants))["hero"]["id"] == "p2"
    assert state(make_db(user={"nook_hero_plant_id": "gone"}, plants=plants))["hero"]["id"] == "p1"


def test_archived_plants_are_left_out():
    plants = [{"id": "p1", "created_at": stamp(1), "is_archived": True}, {"id": "p2", "created_at": stamp(2)}]
    assert [p["id"] for p in state(make_db(plants=plants))["plants"]] == ["p2"]


def test_conditions_come_from_status_looks_off_and_health_and_drive_quiet_mode():
    plants = [
        {"id": "p1", "created_at": stamp(1), "status": "healthy"},
        {"id": "p2", "created_at": stamp(2), "status": "needs_water"},
        {"id": "p3", "created_at": stamp(3), "status": "healthy", "looks_off": True},
    ]
    result = state(make_db(plants=plants))
    assert {p["id"]: p["condition"] for p in result["plants"]} == {
        "p1": "fine", "p2": "due-soon", "p3": "needs-attention",
    }
    assert result["quiet"] is True

    calm = state(make_db(plants=plants[:2]))
    assert calm["quiet"] is False


def test_a_low_health_score_marks_a_plant_as_needing_attention():
    async def weak(plant):
        return [100, 20]
    result = state(make_db(plants=[{"id": "p1", "created_at": stamp(1)}]), scores_fn=weak)
    assert result["plants"][0]["condition"] == "needs-attention"


def test_plants_use_their_species_template_and_their_nickname():
    plants = [{"id": "p1", "created_at": stamp(1), "common_name": "Snake Plant", "nickname": "Sid"}]
    plant = state(make_db(plants=plants))["plants"][0]
    assert (plant["name"], plant["group"]) == ("Sid", "snake")


def test_the_readiness_plant_shows_its_steps_state_and_real_schedule():
    db = make_db(user={"readiness_plant": {
        "species_id": "s1", "species_name": "Snake Plant", "watering_days": 14,
        "steps": {"light-spot": stamp(2), "drainage": stamp(3)},
    }})
    readiness = state(db)["readiness"]
    assert readiness["state"] == "sprouting"
    assert readiness["watering_days"] == 14
    assert readiness["group"] == "snake"
    assert readiness["steps"] == [
        {"id": "light-spot", "done": True},
        {"id": "drainage", "done": True},
        {"id": "soil-mix", "done": False},
    ]


def test_the_catalog_is_open_only_for_users_with_the_nook_on_after_30_days():
    assert state(make_db(user={"nook_enabled": True}))["catalog_open"] is True
    assert state(make_db(user={"nook_enabled": False}))["catalog_open"] is False
    assert state(make_db(user={"nook_enabled": True, "created_at": stamp(10)}))["catalog_open"] is False


# ---------- badges ----------

def test_level_badges_are_awarded_up_to_the_current_level_once():
    db = make_db()
    for number in (2, 3, 4):
        db.badges.docs.append({"id": f"b{number}", "slug": f"nook_level_{number}"})
    assert run(nook_service.award_level_badges(db, "u1", 3, NOW_ISO)) == ["nook_level_2", "nook_level_3"]
    assert run(nook_service.award_level_badges(db, "u1", 3, NOW_ISO)) == []
    assert run(nook_service.award_level_badges(db, "u1", 4, NOW_ISO)) == ["nook_level_4"]
    assert sorted(b["badge_slug"] for b in db.user_badges.docs) == ["nook_level_2", "nook_level_3", "nook_level_4"]


def test_level_1_awards_nothing_and_a_missing_badge_is_skipped():
    db = make_db()
    assert run(nook_service.award_level_badges(db, "u1", 1, NOW_ISO)) == []
    assert run(nook_service.award_level_badges(db, "u1", 4, NOW_ISO)) == []
    assert db.user_badges.docs == []


# ---------- settings ----------

def test_turning_the_nook_on_records_the_offer_once():
    db = make_db()
    first = run(nook_service.update_settings(db, "u1", True, None, "2026-10-14T10:00:00+00:00"))
    assert first["nook_enabled"] is True
    assert first["nook_offered_at"] == "2026-10-14T10:00:00+00:00"
    second = run(nook_service.update_settings(db, "u1", False, None, "2026-10-15T10:00:00+00:00"))
    assert second["nook_enabled"] is False
    assert second["nook_offered_at"] == "2026-10-14T10:00:00+00:00"


def test_saying_no_still_records_that_the_offer_was_made():
    db = make_db()
    saved = run(nook_service.update_settings(db, "u1", False, None, NOW_ISO))
    assert saved["nook_enabled"] is False
    assert saved["nook_offered_at"] == NOW_ISO


def test_choosing_a_hero_needs_one_of_the_users_own_plants():
    db = make_db(plants=[{"id": "p1"}])
    db.plants.docs.append({"id": "other", "user_id": "u2"})
    assert run(nook_service.update_settings(db, "u1", None, "p1", NOW_ISO))["nook_hero_plant_id"] == "p1"
    for bad in ("missing", "other"):
        with pytest.raises(nook_service.NookError) as err:
            run(nook_service.update_settings(db, "u1", None, bad, NOW_ISO))
        assert err.value.status == 404


def test_an_empty_update_changes_nothing():
    db = make_db()
    run(nook_service.update_settings(db, "u1", None, None, NOW_ISO))
    assert "nook_enabled" not in db.users.docs[0]
    assert "updated_at" not in db.users.docs[0]


# ---------- readiness ----------

def test_starting_readiness_needs_a_known_species_and_defaults_to_a_week():
    db = make_db()
    db.species.docs.append({"id": "s1", "common_name": "Pothos", "default_watering_days": 9})
    db.species.docs.append({"id": "s2", "common_name": "Mystery"})
    with pytest.raises(nook_service.NookError) as err:
        run(nook_service.start_readiness(db, "u1", "nope", NOW_ISO))
    assert err.value.status == 404
    run(nook_service.start_readiness(db, "u1", "s1", NOW_ISO))
    assert db.users.docs[0]["readiness_plant"]["watering_days"] == 9
    run(nook_service.start_readiness(db, "u1", "s2", NOW_ISO))
    assert db.users.docs[0]["readiness_plant"]["watering_days"] == 7


def test_changing_species_keeps_the_steps_already_done():
    db = make_db()
    db.species.docs.extend([{"id": "s1", "common_name": "Pothos"}, {"id": "s2", "common_name": "Aloe"}])
    run(nook_service.start_readiness(db, "u1", "s1", NOW_ISO))
    run(nook_service.complete_readiness_step(db, "u1", "drainage", NOW_ISO))
    run(nook_service.start_readiness(db, "u1", "s2", "2026-10-20T00:00:00+00:00"))
    plant = db.users.docs[0]["readiness_plant"]
    assert plant["species_name"] == "Aloe"
    assert plant["steps"] == {"drainage": NOW_ISO}
    assert plant["started_at"] == NOW_ISO


def test_a_readiness_step_needs_a_started_plant_and_a_real_step():
    db = make_db()
    with pytest.raises(nook_service.NookError) as err:
        run(nook_service.complete_readiness_step(db, "u1", "drainage", NOW_ISO))
    assert err.value.status == 409
    db.users.docs[0]["readiness_plant"] = {"species_id": "s1", "steps": {}}
    with pytest.raises(nook_service.NookError) as err:
        run(nook_service.complete_readiness_step(db, "u1", "made-up", NOW_ISO))
    assert err.value.status == 404


def test_completing_a_readiness_step_twice_keeps_the_first_time():
    db = make_db(user={"readiness_plant": {"species_id": "s1", "steps": {}}})
    run(nook_service.complete_readiness_step(db, "u1", "drainage", NOW_ISO))
    run(nook_service.complete_readiness_step(db, "u1", "drainage", "2026-10-30T00:00:00+00:00"))
    assert db.users.docs[0]["readiness_plant"]["steps"] == {"drainage": NOW_ISO}


# ---------- looks off ----------

def test_looks_off_can_be_set_and_cleared_on_the_users_own_plant_only():
    db = make_db(plants=[{"id": "p1"}])
    db.plants.docs.append({"id": "other", "user_id": "u2"})
    run(nook_service.set_looks_off(db, "u1", "p1", True, NOW_ISO))
    assert db.plants.docs[0]["looks_off"] is True
    run(nook_service.set_looks_off(db, "u1", "p1", False, NOW_ISO))
    assert db.plants.docs[0]["looks_off"] is False
    with pytest.raises(nook_service.NookError) as err:
        run(nook_service.set_looks_off(db, "u1", "other", True, NOW_ISO))
    assert err.value.status == 404
    assert "looks_off" not in db.plants.docs[1]
