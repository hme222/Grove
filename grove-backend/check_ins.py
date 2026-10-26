"""Weekly check-ins: a gentle rhythm that replaces the daily care streak.

A check-in is a day on which someone paid attention to a plant, not a day on
which they watered. These count:
  - a soil check, or another "looked at it" action (see LOOKED_ACTIONS)
  - a plant photo (a photo upload, or a care log that carries a photo)
  - finishing a lesson

Watering, misting, feeding and the like never count on their own, so doing
more of them earns nothing extra. One day is one check-in, however many
things happened on it.

The weekly goal is WEEKLY_GOAL check-ins in a calendar week (Monday to
Sunday, UTC). Nothing ever resets and nothing is lost: a missed week is just
a week without a tick, and weeks_goal_met only goes up. There are no alerts.

The pure functions here need no database. The two database helpers write only
to the `check_ins` collection, and read care logs that already exist, so
people who had a daily streak start with their real history.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Set

WEEKLY_GOAL = 3

# Care actions that mean "I looked at the plant". A plain watering is not one.
LOOKED_ACTIONS = frozenset({"soil_check", "inspect", "health_check", "check"})
PHOTO_ACTION = "photo"

# Kinds recorded in the check_ins collection (care logs are read directly).
KIND_LESSON = "lesson"
KIND_PHOTO = "photo"


def is_check_in_log(log: Dict[str, Any]) -> bool:
    """True if a care log counts as a check-in."""
    action = (log or {}).get("action")
    if action in LOOKED_ACTIONS or action == PHOTO_ACTION:
        return True
    return bool((log or {}).get("photo_url"))


def actions_count_as_check_in(actions: Iterable[str]) -> bool:
    return any(a in LOOKED_ACTIONS or a == PHOTO_ACTION for a in actions)


def week_start(day: date) -> date:
    """The Monday of the calendar week that contains `day`."""
    return day - timedelta(days=day.weekday())


def _as_date(value: Any) -> Optional[date]:
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).date() if value.tzinfo else value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str) and value:
        try:
            return _as_date(datetime.fromisoformat(value.replace("Z", "+00:00")))
        except ValueError:
            return None
    return None


def summarize(days: Iterable[Any], today: Optional[date] = None) -> Dict[str, Any]:
    """Turn check-in days into the numbers the app shows. Pure."""
    today = today or datetime.now(timezone.utc).date()
    unique: Set[date] = {d for d in (_as_date(v) for v in days) if d is not None and d <= today}
    per_week: Dict[date, int] = {}
    for d in unique:
        wk = week_start(d)
        per_week[wk] = per_week.get(wk, 0) + 1
    this_week = per_week.get(week_start(today), 0)
    return {
        "weekly_goal": WEEKLY_GOAL,
        "this_week": this_week,
        "goal_met_this_week": this_week >= WEEKLY_GOAL,
        "weeks_goal_met": sum(1 for n in per_week.values() if n >= WEEKLY_GOAL),
        "total_check_ins": len(unique),
        "last_check_in": max(unique).isoformat() if unique else None,
    }


EMPTY_SUMMARY: Dict[str, Any] = summarize([])


async def collect_days(db, user_id: str) -> List[str]:
    """Every day this person checked in: qualifying care logs plus recorded check-ins."""
    days: List[str] = []
    logs = await db.care_logs.find(
        {"user_id": user_id, "$or": [
            {"action": {"$in": sorted(LOOKED_ACTIONS | {PHOTO_ACTION})}},
            {"photo_url": {"$nin": ["", None]}},
        ]},
        {"_id": 0, "logged_at": 1, "action": 1, "photo_url": 1},
    ).to_list(20000)
    for log in logs:
        if is_check_in_log(log) and log.get("logged_at"):
            days.append(log["logged_at"])
    recorded = await db.check_ins.find({"user_id": user_id}, {"_id": 0, "date": 1}).to_list(20000)
    days.extend(r["date"] for r in recorded if r.get("date"))
    return days


async def get_summary(db, user_id: str, today: Optional[date] = None) -> Dict[str, Any]:
    return summarize(await collect_days(db, user_id), today)


async def record_check_in(db, user_id: str, kind: str, when: Optional[datetime] = None) -> None:
    """Record today's check-in for a source that is not a care log (lesson, photo).

    One document per person per day, so repeats on the same day change nothing.
    """
    when = when or datetime.now(timezone.utc)
    day = when.astimezone(timezone.utc).date().isoformat()
    await db.check_ins.update_one(
        {"user_id": user_id, "date": day},
        {"$addToSet": {"kinds": kind}, "$setOnInsert": {"created_at": when.isoformat()}},
        upsert=True,
    )
