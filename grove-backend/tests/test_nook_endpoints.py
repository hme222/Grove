"""Endpoint tests for Pip's nook, run against an in-memory stand-in for the database.

No MongoDB and no network are used. Badge awarding for the older badge system is
stubbed out because it is not what these tests are about.
"""
import os
from datetime import datetime, timedelta, timezone

import pytest

# Dummy values are set before `server` is imported so a real database is never configured.
os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402

from fakes import FakeDb  # noqa: E402


def iso(days_ago=0, hours_ago=0):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)).isoformat()


async def _noop(*args, **kwargs):
    return None


@pytest.fixture
def make_client(monkeypatch):
    def build(user=None, plants=()):
        db = FakeDb()
        db.users.docs.append({"id": "u1", "email": "a@b.c", "created_at": iso(60), "tutorials_seen": [], **(user or {})})
        db.plants.docs.extend({"user_id": "u1", **plant} for plant in plants)
        for number in (2, 3, 4):
            db.badges.docs.append({"id": f"b{number}", "slug": f"nook_level_{number}"})
        monkeypatch.setattr(server, "db", db)
        monkeypatch.setattr(server, "check_and_award_badges", _noop)
        monkeypatch.setattr(server, "update_streak", _noop)
        server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
        return db, TestClient(server.app)

    yield build
    server.app.dependency_overrides.pop(server.get_current_user, None)


def seed_soil_tests(db, days=9):
    for day in range(days):
        db.care_logs.docs.append({"user_id": "u1", "plant_id": "p1", "action": "soil_check", "logged_at": iso(days_ago=day + 20)})


# ---------- state ----------

def test_a_new_user_gets_a_bare_nook_with_no_growth_number(make_client):
    _, client = make_client()
    res = client.get("/api/nook/state")
    assert res.status_code == 200
    body = res.json()
    assert body["enabled"] is False
    assert (body["level"], body["level_name"]) == (1, "Bare")
    assert body["pip"] == {"form": "seed", "location": "sill"}
    assert not any("growth" in key for key in body)


def test_level_badges_are_only_awarded_after_opting_in_and_only_once(make_client):
    db, client = make_client(plants=[{"id": "p1", "created_at": iso(90)}])
    seed_soil_tests(db)
    assert client.get("/api/nook/state").json()["level"] == 2
    assert db.user_badges.docs == []

    client.post("/api/users/me/nook", json={"enabled": True})
    client.get("/api/nook/state")
    client.get("/api/nook/state")
    assert [b["badge_slug"] for b in db.user_badges.docs] == ["nook_level_2"]


def test_seen_stops_the_grew_message_until_something_new_happens(make_client):
    db, client = make_client(plants=[{"id": "p1", "created_at": iso(90)}])
    seed_soil_tests(db)
    first = client.get("/api/nook/state").json()
    assert first["grew"] is True and first["level_up"] is True
    assert client.post("/api/nook/seen").status_code == 200
    second = client.get("/api/nook/state").json()
    assert second["grew"] is False and second["level_up"] is False


# ---------- opting in and the hero plant ----------

def test_the_offer_is_recorded_once_and_saying_no_is_respected(make_client):
    db, client = make_client()
    no = client.post("/api/users/me/nook", json={"enabled": False})
    assert no.status_code == 200
    assert no.json()["nook_enabled"] is False
    assert no.json()["nook_offered_at"]
    first_offer = no.json()["nook_offered_at"]
    yes = client.post("/api/users/me/nook", json={"enabled": True})
    assert yes.json()["nook_enabled"] is True
    assert yes.json()["nook_offered_at"] == first_offer
    assert client.get("/api/nook/state").json()["offered"] is True


def test_the_hero_plant_must_be_the_users_own(make_client):
    db, client = make_client(plants=[{"id": "p1", "created_at": iso(5)}, {"id": "p2", "created_at": iso(4)}])
    db.plants.docs.append({"id": "other", "user_id": "u2"})
    assert client.post("/api/users/me/nook", json={"hero_plant_id": "other"}).status_code == 404
    assert client.post("/api/users/me/nook", json={"hero_plant_id": "missing"}).status_code == 404
    res = client.post("/api/users/me/nook", json={"hero_plant_id": "p2"})
    assert res.status_code == 200
    assert client.get("/api/nook/state").json()["hero"]["id"] == "p2"


