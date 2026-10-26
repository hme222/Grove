"""Weekly check-ins, the open read-only community, and the badges that follow.

Pure rules are tested directly. Endpoint tests run the real app against an
in-memory stand-in for the database, so no MongoDB and no network are used.
"""
import asyncio
import os
from datetime import date, datetime, timedelta, timezone

import pytest

import check_ins
import badge_catalog
import badge_progress

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402

MONDAY = date(2026, 10, 19)  # a Monday
WEDNESDAY = MONDAY + timedelta(days=2)


def run(coro):
    return asyncio.run(coro)


# ---------- the rules, no database ----------

def test_the_week_starts_on_monday():
    assert check_ins.week_start(date(2026, 10, 25)) == MONDAY  # Sunday
    assert check_ins.week_start(MONDAY) == MONDAY


def test_three_check_ins_in_a_calendar_week_meet_the_goal():
    s = check_ins.summarize([MONDAY, MONDAY + timedelta(days=2), MONDAY + timedelta(days=5)], today=MONDAY + timedelta(days=6))
    assert (s["this_week"], s["weekly_goal"], s["goal_met_this_week"], s["weeks_goal_met"]) == (3, 3, True, 1)


def test_two_check_ins_do_not_meet_it_and_nothing_is_lost():
    s = check_ins.summarize([MONDAY, WEDNESDAY], today=WEDNESDAY)
    assert s["this_week"] == 2 and s["goal_met_this_week"] is False
    assert s["total_check_ins"] == 2


def test_many_things_on_one_day_are_one_check_in():
    s = check_ins.summarize([f"{MONDAY}T08:00:00+00:00", f"{MONDAY}T20:00:00+00:00", MONDAY], today=MONDAY)
    assert s["total_check_ins"] == 1


def test_gaps_never_reset_anything():
    weeks = []
    for week in (0, 1, 5, 6, 12):  # long silences in between
        start = MONDAY - timedelta(weeks=week)
        weeks += [start, start + timedelta(days=1), start + timedelta(days=2)]
    s = check_ins.summarize(weeks, today=MONDAY + timedelta(days=6))
    assert s["weeks_goal_met"] == 5


def test_a_quiet_week_after_a_good_one_keeps_the_count():
    good = [MONDAY, MONDAY + timedelta(days=1), MONDAY + timedelta(days=2)]
    s = check_ins.summarize(good, today=MONDAY + timedelta(days=30))
    assert s["weeks_goal_met"] == 1 and s["this_week"] == 0


def test_future_dates_and_junk_are_ignored():
    s = check_ins.summarize(["nope", None, "", MONDAY + timedelta(days=20)], today=MONDAY)
    assert s["total_check_ins"] == 0 and s["last_check_in"] is None


def test_looking_counts_and_watering_volume_never_does():
    for action in ("soil_check", "inspect", "health_check", "check", "photo"):
        assert check_ins.is_check_in_log({"action": action})
    assert check_ins.is_check_in_log({"action": "water", "photo_url": "a.jpg"})
    for action in ("water", "mist", "fertilize", "flush", "change_water", "rotate", "prune", "repot"):
        assert not check_ins.is_check_in_log({"action": action, "photo_url": ""})
    assert check_ins.actions_count_as_check_in(["water", "soil_check"])
    assert not check_ins.actions_count_as_check_in(["water", "mist"])


def test_watering_a_hundred_times_earns_nothing():
    logs = [{"action": "water", "logged_at": (datetime(2026, 10, 19, tzinfo=timezone.utc) + timedelta(days=i)).isoformat()} for i in range(100)]
    assert not any(check_ins.is_check_in_log(log) for log in logs)


# ---------- a stand-in database ----------

def _matches(doc, flt):
    for key, value in flt.items():
        if key == "$or":
            if not any(_matches(doc, sub) for sub in value):
                return False
        elif isinstance(value, dict):
            got = doc.get(key)
            for op, arg in value.items():
                if op == "$ne" and got == arg:
                    return False
                if op == "$in" and got not in arg:
                    return False
                if op == "$nin" and got in arg:
                    return False
        elif doc.get(key) != value:
            return False
    return True


