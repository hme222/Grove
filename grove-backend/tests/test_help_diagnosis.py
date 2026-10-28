"""The help_diagnosis experiment: who gets which arm, what the photo check refuses, what it records."""
import os

import pytest

import experiments
import photo_diagnosis

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402

from fakes import FakeDb  # noqa: E402


# ---------- arms ----------

def test_everyone_gets_control_when_the_experiment_is_off():
    assert {experiments.assign(f"u{i}", mode="off", ai=True) for i in range(50)} == {"control"}


def test_nobody_gets_the_photo_check_without_an_ai_key():
    assert {experiments.assign(f"u{i}", mode="on", ai=False) for i in range(50)} == {"control"}
    assert {experiments.assign(f"u{i}", mode="split", ai=False) for i in range(50)} == {"control"}


def test_on_puts_everyone_in_the_photo_check_arm():
    assert {experiments.assign(f"u{i}", mode="on", ai=True) for i in range(20)} == {"photo_check"}


def test_split_is_stable_per_user_and_roughly_even():
    arms = [experiments.assign(f"user-{i}", mode="split", ai=True) for i in range(400)]
    assert arms == [experiments.assign(f"user-{i}", mode="split", ai=True) for i in range(400)]
    share = arms.count("photo_check") / len(arms)
    assert 0.4 < share < 0.6


def test_unknown_mode_falls_back_to_off(monkeypatch):
    monkeypatch.setenv("EXPERIMENT_HELP_DIAGNOSIS", "banana")
    assert experiments.mode_for(experiments.HELP_DIAGNOSIS) == "off"


# ---------- cleaning a model answer ----------

def test_finish_words_the_confidence_and_caps_the_causes():
    out = photo_diagnosis.finish({"seesAProblem": True, "photoIsEnough": True, "causes": [
        {"title": f"Cause {i}", "likelihood": "high" if i == 0 else "medium", "why": "w", "check": "c", "fix": "f"}
        for i in range(5)]})
    assert len(out["causes"]) == 3
    assert out["causes"][0]["likelihood"] == "Likely" and out["confidence"] == "Fairly sure" and not out["notSure"]


def test_finish_says_not_sure_when_the_photo_is_not_enough_or_nothing_came_back():
    assert photo_diagnosis.finish({"causes": [{"title": "Thirsty", "likelihood": "high"}], "photoIsEnough": False})["notSure"]
    assert photo_diagnosis.finish({})["notSure"]
    assert photo_diagnosis.finish("not a dict")["causes"] == []


def test_finish_treats_an_unknown_likelihood_as_low():
    out = photo_diagnosis.finish({"causes": [{"title": "Odd", "likelihood": "certain"}]})
    assert out["causes"][0]["likelihood"] == "Less likely" and out["notSure"]


def test_prompt_carries_the_soil_answer():
    assert "wet or soggy" in photo_diagnosis.build_prompt("wet")


# ---------- endpoints ----------

@pytest.fixture
def make_client(monkeypatch):
    def build(mode="on", ai=True):
        db = FakeDb()
        monkeypatch.setattr(server, "db", db)
        monkeypatch.setenv("EXPERIMENT_HELP_DIAGNOSIS", mode)
        monkeypatch.setattr(experiments, "ai_ready", lambda: ai)
        server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
        return db, TestClient(server.app)
    yield build
    server.app.dependency_overrides.pop(server.get_current_user, None)


def test_arm_endpoint(make_client):
    _, client = make_client(mode="off")
    assert client.get("/api/experiments/help-diagnosis").json() == {"arm": "control"}
    _, client = make_client(mode="on")
    assert client.get("/api/experiments/help-diagnosis").json() == {"arm": "photo_check"}


def test_events_are_checked_and_stored_with_the_arm(make_client):
    db, client = make_client()
    assert client.post("/api/experiments/events", json={"experiment": "help_diagnosis", "event": "nope"}).status_code == 422
    assert client.post("/api/experiments/events", json={"experiment": "other", "event": "exposure"}).status_code == 422
    assert client.post("/api/experiments/events", json={"experiment": "help_diagnosis", "event": "exposure"}).status_code == 200
    saved = db.experiment_events.docs[0]
    assert saved["arm"] == "photo_check" and saved["event"] == "exposure" and saved["user_id"] == "u1"


def test_the_photo_check_is_closed_to_the_control_arm(make_client):
    _, client = make_client(mode="off")
    res = client.post("/api/plants/diagnose-photo", json={"image_base64": "AAAA", "soil_answer": "dry"})
    assert res.status_code == 403


def test_the_photo_check_asks_for_the_soil_check_and_makes_no_ai_call(make_client, monkeypatch):
    _, client = make_client()

    async def boom(*a, **k):
        raise AssertionError("the model must not be called before a soil answer")
    monkeypatch.setattr(server, "call_claude_vision", boom)
    res = client.post("/api/plants/diagnose-photo", json={"image_base64": "AAAA", "soil_answer": "not_checked"})
    assert res.json()["needsSoilCheck"] is True


def test_the_photo_check_returns_a_cleaned_result_and_records_it(make_client, monkeypatch):
    db, client = make_client()

    async def fake(system, prompt, image):
        assert "wet or soggy" in prompt
        return '{"seesAProblem": true, "photoIsEnough": true, "causes": [{"title": "Too much water", "likelihood": "high", "why": "Soil is wet", "check": "Lift the pot", "fix": "Let it dry"}]}'
    monkeypatch.setattr(server, "call_claude_vision", fake)
    res = client.post("/api/plants/diagnose-photo", json={"image_base64": "AAAA", "soil_answer": "wet"}).json()
    assert res["causes"][0]["title"] == "Too much water" and res["confidence"] == "Fairly sure"
    assert db.experiment_events.docs[-1]["event"] == "photo_check_result"
    assert db.experiment_events.docs[-1]["props"]["soil"] == "wet"


def test_a_model_failure_says_so_and_keeps_the_list_working(make_client, monkeypatch):
    db, client = make_client()

    async def fail(*a, **k):
        raise RuntimeError("down")
    monkeypatch.setattr(server, "call_claude_vision", fail)
    res = client.post("/api/plants/diagnose-photo", json={"image_base64": "AAAA", "soil_answer": "dry"}).json()
    assert res["error"] == "diagnosis_unavailable"
    assert db.experiment_events.docs[-1]["event"] == "photo_check_failed"
