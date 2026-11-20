"""Who can use what: Pro status, the free photo-ID allowance, and the cost caps on the AI features.

The rules come from docs/product/pricing-and-launch.md (draft v8). Every number is one setting:

  FREE_ID_ALLOWANCE      free photo IDs per account, for life (decided: 3). The sales page reads the same number.
  AI_DAILY_CAP           most AI photo calls one account can make in a rolling 24 hours (plan's starting point: 30)
  AI_MONTHLY_CAP         most in a rolling 30 days (plan's starting point: 300)
  AI_BURST_PER_MINUTE    most in one minute. Not in the plan: a guard so one account can't run up cost in seconds.
  DIAGNOSIS_REQUIRES_PRO sick-plant diagnosis is Pro only (decided). `off` lifts it, for example to run the
                         help_diagnosis A/B test on free accounts. It is checked after the experiment arm.

Who is Pro: a `tier` of pro or florist_pro, or a `pro_until` date still in the future. `pro_until` is how a founder's
year, a friends-and-family comp (free through Jan 31, 2027) or any other grant is recorded; `pro_source` says which.
Because it lives on the account and not on a TestFlight install, it carries over to the App Store version.

A free ID is used only when the photo is identified with confidence, so a blurry photo or a model failure never costs a
new owner one of their three. The limit is checked before the model is called and the count goes up after a good result,
so two requests in the same instant could overshoot by one; the burst cap keeps that small.
"""
import os
from datetime import datetime, timedelta, timezone

PRO_TIERS = {"pro", "florist_pro"}

DEFAULTS = {
    "FREE_ID_ALLOWANCE": 3,
    "AI_DAILY_CAP": 30,
    "AI_MONTHLY_CAP": 300,
    "AI_BURST_PER_MINUTE": 6,
}


def _int_setting(name: str) -> int:
    try:
        value = int(os.environ.get(name, DEFAULTS[name]))
    except (TypeError, ValueError):
        return DEFAULTS[name]
    return value if value >= 0 else DEFAULTS[name]


def free_id_allowance() -> int:
    return _int_setting("FREE_ID_ALLOWANCE")


def diagnosis_requires_pro() -> bool:
    return os.environ.get("DIAGNOSIS_REQUIRES_PRO", "on").strip().lower() != "off"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def parse_dt(value):
    """A datetime from a datetime or an ISO string (a trailing Z is fine). None when it is not one."""
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str) and value.strip():
        try:
            dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        except ValueError:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None


def pro_until(user, now=None):
    """The end of a granted Pro period if it is still running, else None."""
    until = parse_dt((user or {}).get("pro_until"))
    return until if until and until > (now or _now()) else None


def is_pro(user, now=None) -> bool:
    user = user or {}
    return user.get("tier") in PRO_TIERS or pro_until(user, now) is not None


def free_ids_used(user) -> int:
    used = ((user or {}).get("ai_usage") or {}).get("free_ids_used", 0)
    return used if isinstance(used, int) and used >= 0 else 0


def free_ids_left(user) -> int:
    return max(0, free_id_allowance() - free_ids_used(user))


def summary(user, now=None) -> dict:
    """What the app needs to show: Pro or not, until when, and the free IDs left."""
    now = now or _now()
    until = pro_until(user, now)
    pro = is_pro(user, now)
    return {
        "pro": pro,
        "pro_until": until.isoformat() if until else None,
        "pro_source": (user or {}).get("pro_source") if until else None,
        "free_ids": {
            "allowance": free_id_allowance(),
            "used": free_ids_used(user),
            "left": free_ids_left(user),
        },
        "diagnosis_requires_pro": diagnosis_requires_pro(),
    }


# ---------- what to say when something is refused ----------
# The words tell a new owner what they can still do. Nothing here blocks adding a plant: the person can always type
# the name instead.

def free_limit_detail() -> dict:
    n = free_id_allowance()
    return {
        "code": "free_id_limit",
        "message": f"You’ve used your {n} free photo IDs. You can still add a plant by searching for its name.",
        "allowance": n,
    }


def pro_required_detail() -> dict:
    return {
        "code": "pro_required",
        "message": "Sick-plant diagnosis is part of FloraGrove Pro. The symptom checker on Help my plant is free.",
    }


def cap_detail(code: str) -> dict:
    when = {
        "fair_use_burst": "a few photos in a row. Wait a minute and try again.",
        "fair_use_daily": "today’s photo limit. It resets over the next 24 hours.",
        "fair_use_monthly": "this month’s photo limit. It resets gradually over the next 30 days.",
    }[code]
    return {"code": code, "message": f"You’ve reached {when} You can still add a plant by searching for its name."}


# ---------- usage records ----------

async def over_cap(db, user_id, now=None):
    """The code of the first cap this account has hit (burst, daily, monthly), or None."""
    now = now or _now()
    checks = (
        ("fair_use_burst", now - timedelta(minutes=1), _int_setting("AI_BURST_PER_MINUTE")),
        ("fair_use_daily", now - timedelta(days=1), _int_setting("AI_DAILY_CAP")),
        ("fair_use_monthly", now - timedelta(days=30), _int_setting("AI_MONTHLY_CAP")),
    )
    for code, since, limit in checks:
        if await db.ai_usage.count_documents({"user_id": user_id, "at": {"$gte": since}}) >= limit:
            return code
    return None


async def record_call(db, user_id, kind, now=None):
    await db.ai_usage.insert_one({"user_id": user_id, "kind": kind, "at": now or _now()})


async def use_free_id(db, user_id):
    await db.users.update_one({"id": user_id}, {"$inc": {"ai_usage.free_ids_used": 1}})


# ---------- granting Pro (scripts/grant_pro.py) ----------

GRANT_SOURCES = ("founder", "friends_family", "comp")


def plan_grant(user, until, source, now=None):
    """What granting Pro until `until` would do to this account: (new_until, action, note).

    action is "grant" (nothing was running), "extend" (a shorter grant is running), "keep" (a longer or equal one is
    running, so nothing changes) or "skip" (the account is on a paid tier, so a grant adds nothing). A grant never
    shortens one that is already running, and an expired one is replaced.
    """
    now = now or _now()
    if source not in GRANT_SOURCES:
        raise ValueError(f"source must be one of {', '.join(GRANT_SOURCES)}")
    if until <= now:
        raise ValueError("the end date has to be in the future")
    if (user or {}).get("tier") in PRO_TIERS:
        return None, "skip", "already on a paid tier"
    current = pro_until(user, now)
    if current is None:
        return until, "grant", ""
    if current >= until:
        return current, "keep", f"already Pro until {current.date()} ({(user or {}).get('pro_source') or 'no source recorded'})"
    return until, "extend", f"was Pro until {current.date()}"