class _Cursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, *a, **k):
        return self

    def skip(self, *a, **k):
        return self

    def limit(self, *a, **k):
        return self

    async def to_list(self, _n=None):
        return list(self.docs)

    def __aiter__(self):
        async def gen():
            for d in self.docs:
                yield d
        return gen()


class Coll:
    def __init__(self):
        self.docs = []

    def find(self, flt=None, projection=None):
        return _Cursor([d for d in self.docs if _matches(d, flt or {})])

    async def find_one(self, flt=None, projection=None, **kw):
        return next((d for d in self.docs if _matches(d, flt or {})), None)

    async def count_documents(self, flt=None):
        return sum(1 for d in self.docs if _matches(d, flt or {}))

    async def insert_one(self, doc):
        self.docs.append(doc)

    async def update_one(self, flt, update, upsert=False):
        doc = await self.find_one(flt)
        if doc is None and upsert:
            doc = {k: v for k, v in flt.items() if not isinstance(v, dict)}
            doc.update(update.get("$setOnInsert", {}))
            self.docs.append(doc)
        if doc is None:
            return
        doc.update(update.get("$set", {}))
        for k, v in update.get("$addToSet", {}).items():
            items = doc.setdefault(k, [])
            if v not in items:
                items.append(v)

    async def distinct(self, *a, **k):
        return []

    def aggregate(self, *a, **k):
        return _Cursor([])


class FakeDb:
    def __init__(self):
        self._c = {}

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        return self._c.setdefault(name, Coll())


def _log(day, action="soil_check", photo=""):
    return {"user_id": "u1", "action": action, "photo_url": photo,
            "logged_at": datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc).isoformat()}


# ---------- reading and recording ----------

def test_summary_reads_existing_care_logs_so_nobody_starts_from_zero():
    db = FakeDb()
    db.care_logs.docs += [_log(MONDAY), _log(WEDNESDAY, "water"), _log(WEDNESDAY, "inspect"), _log(MONDAY - timedelta(days=30), "water")]
    s = run(check_ins.get_summary(db, "u1", today=WEDNESDAY))
    assert s["total_check_ins"] == 2  # the soil check and the look; both waterings ignored


def test_recording_a_check_in_twice_on_one_day_stores_one_document():
    db = FakeDb()
    when = datetime(2026, 10, 21, 9, tzinfo=timezone.utc)
    run(check_ins.record_check_in(db, "u1", "lesson", when))
    run(check_ins.record_check_in(db, "u1", "photo", when))
    assert len(db.check_ins.docs) == 1
    assert db.check_ins.docs[0]["kinds"] == ["lesson", "photo"]
    assert run(check_ins.get_summary(db, "u1", today=WEDNESDAY))["total_check_ins"] == 1


def test_lessons_and_photos_count_with_soil_checks():
    db = FakeDb()
    db.care_logs.docs.append(_log(MONDAY))
    run(check_ins.record_check_in(db, "u1", "lesson", datetime(2026, 10, 20, 9, tzinfo=timezone.utc)))
    run(check_ins.record_check_in(db, "u1", "photo", datetime(2026, 10, 21, 9, tzinfo=timezone.utc)))
    s = run(check_ins.get_summary(db, "u1", today=WEDNESDAY))
    assert s["this_week"] == 3 and s["goal_met_this_week"] is True


# ---------- endpoints ----------

@pytest.fixture
def make_client(monkeypatch):
    def build(plants=1, care_logs=0):
        db = FakeDb()
        db.users.docs.append({"id": "u1", "email": "a@b.c", "created_at": datetime.now(timezone.utc).isoformat()})
        for i in range(plants):
            db.plants.docs.append({"id": f"p{i}", "user_id": "u1", "watering_frequency_days": 7})
        for i in range(care_logs):
            db.care_logs.docs.append(_log(MONDAY - timedelta(days=i), "water"))
        monkeypatch.setattr(server, "db", db)
        server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
        return db, TestClient(server.app)

    yield build
    server.app.dependency_overrides.pop(server.get_current_user, None)


