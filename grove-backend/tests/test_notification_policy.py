"""Quieter notification defaults, safe migration of saved preferences, and the care send policy."""
import os
from datetime import time

import pytest

from notification_policy import (
    DEFAULT_NOTIFICATION_PREFS,
    LEGACY_DEFAULTS,
    RETIRED_PREF_KEYS,
    PREFS_VERSION,
    explicit_prefs,
    in_quiet_hours,
    may_send_care_notification,
    merge_prefs,
    stored_after_update,
)

PUSH_KEYS = [k for k in DEFAULT_NOTIFICATION_PREFS if k.startswith("push_")]


# ---------- defaults ----------

def test_only_care_check_pushes_are_on_by_default():
    on = sorted(k for k in PUSH_KEYS if DEFAULT_NOTIFICATION_PREFS[k])
    assert on == ["push_bouquet_reminder", "push_care_due", "push_sitter_logged"]


def test_streak_alerts_are_retired_not_just_off():
    # No default, no effective value and no pref for either, whatever is stored.
    for key in ("push_streak_at_risk", "push_streak_milestone"):
        assert key not in DEFAULT_NOTIFICATION_PREFS
        assert key in RETIRED_PREF_KEYS
    assert not any("streak" in k for k in DEFAULT_NOTIFICATION_PREFS)


def test_stored_streak_prefs_are_kept_on_the_record_but_never_returned():
    stored = {"prefs_version": PREFS_VERSION, "push_streak_at_risk": True, "push_streak_milestone": True}
    merged = merge_prefs(stored)
    assert "push_streak_at_risk" not in merged and "push_streak_milestone" not in merged
    # An update must not delete what was stored.
    again = stored_after_update(stored, {"care_daily_cap": 2})
    assert again["push_streak_at_risk"] is True and again["push_streak_milestone"] is True


def test_bloom_hour_and_challenge_pushes_are_off_for_new_owners():
    assert DEFAULT_NOTIFICATION_PREFS["push_bloom_hour"] is False
    assert DEFAULT_NOTIFICATION_PREFS["push_grove_challenge"] is False


def test_quiet_hours_are_on_overnight_and_care_is_capped_at_one():
    assert DEFAULT_NOTIFICATION_PREFS["quiet_hours_enabled"] is True
    assert (DEFAULT_NOTIFICATION_PREFS["quiet_hours_start"], DEFAULT_NOTIFICATION_PREFS["quiet_hours_end"]) == ("21:00", "08:00")
    assert DEFAULT_NOTIFICATION_PREFS["care_daily_cap"] == 1


def test_a_new_user_gets_the_new_defaults():
    assert merge_prefs(None) == DEFAULT_NOTIFICATION_PREFS
    assert merge_prefs({}) == DEFAULT_NOTIFICATION_PREFS


# ---------- migration ----------

def test_legacy_snapshot_values_equal_to_old_defaults_fall_through_to_new_defaults():
    # Old PATCH saved the whole merged dict after the user flipped one toggle.
    snapshot = {**LEGACY_DEFAULTS, "push_swap_match": False}
    merged = merge_prefs(snapshot)
    assert "push_streak_at_risk" not in merged
    assert merged["quiet_hours_enabled"] is True
    assert merged["care_daily_cap"] == 1


def test_legacy_choices_that_differ_from_old_defaults_are_kept():
    snapshot = {**LEGACY_DEFAULTS, "push_care_due": False, "push_kudos_received": True, "quiet_hours_start": "23:30"}
    merged = merge_prefs(snapshot)
    assert merged["push_care_due"] is False
    assert merged["push_kudos_received"] is True
    assert merged["quiet_hours_start"] == "23:30"


def test_version_two_records_are_taken_at_face_value():
    stored = {"prefs_version": PREFS_VERSION, "push_swap_match": True, "quiet_hours_enabled": False}
    merged = merge_prefs(stored)
    assert merged["push_swap_match"] is True
    assert merged["quiet_hours_enabled"] is False
    assert "prefs_version" not in merged


def test_an_update_stores_only_explicit_keys_and_the_version():
    stored = stored_after_update({**LEGACY_DEFAULTS, "push_kudos_received": True}, {"care_daily_cap": 3})
    assert stored == {"push_kudos_received": True, "care_daily_cap": 3, "prefs_version": PREFS_VERSION}


def test_garbage_stored_value_is_ignored():
    assert explicit_prefs("nope") == {}
    assert merge_prefs(["x"]) == DEFAULT_NOTIFICATION_PREFS


# ---------- quiet hours ----------

