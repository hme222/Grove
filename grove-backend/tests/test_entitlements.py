"""Pro status, the 3 free photo IDs, the cost caps, and what the AI endpoints refuse before calling the model."""
import asyncio
import os
from datetime import datetime, timedelta, timezone

import pytest

import entitlements

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402

import experiments  # noqa: E402
from fakes import FakeDb  # noqa: E402

NOW = datetime(2026, 12, 2, 12, 0, tzinfo=timezone.utc)


def run(coro):
    return asyncio.run(coro)


# ---------- who is Pro ----------

def test_a_pro_tier_is_pro_and_a_free_one_is_not():
    assert entitlements.is_pro({"tier": "pro"}, NOW)
    assert entitlements.is_pro({"tier": "florist_pro"}, NOW)
    assert not entitlements.is_pro({"tier": "free"}, NOW)
    assert not entitlements.is_pro({}, NOW) and not entitlements.is_pro(None, NOW)


def test_a_grant_makes_an_account_pro_until_it_ends():
    future = (NOW + timedelta(days=30)).isoformat()
    past = (NOW - timedelta(seconds=1)).isoformat()
    assert entitlements.is_pro({"tier": "free", "pro_until": future}, NOW)
    assert not entitlements.is_pro({"tier": "free", "pro_until": past}, NOW)
    assert entitlements.is_pro({"pro_until": NOW + timedelta(days=1)}, NOW)  # a datetime works too
    assert entitlements.is_pro({"pro_until": "2027-01-31T23:59:59Z"}, NOW)  # a trailing Z works
    assert entitlements.is_pro({"pro_until": "2027-01-31T23:59:59"}, NOW)  # and no zone means UTC


def test_a_grant_that_is_not_a_date_gives_nothing():
    for bad in ("soon", "", None, 12345, {"a": 1}):
        assert not entitlements.is_pro({"pro_until": bad}, NOW)


def test_the_friends_and_family_comp_ends_after_jan_31():
    user = {"pro_until": "2027-01-31T23:59:59+00:00", "pro_source": "friends_family"}
    assert entitlements.is_pro(user, datetime(2027, 1, 31, 12, tzinfo=timezone.utc))
    assert not entitlements.is_pro(user, datetime(2027, 2, 1, 0, 0, 1, tzinfo=timezone.utc))


# ---------- the free ID allowance ----------

def test_the_allowance_is_three_unless_the_setting_says_otherwise(monkeypatch):
    monkeypatch.delenv("FREE_ID_ALLOWANCE", raising=False)
    assert entitlements.free_id_allowance() == 3
    monkeypatch.setenv("FREE_ID_ALLOWANCE", "5")
    assert entitlements.free_id_allowance() == 5
    monkeypatch.setenv("FREE_ID_ALLOWANCE", "banana")
    assert entitlements.free_id_allowance() == 3
    monkeypatch.setenv("FREE_ID_ALLOWANCE", "-2")
    assert entitlements.free_id_allowance() == 3


def test_ids_left_counts_down_and_never_goes_negative(monkeypatch):
    monkeypatch.delenv("FREE_ID_ALLOWANCE", raising=False)
    assert entitlements.free_ids_left({}) == 3
    assert entitlements.free_ids_left({"ai_usage": {"free_ids_used": 2}}) == 1
    assert entitlements.free_ids_left({"ai_usage": {"free_ids_used": 9}}) == 0
    assert entitlements.free_ids_left({"ai_usage": {"free_ids_used": "x"}}) == 3


def test_the_summary_says_what_the_app_needs(monkeypatch):
    monkeypatch.delenv("FREE_ID_ALLOWANCE", raising=False)
    free = entitlements.summary({"ai_usage": {"free_ids_used": 1}}, NOW)
    assert free["pro"] is False and free["pro_until"] is None
    assert free["free_ids"] == {"allowance": 3, "used": 1, "left": 2}
    comp = entitlements.summary({"pro_until": "2027-01-31T23:59:59+00:00", "pro_source": "friends_family"}, NOW)
    assert comp["pro"] is True and comp["pro_source"] == "friends_family" and comp["pro_until"].startswith("2027-01-31")
    expired = entitlements.summary({"pro_until": "2026-01-01T00:00:00+00:00", "pro_source": "friends_family"}, NOW)
    assert expired["pro"] is False and expired["pro_source"] is None


def test_what_a_refusal_says_never_leaves_the_person_stuck():
    for detail in (entitlements.free_limit_detail(), entitlements.cap_detail("fair_use_daily"), entitlements.cap_detail("fair_use_burst")):
        assert "searching for its name" in detail["message"]
    assert "symptom checker" in entitlements.pro_required_detail()["message"]
    assert "unlimited" not in str(entitlements.free_limit_detail()).lower()


# ---------- the cost caps ----------

