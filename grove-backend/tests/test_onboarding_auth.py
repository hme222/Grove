"""First-run onboarding on the server: email confirmation, Apple/Google sign-in, hemisphere, plan quiz.

Runs the real FastAPI app against an in-memory stand-in for the database; no MongoDB, no network,
no email is sent. The flags are environment variables, so each test sets what it needs.
"""
import logging
import os
from datetime import datetime, timedelta, timezone

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402

import auth_flow  # noqa: E402
import hardiness_zones  # noqa: E402

FLAGS = ("EMAIL_VERIFICATION_ENABLED", "SSO_GOOGLE_ENABLED", "SSO_APPLE_ENABLED", "GOOGLE_CLIENT_ID",
         "APPLE_CLIENT_ID", "APPLE_REDIRECT_URI", "EMAIL_SMTP_HOST", "APP_ENV")


def _matches(doc, flt):
    for key, value in flt.items():
        if key == "$or":
            if not any(_matches(doc, sub) for sub in value):
                return False
        elif isinstance(value, dict) and "$ne" in value:
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
        return next((d for d in self.docs if _matches(d, flt)), None)

    async def count_documents(self, flt):
        return sum(1 for d in self.docs if _matches(d, flt))

    async def update_one(self, flt, update):
        doc = await self.find_one(flt)
        if doc is None:
            return
        doc.update(update.get("$set", {}))
        for key, value in update.get("$addToSet", {}).items():
            items = doc.setdefault(key, [])
            if value not in items:
                items.append(value)


class FakeDb:
    def __init__(self):
        for name in ("users", "streaks", "user_unlocks", "email_tokens", "plants"):
            setattr(self, name, FakeCollection())


@pytest.fixture
def env(monkeypatch):
    for name in FLAGS:
        monkeypatch.delenv(name, raising=False)
    return monkeypatch


@pytest.fixture
def api(env):
    db = FakeDb()
    env.setattr(server, "db", db)
    sent = []

    def fake_send(to, link):
        sent.append((to, link))
        return "logged"

    env.setattr(auth_flow, "send_confirmation_email", fake_send)
    client = TestClient(server.app)
    client.db = db
    client.sent = sent
    yield client
    server.app.dependency_overrides.pop(server.get_current_user, None)


def sign_in_as(user_id, email="a@b.c"):
    server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": user_id, "email": email}


def register(api, email="maya.r88@gmail.com", **extra):
    res = api.post("/api/auth/register", json={"email": email, "password": "secret1", **extra})
    assert res.status_code == 200, res.text
    return res.json()


def token_from(link):
    return link.split("token=")[1]


# ---------------- flags off: the app behaves as before ----------------

def test_flags_default_off_and_the_config_says_so(api):
    cfg = api.get("/api/auth/config").json()
    assert cfg["email_verification"] is False
    assert cfg["sso"]["google"]["enabled"] is False
    assert cfg["sso"]["apple"]["enabled"] is False


def test_with_flags_off_signup_sends_nothing_stores_no_token_and_adds_no_flag(api):
    out = register(api)
    assert api.sent == []
    assert api.db.email_tokens.docs == []
    assert "email_confirmed" not in out["user"]
    assert out["access_token"]


def test_with_flags_off_the_new_routes_are_not_there(api):
    sign_in_as("u1")
    assert api.post("/api/auth/email/send").status_code == 404
    assert api.post("/api/auth/email/confirm", json={"token": "x"}).status_code == 404
    assert api.post("/api/auth/email/change", json={"email": "n@e.w"}).status_code == 404
    assert api.post("/api/auth/sso/google", json={"id_token": "x"}).status_code == 404
    assert api.post("/api/auth/sso/apple", json={"id_token": "x"}).status_code == 404


def test_sso_stays_off_when_the_switch_is_on_but_the_credentials_are_missing(api, env):
    env.setenv("SSO_GOOGLE_ENABLED", "1")
    env.setenv("SSO_APPLE_ENABLED", "1")
    cfg = api.get("/api/auth/config").json()
    assert cfg["sso"]["google"]["enabled"] is False
    assert cfg["sso"]["apple"]["enabled"] is False
    assert api.post("/api/auth/sso/google", json={"id_token": "x"}).status_code == 404


def test_signup_with_a_username_still_works_as_it_did(api):
    out = register(api, username="plantlover", display_name="Pat")
    assert out["user"]["username"] == "plantlover"
    assert out["user"]["display_name"] == "Pat"


def test_signup_without_a_username_makes_one_from_the_email_and_a_first_name(api):
    out = register(api, email="maya.r88@gmail.com")
    assert out["user"]["username"] == "maya.r88"
    assert out["user"]["display_name"] == "Maya"


