import asyncio

import pytest

import light_service
from fakes import FakeDb

NOW_ISO = "2026-07-15T12:00:00+00:00"


def run(coro):
    return asyncio.run(coro)


def make_db(user=None, plants=(), species=()):
    db = FakeDb()
    db.users.docs.append({"id": "u1", "created_at": "2026-06-01T00:00:00+00:00", **(user or {})})
    db.plants.docs.extend({"user_id": "u1", **p} for p in plants)
    db.species.docs.extend(species)
    return db


def user_of(db):
    return db.users.docs[0]


def save(db, sun=None, direction=None, view=None, hemisphere=None):
    return run(light_service.save_window(db, "u1", sun, direction, view, hemisphere, NOW_ISO))


def test_saving_a_window_by_timing_derives_the_direction():
    db = make_db()
    summary = save(db, sun="afternoon")
    user = user_of(db)
    assert user["window_sun"] == "afternoon" and user["window_view"] == "open" and user["hemisphere"] == "north"
    assert "window_direction" not in user
    assert summary["direction"] == "W"


def test_saving_by_compass_stores_the_direction_and_derives_the_timing():
    db = make_db()
    save(db, direction="SE")
    assert user_of(db)["window_direction"] == "SE"
    assert user_of(db)["window_sun"] == "morning"


def test_no_window_stores_no_direction_and_clears_an_old_one():
    db = make_db()
    save(db, direction="SE")
    save(db, sun="nowindow")
    assert user_of(db)["window_sun"] == "nowindow"
    assert "window_direction" not in user_of(db)


def test_hemisphere_and_view_are_remembered_when_left_out():
    db = make_db()
    save(db, sun="midday", view="tree", hemisphere="south")
    save(db, sun="morning")
    assert user_of(db)["window_view"] == "tree" and user_of(db)["hemisphere"] == "south"


def test_saving_a_window_needs_a_timing_or_a_direction_and_valid_values():
    db = make_db()
    for kwargs in ({}, {"sun": "noon"}, {"direction": "UP"}, {"sun": "midday", "view": "pond"}, {"sun": "midday", "hemisphere": "east"}):
        with pytest.raises(light_service.LightError) as error:
            save(db, **kwargs)
        assert error.value.status == 422
    assert "window_sun" not in user_of(db)


def test_saving_a_window_dismisses_the_prompt():
    db = make_db({"light_prompt_pending": True})
    save(db, sun="midday")
    assert user_of(db)["light_prompt_pending"] is False and user_of(db)["light_prompt_dismissed"] is True


def test_saving_a_window_completes_the_readiness_light_spot_step_once():
    db = make_db({"readiness_plant": {"species_id": "s1", "steps": {}}})
    save(db, sun="midday")
    first = user_of(db)["readiness_plant"]["steps"]["light-spot"]
    run(light_service.save_window(db, "u1", "morning", None, None, None, "2026-07-16T12:00:00+00:00"))
    assert user_of(db)["readiness_plant"]["steps"]["light-spot"] == first


def test_saving_a_window_without_a_readiness_plant_still_works_and_writes_nothing_extra():
    db = make_db()
    save(db, sun="midday")
    assert "readiness_plant" not in user_of(db)


def test_saving_a_reading_keeps_the_value_and_dismisses_the_prompt():
    db = make_db({"light_prompt_pending": True})
    assert run(light_service.save_reading(db, "u1", "soft", NOW_ISO)) == {"light_reading": "soft"}
    assert user_of(db)["light_reading"] == "soft" and user_of(db)["light_prompt_dismissed"] is True
    with pytest.raises(light_service.LightError):
        run(light_service.save_reading(db, "u1", "blurry", NOW_ISO))


def test_progress_is_saved_per_lesson():
    db = make_db()
    run(light_service.save_progress(db, "u1", "window-map", 2, NOW_ISO))
    run(light_service.save_progress(db, "u1", "light-basics", 1, NOW_ISO))
    assert user_of(db)["lesson_progress"] == {"window-map": 2, "light-basics": 1}
    result = run(light_service.save_progress(db, "u1", "window-map", 0, NOW_ISO))
    assert result == {"lesson_progress": {"window-map": 0, "light-basics": 1}}


def test_progress_rejects_unknown_and_retired_lessons_and_negative_cards():
    db = make_db()
    for lesson, card in (("nope", 1), ("window-blueprint", 1)):
        with pytest.raises(light_service.LightError) as error:
            run(light_service.save_progress(db, "u1", lesson, card, NOW_ISO))
        assert error.value.status == 404
    with pytest.raises(light_service.LightError) as error:
        run(light_service.save_progress(db, "u1", "window-map", -1, NOW_ISO))
    assert error.value.status == 422


def test_the_prompt_actions():
    db = make_db()
    assert run(light_service.set_prompt(db, "u1", "later", NOW_ISO)) == {"light_prompt_pending": True, "light_prompt_dismissed": False}
    assert run(light_service.set_prompt(db, "u1", "dismiss", NOW_ISO)) == {"light_prompt_pending": False, "light_prompt_dismissed": True}
    assert run(light_service.set_prompt(db, "u1", "later", NOW_ISO))["light_prompt_pending"] is False
    with pytest.raises(light_service.LightError):
        run(light_service.set_prompt(db, "u1", "snooze", NOW_ISO))


def test_fits_has_no_window_until_one_is_saved():
    db = make_db()
    assert run(light_service.fits_for(db, "u1", NOW_ISO)) == {"has_window": False, "level": None, "plants": [], "species": []}


def test_fits_names_the_users_plants_and_matching_species():
    species = [
        {"id": "s-sun", "slug": "jade", "common_name": "Jade", "default_light_level": "bright_direct"},
        {"id": "s-low", "slug": "snake", "common_name": "Snake plant", "default_light_level": "low"},
        {"id": "s-bi", "slug": "pothos", "common_name": "Pothos", "default_light_level": "bright_indirect"},
    ]
    plants = [
        {"id": "p1", "nickname": "Sunny", "species_id": "s-sun"},
        {"id": "p2", "common_name": "Snake plant", "species_id": "s-low"},
        {"id": "p3", "common_name": "Mystery"},
        {"id": "p4", "common_name": "Ghost", "species_id": "gone"},
        {"id": "p5", "common_name": "Old", "species_id": "s-sun", "is_archived": True},
    ]
    db = make_db({"window_sun": "midday"}, plants, species)
    result = run(light_service.fits_for(db, "u1", NOW_ISO))
    assert result["has_window"] is True and result["level"] == "bright_direct"
    assert result["plants"] == [
        {"id": "p1", "name": "Sunny", "suit": "suits"},
        {"id": "p2", "name": "Snake plant", "suit": "prefers_dimmer"},
    ]
    assert [s["common_name"] for s in result["species"]] == ["Jade", "Pothos"]
    assert set(result["species"][0]) == {"id", "slug", "common_name"}