def test_the_caps_trip_in_order_burst_then_daily_then_monthly(monkeypatch):
    monkeypatch.setenv("AI_BURST_PER_MINUTE", "2")
    monkeypatch.setenv("AI_DAILY_CAP", "5")
    monkeypatch.setenv("AI_MONTHLY_CAP", "8")
    db = FakeDb()
    assert run(entitlements.over_cap(db, "u1", NOW)) is None
    for minutes_ago in (0.2, 0.5):
        run(entitlements.record_call(db, "u1", "identify", NOW - timedelta(minutes=minutes_ago)))
    assert run(entitlements.over_cap(db, "u1", NOW)) == "fair_use_burst"
    assert run(entitlements.over_cap(db, "u1", NOW + timedelta(minutes=2))) is None  # a minute later it clears
    for hours_ago in (2, 3, 4):
        run(entitlements.record_call(db, "u1", "identify", NOW - timedelta(hours=hours_ago)))
    assert run(entitlements.over_cap(db, "u1", NOW + timedelta(minutes=2))) == "fair_use_daily"
    for days_ago in (3, 4, 5):
        run(entitlements.record_call(db, "u1", "identify", NOW - timedelta(days=days_ago)))
    assert run(entitlements.over_cap(db, "u1", NOW + timedelta(days=1, minutes=2))) == "fair_use_monthly"
    assert run(entitlements.over_cap(db, "someone-else", NOW)) is None  # one account's use is not another's


# ---------- the endpoints ----------

GOOD = '{"commonName": "Pothos", "latinName": "Epipremnum aureum", "confidence": 0.93, "isConfident": true, "wateringFrequencyDays": 7}'
UNSURE = '{"commonName": "Plant", "latinName": "", "confidence": 0.2, "isConfident": false}'


@pytest.fixture
def make_client(monkeypatch):
    def build(user=None, mode="off"):
        db = FakeDb()
        if user is not None:
            db.users.docs.append({"id": "u1", **user})
        monkeypatch.setattr(server, "db", db)
        monkeypatch.setenv("EXPERIMENT_HELP_DIAGNOSIS", mode)
        monkeypatch.setattr(experiments, "ai_ready", lambda: True)

        async def no_match(*a, **k):
            return None
        monkeypatch.setattr(server, "find_library_species", no_match)
        server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
        return db, TestClient(server.app)
    yield build
    server.app.dependency_overrides.pop(server.get_current_user, None)


def model(monkeypatch, *answers):
    calls = []
    queue = list(answers)

    async def fake(system, prompt, image):
        calls.append(prompt)
        answer = queue.pop(0) if len(queue) > 1 else queue[0]
        if isinstance(answer, Exception):
            raise answer
        return answer
    monkeypatch.setattr(server, "call_claude_vision", fake)
    return calls


def identify(client):
    return client.post("/api/plants/identify", json={"image_base64": "AAAA"})


def test_a_free_account_gets_three_ids_then_a_clear_refusal_and_no_model_call(make_client, monkeypatch):
    monkeypatch.delenv("FREE_ID_ALLOWANCE", raising=False)
    db, client = make_client({"tier": "free"})
    calls = model(monkeypatch, GOOD)
    lefts = [identify(client).json().get("freeIdsLeft") for _ in range(3)]
    assert lefts == [2, 1, 0]
    assert len(calls) == 3
    res = identify(client)
    assert res.status_code == 402
    assert res.json()["detail"]["code"] == "free_id_limit" and res.json()["detail"]["allowance"] == 3
    assert len(calls) == 3  # the fourth never reached the model
    assert db.users.docs[0]["ai_usage"]["free_ids_used"] == 3


def test_an_unsure_photo_or_a_model_failure_does_not_use_a_free_id(make_client, monkeypatch):
    db, client = make_client({"tier": "free"})
    model(monkeypatch, UNSURE)
    assert identify(client).json()["identified"] is False
    model(monkeypatch, RuntimeError("down"))
    assert identify(client).json()["error"] == "identification_failed"
    assert entitlements.free_ids_used(db.users.docs[0]) == 0
    assert [d["kind"] for d in db.ai_usage.docs] == ["identify"]  # the unsure photo cost a call; the failure did not


def test_a_pro_account_is_not_held_to_the_allowance_and_uses_none(make_client, monkeypatch):
    monkeypatch.setenv("FREE_ID_ALLOWANCE", "1")
    db, client = make_client({"tier": "pro", "ai_usage": {"free_ids_used": 99}})
    model(monkeypatch, GOOD)
    for _ in range(3):
        res = identify(client)
        assert res.status_code == 200 and "freeIdsLeft" not in res.json()
    assert db.users.docs[0]["ai_usage"]["free_ids_used"] == 99