@pytest.mark.parametrize(
    "now, expected",
    [(time(21, 0), True), (time(23, 59), True), (time(3, 0), True), (time(7, 59), True), (time(8, 0), False), (time(12, 0), False), (time(20, 59), False)],
)
def test_overnight_quiet_window(now, expected):
    assert in_quiet_hours(DEFAULT_NOTIFICATION_PREFS, now) is expected


def test_same_day_window_and_disabled_window():
    prefs = {**DEFAULT_NOTIFICATION_PREFS, "quiet_hours_start": "13:00", "quiet_hours_end": "15:00"}
    assert in_quiet_hours(prefs, time(14, 0)) is True
    assert in_quiet_hours(prefs, time(16, 0)) is False
    assert in_quiet_hours({**prefs, "quiet_hours_enabled": False}, time(14, 0)) is False


def test_malformed_window_never_blocks():
    assert in_quiet_hours({**DEFAULT_NOTIFICATION_PREFS, "quiet_hours_start": "bad"}, time(23, 0)) is False


# ---------- care send policy ----------

def test_one_care_notification_a_day_by_default():
    assert may_send_care_notification(DEFAULT_NOTIFICATION_PREFS, "care_due", 0, time(9, 0)) is True
    assert may_send_care_notification(DEFAULT_NOTIFICATION_PREFS, "care_due", 1, time(9, 0)) is False


def test_cap_is_user_adjustable_up_to_three():
    prefs = {**DEFAULT_NOTIFICATION_PREFS, "care_daily_cap": 3}
    assert may_send_care_notification(prefs, "care_due", 2, time(9, 0)) is True
    assert may_send_care_notification(prefs, "care_due", 3, time(9, 0)) is False


def test_invalid_cap_falls_back_to_one():
    prefs = {**DEFAULT_NOTIFICATION_PREFS, "care_daily_cap": 99}
    assert may_send_care_notification(prefs, "care_due", 1, time(9, 0)) is False


def test_nothing_sends_during_quiet_hours_or_when_off():
    assert may_send_care_notification(DEFAULT_NOTIFICATION_PREFS, "care_due", 0, time(22, 0)) is False
    assert may_send_care_notification(DEFAULT_NOTIFICATION_PREFS, "care_overdue", 0, time(9, 0)) is False
    assert may_send_care_notification(DEFAULT_NOTIFICATION_PREFS, "streak_at_risk", 0, time(9, 0)) is False
    assert may_send_care_notification({**DEFAULT_NOTIFICATION_PREFS, "push_streak_at_risk": True}, "streak_at_risk", 0, time(9, 0)) is False


# ---------- endpoints ----------

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")


class _Users:
    def __init__(self, docs):
        self.docs = docs

    async def find_one(self, flt, projection=None):
        return next((d for d in self.docs if d.get("id") == flt.get("id")), None)

    async def update_one(self, flt, update):
        doc = await self.find_one(flt)
        if doc is not None:
            doc.update(update.get("$set", {}))


class _Db:
    def __init__(self, user):
        self.users = _Users([user])


@pytest.fixture
def client_for(monkeypatch):
    server = pytest.importorskip("server", reason="server dependencies are not installed")
    from fastapi.testclient import TestClient

    def build(user):
        db = _Db(user)
        monkeypatch.setattr(server, "db", db)
        server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": user["id"], "email": "a@b.c"}
        return db, TestClient(server.app)

    yield build
    server = pytest.importorskip("server")
    server.app.dependency_overrides.pop(server.get_current_user, None)


def test_get_returns_new_defaults_for_a_user_with_nothing_saved(client_for):
    _, client = client_for({"id": "u1"})
    res = client.get("/api/users/me/notification-preferences")
    assert res.status_code == 200
    assert res.json() == DEFAULT_NOTIFICATION_PREFS


def test_patch_keeps_a_legacy_users_real_choice_and_writes_only_explicit_keys(client_for):
    user = {"id": "u1", "notification_preferences": {**LEGACY_DEFAULTS, "push_care_due": False}}
    db, client = client_for(user)
    res = client.patch("/api/users/me/notification-preferences", json={"care_daily_cap": 2})
    assert res.status_code == 200
    body = res.json()
    assert body["push_care_due"] is False  # explicit legacy choice survives
    assert "push_streak_at_risk" not in body  # retired, never returned
    assert body["care_daily_cap"] == 2
    assert user["notification_preferences"] == {"push_care_due": False, "care_daily_cap": 2, "prefs_version": PREFS_VERSION}


@pytest.mark.parametrize("cap", [0, 4])
def test_patch_rejects_a_cap_outside_one_to_three(client_for, cap):
    _, client = client_for({"id": "u1"})
    res = client.patch("/api/users/me/notification-preferences", json={"care_daily_cap": cap})
    assert res.status_code == 422