# ---------- plant condition and quiet mode ----------

def test_conditions_follow_the_schedule_and_quiet_mode_follows_conditions(make_client):
    soon = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    later = (datetime.now(timezone.utc) + timedelta(days=6)).isoformat()
    overdue = (datetime.now(timezone.utc) - timedelta(days=4)).isoformat()
    _, client = make_client(plants=[
        {"id": "p1", "created_at": iso(30), "next_water_due": later},
        {"id": "p2", "created_at": iso(20), "next_water_due": soon},
        {"id": "p3", "created_at": iso(10), "next_water_due": overdue},
    ])
    body = client.get("/api/nook/state").json()
    assert {p["id"]: p["condition"] for p in body["plants"]} == {
        "p1": "fine", "p2": "due-soon", "p3": "needs-attention",
    }
    assert body["quiet"] is True


def test_looks_off_overrides_a_fine_plant_and_can_be_cleared(make_client):
    later = (datetime.now(timezone.utc) + timedelta(days=6)).isoformat()
    _, client = make_client(plants=[{"id": "p1", "created_at": iso(30), "next_water_due": later}])
    assert client.post("/api/plants/p1/looks-off", json={"looks_off": True}).status_code == 200
    body = client.get("/api/nook/state").json()
    assert body["plants"][0]["condition"] == "needs-attention"
    assert body["plants"][0]["looks_off"] is True and body["quiet"] is True
    client.post("/api/plants/p1/looks-off", json={"looks_off": False})
    assert client.get("/api/nook/state").json()["quiet"] is False


def test_looks_off_only_works_on_the_users_own_plants(make_client):
    db, client = make_client()
    db.plants.docs.append({"id": "other", "user_id": "u2"})
    assert client.post("/api/plants/other/looks-off", json={"looks_off": True}).status_code == 404
    assert "looks_off" not in db.plants.docs[0]


# ---------- readiness ----------

def test_the_readiness_plant_goes_from_seed_to_ready_with_no_needs(make_client):
    db, client = make_client()
    db.species.docs.append({"id": "s1", "common_name": "Snake Plant", "default_watering_days": 14})
    assert client.post("/api/nook/readiness", json={"species_id": "nope"}).status_code == 404

    started = client.post("/api/nook/readiness", json={"species_id": "s1"}).json()["readiness"]
    assert started["state"] == "seed" and started["watering_days"] == 14 and started["group"] == "snake"

    states = []
    for step in ("light-spot", "drainage", "soil-mix"):
        res = client.post(f"/api/nook/readiness/steps/{step}")
        assert res.status_code == 200
        states.append(res.json()["readiness"]["state"])
    assert states == ["sprouting", "sprouting", "ready"]
    again = client.post("/api/nook/readiness/steps/drainage")
    assert again.json()["readiness"]["state"] == "ready"


def test_readiness_steps_need_a_started_plant_and_a_real_step(make_client):
    db, client = make_client()
    assert client.post("/api/nook/readiness/steps/drainage").status_code == 409
    db.users.docs[0]["readiness_plant"] = {"species_id": "s1", "steps": {}}
    assert client.post("/api/nook/readiness/steps/not-a-step").status_code == 404


# ---------- lessons feed the nook ----------

def test_finishing_a_lesson_records_when_and_keeps_the_first_time(make_client):
    db, client = make_client()
    client.post("/api/users/me/quiz", json={"answers": ["gifted_no_instructions"]})
    assert client.post("/api/lessons/plant-er/complete").status_code == 200
    first = db.users.docs[0]["lesson_completed_at"]["plant-er"]
    assert first
    client.post("/api/lessons/plant-er/complete")
    assert db.users.docs[0]["lesson_completed_at"]["plant-er"] == first
    assert db.users.docs[0]["tutorials_seen"] == ["lesson:plant-er"]


# ---------- the badge catalog ----------

def test_the_three_level_badges_are_in_the_catalog_and_earnable():
    import badge_catalog

    by_slug = {badge["slug"]: badge for badge in badge_catalog.BADGE_CATALOG}
    for number, tier in ((2, "bronze"), (3, "silver"), (4, "gold")):
        badge = by_slug[f"nook_level_{number}"]
        assert badge["tier"] == tier
        assert badge["family"] == "nook_level"
        assert f"nook_level_{number}" in badge_catalog.EARNABLE_SLUGS
