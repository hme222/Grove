"""Phase 14C.4 — Goal/Badge unification: progress computation.

Source of truth for how a "goal" (a pinned locked badge) shows progress on
the Care tab. Each entry maps a badge slug to:
  - metric:  one of a known set of countable signals (see _METRIC_RESOLVERS)
  - target:  the threshold the user is working toward
  - label:   short human progress label e.g. "plants", "waterings logged"

Unearnable badges are NOT in this table — they cannot be pinned as goals
because they have no automated progress signal (admin-grantable only).
"""
from typing import Dict, Optional, Tuple
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Slug → (metric, target, label) table
# ---------------------------------------------------------------------------
BADGE_PROGRESS_RULES: Dict[str, Tuple[str, int, str]] = {
    # Streak family
    "streak_7": ("streak", 7, "day streak"),
    "streak_14": ("streak", 14, "day streak"),
    "streak_30": ("streak", 30, "day streak"),
    "streak_60": ("streak", 60, "day streak"),
    "streak_100": ("streak", 100, "day streak"),
    "streak_180": ("streak", 180, "day streak"),
    "streak_365": ("streak", 365, "day streak"),
    "streak_500": ("streak", 500, "day streak"),
    "streak_1000": ("streak", 1000, "day streak"),
    # Watering
    "watering_first": ("water_count", 1, "watering"),
    "watering_10": ("water_count", 10, "waterings"),
    "watering_50": ("water_count", 50, "waterings"),
    "watering_100": ("water_count", 100, "waterings"),
    "watering_500": ("water_count", 500, "waterings"),
    "watering_1000": ("water_count", 1000, "waterings"),
    # Fertilizing
    "fert_first": ("fert_count", 1, "fertilization"),
    "fert_25": ("fert_count", 25, "fertilizations"),
    "fert_100": ("fert_count", 100, "fertilizations"),
    "fert_500": ("fert_count", 500, "fertilizations"),
    # Repotting
    "repot_first": ("repot_count", 1, "repot"),
    "repot_5": ("repot_count", 5, "repots"),
    "repot_25": ("repot_count", 25, "repots"),
    "repot_50": ("repot_count", 50, "repots"),
    # Pruning
    "prune_first": ("prune_count", 1, "pruning"),
    "prune_25": ("prune_count", 25, "prunings"),
    "prune_100": ("prune_count", 100, "prunings"),
    # Propagation
    "prop_first": ("prop_count", 1, "propagation"),
    "prop_5": ("prop_count", 5, "propagations"),
    "prop_25": ("prop_count", 25, "propagations"),
    "prop_50": ("prop_count", 50, "propagations"),
    "prop_100": ("prop_count", 100, "propagations"),
    # Health
    "health_hero": ("plants_at_100", 5, "plants at full health"),
    "plant_rescue": ("rescued_plants", 1, "plant rescued"),
    # Plant counts
    "plant_first": ("plants_count", 1, "plant"),
    "plant_5": ("plants_count", 5, "plants"),
    "plant_collector_bronze": ("plants_count", 10, "plants"),
    "plant_collector_silver": ("plants_count", 25, "plants"),
    "plant_collector_gold": ("plants_count", 50, "plants"),
    "plant_collector_platinum": ("plants_count", 100, "plants"),
    "plant_collector_legendary": ("plants_count", 200, "plants"),
    # Bouquets
    "bouquet_first": ("bouquets_count", 1, "bouquet"),
    "bouquet_5": ("bouquets_count", 5, "bouquets"),
    "bouquet_collector_bronze": ("bouquets_count", 10, "bouquets"),
    "bouquet_collector_silver": ("bouquets_count", 25, "bouquets"),
    "bouquet_collector_gold": ("bouquets_count", 50, "bouquets"),
    "bouquet_collector_platinum": ("bouquets_count", 100, "bouquets"),
    # Species variety
    "species_5": ("species_count", 5, "species"),
    "species_10": ("species_count", 10, "species"),
    "species_25": ("species_count", 25, "species"),
    "species_50": ("species_count", 50, "species"),
    # Community
    "post_first": ("posts_count", 1, "post"),
    "post_10": ("posts_count", 10, "posts"),
    "kudos_given_first": ("kudos_given", 1, "kudos given"),
    "kudos_received_first": ("kudos_received", 1, "kudos received"),
    "grove_joined_first": ("grove_memberships", 1, "Grove"),
    # Swaps
    "swap_first": ("swaps_completed", 1, "swap"),
    # Tutorial
    "light_reader": ("lighting_tutorial_seen", 1, "tutorial complete"),
    # Time milestones
    "grove_1_month": ("account_age_days", 30, "days on Grove"),
    "grove_6_months": ("account_age_days", 180, "days on Grove"),
    "grove_1_year": ("account_age_days", 365, "days on Grove"),
    # Grove chat
    "grove_chat_first": ("chat_messages_sent", 1, "Grove chat sent"),
    "grove_chat_50": ("chat_messages_sent", 50, "Grove chats sent"),
    # Verification (binary; pinning verifies users see the pact prompt)
    "verified_user": ("is_verified_flag", 1, "complete the pact"),
}