def test_a_taken_username_gets_digits_added(api):
    register(api, email="maya@one.com")
    out = register(api, email="maya@two.com")
    assert out["user"]["username"] != "maya"
    assert out["user"]["username"].startswith("maya")


def test_duplicate_email_is_still_refused(api):
    register(api, email="dup@x.com")
    res = api.post("/api/auth/register", json={"email": "dup@x.com", "password": "secret1"})
    assert res.status_code == 400
    assert res.json()["detail"] == "Email already registered"


# ---------------- email confirmation on ----------------

@pytest.fixture
def verifying(api, env):
    env.setenv("EMAIL_VERIFICATION_ENABLED", "true")
    return api


def test_signup_with_verification_on_sends_one_link_and_stores_only_a_hash(verifying):
    out = register(verifying)
    assert out["user"]["email_confirmed"] is False
    assert len(verifying.sent) == 1
    to, link = verifying.sent[0]
    assert to == "maya.r88@gmail.com"
    assert "/confirm-email?token=" in link
    stored = verifying.db.email_tokens.docs[0]
    assert token_from(link) not in str(stored)
    assert stored["token_hash"] == auth_flow.hash_token(token_from(link))


def test_the_link_confirms_once_and_only_once(verifying):
    register(verifying)
    raw = token_from(verifying.sent[0][1])
    ok = verifying.post("/api/auth/email/confirm", json={"token": raw})
    assert ok.status_code == 200 and ok.json()["confirmed"] is True
    assert verifying.db.users.docs[0]["email_confirmed"] is True
    again = verifying.post("/api/auth/email/confirm", json={"token": raw})
    assert again.status_code == 400
    assert "expired or was already used" in again.json()["detail"]


def test_a_wrong_or_empty_token_is_refused(verifying):
    register(verifying)
    assert verifying.post("/api/auth/email/confirm", json={"token": "nope"}).status_code == 400
    assert verifying.post("/api/auth/email/confirm", json={"token": ""}).status_code == 400
    assert verifying.db.users.docs[0]["email_confirmed"] is False


def test_an_expired_link_does_not_confirm(verifying):
    register(verifying)
    raw = token_from(verifying.sent[0][1])
    verifying.db.email_tokens.docs[0]["expires_at"] = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
    assert verifying.post("/api/auth/email/confirm", json={"token": raw}).status_code == 400
    assert verifying.db.users.docs[0]["email_confirmed"] is False


def test_resend_is_rate_limited_then_allowed(verifying):
    out = register(verifying)
    sign_in_as(out["user"]["id"])
    first = verifying.post("/api/auth/email/send")
    assert first.status_code == 429
    assert "seconds" in first.json()["detail"]
    verifying.db.users.docs[0]["email_confirmation_sent_at"] = (datetime.now(timezone.utc) - timedelta(seconds=61)).isoformat()
    assert verifying.post("/api/auth/email/send").json() == {"sent": True}
    assert len(verifying.sent) == 2


def test_resend_for_a_confirmed_account_sends_nothing(verifying):
    out = register(verifying)
    verifying.post("/api/auth/email/confirm", json={"token": token_from(verifying.sent[0][1])})
    sign_in_as(out["user"]["id"])
    res = verifying.post("/api/auth/email/send")
    assert res.json() == {"sent": False, "already_confirmed": True}
    assert len(verifying.sent) == 1


def test_changing_the_email_kills_the_old_link_and_sends_a_new_one(verifying):
    out = register(verifying)
    old = token_from(verifying.sent[0][1])
    sign_in_as(out["user"]["id"])
    res = verifying.post("/api/auth/email/change", json={"email": "maya@new.com"})
    assert res.status_code == 200
    assert verifying.sent[1][0] == "maya@new.com"
    assert verifying.post("/api/auth/email/confirm", json={"token": old}).status_code == 400
    new = token_from(verifying.sent[1][1])
    assert verifying.post("/api/auth/email/confirm", json={"token": new}).status_code == 200
    assert verifying.db.users.docs[0]["email"] == "maya@new.com"


def test_changing_to_an_email_someone_has_is_refused(verifying):
    register(verifying, email="taken@x.com")
    out = register(verifying, email="me@x.com")
    sign_in_as(out["user"]["id"])
    res = verifying.post("/api/auth/email/change", json={"email": "taken@x.com"})
    assert res.status_code == 400
    assert res.json()["detail"] == "That email is already registered"


