"""Notification defaults, stored-preference migration, and the care send policy.

Pure functions, no database access, so they can be unit tested.

Why these defaults (2026 concept survey, docs/research/findings):
- 11 of 35 people would delete the app over notification volume, the
  largest delete trigger. Reminders are also the #1 dealbreaker if missing
  (26 of 35), so care reminders stay on and everything else goes quiet.
- On by default: the daily care check (`push_care_due`), plus the two care
  types that only fire once someone opts into the thing behind them: an
  active bouquet (`push_bouquet_reminder`) or a plant sitter
  (`push_sitter_logged`).
- `push_care_overdue` is off because overdue plants are folded into the one
  daily care check. A second "overdue" alert would break the daily cap.
- Streaks, bloom hour, challenges, swaps and reactions are off. Grove does
  not gamify care, and swap and reaction activity still lands in the
  in-app notification center whatever these push toggles say.
- Quiet hours are on, 21:00 to 08:00 local time, and care is capped at one
  notification a day (adjustable to 3).
"""
from datetime import time
from typing import Any, Dict, Mapping, Optional

PREFS_VERSION = 2

# The defaults that shipped before survey-2026-update. Used only to migrate
# preference snapshots saved under the old PATCH behavior (see below).
LEGACY_DEFAULTS: Dict[str, Any] = {
    "push_care_due": True,
    "push_care_overdue": True,
    "push_streak_at_risk": True,
    "push_streak_milestone": True,
    "push_swap_match": True,
    "push_swap_message": True,
    "push_kudos_received": False,
    "push_sitter_logged": True,
    "push_bloom_hour": True,
    "push_bouquet_reminder": True,
    "push_grove_challenge": True,
    "email_digest": True,
    "email_swap_match": True,
    "quiet_hours_enabled": False,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
}

DEFAULT_NOTIFICATION_PREFS: Dict[str, Any] = {
    "push_care_due": True,
    "push_care_overdue": False,
    "push_streak_at_risk": False,
    "push_streak_milestone": False,
    "push_swap_match": False,
    "push_swap_message": False,
    "push_kudos_received": False,
    "push_sitter_logged": True,
    "push_bloom_hour": False,
    "push_bouquet_reminder": True,
    "push_grove_challenge": False,
    # Email is unchanged in this pass; the survey evidence is about push volume.
    "email_digest": True,
    "email_swap_match": True,
    "quiet_hours_enabled": True,
    "quiet_hours_start": "21:00",
    "quiet_hours_end": "08:00",
    "care_daily_cap": 1,
}

CARE_DAILY_CAP_CHOICES = (1, 2, 3)

# Notification type -> the push preference that controls it.
CARE_TYPE_PREF_KEYS = {
    "care_due": "push_care_due",
    "care_overdue": "push_care_overdue",
    "bouquet_reminder": "push_bouquet_reminder",
}


def explicit_prefs(stored: Optional[Mapping[str, Any]]) -> Dict[str, Any]:
    """The preferences a user actually chose, from what is stored on their record.

    Before this version, every PATCH saved the full merged dict, so a user who
    flipped one toggle also had every other default of the day written to
    their record. For those legacy snapshots (no `prefs_version`), a value that
    equals the old default is treated as unset, so the new quieter default
    applies. A value that differs from the old default was a real choice and
    is kept. Version 2 records only ever store keys the user changed.
    """
    if not isinstance(stored, Mapping):
        return {}
    if stored.get("prefs_version") == PREFS_VERSION:
        return {k: v for k, v in stored.items() if k != "prefs_version"}
    return {
        k: v
        for k, v in stored.items()
        if k != "prefs_version" and not (k in LEGACY_DEFAULTS and LEGACY_DEFAULTS[k] == v)
    }


def merge_prefs(stored: Optional[Mapping[str, Any]]) -> Dict[str, Any]:
    """Effective preferences: current defaults, overlaid with explicit choices."""
    return {**DEFAULT_NOTIFICATION_PREFS, **explicit_prefs(stored)}


def stored_after_update(stored: Optional[Mapping[str, Any]], updates: Mapping[str, Any]) -> Dict[str, Any]:
    """What to write back to the user record: explicit choices only, versioned."""
    return {**explicit_prefs(stored), **dict(updates), "prefs_version": PREFS_VERSION}


def _parse_hhmm(value: Any) -> Optional[time]:
    try:
        hours, minutes = str(value).split(":")
        return time(int(hours), int(minutes))
    except (ValueError, TypeError):
        return None


def in_quiet_hours(prefs: Mapping[str, Any], local_time: time) -> bool:
    """True if `local_time` falls inside the user's quiet window. Handles overnight windows."""
    if not prefs.get("quiet_hours_enabled"):
        return False
    start = _parse_hhmm(prefs.get("quiet_hours_start"))
    end = _parse_hhmm(prefs.get("quiet_hours_end"))
    if start is None or end is None or start == end:
        return False
    if start < end:
        return start <= local_time < end
    return local_time >= start or local_time < end


def care_daily_cap(prefs: Mapping[str, Any]) -> int:
    cap = prefs.get("care_daily_cap")
    return cap if cap in CARE_DAILY_CAP_CHOICES else DEFAULT_NOTIFICATION_PREFS["care_daily_cap"]


def may_send_care_notification(
    prefs: Mapping[str, Any], ntype: str, sent_today: int, local_time: time
) -> bool:
    """Whether a care push may go out now.

    No care sender exists yet ("Wave B"). When it is built it must call this
    before every care push, bundle every due plant into one message, and hold
    (not drop) anything that lands in quiet hours.
    """
    pref_key = CARE_TYPE_PREF_KEYS.get(ntype)
    if pref_key is None or not prefs.get(pref_key, False):
        return False
    if sent_today >= care_daily_cap(prefs):
        return False
    return not in_quiet_hours(prefs, local_time)
