"""Undo on Water All removes the round's logs and puts each plant's schedule back."""
import os
from datetime import datetime, timedelta, timezone

import pytest

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


class _Cursor:
    def __init__(self, docs):
        self.docs = docs

    async def to_list(self, _n):
        return list(self.docs)


class FakeCollection:
    def __init__(self):
        self.docs = []

    def find(self, flt, projection=None):
        return _Cursor([d for d in self.docs if _matches(d, flt)])

    async def find_one(self, flt, projection=None):
        return next((d for d in self.docs if _matches(d, flt)), None)

    async def insert_one(self, doc):
        self.docs.append(doc)

    async def update_one(self, flt, update):
        doc = await self.find_one(flt)
        if doc is not None:
            doc.update(update.get("$set", {}))

    async def delete_one(self, flt):
        doc = await self.find_one(flt)
        if doc is not None:
            self.docs.remove(doc)


class FakeDb:
    def __init__(self):
        for name in ("users", "plants", "care_logs", "water_rounds"):
            setattr(self, name, FakeCollection())


async def _noop(*args, **kwargs):
    return None


def _iso(days_ago):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


@pytest.fixture
def setup(monkeypatch):
    db = FakeDb()
    db.users.docs.append({"id": "u1", "first_care_celebrated": True})
    db.plants.docs += [
        {"id": "due", "user_id": "u1", "watering_frequency_days": 7, "last_watered_at": _iso(10), "next_water_due": _iso(3)},
        {"id": "fine", "user_id": "u1", "watering_frequency_days": 7, "last_watered_at": _iso(1), "next_water_due": _iso(-6)},
    ]
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(server.missions_mod, "on_care_log", _noop)
    server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
    yield db, TestClient(server.app)
    server.app.dependency_overrides.pop(server.get_current_user, None)


def test_round_returns_an_id_and_undo_restores_everything(setup):
    db, client = setup
    before = dict(db.plants.docs[0])
    res = client.post("/api/plants/water-round/log").json()
    assert res["watered"] == 1 and res["round_id"]
    assert len(db.care_logs.docs) == 1

    undo = client.post(f"/api/plants/water-round/{res['round_id']}/undo")
    assert undo.status_code == 200 and undo.json() == {"undone": 1}
    assert db.care_logs.docs == []
    plant = db.plants.docs[0]
    assert plant["last_watered_at"] == before["last_watered_at"]
    assert plant["next_water_due"] == before["next_water_due"]


def test_undo_twice_is_a_409(setup):
    _, client = setup
    rid = client.post("/api/plants/water-round/log").json()["round_id"]
    client.post(f"/api/plants/water-round/{rid}/undo")
    assert client.post(f"/api/plants/water-round/{rid}/undo").status_code == 409


def test_undo_after_the_window_is_a_410(setup):
    db, client = setup
    rid = client.post("/api/plants/water-round/log").json()["round_id"]
    db.water_rounds.docs[0]["logged_at"] = _iso(1)
    assert client.post(f"/api/plants/water-round/{rid}/undo").status_code == 410


def test_someone_elses_round_is_a_404(setup):
    db, client = setup
    rid = client.post("/api/plants/water-round/log").json()["round_id"]
    db.water_rounds.docs[0]["user_id"] = "u2"
    assert client.post(f"/api/plants/water-round/{rid}/undo").status_code == 404


def test_a_newer_log_keeps_its_schedule(setup):
    db, client = setup
    rid = client.post("/api/plants/water-round/log").json()["round_id"]
    newer = _iso(0)
    db.plants.docs[0]["last_watered_at"] = newer  # logged again after the round
    client.post(f"/api/plants/water-round/{rid}/undo")
    assert db.plants.docs[0]["last_watered_at"] == newer
    assert db.care_logs.docs == []


def test_nothing_due_means_no_round(setup):
    db, client = setup
    db.plants.docs.pop(0)
    res = client.post("/api/plants/water-round/log").json()
    assert res == {"watered": 0, "first_care_pending": False, "round_id": None}
    assert db.water_rounds.docs == []
