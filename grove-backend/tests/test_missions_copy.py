"""Daily mission rules: a 20-second plant check-in, no self-attest, no points."""
import asyncio
from datetime import datetime, timezone

import missions


# ---------- copy and shape ----------

def test_plant_check_in_is_a_short_soil_check_not_watering():
    copy = missions.MISSION_COPY["plant_check_in"]
    assert copy["title"] == "Plant check-in"
    assert "20-second" in copy["subtitle"]
    assert "soil" in copy["subtitle"].lower()
    assert "decide" in copy["subtitle"].lower()
    assert copy["cta_path"] == "/care"
    assert "water one plant" not in copy["title"].lower()


def test_no_mission_carries_points_or_a_currency():
    for copy in missions.MISSION_COPY.values():
        assert "xp" not in copy
        assert set(copy) == {"title", "subtitle", "cta", "cta_path", "icon"}


def test_retired_water_streak_id_still_reads_as_the_plant_check_in():
    assert missions.canonical_type("water_streak") == "plant_check_in"
    assert "water_streak" not in missions.MISSION_COPY


def test_no_streak_wording_in_any_mission_copy():
    for copy in missions.MISSION_COPY.values():
        assert "streak" not in " ".join(copy.values()).lower()


def test_plant_owners_get_the_plant_check_in_on_most_days():
    share = missions.PLANT_OWNER_ROTATION.count("plant_check_in") / len(missions.PLANT_OWNER_ROTATION)
    assert 0.6 <= share < 1.0
    assert set(missions.PLANT_OWNER_ROTATION) <= set(missions.MISSION_COPY)


# ---------- behavior, against a tiny in-memory db ----------

def _matches(doc, flt):
    for key, value in flt.items():
        if isinstance(value, dict) and "$ne" in value:
            if doc.get(key) == value["$ne"]:
                return False
        elif doc.get(key) != value:
            return False
    return True


class _Coll:
    def __init__(self):
        self.docs = []

    async def find_one(self, flt, projection=None):
        return next((d for d in self.docs if _matches(d, flt)), None)

    async def insert_one(self, doc):
        self.docs.append(doc)

    async def update_one(self, flt, update):
        doc = await self.find_one(flt)
        if doc is not None:
            doc.update(update.get("$set", {}))

    async def count_documents(self, flt):
        return sum(1 for d in self.docs if _matches(d, flt))


class _Db:
    def __init__(self, plants=1):
        self.user_missions = _Coll()
        self.plants = _Coll()
        for i in range(plants):
            self.plants.docs.append({"id": f"p{i}", "user_id": "u1"})


def _today_mission(db, mission_type):
    doc = {
        "id": "m1", "user_id": "u1", "mission_date": missions.today_str(),
        "mission_type": mission_type, "assigned_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None, "metadata": {},
    }
    db.user_missions.docs.append(doc)
    return doc


def run(coro):
    return asyncio.run(coro)


def test_a_new_mission_stores_and_returns_no_xp():
    db = _Db()
    out = run(missions.get_or_assign_daily_mission(db, "u1"))
    assert "xp" not in out and "xp_awarded" not in out
    assert "xp_awarded" not in db.user_missions.docs[0]


def test_watering_does_not_complete_the_plant_check_in():
    db = _Db()
    doc = _today_mission(db, "plant_check_in")
    assert run(missions.on_care_log(db, "u1", [{"action": "water"}, {"action": "fertilize"}])) is None
    assert doc["completed_at"] is None


def test_a_soil_check_completes_it_even_after_a_watering_in_the_same_log():
    db = _Db()
    doc = _today_mission(db, "plant_check_in")
    out = run(missions.on_care_log(db, "u1", [{"action": "water"}, {"action": "soil_check"}]))
    assert out["completed"] is True
    assert doc["completed_at"] and "xp_awarded" not in doc


def test_an_old_water_streak_mission_completes_on_a_soil_check_only():
    db = _Db()
    doc = _today_mission(db, "water_streak")
    assert run(missions.on_care_log(db, "u1", {"action": "water"})) is None
    out = run(missions.on_care_log(db, "u1", {"action": "soil_check"}))
    assert out["mission_type"] == "plant_check_in"
    assert doc["completed_at"]


def test_there_is_no_self_attest_path_any_more():
    assert not hasattr(missions, "manual_complete")


def test_someone_with_no_plants_is_asked_to_add_one_and_it_completes_when_they_do():
    db = _Db(plants=0)
    out = run(missions.get_or_assign_daily_mission(db, "u1"))
    assert out["mission_type"] == "first_plant"
    assert out["cta_path"] == "/add-plant"
    assert run(missions.on_plant_added(db, "u1"))["completed"] is True


def test_nice_work_state_is_kept_as_completed_flag():
    db = _Db()
    _today_mission(db, "photo_log")
    out = run(missions.on_care_log(db, "u1", {"action": "water", "photo_url": "x.jpg"}))
    assert out["completed"] is True and out["completed_at"]
