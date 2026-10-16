"""Care tips Simple/Detailed is a saved profile preference with two allowed values."""
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


@pytest.mark.parametrize("mode", ["simple", "detailed"])
def test_care_text_detail_is_saved(client, mode):
    db, c = client
    res = c.patch("/api/users/me", json={"care_text_detail": mode})
    assert res.status_code == 200
    assert res.json()["care_text_detail"] == mode
    assert db.users.doc["care_text_detail"] == mode


def test_unknown_care_text_detail_is_rejected(client):
    db, c = client
    res = c.patch("/api/users/me", json={"care_text_detail": "verbose"})
    assert res.status_code == 422
    assert "care_text_detail" not in db.users.doc