def can_be_pinned_as_goal(slug: str) -> bool:
    """Only badges with a defined progress signal can be pinned."""
    return slug in BADGE_PROGRESS_RULES


# ---------------------------------------------------------------------------
# Metric resolvers — each takes the snapshot dict and returns an int count.
# The snapshot is built once per request via collect_user_snapshot().
# ---------------------------------------------------------------------------
def _account_age_days(user: dict) -> int:
    try:
        created = datetime.fromisoformat((user.get("created_at") or "").replace("Z", "+00:00"))
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        return int((datetime.now(timezone.utc) - created).total_seconds() / 86400)
    except Exception:
        return 0


async def collect_user_snapshot(db, user_id: str) -> dict:
    """Compute every metric we need for goal progress in one batch.

    This mirrors check_and_award_badges() so the displayed progress matches
    what the awarder will see on the next sweep — no UI/award drift.
    """
    user = await db.users.find_one({"id": user_id}) or {}
    streak = await db.streaks.find_one({"user_id": user_id}) or {}
    streak_value = max(streak.get("current_streak", 0) or 0,
                       streak.get("longest_streak", 0) or 0)
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
    ]
    action_counts = {row["_id"]: row["count"] async for row in db.care_logs.aggregate(pipeline)}
    plants_count = await db.plants.count_documents(
        {"user_id": user_id, "is_archived": {"$ne": True}}
    )
    bouquets_count = await db.bouquets.count_documents({"user_id": user_id})
    distinct_species = await db.plants.distinct(
        "species_id", {"user_id": user_id, "species_id": {"$ne": None}}
    )
    species_count = len([s for s in distinct_species if s])
    posts_count = await db.posts.count_documents({"user_id": user_id})
    kudos_given = await db.kudos.count_documents({"user_id": user_id})
    user_post_ids = [p["id"] async for p in db.posts.find({"user_id": user_id}, {"id": 1})]
    kudos_received = (
        await db.kudos.count_documents({"post_id": {"$in": user_post_ids}})
        if user_post_ids else 0
    )
    grove_memberships = await db.grove_members.count_documents({"user_id": user_id})
    chat_messages_sent = await db.grove_messages.count_documents(
        {"user_id": user_id, "is_deleted": {"$ne": True}}
    )
    swaps_completed = 0
    try:
        swaps_completed = await db.swaps.count_documents({
            "$or": [{"user_id": user_id}, {"requester_id": user_id}, {"recipient_id": user_id}],
            "status": "completed",
        })
    except Exception:
        swaps_completed = 0
    plants_at_100 = await db.plants.count_documents({
        "user_id": user_id, "is_archived": {"$ne": True}, "health_score": {"$gte": 100}
    })
    rescued_plants = await db.plants.count_documents({
        "user_id": user_id, "is_archived": {"$ne": True},
        "was_unhealthy": True, "health_score": {"$gte": 80},
    })
    tutorials_seen = set(user.get("tutorials_seen") or [])

    return {
        "streak": streak_value,
        "water_count": action_counts.get("water", 0),
        "fert_count": action_counts.get("fertilize", 0),
        "repot_count": action_counts.get("repot", 0),
        "prune_count": action_counts.get("prune", 0),
        "prop_count": action_counts.get("propagate", 0),
        "plants_count": plants_count,
        "bouquets_count": bouquets_count,
        "species_count": species_count,
        "posts_count": posts_count,
        "kudos_given": kudos_given,
        "kudos_received": kudos_received,
        "grove_memberships": grove_memberships,
        "chat_messages_sent": chat_messages_sent,
        "swaps_completed": swaps_completed,
        "plants_at_100": plants_at_100,
        "rescued_plants": rescued_plants,
        "lighting_tutorial_seen": 1 if "lighting" in tutorials_seen else 0,
        "is_verified_flag": 1 if user.get("is_verified") or user.get("verified_user") else 0,
        "account_age_days": _account_age_days(user),
    }


def progress_for(slug: str, snapshot: dict) -> Optional[dict]:
    """Compute {current, target, pct, label, complete} for a single slug.

    Returns None if the slug isn't a pinnable goal."""
    rule = BADGE_PROGRESS_RULES.get(slug)
    if not rule:
        return None
    metric, target, label = rule
    current = int(snapshot.get(metric, 0) or 0)
    capped = min(current, target)
    pct = 0.0 if target <= 0 else round(capped / target, 4)
    return {
        "current": current,
        "target": target,
        "pct": pct,
        "label": label,
        "complete": current >= target,
    }
