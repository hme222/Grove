"""Endpoint tests for the light routes, run against an in-memory stand-in for the database."""
import os

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402

from fakes import FakeDb  # noqa: E402


@pytest.fixture
def make_client(monkeypatch):
    def build():
        db = FakeDb()
        db.users.docs.append({"id": "u1", "email": "a@b.c", "tutorials_seen": []})
        db.users.docs.append({"id": "u2", "email": "x@y.z", "tutorials_seen": []})
        monkeypatch.setattr(server, "db", db)
        server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
        return db, TestClient(server.app)

    yield build
    server.app.dependency_overrides.pop(server.get_current_user, None)


@pytest.mark.parametrize("body", [
    {}, {"sun": "noon"}, {"direction": "UP"}, {"sun": "midday", "view": "pond"}, {"sun": "midday", "hemisphere": "east"},
])
def test_window_endpoint_rejects_bad_values(make_client, body):
    db, client = make_client()
    assert client.post("/api/users/me/window", json=body).status_code == 422
    assert "window_sun" not in db.users.docs[0]


def test_window_endpoint_returns_the_summary(make_client):
    db, client = make_client()
    res = client.post("/api/users/me/window", json={"sun": "afternoon", "view": "tree"})
    assert res.status_code == 200
    body = res.json()
    assert body["direction"] == "W" and body["view"] == "tree" and body["lamp"] is False
    assert db.users.docs[0]["window_sun"] == "afternoon"


def test_reading_endpoint_rejects_bad_values_and_saves_good_ones(make_client):
    db, client = make_client()
    assert client.post("/api/users/me/light-reading", json={"reading": "blurry"}).status_code == 422
    assert client.post("/api/users/me/light-reading", json={"reading": "faint"}).json() == {"light_reading": "faint"}


def test_progress_endpoint_404_and_422(make_client):
    _, client = make_client()
    assert client.post("/api/lessons/nope/progress", json={"card": 1}).status_code == 404
    assert client.post("/api/lessons/window-blueprint/progress", json={"card": 1}).status_code == 404
    assert client.post("/api/lessons/window-map/progress", json={"card": -1}).status_code == 422
    assert client.post("/api/lessons/window-map/progress", json={"card": 2}).json() == {"lesson_progress": {"window-map": 2}}


def test_prompt_endpoint(make_client):
    _, client = make_client()
    assert client.post("/api/users/me/light-prompt", json={"action": "later"}).json()["light_prompt_pending"] is True
    assert client.post("/api/users/me/light-prompt", json={"action": "snooze"}).status_code == 422


def test_guide_endpoint_has_sixteen_items(make_client):
    _, client = make_client()
    body = client.get("/api/light/guide?hemisphere=south&view=tree").json()
    assert len(body["items"]) == 16 and body["hemisphere"] == "south" and body["view"] == "tree"
    assert client.get("/api/light/guide?hemisphere=east").status_code == 422


def test_fits_endpoint_without_a_window(make_client):
    _, client = make_client()
    assert client.get("/api/light/fits").json()["has_window"] is False


def test_the_endpoints_only_touch_the_signed_in_user(make_client):
    db, client = make_client()
    client.post("/api/users/me/window", json={"sun": "midday"})
    client.post("/api/users/me/light-reading", json={"reading": "crisp"})
    client.post("/api/lessons/window-map/progress", json={"card": 1})
    client.post("/api/users/me/light-prompt", json={"action": "later"})
    other = db.users.docs[1]
    assert set(other) == {"id", "email", "tutorials_seen"}
