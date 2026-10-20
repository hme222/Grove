"""Endpoint tests for the soil test, quiz, and lesson routes.

They run the real FastAPI app against an in-memory stand-in for the database,
so no MongoDB and no network are used. Streak, badge, and mission side effects
are stubbed out because they are not what these tests are about.
"""
import os

import pytest

# Dummy values are set before `server` is imported so a real database is never configured.
os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402


def _matches(doc, flt):
    for key, value in flt.items():
        if isinstance(value, dict) and "$ne" in value:
            if doc.get(key) == value["$ne"]:
                return False
        elif doc.get(key) != value:
            return False
    return True


class FakeCollection:
    def __init__(self):
        self.docs = []

    async def insert_one(self, doc):
        self.docs.append(doc)

    async def find_one(self, flt, projection=None):
        for doc in self.docs:
            if _matches(doc, flt):
                return doc
        return None

    async def count_documents(self, flt):
        return sum(1 for doc in self.docs if _matches(doc, flt))

    async def update_one(self, flt, update):
        doc = await self.find_one(flt)
        if doc is None:
            return
        for key, value in update.get("$set", {}).items():
            doc[key] = value
        for key, value in update.get("$addToSet", {}).items():
            items = doc.setdefault(key, [])
            if value not in items:
                items.append(value)


class FakeDb:
    def __init__(self):
        self.users = FakeCollection()
        self.plants = FakeCollection()
        self.care_logs = FakeCollection()


async def _noop(*args, **kwargs):
    return None


@pytest.fixture
def make_client(monkeypatch):
    def build(with_plant=True):
        db = FakeDb()
        db.users.docs.append({"id": "u1", "email": "a@b.c", "tutorials_seen": []})
        if with_plant:
            db.plants.docs.append({"id": "p1", "user_id": "u1", "watering_frequency_days": 7})
        monkeypatch.setattr(server, "db", db)
        monkeypatch.setattr(server, "update_streak", _noop)
        monkeypatch.setattr(server, "check_and_award_badges", _noop)
        monkeypatch.setattr(server.missions_mod, "on_care_log", _noop)
        server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
        return db, TestClient(server.app)

    yield build
    server.app.dependency_overrides.pop(server.get_current_user, None)


# ---------- soil test through the care log ----------

def test_soil_check_is_stored_and_returns_coaching(make_client):
    db, client = make_client()
    res = client.post("/api/plants/p1/care-logs", json={"actions": ["soil_check"], "soil_outcome": "damp", "soil_decision": "wait"})
    assert res.status_code == 200
    assert res.json()["_meta"]["soil_coaching"].startswith("Damp soil means")
    log = db.care_logs.docs[0]
    assert (log["soil_outcome"], log["soil_decision"]) == ("damp", "wait")


def test_soil_check_without_an_outcome_is_a_plain_400_and_writes_nothing(make_client):
    db, client = make_client()
    res = client.post("/api/plants/p1/care-logs", json={"actions": ["soil_check"]})
    assert res.status_code == 400
    assert res.json()["detail"] == "A soil test needs an outcome: dry or damp."
    assert db.care_logs.docs == []


@pytest.mark.parametrize(
    "body",
    [
        {"actions": ["soil_check"], "soil_outcome": "wet"},
        {"actions": ["soil_check"], "soil_outcome": "dry", "soil_decision": "drown"},
        {"actions": ["water", "soil_check"], "soil_outcome": "nope"},
    ],
)
def test_invalid_soil_values_write_no_logs_at_all(make_client, body):
    db, client = make_client()
    res = client.post("/api/plants/p1/care-logs", json=body)
    assert res.status_code == 400
    assert db.care_logs.docs == []


def test_soil_check_and_water_in_one_sweep_write_two_logs_with_soil_fields_on_one(make_client):
    db, client = make_client()
    res = client.post(
        "/api/plants/p1/care-logs",
        json={"actions": ["water", "soil_check"], "soil_outcome": "dry", "soil_decision": "water", "notes": "Looked fine"},
    )
    assert res.status_code == 200
    by_action = {doc["action"]: doc for doc in db.care_logs.docs}
    assert len(db.care_logs.docs) == 2
    assert "soil_outcome" not in by_action["water"]
    assert by_action["soil_check"]["soil_outcome"] == "dry"
    assert by_action["soil_check"]["notes"] == "Looked fine"
    assert db.plants.docs[0].get("last_watered_at")


def test_other_care_logs_get_no_soil_coaching(make_client):
    _, client = make_client()
    res = client.post("/api/plants/p1/care-logs", json={"actions": ["water"]})
    assert res.status_code == 200
    assert "soil_coaching" not in res.json()["_meta"]