def test_check_ins_endpoint_and_stats_carry_the_summary_and_no_streak(make_client):
    db, client = make_client()
    db.care_logs.docs.append(_log(datetime.now(timezone.utc).date()))
    body = client.get("/api/users/me/check-ins").json()
    assert body["weekly_goal"] == 3 and body["this_week"] == 1
    stats = client.get("/api/users/me/stats").json()
    assert stats["check_ins"]["this_week"] == 1
    assert "current_streak" not in stats and "longest_streak" not in stats


def test_a_soil_check_through_the_care_log_is_a_check_in_and_a_watering_is_not(make_client):
    db, client = make_client()
    client.post("/api/plants/p0/care-logs", json={"actions": ["water"]})
    assert client.get("/api/users/me/check-ins").json()["this_week"] == 0
    client.post("/api/plants/p0/care-logs", json={"actions": ["soil_check"], "soil_outcome": "dry", "soil_decision": "wait"})
    assert client.get("/api/users/me/check-ins").json()["this_week"] == 1


def test_a_water_round_never_counts_and_leaves_the_streak_collection_alone(make_client):
    db, client = make_client()
    db.plants.docs[0]["next_water_due"] = "2000-01-01T00:00:00+00:00"
    client.post("/api/plants/water-round/log")
    assert client.get("/api/users/me/check-ins").json()["this_week"] == 0
    assert db.streaks.docs == []  # old collection is neither written nor needed


def test_a_plant_photo_is_recorded_as_a_check_in(make_client, monkeypatch):
    db, client = make_client()
    monkeypatch.setattr(server, "put_object", lambda path, data, ct: {"path": path, "size": len(data)})
    res = client.post("/api/plants/p0/photos", files={"file": ("a.png", b"123", "image/png")})
    assert res.status_code == 200, res.text
    assert client.get("/api/users/me/check-ins").json()["this_week"] == 1


def test_streak_notifications_are_never_created(make_client):
    db, client = make_client()
    for ntype in ("streak_at_risk", "streak_milestone"):
        assert run(server.create_notification("u1", ntype, "t", "b")) is None
    assert db.notifications.docs == []


def test_the_old_streak_shortcuts_are_gone(make_client):
    db, client = make_client()
    db.users.docs[0]["is_admin"] = True
    db.users.docs.append({"id": "u2", "username": "mayagreens"})
    res = client.post("/api/admin/demo/quick-state/mayagreens", params={"action": "set_streak_7"})
    assert res.status_code in (404, 405) or res.json().get("success") is False


# ---------- open, read-only community ----------

def test_the_feed_and_swaps_are_unlocked_for_everyone_with_no_streak(make_client):
    _, client = make_client(plants=0)
    body = client.get("/api/users/me/unlocks").json()
    assert body["social_feed_unlocked"] is True
    assert body["swap_unlocked"] is True and body["swipe_unlocked"] is True
    assert body["can_post"] is False


def test_the_swap_deck_browses_without_a_streak(make_client):
    db, client = make_client(plants=0)
    db.plants.docs.append({"id": "other", "user_id": "u2", "common_name": "Pothos"})
    db.users.docs.append({"id": "u2", "username": "other"})
    body = client.get("/api/swap/deck").json()
    assert body["unlocked"] is True
    assert [c["plant_id"] for c in body["cards"]] == ["other"]
    assert "streak_needed" not in body and "current_streak" not in body


def test_browsing_the_feed_needs_no_plant(make_client):
    _, client = make_client(plants=0)
    assert client.get("/api/feed").status_code == 200


@pytest.mark.parametrize("method,path,body", [
    ("post", "/api/posts", {"post_type": "plant_update", "caption": "hi"}),
    ("post", "/api/posts/x/reactions", {"type": "leaf"}),
    ("post", "/api/posts/x/comments", {"body": "hi"}),
    ("post", "/api/posts/x/kudos", None),
    ("post", "/api/swaps/interest", {"plant_id": "x"}),
])
def test_posting_reacting_and_swapping_need_a_plant_or_a_first_care(make_client, method, path, body):
    _, client = make_client(plants=0)
    res = getattr(client, method)(path, json=body) if body is not None else getattr(client, method)(path)
    assert res.status_code == 403
    assert "Browsing is open to everyone" in res.json()["detail"]