def test_a_friends_and_family_comp_counts_as_pro_until_it_ends(make_client, monkeypatch):
    monkeypatch.setenv("FREE_ID_ALLOWANCE", "0")
    future = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    _, client = make_client({"pro_until": future, "pro_source": "friends_family"})
    model(monkeypatch, GOOD)
    assert identify(client).status_code == 200
    _, client = make_client({"pro_until": past, "pro_source": "friends_family"})
    assert identify(client).status_code == 402


def test_the_cost_caps_stop_a_call_before_the_model_and_say_which(make_client, monkeypatch):
    monkeypatch.setenv("AI_BURST_PER_MINUTE", "2")
    monkeypatch.setenv("AI_DAILY_CAP", "100")
    db, client = make_client({"tier": "pro"})
    calls = model(monkeypatch, GOOD)
    assert identify(client).status_code == 200 and identify(client).status_code == 200
    res = identify(client)
    assert res.status_code == 429 and res.json()["detail"]["code"] == "fair_use_burst"
    assert len(calls) == 2


def test_room_scan_shares_the_caps_but_not_the_free_id_allowance(make_client, monkeypatch):
    monkeypatch.setenv("FREE_ID_ALLOWANCE", "0")
    monkeypatch.setenv("AI_BURST_PER_MINUTE", "1")
    db, client = make_client({"tier": "free"})
    model(monkeypatch, '{"plants": []}')
    assert client.post("/api/plants/scan-room", json={"image_base64": "AAAA"}).status_code == 200  # no free-ID rule here
    res = client.post("/api/plants/scan-room", json={"image_base64": "AAAA"})
    assert res.status_code == 429 and res.json()["detail"]["code"] == "fair_use_burst"


def test_diagnosis_is_pro_only_and_a_free_account_is_told_what_is_still_free(make_client, monkeypatch):
    db, client = make_client({"tier": "free"}, mode="on")
    calls = model(monkeypatch, "{}")
    res = client.post("/api/plants/diagnose-photo", json={"image_base64": "AAAA", "soil_answer": "dry"})
    assert res.status_code == 402 and res.json()["detail"]["code"] == "pro_required"
    assert "symptom checker" in res.json()["detail"]["message"]
    assert calls == []


def test_the_arm_check_still_comes_first(make_client, monkeypatch):
    _, client = make_client({"tier": "free"}, mode="off")
    res = client.post("/api/plants/diagnose-photo", json={"image_base64": "AAAA", "soil_answer": "dry"})
    assert res.status_code == 403


def test_the_pro_requirement_can_be_lifted_for_the_experiment(make_client, monkeypatch):
    monkeypatch.setenv("DIAGNOSIS_REQUIRES_PRO", "off")
    _, client = make_client({"tier": "free"}, mode="on")
    model(monkeypatch, '{"seesAProblem": false, "photoIsEnough": true, "causes": []}')
    res = client.post("/api/plants/diagnose-photo", json={"image_base64": "AAAA", "soil_answer": "dry"})
    assert res.status_code == 200


def test_the_entitlements_endpoint_reports_the_account(make_client, monkeypatch):
    monkeypatch.delenv("FREE_ID_ALLOWANCE", raising=False)
    _, client = make_client({"tier": "free", "ai_usage": {"free_ids_used": 2}})
    body = client.get("/api/entitlements/me").json()
    assert body["pro"] is False and body["free_ids"] == {"allowance": 3, "used": 2, "left": 1}
    assert body["diagnosis_requires_pro"] is True


# ---------- granting Pro ----------

def test_a_grant_starts_extends_keeps_and_skips_correctly():
    until = datetime(2027, 1, 31, 23, 59, 59, tzinfo=timezone.utc)
    assert entitlements.plan_grant({}, until, "friends_family", NOW)[:2] == (until, "grant")
    shorter = {"pro_until": "2026-12-20T23:59:59+00:00", "pro_source": "comp"}
    assert entitlements.plan_grant(shorter, until, "friends_family", NOW)[:2] == (until, "extend")
    longer = {"pro_until": "2027-12-15T23:59:59+00:00", "pro_source": "founder"}
    new, action, note = entitlements.plan_grant(longer, until, "friends_family", NOW)
    assert action == "keep" and new.year == 2027 and new.month == 12 and "founder" in note  # a longer grant is never cut short
    expired = {"pro_until": "2026-01-01T00:00:00+00:00"}
    assert entitlements.plan_grant(expired, until, "comp", NOW)[:2] == (until, "grant")
    assert entitlements.plan_grant({"tier": "pro"}, until, "comp", NOW)[1] == "skip"


def test_a_grant_refuses_a_past_date_or_an_unknown_source():
    with pytest.raises(ValueError):
        entitlements.plan_grant({}, NOW - timedelta(days=1), "comp", NOW)
    with pytest.raises(ValueError):
        entitlements.plan_grant({}, NOW + timedelta(days=1), "gift", NOW)