def test_bulk_endpoint_refuses_soil_checks(make_client):
    _, client = make_client()
    res = client.post("/api/care-logs/bulk", json={"plant_ids": ["p1"], "actions": ["soil_check"]})
    assert res.status_code == 400
    assert "one plant at a time" in res.text


# ---------- quiz and lessons ----------

def test_queue_defaults_to_the_rebirth_track(make_client):
    _, client = make_client()
    body = client.get("/api/lessons/queue").json()
    assert body["primary_track"] == "rebirth"
    assert body["queue"] == ["soil-finger-test", "plant-parent-reset"]
    assert body["has_plant"] is True
    assert len(body["library"]) == 6


def test_quiz_picks_a_track_and_stores_only_known_answers(make_client):
    db, client = make_client()
    res = client.post("/api/users/me/quiz", json={"answers": ["forget", "nonsense"]})
    assert res.status_code == 200
    assert res.json()["primary_track"] == "steady_sprout"
    assert res.json()["queue"] == ["habit-stacking", "soil-finger-test"]
    user = db.users.docs[0]
    assert user["quiz_answers"] == ["forget"]
    assert user["quiz_completed_at"]


@pytest.mark.parametrize("body", [{"answers": []}, {}])
def test_skipped_or_empty_quiz_falls_back_to_rebirth(make_client, body):
    _, client = make_client()
    res = client.post("/api/users/me/quiz", json=body)
    assert res.status_code == 200
    assert res.json()["primary_track"] == "rebirth"


def test_completing_an_unknown_lesson_is_a_404(make_client):
    _, client = make_client()
    assert client.post("/api/lessons/not-a-lesson/complete").status_code == 404


def test_completing_a_lesson_twice_stores_it_once(make_client):
    db, client = make_client()
    client.post("/api/users/me/quiz", json={"answers": ["gifted_no_instructions"]})
    first = client.post("/api/lessons/plant-er/complete")
    second = client.post("/api/lessons/plant-er/complete")
    assert first.status_code == second.status_code == 200
    assert second.json()["completed"] == ["plant-er"]
    assert second.json()["queue"] == ["soil-finger-test"]
    assert db.users.docs[0]["tutorials_seen"] == ["lesson:plant-er"]


def test_the_soil_lesson_completes_when_the_user_has_a_plant(make_client):
    _, client = make_client()
    res = client.post("/api/lessons/soil-finger-test/complete")
    assert res.status_code == 200
    assert "soil-finger-test" in res.json()["completed"]


def test_the_soil_lesson_cannot_complete_without_a_plant(make_client):
    db, client = make_client(with_plant=False)
    res = client.post("/api/lessons/soil-finger-test/complete")
    assert res.status_code == 409
    assert db.users.docs[0]["tutorials_seen"] == []
    queue = client.get("/api/lessons/queue").json()
    assert queue["has_plant"] is False
    assert "soil-finger-test" in queue["queue"]


def test_other_lessons_complete_without_a_plant(make_client):
    _, client = make_client(with_plant=False)
    assert client.post("/api/lessons/plant-er/complete").status_code == 200


# ---------- the light lessons ----------

def test_the_queue_suggests_part_two_after_part_one(make_client):
    db, client = make_client()
    assert client.get("/api/lessons/queue").json()["up_next"] is None
    db.users.docs[0]["tutorials_seen"] = ["lesson:light-basics"]
    assert client.get("/api/lessons/queue").json()["up_next"] == "window-map"
    db.users.docs[0]["tutorials_seen"] = ["lesson:light-basics", "lesson:window-map"]
    assert client.get("/api/lessons/queue").json()["up_next"] is None


def test_the_queue_credits_the_old_lesson_without_writing(make_client):
    db, client = make_client()
    db.users.docs[0]["tutorials_seen"] = ["lesson:window-blueprint"]
    body = client.get("/api/lessons/queue").json()
    assert "light-basics" in body["completed"]
    assert body["up_next"] == "window-map"
    assert db.users.docs[0]["tutorials_seen"] == ["lesson:window-blueprint"]


def test_the_queue_returns_saved_progress(make_client):
    db, client = make_client()
    assert client.get("/api/lessons/queue").json()["progress"] == {}
    db.users.docs[0]["lesson_progress"] = {"window-map": 2}
    assert client.get("/api/lessons/queue").json()["progress"] == {"window-map": 2}


def test_the_retired_lesson_cannot_be_completed(make_client):
    _, client = make_client()
    assert client.post("/api/lessons/window-blueprint/complete").status_code == 404


def test_the_new_lessons_can_be_completed_with_a_time_stamp(make_client):
    db, client = make_client()
    assert client.post("/api/lessons/light-basics/complete").status_code == 200
    user = db.users.docs[0]
    assert "lesson:light-basics" in user["tutorials_seen"]
    # This file's small fake keeps a dotted path as a plain key.
    assert "lesson_completed_at.light-basics" in user