def test_a_plant_is_enough_to_post(make_client):
    _, client = make_client(plants=1)
    res = client.post("/api/posts", json={"post_type": "plant_update", "caption": "hi"})
    assert res.status_code == 200, res.text


def test_a_first_care_log_is_enough_to_post_even_with_no_plant_left(make_client):
    _, client = make_client(plants=0, care_logs=1)
    assert client.post("/api/posts", json={"post_type": "plant_update", "caption": "hi"}).status_code == 200


def test_swapping_keeps_its_existing_pro_and_verification_rules():
    user = {"created_at": datetime.now(timezone.utc).isoformat()}
    result = server._swap_eligibility(user)
    assert result["eligible"] is False
    assert set(result["missing"]) == {"account_age", "pro", "verified"}


# ---------- badges ----------

def test_weekly_check_in_badges_replace_the_nine_streak_tiers():
    slugs = {b["slug"] for b in badge_catalog.BADGE_CATALOG}
    assert {"checkin_first", "checkin_weeks_4", "checkin_weeks_12"} <= slugs
    assert not any(s.startswith("streak_") for s in slugs)
    assert not any(s.startswith("streak_") for s in badge_catalog.EARNABLE_SLUGS)
    assert badge_catalog.BADGE_FAMILIES["checkin"] == ["checkin_first", "checkin_weeks_4", "checkin_weeks_12"]
    assert badge_catalog.BADGE_SEED_VERSION.endswith("v3")


def test_no_badge_asks_for_days_in_a_row_of_care():
    for b in badge_catalog.BADGE_CATALOG:
        if b["slug"].startswith("checkin_"):
            text = (b["name"] + " " + b["description"]).lower()
            assert "streak" not in text and "in a row" not in text


def test_badge_progress_rules_follow_check_ins():
    assert badge_progress.BADGE_PROGRESS_RULES["checkin_weeks_4"][1] == 4
    snap = {"check_ins_total": 5, "weeks_goal_met": 2}
    assert badge_progress.progress_for("checkin_first", snap)["complete"] is True
    assert badge_progress.progress_for("checkin_weeks_4", snap)["pct"] == 0.5
    assert badge_progress.progress_for("streak_7", snap) is None


def _award(db):
    for slug in ("checkin_first", "checkin_weeks_4", "checkin_weeks_12"):
        db.badges.docs.append({"id": f"id-{slug}", "slug": slug})
    run(server.check_and_award_badges("u1"))
    return {b["badge_slug"] for b in db.user_badges.docs}


def test_first_check_in_badge_is_earned_by_a_soil_check_not_a_watering(make_client):
    db, _ = make_client()
    db.care_logs.docs.append(_log(WEDNESDAY, "water"))
    assert _award(db) == set()
    db.care_logs.docs.append(_log(WEDNESDAY, "soil_check"))
    assert _award(db) == {"checkin_first"}


def test_four_weeks_with_the_goal_met_earns_the_second_badge_with_gaps_allowed(make_client):
    db, _ = make_client()
    for week in (0, 2, 5, 9):  # gaps between the weeks
        start = MONDAY - timedelta(weeks=week)
        db.care_logs.docs += [_log(start), _log(start + timedelta(days=1)), _log(start + timedelta(days=2))]
    assert _award(db) == {"checkin_first", "checkin_weeks_4"}


def test_twelve_weeks_earns_the_third(make_client):
    db, _ = make_client()
    for week in range(12):
        start = MONDAY - timedelta(weeks=week * 2)
        db.care_logs.docs += [_log(start), _log(start + timedelta(days=1)), _log(start + timedelta(days=2))]
    assert _award(db) == {"checkin_first", "checkin_weeks_4", "checkin_weeks_12"}
