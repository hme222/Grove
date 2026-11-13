"""Pip is on for everyone by default. Two saved switches turn him off: Pip everywhere, and just the peeks."""
import os

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402


class _Users:
    def __init__(self):
        self.doc = {"id": "u1", "email": "a@b.c"}

    async def find_one(self, flt, projection=None):
        return self.doc if flt.get("id") == "u1" else None

    async def update_one(self, flt, update):
        self.doc.update(update.get("$set", {}))


class _Db:
    def __init__(self):
        self.users = _Users()


@pytest.fixture
def client(monkeypatch):
    db = _Db()
    monkeypatch.setattr(server, "db", db)
    server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
    yield db, TestClient(server.app)
    server.app.dependency_overrides.pop(server.get_current_user, None)


def test_pip_prefs_are_not_set_by_default(client):
    db, _ = client
    assert "pip_enabled" not in db.users.doc
    assert "pip_peeks_enabled" not in db.users.doc


def test_pip_prefs_can_be_turned_off_and_on(client):
    db, c = client
    res = c.patch("/api/users/me", json={"pip_enabled": False, "pip_peeks_enabled": False})
    assert res.status_code == 200
    assert res.json()["pip_enabled"] is False
    assert db.users.doc["pip_enabled"] is False
    assert db.users.doc["pip_peeks_enabled"] is False
    res = c.patch("/api/users/me", json={"pip_enabled": True})
    assert res.status_code == 200
    assert db.users.doc["pip_enabled"] is True
    assert db.users.doc["pip_peeks_enabled"] is False
