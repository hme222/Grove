import missions


def test_water_streak_keeps_its_id_xp_and_shape():
    assert "water_streak" in missions.MISSION_TYPES
    copy = missions.MISSION_COPY["water_streak"]
    assert copy["xp"] == 10
    assert copy["icon"] == "droplet"
    assert copy["cta_path"] == "/care"
    assert set(copy) == {"title", "subtitle", "cta", "cta_path", "xp", "icon"}


def test_water_streak_copy_asks_for_a_check_not_for_watering():
    copy = missions.MISSION_COPY["water_streak"]
    assert copy["title"] == "Check one plant"
    assert "water" in copy["subtitle"].lower()
    assert "decide" in copy["subtitle"].lower()
    assert "water one plant" not in copy["title"].lower()