def test_a_sender_that_fails_does_not_block_signup(api, env):
    env.setenv("EMAIL_VERIFICATION_ENABLED", "1")

    def boom(to, link):
        raise RuntimeError("smtp down")

    env.setattr(auth_flow, "send_confirmation_email", boom)
    out = register(api)
    assert out["access_token"]
    assert out["user"]["email_confirmed"] is False


def test_no_sender_in_dev_logs_the_link(env, caplog):
    env.setenv("EMAIL_VERIFICATION_ENABLED", "1")
    caplog.set_level(logging.WARNING)
    result = auth_flow.send_confirmation_email("a@b.c", "http://localhost:3000/confirm-email?token=abc")
    assert result == "logged"
    assert "confirm-email?token=abc" in caplog.text


def test_no_sender_in_production_raises_and_logs_no_link(env, caplog):
    env.setenv("APP_ENV", "production")
    caplog.set_level(logging.WARNING)
    with pytest.raises(RuntimeError):
        auth_flow.send_confirmation_email("a@b.c", "http://x/confirm-email?token=secret")
    assert "secret" not in caplog.text


def test_seconds_until_resend_counts_down():
    now = datetime.now(timezone.utc)
    assert auth_flow.seconds_until_resend(None) == 0
    assert auth_flow.seconds_until_resend((now - timedelta(seconds=10)).isoformat(), now) == 50
    assert auth_flow.seconds_until_resend((now - timedelta(seconds=90)).isoformat(), now) == 0


# ---------------- Apple and Google ----------------

@pytest.fixture
def sso(api, env):
    env.setenv("SSO_GOOGLE_ENABLED", "1")
    env.setenv("GOOGLE_CLIENT_ID", "client-123.apps.googleusercontent.com")
    env.setenv("SSO_APPLE_ENABLED", "1")
    env.setenv("APPLE_CLIENT_ID", "com.example.services")
    env.setenv("APPLE_REDIRECT_URI", "https://example.com/apple")
    claims = {"sub": "g-1", "email": "ana@gmail.com", "email_verified": True, "name": "Ana Lopez"}
    env.setattr(server.sso_mod, "verify_id_token", lambda provider, token: dict(claims))
    api.claims = claims
    return api


def test_config_shows_a_provider_only_when_switch_and_credentials_are_both_set(sso):
    cfg = sso.get("/api/auth/config").json()
    assert cfg["sso"]["google"] == {"enabled": True, "client_id": "client-123.apps.googleusercontent.com"}
    assert cfg["sso"]["apple"]["enabled"] is True
    assert cfg["sso"]["apple"]["redirect_uri"] == "https://example.com/apple"
    assert "secret" not in str(cfg).lower()


def test_google_sign_in_makes_a_confirmed_account_without_a_password_or_email(sso):
    res = sso.post("/api/auth/sso/google", json={"id_token": "t"})
    assert res.status_code == 200
    body = res.json()
    assert body["is_new"] is True
    assert body["user"]["email"] == "ana@gmail.com"
    assert body["user"]["email_confirmed"] is True
    assert body["user"]["display_name"] == "Ana Lopez"
    assert "password_hash" not in body["user"]
    assert sso.sent == []
    assert body["access_token"] and body["refresh_token"]


def test_signing_in_again_finds_the_same_account(sso):
    first = sso.post("/api/auth/sso/google", json={"id_token": "t"}).json()
    second = sso.post("/api/auth/sso/google", json={"id_token": "t"}).json()
    assert second["is_new"] is False
    assert second["user"]["id"] == first["user"]["id"]
    assert len(sso.db.users.docs) == 1


def test_a_verified_email_links_to_the_account_that_already_has_it(sso):
    existing = register(sso, email="ana@gmail.com")
    res = sso.post("/api/auth/sso/google", json={"id_token": "t"}).json()
    assert res["is_new"] is False
    assert res["user"]["id"] == existing["user"]["id"]


def test_an_unverified_provider_email_is_not_linked_or_used(sso):
    register(sso, email="ana@gmail.com")
    sso.claims["email_verified"] = False
    sso.claims["sub"] = "g-2"
    res = sso.post("/api/auth/sso/google", json={"id_token": "t"})
    assert res.status_code == 400
    assert len(sso.db.users.docs) == 1


def test_a_token_that_does_not_check_out_is_a_401(sso, env):
    def bad(provider, token):
        raise server.sso_mod.SSOError("We couldn't check that sign-in.")

    env.setattr(server.sso_mod, "verify_id_token", bad)
    res = sso.post("/api/auth/sso/google", json={"id_token": "t"})
    assert res.status_code == 401
    assert sso.db.users.docs == []


