"""Public waitlist: joins once per email, never reveals who is already on the list."""
import os

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402


class FakeCollection:
    def __init__(self):
        self.docs = []

    async def find_one(self, flt, projection=None):
        return next((d for d in self.docs if all(d.get(k) == v for k, v in flt.items())), None)

    async def insert_one(self, doc):
        self.docs.append(doc)

    async def update_one(self, flt, update):
        doc = await self.find_one(flt)
        if doc is not None:
            doc.update(update.get("$set", {}))


class FakeDb:
    def __init__(self):
        self.waitlist = FakeCollection()


@pytest.fixture
def setup(monkeypatch):
    db = FakeDb()
    monkeypatch.setattr(server, "db", db)
    yield db, TestClient(server.app)


def test_join_stores_a_normalised_email_and_returns_a_token(setup):
    db, client = setup
    res = client.post("/api/waitlist", json={"email": "  Maya@Example.com "})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok" and body["token"]
    assert len(db.waitlist.docs) == 1
    assert db.waitlist.docs[0]["email"] == "maya@example.com"
    assert db.waitlist.docs[0]["beta"] is False


def test_joining_twice_looks_the_same_but_stores_once_and_gives_no_token(setup):
    db, client = setup
    client.post("/api/waitlist", json={"email": "maya@example.com"})
    again = client.post("/api/waitlist", json={"email": "MAYA@example.com"})
    assert again.status_code == 200
    assert again.json() == {"status": "ok", "token": None}
    assert len(db.waitlist.docs) == 1


def test_invalid_email_is_rejected(setup):
    db, client = setup
    assert client.post("/api/waitlist", json={"email": "not-an-email"}).status_code == 422
    assert db.waitlist.docs == []


def test_beta_opt_in_needs_the_token(setup):
    db, client = setup
    token = client.post("/api/waitlist", json={"email": "sam@example.com"}).json()["token"]
    assert client.patch("/api/waitlist/beta", json={"token": token, "beta": True}).json() == {"beta": True}
    assert db.waitlist.docs[0]["beta"] is True
    assert client.patch("/api/waitlist/beta", json={"token": token, "beta": False}).json() == {"beta": False}
    assert db.waitlist.docs[0]["beta"] is False


def test_beta_with_an_unknown_token_is_a_404(setup):
    _, client = setup
    res = client.patch("/api/waitlist/beta", json={"token": "x" * 22, "beta": True})
    assert res.status_code == 404
