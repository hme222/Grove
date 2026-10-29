"""Password reset: the same answer for every address, a link that works once, and a new password that logs in."""
import os
from datetime import datetime, timedelta, timezone

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
import auth_flow  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


class FakeCollection:
    def __init__(self):
        self.docs = []

    def _match(self, flt):
        return [d for d in self.docs if all(d.get(k) == v for k, v in flt.items())]

    async def find_one(self, flt, projection=None):
        found = self._match(flt)
        return found[0] if found else None

    async def insert_one(self, doc):
        self.docs.append(doc)

    async def update_one(self, flt, update):
        for d in self._match(flt)[:1]:
            d.update(update.get("$set", {}))

    async def update_many(self, flt, update):
        for d in self._match(flt):
            d.update(update.get("$set", {}))


class FakeDb:
    def __init__(self):
        self.users = FakeCollection()
        self.password_reset_tokens = FakeCollection()


@pytest.fixture
def setup(monkeypatch):
    db = FakeDb()
    db.users.docs.append({"id": "u1", "email": "a@b.co", "password_hash": server.hash_password("oldpass1")})
    monkeypatch.setattr(server, "db", db)
    sent = []
    monkeypatch.setattr(auth_flow, "send_password_reset_email", lambda to, link: sent.append((to, link)) or "sent")
    return db, sent, TestClient(server.app)


def token_from(sent):
    return sent[-1][1].split("token=")[1]


def test_an_unknown_address_gets_the_same_answer_and_no_email(setup):
    db, sent, api = setup
    known = api.post("/api/auth/password/forgot", json={"email": "a@b.co"})
    unknown = api.post("/api/auth/password/forgot", json={"email": "nobody@b.co"})
    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json() == {"sent": True}
    assert len(sent) == 1 and sent[0][0] == "a@b.co"


def test_a_second_request_within_a_minute_sends_nothing_more(setup):
    db, sent, api = setup
    api.post("/api/auth/password/forgot", json={"email": "a@b.co"})
    api.post("/api/auth/password/forgot", json={"email": "a@b.co"})
    assert len(sent) == 1


def test_the_link_sets_a_new_password_once(setup):
    db, sent, api = setup
    api.post("/api/auth/password/forgot", json={"email": "a@b.co"})
    token = token_from(sent)
    ok = api.post("/api/auth/password/reset", json={"token": token, "password": "newpass1"})
    assert ok.status_code == 200
    assert server.verify_password("newpass1", db.users.docs[0]["password_hash"])
    again = api.post("/api/auth/password/reset", json={"token": token, "password": "another1"})
    assert again.status_code == 400
    assert server.verify_password("newpass1", db.users.docs[0]["password_hash"])


def test_a_wrong_or_expired_link_is_refused(setup):
    db, sent, api = setup
    assert api.post("/api/auth/password/reset", json={"token": "nope", "password": "newpass1"}).status_code == 400
    api.post("/api/auth/password/forgot", json={"email": "a@b.co"})
    db.password_reset_tokens.docs[0]["expires_at"] = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    assert api.post("/api/auth/password/reset", json={"token": token_from(sent), "password": "newpass1"}).status_code == 400
    assert server.verify_password("oldpass1", db.users.docs[0]["password_hash"])


def test_the_new_password_has_to_be_usable(setup):
    db, sent, api = setup
    api.post("/api/auth/password/forgot", json={"email": "a@b.co"})
    assert api.post("/api/auth/password/reset", json={"token": token_from(sent), "password": "1"}).status_code == 422


def test_the_reset_link_points_at_the_reset_page():
    assert auth_flow.reset_link("abc").endswith("/reset-password?token=abc")