def test_apple_uses_the_name_the_screen_passes_on_first_sign_in(sso):
    sso.claims.update({"sub": "a-1", "email": "bo@icloud.com", "name": None})
    res = sso.post("/api/auth/sso/apple", json={"id_token": "t", "name": "Bo Chen"}).json()
    assert res["user"]["display_name"] == "Bo Chen"


def test_sso_verify_refuses_when_the_client_id_is_missing(env):
    import sso as sso_module
    with pytest.raises(sso_module.SSOError):
        sso_module.verify_id_token("google", "anything")
    with pytest.raises(sso_module.SSOError):
        sso_module.verify_id_token("facebook", "anything")


# ---------------- hemisphere and zip ----------------

@pytest.fixture
def profile(api):
    api.db.users.docs.append({"id": "u1", "email": "a@b.c"})
    sign_in_as("u1")
    return api


def test_a_us_zip_sets_the_zone_and_the_northern_hemisphere(profile):
    res = profile.patch("/api/users/me", json={"location_country": "US", "location_postcode": "10019"})
    body = res.json()
    assert body["hardiness_zone"] == "7b"
    assert body["hemisphere"] == "north"


def test_a_choice_of_hemisphere_alone_is_stored_with_no_zip(profile):
    body = profile.patch("/api/users/me", json={"hemisphere": "south"}).json()
    assert body["hemisphere"] == "south"
    assert "hardiness_zone" not in body


def test_an_explicit_hemisphere_beats_the_one_a_zip_would_give(profile):
    body = profile.patch("/api/users/me", json={"location_country": "US", "location_postcode": "10019", "hemisphere": "south"}).json()
    assert body["hemisphere"] == "south"


def test_a_zip_that_does_not_exist_stores_nothing_extra(profile):
    body = profile.patch("/api/users/me", json={"location_country": "US", "location_postcode": "00000"}).json()
    assert "hemisphere" not in body
    assert "hardiness_zone" not in body


def test_only_north_or_south_is_accepted(profile):
    assert profile.patch("/api/users/me", json={"hemisphere": "east"}).status_code == 422


def test_a_non_us_postcode_gives_no_zone_and_no_hemisphere(profile):
    body = profile.patch("/api/users/me", json={"location_country": "AU", "location_postcode": "2000"}).json()
    assert "hemisphere" not in body and "hardiness_zone" not in body


def test_the_zone_lookup_reports_hemisphere_and_unknown_zips(api):
    found = api.get("/api/zones/lookup", params={"country": "US", "postcode": "10019"}).json()
    assert (found["zone"], found["hemisphere"]) == ("7b", "north")
    missing = api.get("/api/zones/lookup", params={"country": "US", "postcode": "00000"}).json()
    assert (missing["zone"], missing["hemisphere"]) == (None, None)
    abroad = api.get("/api/zones/lookup", params={"country": "FR", "postcode": "75001"}).json()
    assert (abroad["zone"], abroad["hemisphere"]) == (None, None)


@pytest.mark.parametrize("zip_code,ok", [("10019", True), ("10019-1234", True), ("1001", False), ("abcde", False), ("00000", False), ("00501", True), ("", False)])
def test_is_us_zip(zip_code, ok):
    assert hardiness_zones.is_us_zip(zip_code) is ok


def test_zone_descriptions_for_the_coldest_zones_are_the_published_ranges():
    d = hardiness_zones.USDA_DESCRIPTIONS
    assert d["3a"] == "-40 to -35°F" and d["3b"] == "-35 to -30°F" and d["4a"] == "-30 to -25°F"
    assert d["7b"] == "5 to 10°F"


# ---------------- plan quiz through the endpoint ----------------

def test_plan_answers_set_the_track_and_return_what_matched(profile):
    res = profile.post("/api/users/me/quiz", json={"plan_answers": {"q1": "gift", "q3": "save_gift", "q4": "know_basics"}})
    body = res.json()
    assert body["primary_track"] == "rescue"
    assert body["queue"][0] == "plant-er"
    assert body["matched"] == [{"question": "q1", "answer": "gift"}, {"question": "q3", "answer": "save_gift"}]
    assert profile.db.users.docs[0]["quiz_plan_answers"]["q4"] == "know_basics"


def test_skipping_every_question_still_finishes_with_the_default_track(profile):
    body = profile.post("/api/users/me/quiz", json={"plan_answers": {}}).json()
    assert body["primary_track"] == "rebirth"
    assert body["matched"] == []
    assert profile.db.users.docs[0]["primary_track"] == "rebirth"


def test_the_old_one_screen_quiz_body_still_works(profile):
    body = profile.post("/api/users/me/quiz", json={"answers": ["forget"]}).json()
    assert body["primary_track"] == "steady_sprout"
    assert "matched" not in body
