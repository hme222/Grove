from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from auth import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    decode_access_token, decode_refresh_token, get_current_user, get_optional_user
)
from storage import init_storage, put_object, get_object, generate_storage_path
from ai_service import (
    suggest_watering_schedule, generate_plant_biography, generate_plant_personality,
    call_claude, call_claude_vision, parse_json_response,
    summarize_species_performance,
)
import ai_service
from hardiness_zones import (
    lookup_zone, USDA_DESCRIPTIONS, RHS_DESCRIPTIONS,
    US_ZIP_PREFIX_TO_ZONE, UK_POSTCODE_AREA_TO_RHS,
)
from seed import seed_database
import missions as missions_mod
import secrets
import base64

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'grove_db')]

app = FastAPI(title="Grove API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ HELPERS ============

def serialize_doc(doc):
    if doc is None:
        return None
    if '_id' in doc:
        del doc['_id']
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, date):
            doc[key] = value.isoformat()
    return doc

CARE_ACTION_MINUTES = {
    'water': 2, 'mist': 1, 'feed': 3, 'repot': 20, 'prune': 10,
    'propagate': 15, 'photo': 1, 'note': 1, 'top_up': 1,
    'change_water': 3, 'flush': 5, 'add_nutrients': 3
}

def calculate_plant_status(plant: dict) -> str:
    if plant.get('grow_medium') in ('propagation_jar', 'water'):
        return 'propagating'
    next_due = plant.get('next_water_due')
    if not next_due:
        return 'healthy'
    if isinstance(next_due, str):
        try:
            next_due = datetime.fromisoformat(next_due)
        except (ValueError, TypeError):
            return 'healthy'
    now = datetime.now(timezone.utc)
    if not next_due.tzinfo:
        next_due = next_due.replace(tzinfo=timezone.utc)
    days_until = (next_due - now).total_seconds() / 86400
    if days_until < -1:
        return 'urgent'
    elif days_until < 1:
        return 'needs_water'
    return 'healthy'


def compute_status_reason(plant: dict, status: str) -> str:
    """Phase 14 Part 4.4 — every urgent/needs_water status carries a human reason."""
    if status == 'propagating':
        return 'In water — soil-moisture rules do not apply.'
    nd_raw = plant.get('next_water_due')
    lw_raw = plant.get('last_watered_at')
    freq = plant.get('watering_frequency_days') or 7
    try:
        now = datetime.now(timezone.utc)
        if isinstance(nd_raw, str) and nd_raw:
            nd = datetime.fromisoformat(nd_raw)
            if not nd.tzinfo:
                nd = nd.replace(tzinfo=timezone.utc)
            overdue_days = int((now - nd).total_seconds() / 86400)
        else:
            overdue_days = 0
        last_days = None
        if isinstance(lw_raw, str) and lw_raw:
            lw = datetime.fromisoformat(lw_raw)
            if not lw.tzinfo:
                lw = lw.replace(tzinfo=timezone.utc)
            last_days = int((now - lw).total_seconds() / 86400)
    except Exception:
        overdue_days, last_days = 0, None

    if status == 'urgent':
        if last_days is not None and last_days >= 1:
            return f"Hasn't been watered in {last_days} days — overdue by {max(1, overdue_days)}."
        return f"Overdue by {max(1, overdue_days)} days on its {freq}-day schedule."
    if status == 'needs_water':
        return f"Soil-dry estimate based on your {freq}-day watering pattern."
    return ""

async def update_streak(user_id: str):
    today = datetime.now(timezone.utc).date().isoformat()
    streak = await db.streaks.find_one({"user_id": user_id})
    if not streak:
        await db.streaks.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id,
            "current_streak": 1, "longest_streak": 1,
            "last_log_date": today, "paused": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        return
    last_date = streak.get('last_log_date')
    if last_date == today:
        return
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    current = streak.get('current_streak', 0)
    longest = streak.get('longest_streak', 0)
    if last_date == yesterday:
        current += 1
    else:
        current = 1
    longest = max(longest, current)
    await db.streaks.update_one(
        {"user_id": user_id},
        {"$set": {"current_streak": current, "longest_streak": longest,
                  "last_log_date": today, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    # Streak milestone notifications
    milestone_bodies = {
        7: "Your social feed just unlocked. See what your grove is growing.",
        14: "Two weeks of steady care. Your plants feel it.",
        30: "Swap matching just unlocked. See what's available in your grove.",
        60: "Sixty days of care. You've built a real rhythm.",
        100: "One hundred days of care. That's grove-level commitment.",
    }
    if current in milestone_bodies:
        await create_notification(
            user_id=user_id,
            ntype="streak_milestone",
            title=f"{current} days of care",
            body=milestone_bodies[current],
            entity_type="streak",
            entity_id=str(current),
            data={"streak_days": current},
        )

def compute_health_breakdown(plant: dict, recent_logs: list) -> dict:
    """6-factor explainable plant health breakdown. Each factor 0-100.
    Final score = weighted average. Returns factors, tips, and total."""
    now = datetime.now(timezone.utc)
    factors = []
    tips = []

    # 1. Watering recency — how close to / past due
    freq = plant.get('watering_frequency_days') or 7
    last = plant.get('last_watered_at')
    try:
        last_dt = datetime.fromisoformat(last) if isinstance(last, str) else None
    except Exception:
        last_dt = None
    if last_dt:
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        days_since = (now - last_dt).total_seconds() / 86400.0
        ratio = days_since / max(freq, 1)
        if ratio <= 1.0:
            recency_score = 100
        elif ratio <= 1.3:
            recency_score = 80
        elif ratio <= 1.7:
            recency_score = 55
        elif ratio <= 2.2:
            recency_score = 30
        else:
            recency_score = 10
    else:
        recency_score = 50
        tips.append("Log a recent watering to anchor this plant's rhythm.")
    factors.append({
        "key": "watering_recency",
        "label": "Watering recency",
        "score": int(recency_score),
        "weight": 25,
    })
    if recency_score < 70:
        tips.append("Water when this plant comes due to lift the recency factor.")

    # 2. Schedule consistency — recent care cadence
    water_logs = [l for l in recent_logs if l.get('action') == 'water']
    if len(water_logs) >= 3:
        consistency = 95
    elif len(water_logs) == 2:
        consistency = 75
    elif len(water_logs) == 1:
        consistency = 55
    else:
        consistency = 35
        tips.append("Build a cadence — 2-3 logged waterings strengthens consistency.")
    factors.append({
        "key": "schedule_consistency",
        "label": "Schedule consistency",
        "score": consistency,
        "weight": 20,
    })

    # 3. Care variety — different action types
    action_types = {l.get('action') for l in recent_logs if l.get('action')}
    variety_score = min(100, 40 + len(action_types) * 15)
    factors.append({
        "key": "care_variety",
        "label": "Care variety",
        "score": variety_score,
        "weight": 10,
    })
    if variety_score < 80:
        tips.append("Mix in fertilizing, pruning, or misting logs for well-rounded care.")

    # 4. Grow medium match
    medium_score = 85 if plant.get('grow_medium') else 60
    factors.append({
        "key": "grow_medium",
        "label": "Grow medium",
        "score": medium_score,
        "weight": 10,
    })
    if not plant.get('grow_medium'):
        tips.append("Set a grow medium so care suggestions can align with it.")

    # 5. Notes & observations — user engagement with the plant
    notes_present = 1 if (plant.get('notes') or '').strip() else 0
    note_logs = len([l for l in recent_logs if (l.get('notes') or '').strip()])
    engagement = min(100, 40 + notes_present * 25 + note_logs * 10)
    factors.append({
        "key": "observations",
        "label": "Observations & notes",
        "score": engagement,
        "weight": 15,
    })
    if engagement < 80:
        tips.append("Add notes when you log care — short observations compound.")

    # 6. Archive/vitality — if archived, cap at 40
    vitality = 100 if not plant.get('is_archived') else 40
    factors.append({
        "key": "vitality",
        "label": "Vitality",
        "score": vitality,
        "weight": 20,
    })

    total_weight = sum(f['weight'] for f in factors)
    total_score = int(round(sum(f['score'] * f['weight'] for f in factors) / max(total_weight, 1)))

    return {
        "total_score": total_score,
        "factors": factors,
        "tips": tips[:4],  # keep it short
    }


async def check_and_award_badges(user_id: str):
    """Phase 14C.3.b — Earning logic for the top 60 highest-signal badges.

    All other badges in the 170-catalog ship as schema-only and are awarded
    via the admin grant endpoint. Idempotent: existing user_badges entries
    are not duplicated.
    """
    # Snapshot user state once.
    user = await db.users.find_one({"id": user_id}) or {}
    streak = await db.streaks.find_one({"user_id": user_id}) or {}
    current_streak = streak.get("current_streak", 0) or 0
    longest_streak = streak.get("longest_streak", 0) or 0
    streak_value = max(current_streak, longest_streak)

    # Care-log action counts (single aggregate query)
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
    ]
    action_counts = {row["_id"]: row["count"] async for row in db.care_logs.aggregate(pipeline)}

    plants_count = await db.plants.count_documents({"user_id": user_id, "is_archived": {"$ne": True}})
    bouquets_count = await db.bouquets.count_documents({"user_id": user_id})
    distinct_species = await db.plants.distinct("species_id", {"user_id": user_id, "species_id": {"$ne": None}})
    species_count = len([s for s in distinct_species if s])
    posts_count = await db.posts.count_documents({"user_id": user_id})
    kudos_given = await db.kudos.count_documents({"user_id": user_id})
    # Kudos received: count rows where post_id belongs to one of user's posts.
    user_post_ids = [p["id"] async for p in db.posts.find({"user_id": user_id}, {"id": 1})]
    kudos_received = 0
    if user_post_ids:
        kudos_received = await db.kudos.count_documents({"post_id": {"$in": user_post_ids}})
    grove_memberships = await db.grove_members.count_documents({"user_id": user_id})
    # Phase 14C.3.c — chat message count (excludes soft-deleted)
    chat_messages_sent = await db.grove_messages.count_documents({
        "user_id": user_id, "is_deleted": {"$ne": True}
    })
    swaps_completed = 0
    try:
        # Future-proofing: when a `swaps` collection ships in the swap-matching
        # epic, this will start awarding swap_first automatically.
        swaps_completed = await db.swaps.count_documents({
            "$or": [{"user_id": user_id}, {"requester_id": user_id}, {"recipient_id": user_id}],
            "status": "completed",
        })
    except Exception:
        swaps_completed = 0

    # Plant counts at health 100
    plants_at_100 = await db.plants.count_documents({
        "user_id": user_id, "is_archived": {"$ne": True}, "health_score": {"$gte": 100}
    })
    # Plant rescue: any plant where was_unhealthy AND now health >= 80
    rescued_plants = await db.plants.count_documents({
        "user_id": user_id, "is_archived": {"$ne": True},
        "was_unhealthy": True, "health_score": {"$gte": 80},
    })

    # Account age (UTC)
    age_days = 0
    try:
        created = datetime.fromisoformat((user.get("created_at") or "").replace("Z", "+00:00"))
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age_days = (datetime.now(timezone.utc) - created).total_seconds() / 86400
    except Exception:
        age_days = 0

    # Tutorials seen — for light_reader and similar
    tutorials_seen = set(user.get("tutorials_seen") or [])

    # Existing badges set
    existing = await db.user_badges.find({"user_id": user_id}).to_list(500)
    existing_slugs = {b.get("badge_slug") for b in existing}

    to_award: list = []

    def maybe(slug: str, condition: bool):
        if condition and slug not in existing_slugs:
            to_award.append(slug)

    # --- Streak family (9) ---
    maybe("streak_7",   streak_value >= 7)
    maybe("streak_14",  streak_value >= 14)
    maybe("streak_30",  streak_value >= 30)
    maybe("streak_60",  streak_value >= 60)
    maybe("streak_100", streak_value >= 100)
    maybe("streak_180", streak_value >= 180)
    maybe("streak_365", streak_value >= 365)
    maybe("streak_500", streak_value >= 500)
    maybe("streak_1000", streak_value >= 1000)

    # --- Watering family (6) ---
    water_count = action_counts.get("water", 0)
    maybe("watering_first", water_count >= 1)
    maybe("watering_10",    water_count >= 10)
    maybe("watering_50",    water_count >= 50)
    maybe("watering_100",   water_count >= 100)
    maybe("watering_500",   water_count >= 500)
    maybe("watering_1000",  water_count >= 1000)

    # --- Fertilizing family (4) ---
    fert_count = action_counts.get("fertilize", 0)
    maybe("fert_first", fert_count >= 1)
    maybe("fert_25",    fert_count >= 25)
    maybe("fert_100",   fert_count >= 100)
    maybe("fert_500",   fert_count >= 500)

    # --- Repotting family (4) ---
    repot_count = action_counts.get("repot", 0)
    maybe("repot_first", repot_count >= 1)
    maybe("repot_5",     repot_count >= 5)
    maybe("repot_25",    repot_count >= 25)
    maybe("repot_50",    repot_count >= 50)

    # --- Pruning family (3) ---
    prune_count = action_counts.get("prune", 0)
    maybe("prune_first", prune_count >= 1)
    maybe("prune_25",    prune_count >= 25)
    maybe("prune_100",   prune_count >= 100)

    # --- Propagation family (5) ---
    prop_count = action_counts.get("propagate", 0)
    maybe("prop_first", prop_count >= 1)
    maybe("prop_5",     prop_count >= 5)
    maybe("prop_25",    prop_count >= 25)
    maybe("prop_50",    prop_count >= 50)
    maybe("prop_100",   prop_count >= 100)

    # --- Health (1) + plant rescue (1) ---
    maybe("health_hero",  plants_at_100 >= 5)
    maybe("plant_rescue", rescued_plants >= 1)

    # --- Plant counts (7) ---
    maybe("plant_first",                  plants_count >= 1)
    maybe("plant_5",                      plants_count >= 5)
    maybe("plant_collector_bronze",       plants_count >= 10)
    maybe("plant_collector_silver",       plants_count >= 25)
    maybe("plant_collector_gold",         plants_count >= 50)
    maybe("plant_collector_platinum",     plants_count >= 100)
    maybe("plant_collector_legendary",    plants_count >= 200)

    # --- Bouquet counts (6) ---
    maybe("bouquet_first",                  bouquets_count >= 1)
    maybe("bouquet_5",                      bouquets_count >= 5)
    maybe("bouquet_collector_bronze",       bouquets_count >= 10)
    maybe("bouquet_collector_silver",       bouquets_count >= 25)
    maybe("bouquet_collector_gold",         bouquets_count >= 50)
    maybe("bouquet_collector_platinum",     bouquets_count >= 100)

    # --- Species variety (4) ---
    maybe("species_5",  species_count >= 5)
    maybe("species_10", species_count >= 10)
    maybe("species_25", species_count >= 25)
    maybe("species_50", species_count >= 50)

    # --- Community (5) ---
    maybe("post_first",            posts_count >= 1)
    maybe("post_10",               posts_count >= 10)
    maybe("kudos_given_first",     kudos_given >= 1)
    maybe("kudos_received_first",  kudos_received >= 1)
    maybe("grove_joined_first",    grove_memberships >= 1)
    # Phase 14C.3.c — chat firsts
    maybe("grove_chat_first",      chat_messages_sent >= 1)
    maybe("grove_chat_50",         chat_messages_sent >= 50)

    # --- Swaps (1) ---
    maybe("swap_first", swaps_completed >= 1)

    # --- Tutorial (1) ---
    maybe("light_reader", "lighting" in tutorials_seen)

    # --- Time milestones (3) ---
    maybe("grove_1_month",  age_days >= 30)
    maybe("grove_6_months", age_days >= 180)
    maybe("grove_1_year",   age_days >= 365)

    # NOTE: verified_user is awarded directly by the verification flow
    # (Phase 14C.3.a) and not auto-awarded here.

    # --- Persist ---
    if not to_award:
        return
    for slug in to_award:
        badge = await db.badges.find_one({"slug": slug})
        if not badge:
            continue
        await db.user_badges.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "badge_id": badge["id"],
            "badge_slug": slug,
            "earned_at": datetime.now(timezone.utc).isoformat(),
        })

async def get_user_stats(user_id: str) -> dict:
    total_plants = await db.plants.count_documents({"user_id": user_id, "is_archived": {"$ne": True}})
    active_plants = await db.plants.count_documents({"user_id": user_id, "is_archived": {"$ne": True}})
    past_plants_count = await db.plants.count_documents({"user_id": user_id, "is_archived": True})
    total_care_logs = await db.care_logs.count_documents({"user_id": user_id})
    propagation_count = await db.care_logs.count_documents({"user_id": user_id, "action": "propagate"})
    care_logs = await db.care_logs.find({"user_id": user_id}).to_list(10000)
    estimated_minutes = sum(CARE_ACTION_MINUTES.get(log.get('action', ''), 1) for log in care_logs)
    streak = await db.streaks.find_one({"user_id": user_id})
    # Tier + plant-count gate for advanced analytics (Pro tier + 10+ plants)
    user_doc = await db.users.find_one({"id": user_id})
    tier = (user_doc or {}).get('tier', 'free')
    show_advanced_analytics = tier in ['pro', 'florist_pro'] and total_plants >= 10
    # Thriving rate: positive phrasing instead of "survival rate"
    total_ever = total_plants + past_plants_count
    thriving_rate = int(round((total_plants / total_ever) * 100)) if total_ever > 0 else 100
    return {
        "total_plants": total_plants, "active_plants": active_plants,
        "past_plants_count": past_plants_count,
        "total_care_logs": total_care_logs,
        "estimated_care_hours": round(estimated_minutes / 60, 1),
        "propagation_count": propagation_count,
        "thriving_rate": thriving_rate,
        "swap_count": 0, "bouquet_count": 0,
        "current_streak": streak.get('current_streak', 0) if streak else 0,
        "longest_streak": streak.get('longest_streak', 0) if streak else 0,
        "show_advanced_analytics": show_advanced_analytics,
        "tier": tier,
    }

# ============ AUTH ROUTES ============

class RegisterInput(BaseModel):
    username: str
    email: str
    password: str
    display_name: Optional[str] = None

class LoginInput(BaseModel):
    email: str
    password: str

class RefreshInput(BaseModel):
    refresh_token: str

@api_router.post("/auth/register")
async def register(input: RegisterInput):
    existing = await db.users.find_one({"$or": [{"email": input.email}, {"username": input.username}]})
    if existing:
        if existing.get('email') == input.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already taken")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id, "username": input.username, "email": input.email,
        "password_hash": hash_password(input.password),
        "display_name": input.display_name or input.username,
        "bio": "", "avatar_url": "", "location": "",
        "profile_public": False, "care_public": False,
        "collection_public": True, "streak_public": True,
        "tier": "free", "onboarding_complete": False,
        "is_florist": False, "studio_name": "", "studio_location": "", "portfolio_public": False,
        "first_care_celebrated": False,
        "first_session_banner_dismissed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    await db.streaks.insert_one({
        "id": str(uuid.uuid4()), "user_id": user_id,
        "current_streak": 0, "longest_streak": 0,
        "last_log_date": None, "paused": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    await db.user_unlocks.insert_one({
        "user_id": user_id, "swipe_unlocked": False,
        "social_feed_unlocked": False, "collection_showcase_unlocked": False,
        "swap_unlocked": False, "updated_at": datetime.now(timezone.utc).isoformat()
    })
    access_token = create_access_token(user_id, input.email)
    refresh_token = create_refresh_token(user_id)
    user_safe = {k: v for k, v in user.items() if k != 'password_hash' and k != '_id'}
    return {"user": user_safe, "access_token": access_token, "refresh_token": refresh_token}

@api_router.post("/auth/login")
async def login(input: LoginInput):
    user = await db.users.find_one({"email": input.email})
    if not user or not verify_password(input.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access_token = create_access_token(user['id'], user['email'])
    refresh_token = create_refresh_token(user['id'])
    user_safe = serialize_doc({k: v for k, v in user.items() if k != 'password_hash'})
    return {"user": user_safe, "access_token": access_token, "refresh_token": refresh_token}

@api_router.post("/auth/refresh")
async def refresh_token(input: RefreshInput):
    payload = decode_refresh_token(input.refresh_token)
    user = await db.users.find_one({"id": payload['user_id']})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access_token = create_access_token(user['id'], user['email'])
    new_refresh = create_refresh_token(user['id'])
    return {"access_token": access_token, "refresh_token": new_refresh}

# Testing bypass endpoint
@api_router.post("/auth/test-login")
async def test_login():
    """Bypass login for testing - creates/gets a test user"""
    test_email = "test@grove.app"
    user = await db.users.find_one({"email": test_email})
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id, "username": "testuser", "email": test_email,
            "password_hash": hash_password("test123"),
            "display_name": "Test Grower", "bio": "Testing Grove",
            "avatar_url": "", "location": "Portland, OR",
            "profile_public": True, "care_public": True,
            "collection_public": True, "streak_public": True,
            "tier": "pro", "onboarding_complete": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
        await db.streaks.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id,
            "current_streak": 5, "longest_streak": 15,
            "last_log_date": datetime.now(timezone.utc).date().isoformat(),
            "paused": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        await db.user_unlocks.insert_one({
            "user_id": user_id, "swipe_unlocked": False,
            "social_feed_unlocked": True, "collection_showcase_unlocked": False,
            "swap_unlocked": False, "updated_at": datetime.now(timezone.utc).isoformat()
        })
    access_token = create_access_token(user['id'], user['email'])
    refresh_token = create_refresh_token(user['id'])
    user_safe = serialize_doc({k: v for k, v in user.items() if k != 'password_hash'})
    return {"user": user_safe, "access_token": access_token, "refresh_token": refresh_token}

# ============ USER ROUTES ============

@api_router.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_safe = serialize_doc({k: v for k, v in user.items() if k != 'password_hash'})
    return user_safe

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    profile_public: Optional[bool] = None
    care_public: Optional[bool] = None
    collection_public: Optional[bool] = None
    streak_public: Optional[bool] = None
    onboarding_complete: Optional[bool] = None
    is_florist: Optional[bool] = None
    studio_name: Optional[str] = None
    studio_location: Optional[str] = None
    portfolio_public: Optional[bool] = None
    # Phase 13 — Settings → Preferences toggle
    prefer_manual_plant_entry: Optional[bool] = None
    # Phase 14A.2 — global 30-day tooltip window + section tutorials
    tooltips_enabled: Optional[bool] = None
    tooltips_dismissed: Optional[List[str]] = None
    tutorials_seen: Optional[List[str]] = None
    # Phase 14C — location, hardiness zone, subscription, verification
    location_country: Optional[str] = None  # "US" | "UK" | etc.
    location_postcode: Optional[str] = None  # raw user input
    hardiness_zone: Optional[str] = None  # auto-derived OR manual override
    hardiness_zone_source: Optional[str] = None  # "zip-prefix" | "postcode-area" | "manual"
    hardiness_zone_system: Optional[str] = None  # "USDA" | "RHS"
    # Phase 14C.3 — verification flow (identity step)
    verification_phone: Optional[str] = None  # optional contact phone (never displayed publicly)

@api_router.patch("/users/me")
async def update_me(input: UserUpdate, current_user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    # Phase 14C — auto-resolve hardiness zone if location changed but zone wasn't
    # explicitly provided. Manual `hardiness_zone` value always wins.
    location_changed = ('location_postcode' in updates) or ('location_country' in updates)
    if location_changed and 'hardiness_zone' not in updates:
        existing = await db.users.find_one({"id": current_user['user_id']}) or {}
        country = updates.get('location_country', existing.get('location_country'))
        postcode = updates.get('location_postcode', existing.get('location_postcode'))
        zone, system, source = lookup_zone(country or '', postcode or '')
        if zone:
            updates['hardiness_zone'] = zone
            updates['hardiness_zone_system'] = system
            updates['hardiness_zone_source'] = source
    elif 'hardiness_zone' in updates:
        # Treat explicit zone changes as manual overrides.
        updates['hardiness_zone_source'] = 'manual'
        if not updates.get('hardiness_zone_system'):
            # Infer system from zone string ("H1"/"H2" etc are RHS, otherwise USDA)
            zone_val = (updates['hardiness_zone'] or '').upper()
            updates['hardiness_zone_system'] = 'RHS' if zone_val.startswith('H') else 'USDA'
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": current_user['user_id']}, {"$set": updates})
    user = await db.users.find_one({"id": current_user['user_id']})
    return serialize_doc({k: v for k, v in user.items() if k != 'password_hash'})

# Phase 14C — Public zone lookup endpoint (used by the Profile UI to preview
# the zone before the user confirms saving).
@api_router.get("/zones/lookup")
async def public_zone_lookup(country: str = "US", postcode: str = ""):
    zone, system, source = lookup_zone(country, postcode)
    desc = None
    if zone:
        desc = (USDA_DESCRIPTIONS.get(zone) if system == 'USDA'
                else RHS_DESCRIPTIONS.get(zone))
    return {
        "country": country,
        "postcode": postcode,
        "zone": zone,
        "system": system,
        "source": source,
        "description": desc,
    }

# Phase 14C — Static zone directories for UI dropdowns / overrides.
@api_router.get("/zones/catalog")
async def zone_catalog():
    return {
        "usda": [{"zone": z, "description": d} for z, d in USDA_DESCRIPTIONS.items()],
        "rhs": [{"zone": z, "description": d} for z, d in RHS_DESCRIPTIONS.items()],
    }

# Phase 14A.2 — Tooltip + tutorial state helpers. The 30-day window logic lives
# on the client (it just compares user.created_at against now), but the server
# tracks individually-dismissed tooltips and seen section tutorials so the state
# persists across devices.

class TooltipDismissBody(BaseModel):
    tooltip_id: str

@api_router.post("/users/me/tooltips/dismiss")
async def dismiss_tooltip(body: TooltipDismissBody, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$addToSet": {"tooltips_dismissed": body.tooltip_id},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    user = await db.users.find_one({"id": current_user['user_id']})
    return {"tooltips_dismissed": user.get('tooltips_dismissed', [])}

@api_router.post("/users/me/tooltips/reset")
async def reset_tooltips(current_user: dict = Depends(get_current_user)):
    """Clears the dismissed list and (re-)enables tooltips. Used by the
    Settings > Tutorials and tips toggle to bring training wheels back."""
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$set": {
            "tooltips_dismissed": [],
            "tooltips_enabled": True,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"reset": True}

class TutorialSeenBody(BaseModel):
    tutorial_id: str  # "collection" | "care" | "grove" | "greenhouse" | "lighting"

@api_router.post("/users/me/tutorials/seen")
async def mark_tutorial_seen(body: TutorialSeenBody, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$addToSet": {"tutorials_seen": body.tutorial_id},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    user = await db.users.find_one({"id": current_user['user_id']})
    # Phase 14C.3.b — light_reader and other tutorial badges
    await check_and_award_badges(current_user['user_id'])
    return {"tutorials_seen": user.get('tutorials_seen', [])}

@api_router.post("/users/me/tutorials/reset")
async def reset_tutorial(body: TutorialSeenBody, current_user: dict = Depends(get_current_user)):
    """Replay a single tutorial by removing it from the seen list."""
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$pull": {"tutorials_seen": body.tutorial_id},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"replayed": body.tutorial_id}

@api_router.get("/users/me/stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
    return await get_user_stats(current_user['user_id'])

@api_router.get("/users/me/badges")
async def get_my_badges(current_user: dict = Depends(get_current_user)):
    # Phase 14C.3.b — opportunistic award sweep so time-milestone badges
    # (grove_1_month, grove_6_months, grove_1_year) and any deferred awards
    # show up the moment the user opens the badge surface.
    try:
        await check_and_award_badges(current_user['user_id'])
    except Exception:
        pass
    user_badges = await db.user_badges.find({"user_id": current_user['user_id']}).to_list(500)
    # Sort newest-first
    user_badges.sort(key=lambda x: x.get('earned_at', ''), reverse=True)
    result = []
    for ub in user_badges:
        # Prefer slug-based hydration for re-seeded badges (slug stable, id changes)
        slug = ub.get('badge_slug')
        badge = None
        if slug:
            badge = await db.badges.find_one({"slug": slug})
        if not badge and ub.get('badge_id'):
            badge = await db.badges.find_one({"id": ub['badge_id']})
        if badge:
            result.append({"badge": serialize_doc(badge), "earned_at": ub.get('earned_at')})
    return result


# Phase 14C.3.b — Full 170-badge gallery with earned/locked state for the
# current user. Used by /badges page.
@api_router.get("/users/me/badges/catalog")
async def get_my_badge_catalog(current_user: dict = Depends(get_current_user)):
    # Trigger an opportunistic award sweep so the gallery is current.
    try:
        await check_and_award_badges(current_user['user_id'])
    except Exception:
        pass
    user = await db.users.find_one({"id": current_user['user_id']}) or {}
    user_badges = await db.user_badges.find({"user_id": current_user['user_id']}).to_list(500)
    earned_map = {ub.get('badge_slug'): ub for ub in user_badges if ub.get('badge_slug')}

    # Pull all 170 from db.badges, group by category.
    all_badges = await db.badges.find({}).to_list(500)
    # Sort by family_order within subcategory, then by slug
    def _sort_key(b):
        return (
            b.get("category") or "",
            b.get("subcategory") or "",
            b.get("family") or "",
            b.get("family_order", 0),
            b.get("slug") or "",
        )
    all_badges.sort(key=_sort_key)

    # Compute "highest tier earned in family" per family.
    highest_in_family: dict = {}
    for slug, ub in earned_map.items():
        b = await db.badges.find_one({"slug": slug})
        if not b or not b.get("family"):
            continue
        order = b.get("family_order", 0)
        cur = highest_in_family.get(b["family"])
        if cur is None or order > cur[1]:
            highest_in_family[b["family"]] = (slug, order)

    displayed = set(user.get("displayed_badges") or [])

    items = []
    for b in all_badges:
        slug = b.get("slug")
        ub = earned_map.get(slug)
        family = b.get("family")
        is_earned = ub is not None
        is_displayable = is_earned
        # Tier-replacement: a lower tier in a family is not displayable when a
        # higher tier in that same family has been earned. Highest-tier-earned
        # is always displayable.
        if is_earned and family:
            highest = highest_in_family.get(family)
            if highest and highest[0] != slug:
                is_displayable = False

        items.append({
            "slug": slug,
            "name": b.get("name"),
            "description": b.get("description"),
            "category": b.get("category"),
            "subcategory": b.get("subcategory"),
            "icon": b.get("icon"),
            "tier": b.get("tier"),
            "earnable": bool(b.get("earnable")),
            "family": family,
            "family_order": b.get("family_order", 0),
            "earned": is_earned,
            "earned_at": ub.get("earned_at") if ub else None,
            "displayable": is_displayable,
            "displayed": slug in displayed,
        })

    earned_count = sum(1 for it in items if it["earned"])
    return {
        "total": len(items),
        "earned_count": earned_count,
        "displayed": [s for s in (user.get("displayed_badges") or []) if s in earned_map],
        "max_displayed": 3,
        "items": items,
    }


class DisplayBadgesBody(BaseModel):
    badge_slugs: List[str]


@api_router.put("/users/me/badges/displayed")
async def set_displayed_badges(
    body: DisplayBadgesBody,
    current_user: dict = Depends(get_current_user),
):
    """3-badge display picker per Phase 14 v2 § 7.13.

    Validates: max 3, must own each, and (per § B.7) only the highest-tier
    member of any family may be selected.
    """
    slugs = list(dict.fromkeys(body.badge_slugs or []))  # de-dupe, preserve order
    if len(slugs) > 3:
        raise HTTPException(status_code=400, detail="You can display at most 3 badges.")

    # Ownership check
    owned = await db.user_badges.find(
        {"user_id": current_user['user_id'], "badge_slug": {"$in": slugs}}
    ).to_list(500)
    owned_slugs = {ub.get('badge_slug') for ub in owned}
    missing = [s for s in slugs if s not in owned_slugs]
    if missing:
        raise HTTPException(
            status_code=400,
            detail={"error": "not_owned", "missing": missing},
        )

    # Tier replacement enforcement: cannot select a lower tier in a family
    # when you've also earned a higher tier in that family.
    # Build family -> highest-earned-order from full ownership set.
    all_owned = await db.user_badges.find(
        {"user_id": current_user['user_id']}
    ).to_list(500)
    highest_order: dict = {}
    for ub in all_owned:
        b = await db.badges.find_one({"slug": ub.get('badge_slug')})
        if not b or not b.get('family'):
            continue
        fam = b['family']
        order = b.get('family_order', 0)
        if fam not in highest_order or order > highest_order[fam]:
            highest_order[fam] = order

    blocked: list = []
    for s in slugs:
        b = await db.badges.find_one({"slug": s})
        if not b or not b.get('family'):
            continue
        if b.get('family_order', 0) < highest_order.get(b['family'], 0):
            blocked.append(s)
    if blocked:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "tier_superseded",
                "message": "A higher tier in this family is already earned.",
                "blocked": blocked,
            },
        )

    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$set": {
            "displayed_badges": slugs,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"displayed_badges": slugs}


# ============ PHASE 14C.4 — GOAL/BADGE UNIFICATION ============
#
# Per the spec change: a "goal" is just a locked badge the user is actively
# pursuing. Users pin up to 5 goals from the badge catalog; pinned goals
# show progress on the Care/Today tab and auto-unpin when earned.
#
# Constraints:
#   - Max 5 pinned at once
#   - Must be a badge the user has NOT yet earned
#   - Must be in BADGE_PROGRESS_RULES (i.e., have a progress signal)
#   - Pin/unpin via dedicated endpoints; not via PATCH /users/me

from badge_progress import (
    BADGE_PROGRESS_RULES, can_be_pinned_as_goal,
    collect_user_snapshot, progress_for,
)
from trivia_seed import TRIVIA_CARDS, TRIVIA_SEED_VERSION

MAX_PINNED_GOALS = 5


async def _user_owns_badge(user_id: str, slug: str) -> bool:
    return bool(await db.user_badges.find_one({"user_id": user_id, "badge_slug": slug}))


@api_router.get("/users/me/goals")
async def get_my_goals(current_user: dict = Depends(get_current_user)):
    """Hydrated pinned goals with live progress + badge metadata.

    Pinned goals that have since been earned are auto-removed (they appear
    in the celebration toast on the next badge-award sweep). The endpoint
    is the canonical source for the "Working toward" Care tab section.
    """
    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    pinned: list = list(user.get("pinned_goals") or [])
    if not pinned:
        return {"items": [], "max": MAX_PINNED_GOALS}

    # Auto-unpin anything that's now earned.
    earned_set = set()
    if pinned:
        cur = db.user_badges.find(
            {"user_id": current_user["user_id"], "badge_slug": {"$in": pinned}}
        )
        async for ub in cur:
            earned_set.add(ub.get("badge_slug"))
    auto_remove = [s for s in pinned if s in earned_set]
    if auto_remove:
        pinned = [s for s in pinned if s not in auto_remove]
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": {
                "pinned_goals": pinned,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )

    if not pinned:
        return {"items": [], "max": MAX_PINNED_GOALS, "auto_unpinned": auto_remove}

    snapshot = await collect_user_snapshot(db, current_user["user_id"])
    items = []
    for slug in pinned:
        badge = await db.badges.find_one({"slug": slug})
        if not badge:
            continue
        progress = progress_for(slug, snapshot)
        items.append({
            "slug": slug,
            "name": badge.get("name"),
            "description": badge.get("description"),
            "category": badge.get("category"),
            "subcategory": badge.get("subcategory"),
            "icon": badge.get("icon"),
            "tier": badge.get("tier"),
            "family": badge.get("family"),
            "progress": progress,
        })
    out: dict = {"items": items, "max": MAX_PINNED_GOALS}
    if auto_remove:
        out["auto_unpinned"] = auto_remove
    return out


@api_router.post("/users/me/goals/{slug}")
async def pin_goal(slug: str, current_user: dict = Depends(get_current_user)):
    """Pin a locked, earnable badge as an active goal.

    Validation:
      - Badge must exist
      - Must have a defined progress rule (BADGE_PROGRESS_RULES)
      - User must NOT already own it (can't pin an already-earned badge)
      - Max 5 pinned at once
      - Idempotent (re-pinning the same slug returns the current state)
    """
    badge = await db.badges.find_one({"slug": slug})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    if not can_be_pinned_as_goal(slug):
        raise HTTPException(
            status_code=400,
            detail="This badge has no automated progress signal — it can't be pinned as a goal. (Admin-grantable badges show in the gallery only.)",
        )
    if await _user_owns_badge(current_user["user_id"], slug):
        raise HTTPException(
            status_code=400,
            detail={"error": "already_earned", "message": "You've already earned this badge."},
        )
    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    pinned: list = list(user.get("pinned_goals") or [])
    if slug in pinned:
        return {"pinned": True, "already": True, "pinned_goals": pinned}
    if len(pinned) >= MAX_PINNED_GOALS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "max_pinned",
                "message": f"You can pin at most {MAX_PINNED_GOALS} goals at once. Unpin one first.",
                "max": MAX_PINNED_GOALS,
            },
        )
    pinned.append(slug)
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {
            "pinned_goals": pinned,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"pinned": True, "pinned_goals": pinned}


@api_router.delete("/users/me/goals/{slug}")
async def unpin_goal(slug: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    pinned: list = list(user.get("pinned_goals") or [])
    if slug not in pinned:
        return {"unpinned": False, "already": True, "pinned_goals": pinned}
    pinned = [s for s in pinned if s != slug]
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {
            "pinned_goals": pinned,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"unpinned": True, "pinned_goals": pinned}


# ============ PHASE 14C.4 — DAILY PLANT TRIVIA (Supplement v1 Part D.7) ============
#
# 33 curated trivia cards seeded on startup (versioned). One card surfaces
# per (calendar_day, all-users) — community shares the same daily fact.
# Users can dismiss the card for the day (`trivia_dismissed_for: 'YYYY-MM-DD'`)
# and tomorrow's trivia replaces it automatically at local midnight.

async def seed_trivia(db_handle):
    """Seed the trivia collection. Versioned reseed via app_meta key."""
    meta = await db_handle.app_meta.find_one({"key": "trivia_seed_version"})
    if (meta or {}).get("value") == TRIVIA_SEED_VERSION:
        return
    print(f"Reseeding trivia: {(meta or {}).get('value')} -> {TRIVIA_SEED_VERSION}")
    await db_handle.trivia.delete_many({})
    docs = []
    for i, card in enumerate(TRIVIA_CARDS):
        docs.append({
            "id": str(uuid.uuid4()),
            "order": i,
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **card,
        })
    if docs:
        await db_handle.trivia.insert_many(docs)
    await db_handle.app_meta.update_one(
        {"key": "trivia_seed_version"},
        {"$set": {"key": "trivia_seed_version", "value": TRIVIA_SEED_VERSION}},
        upsert=True,
    )
    print(f"Seeded {len(docs)} trivia cards")


def _local_today(tz_offset_minutes: int) -> str:
    """Local YYYY-MM-DD given a tz offset in minutes from UTC."""
    now_utc = datetime.now(timezone.utc)
    local = now_utc + timedelta(minutes=tz_offset_minutes)
    return local.strftime("%Y-%m-%d")


def _trivia_index_for_day(day_str: str, deck_size: int, user_id: Optional[str] = None) -> int:
    """Deterministic per-user-per-day deck rotation.

    Pre-testing audit fix: the testing script requires *different* trivia
    for Maya / James / Clare on the same day so the rotation feels
    personal and so dismissing on one account doesn't telegraph the card
    on another. We hash (day_str + user_id) into the deck index. Without
    a user_id we fall back to the legacy day-only rotation so non-auth'd
    contexts (admin debug etc.) still produce a stable card.
    """
    if deck_size <= 0:
        return 0
    try:
        d = datetime.strptime(day_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        days_since_epoch = int(d.timestamp() // 86400)
        if user_id:
            import hashlib
            h = hashlib.sha256(f"{days_since_epoch}:{user_id}".encode("utf-8")).digest()
            # First 8 bytes → unsigned int → modulo deck size
            n = int.from_bytes(h[:8], "big")
            return n % deck_size
        return days_since_epoch % deck_size
    except Exception:
        return 0


@api_router.get("/trivia/today")
async def get_today_trivia(
    tz_offset: Optional[int] = 0,  # minutes from UTC; pass new Date().getTimezoneOffset() * -1
    current_user: dict = Depends(get_current_user),
):
    """Today's trivia card for the requesting user.

    The card is shared across the community for a given local calendar day
    (deterministic deck rotation by days-since-epoch). The endpoint also
    returns whether the current user has dismissed today's card.
    """
    day_str = _local_today(tz_offset or 0)
    cards = await db.trivia.find({"active": True}).sort("order", 1).to_list(500)
    if not cards:
        return {"date": day_str, "card": None, "dismissed": False}
    idx = _trivia_index_for_day(day_str, len(cards), current_user["user_id"])
    card = cards[idx]

    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    dismissed = user.get("trivia_dismissed_for") == day_str

    # Hydrate linked species (if any) so the frontend can deep link.
    linked_species: Optional[dict] = None
    if card.get("linked_species_slug"):
        sp = await db.species.find_one({"slug": card["linked_species_slug"]})
        if sp:
            linked_species = {
                "id": sp.get("id"),
                "slug": sp.get("slug"),
                "common_name": sp.get("common_name"),
            }

    return {
        "date": day_str,
        "dismissed": dismissed,
        "card": {
            "id": card.get("id"),
            "headline": card.get("headline"),
            "body": card.get("body"),
            "category": card.get("category"),
            "linked_species": linked_species,
        },
    }


@api_router.post("/trivia/today/dismiss")
async def dismiss_today_trivia(
    tz_offset: Optional[int] = 0,
    current_user: dict = Depends(get_current_user),
):
    day_str = _local_today(tz_offset or 0)
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {
            "trivia_dismissed_for": day_str,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"dismissed": True, "date": day_str}




# Phase 14C.3.b — Admin grant/revoke any badge (covers the 110 schema-only
# entries that don't have automated earning logic yet).
@api_router.post("/admin/users/{user_id}/badges/{slug}/grant")
async def admin_grant_badge(
    user_id: str, slug: str,
    current_user: dict = Depends(get_current_user),
):
    admin = await db.users.find_one({"id": current_user['user_id']})
    if not admin or not admin.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    badge = await db.badges.find_one({"slug": slug})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    existing = await db.user_badges.find_one({"user_id": user_id, "badge_slug": slug})
    if existing:
        return {"granted": False, "already": True, "badge_slug": slug}
    await db.user_badges.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "badge_id": badge['id'],
        "badge_slug": slug,
        "earned_at": datetime.now(timezone.utc).isoformat(),
        "granted_by_admin": True,
    })
    return {"granted": True, "badge_slug": slug}


@api_router.delete("/admin/users/{user_id}/badges/{slug}")
async def admin_revoke_badge(
    user_id: str, slug: str,
    current_user: dict = Depends(get_current_user),
):
    admin = await db.users.find_one({"id": current_user['user_id']})
    if not admin or not admin.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.user_badges.delete_one({"user_id": user_id, "badge_slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Badge not held by user")
    # If the user had this slug in their display picker, drop it.
    await db.users.update_one(
        {"id": user_id, "displayed_badges": slug},
        {"$pull": {"displayed_badges": slug}},
    )
    return {"revoked": True, "badge_slug": slug}

@api_router.get("/users/me/unlocks")
async def get_my_unlocks(current_user: dict = Depends(get_current_user)):
    # Auto-compute unlocks from streak so demo actions feel immediate
    streak = await db.streaks.find_one({"user_id": current_user['user_id']})
    current_streak = streak.get('current_streak', 0) if streak else 0
    plants_count = await db.plants.count_documents({"user_id": current_user['user_id'], "is_archived": {"$ne": True}})
    computed = {
        "social_feed_unlocked": current_streak >= 7,
        "swap_unlocked": current_streak >= 30,
        "swipe_unlocked": current_streak >= 30,
        "collection_showcase_unlocked": plants_count >= 10,
    }
    stored = await db.user_unlocks.find_one({"user_id": current_user['user_id']}) or {}
    merged = {**stored, **computed}
    return serialize_doc({k: v for k, v in merged.items() if k != '_id'})

@api_router.get("/swap/deck")
async def get_swap_deck(current_user: dict = Depends(get_current_user), limit: int = 20):
    """Return a pre-populated swap deck so that when a user unlocks swapping, they
    can start swiping immediately without waiting for discovery heuristics."""
    # Check unlock eligibility
    streak = await db.streaks.find_one({"user_id": current_user['user_id']})
    current_streak = streak.get('current_streak', 0) if streak else 0
    if current_streak < 30:
        return {
            "unlocked": False,
            "streak_needed": 30,
            "current_streak": current_streak,
            "cards": []
        }
    # Pull plants from OTHER users, with basic info. Limit + latest-first.
    cursor = db.plants.find(
        {"user_id": {"$ne": current_user['user_id']}, "is_archived": {"$ne": True}},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit)
    raw = await cursor.to_list(limit)
    cards = []
    for p in raw:
        owner = await db.users.find_one({"id": p['user_id']}, {"_id": 0})
        cards.append({
            "plant_id": p.get('id'),
            "common_name": p.get('common_name', ''),
            "latin_name": p.get('latin_name', ''),
            "nickname": p.get('nickname', ''),
            "photo_url": p.get('photo_url', ''),
            "owner_username": (owner or {}).get('username', ''),
            "owner_display_name": (owner or {}).get('display_name', ''),
            "owner_location": (owner or {}).get('location', ''),
            # Pre-testing diagnostic: surface verified flags so the swap
            # deck card can render the Verified Pro checkmark next to the
            # plant owner's username.
            "owner_verified_user": bool((owner or {}).get('verified_user')),
            "owner_verified_by_admin": bool((owner or {}).get('verified_by_admin')),
        })
    return {
        "unlocked": True,
        "streak_needed": 30,
        "current_streak": current_streak,
        "cards": cards,
    }

@api_router.post("/users/me/generate-personality")
async def gen_personality(current_user: dict = Depends(get_current_user)):
    stats = await get_user_stats(current_user['user_id'])
    top_species_pipeline = [
        {"$match": {"user_id": current_user['user_id'], "is_archived": {"$ne": True}}},
        {"$group": {"_id": "$common_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 3}
    ]
    top_species = await db.plants.aggregate(top_species_pipeline).to_list(3)
    stats['top_species'] = ', '.join([s['_id'] for s in top_species]) if top_species else 'various'
    stats['watering_consistency'] = 75
    result = await generate_plant_personality(stats)
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$set": {"personality_title": result.get('title', ''),
                  "personality_body": result.get('body', ''),
                  "personality_generated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return result

# ============ SPECIES ROUTES ============

@api_router.get("/species/search")
async def search_species(q: str = ""):
    if not q or len(q) < 2:
        species = await db.species.find({}, {"_id": 0}).sort("common_name", 1).limit(50).to_list(50)
        return [serialize_doc(s) for s in species]
    regex = {"$regex": q, "$options": "i"}
    species = await db.species.find(
        {"$or": [{"common_name": regex}, {"latin_name": regex}]}, {"_id": 0}
    ).limit(20).to_list(20)
    return [serialize_doc(s) for s in species]

@api_router.get("/species/{species_id}")
async def get_species(species_id: str):
    species = await db.species.find_one({"id": species_id})
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    return serialize_doc(species)

# ============ PLANT ROUTES ============

class PlantCreate(BaseModel):
    common_name: str
    latin_name: Optional[str] = None
    species_id: Optional[str] = None
    nickname: Optional[str] = None
    room: Optional[str] = None
    grow_medium: str = "soil"
    notes: Optional[str] = None
    acquired_date: Optional[str] = None
    acquired_from: Optional[str] = None
    watering_frequency_days: Optional[int] = None
    photo_url: Optional[str] = None
    # If True, user is creating without a photo now (e.g. bulk import). A
    # "needs photo" state will be stored and surfaced later. Default: False.
    photo_deferred: Optional[bool] = False
    # Phase 13 — AI identification metadata (optional)
    ai_identified: Optional[bool] = False
    ai_confidence: Optional[float] = None
    ai_health_score: Optional[int] = None
    ai_health_summary: Optional[str] = None
    ai_health_flags: Optional[List[dict]] = None
    ai_species_confirmed: Optional[bool] = False

class PlantUpdate(BaseModel):
    common_name: Optional[str] = None
    latin_name: Optional[str] = None
    nickname: Optional[str] = None
    room: Optional[str] = None
    grow_medium: Optional[str] = None
    notes: Optional[str] = None
    watering_frequency_days: Optional[int] = None
    is_archived: Optional[bool] = None
    # Phase 13 — when user manually edits species name, set ai_species_confirmed=True
    ai_species_confirmed: Optional[bool] = None

@api_router.get("/plants")
async def get_plants(
    current_user: dict = Depends(get_current_user),
    room: Optional[str] = None, status: Optional[str] = None,
    medium: Optional[str] = None, page: int = 1, limit: int = 50
):
    query = {"user_id": current_user['user_id'], "is_archived": {"$ne": True}}
    if room:
        query["room"] = room
    if status:
        query["status"] = status
    if medium:
        query["grow_medium"] = medium
    skip = (page - 1) * limit
    plants = await db.plants.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.plants.count_documents(query)
    # Recalculate status for each plant
    for p in plants:
        p['status'] = calculate_plant_status(p)
        p['status_reason'] = compute_status_reason(p, p['status'])
    return {"plants": [serialize_doc(p) for p in plants], "total": total, "page": page, "limit": limit}

@api_router.get("/plants/water-round")
async def get_water_round(current_user: dict = Depends(get_current_user)):
    plants = await db.plants.find({
        "user_id": current_user['user_id'], "is_archived": {"$ne": True}
    }, {"_id": 0}).to_list(200)
    included = []
    excluded = []
    for p in plants:
        p['status'] = calculate_plant_status(p)
        if p.get('grow_medium') == 'propagation_jar':
            excluded.append({**serialize_doc(p), "reason": "Propagating - skip regular watering"})
        elif p['status'] in ['urgent', 'needs_water']:
            included.append(serialize_doc(p))
        elif p['status'] == 'healthy':
            excluded.append({**serialize_doc(p), "reason": "Not due yet"})
        else:
            excluded.append({**serialize_doc(p), "reason": f"Status: {p['status']}"})
    return {"included": included, "excluded": excluded}

@api_router.post("/plants/water-round/log")
async def log_water_round(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    plants = await db.plants.find({
        "user_id": current_user['user_id'], "is_archived": {"$ne": True}
    }).to_list(200)
    count = 0
    for p in plants:
        status = calculate_plant_status(p)
        if status in ['urgent', 'needs_water'] and p.get('grow_medium') != 'propagation_jar':
            freq = p.get('watering_frequency_days', 7)
            await db.care_logs.insert_one({
                "id": str(uuid.uuid4()), "plant_id": p['id'],
                "user_id": current_user['user_id'], "action": "water",
                "notes": "Water round", "photo_url": "",
                "logged_at": now.isoformat(), "created_at": now.isoformat()
            })
            await db.plants.update_one(
                {"id": p['id']},
                {"$set": {
                    "last_watered_at": now.isoformat(),
                    "next_water_due": (now + timedelta(days=freq)).isoformat(),
                    "status": "healthy", "updated_at": now.isoformat()
                }}
            )
            count += 1
    await update_streak(current_user['user_id'])
    if count > 0:
        await missions_mod.on_care_log(db, current_user['user_id'], {})
    user_doc = await db.users.find_one({"id": current_user['user_id']})
    first_care_pending = (count > 0) and not bool((user_doc or {}).get('first_care_celebrated'))
    return {"watered": count, "first_care_pending": first_care_pending}

@api_router.post("/plants")
async def create_plant(input: PlantCreate, current_user: dict = Depends(get_current_user)):
    # Check tier limits
    user = await db.users.find_one({"id": current_user['user_id']})
    if user and user.get('tier', 'free') == 'free':
        count = await db.plants.count_documents({"user_id": current_user['user_id'], "is_archived": {"$ne": True}})
        if count >= 15:
            raise HTTPException(status_code=403, detail="Free tier limited to 15 plants. Upgrade to Pro for unlimited.")
    
    now = datetime.now(timezone.utc)
    watering_days = input.watering_frequency_days
    watering_source = 'user' if watering_days else 'ai'
    
    # If no watering frequency, look up species default
    if not watering_days and input.species_id:
        species = await db.species.find_one({"id": input.species_id})
        if species:
            watering_days = species.get('default_watering_days', 7)
            watering_source = 'ai'
    if not watering_days:
        watering_days = 7
    
    next_water = (now + timedelta(days=watering_days)).isoformat()
    
    # Photo requirement: enforce unless explicitly deferred (bulk/import grace mode)
    if not input.photo_url and not input.photo_deferred:
        raise HTTPException(
            status_code=400,
            detail="A photo is required to add a plant. Take or upload a photo to continue."
        )

    # Phase 14 Part 4.3 — auto-classify as propagation if grown in water
    grow_medium = input.grow_medium
    if grow_medium == 'water':
        grow_medium = 'propagation_jar'

    plant = {
        "id": str(uuid.uuid4()), "user_id": current_user['user_id'],
        "common_name": input.common_name, "latin_name": input.latin_name or "",
        "species_id": input.species_id, "nickname": input.nickname or "",
        "room": input.room or "", "grow_medium": grow_medium,
        "photo_url": input.photo_url or "", "notes": input.notes or "",
        # Phase 14A.2 — initialize photo gallery (cap 10). Seeded with the
        # creation photo if provided so the growth timeline has a day-0 anchor.
        "photos": (
            [{
                "id": str(uuid.uuid4()),
                "path": input.photo_url,
                "taken_at": now.isoformat(),
                "uploaded_at": now.isoformat(),
                "caption": "",
                "is_cover": True,
            }] if input.photo_url else []
        ),
        "photo_required_since": now.isoformat() if not input.photo_url else None,
        "acquired_date": input.acquired_date or now.date().isoformat(),
        "acquired_from": input.acquired_from or "",
        "propagated_from_plant_id": None, "propagated_from_user_id": None,
        "watering_frequency_days": watering_days,
        "watering_frequency_source": watering_source,
        "last_watered_at": now.isoformat(),
        "next_water_due": next_water,
        "health_score": (input.ai_health_score if input.ai_identified and input.ai_health_score is not None else 80),
        "status": "healthy",
        "is_archived": False,
        # Phase 13 — AI identification metadata
        "ai_identified": bool(input.ai_identified),
        "ai_confidence": input.ai_confidence,
        "ai_health_summary": input.ai_health_summary or "",
        "ai_health_flags": input.ai_health_flags or [],
        "ai_species_confirmed": bool(input.ai_species_confirmed),
        "created_at": now.isoformat(), "updated_at": now.isoformat()
    }
    await db.plants.insert_one(plant)
    await check_and_award_badges(current_user['user_id'])
    return serialize_doc({k: v for k, v in plant.items() if k != '_id'})

@api_router.get("/plants/{plant_id}")
async def get_plant(plant_id: str, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    plant['status'] = calculate_plant_status(plant)
    # Attach explainable 6-factor health breakdown
    recent_logs = await db.care_logs.find(
        {"plant_id": plant_id}, {"_id": 0}
    ).sort("logged_at", -1).limit(20).to_list(20)
    breakdown = compute_health_breakdown(plant, recent_logs)
    # Phase 13: preserve AI initial reading until the user has 7+ care logs.
    # The 6-factor breakdown is most reliable once real-care signal exists.
    if plant.get('ai_identified') and len(recent_logs) < 7 and plant.get('health_score') is not None:
        # keep AI score as the headline; expose computed breakdown as supporting view
        pass
    else:
        plant['health_score'] = breakdown['total_score']
    plant['health_breakdown'] = breakdown
    # Phase 14C.3.b — record unhealthy state for the plant_rescue badge.
    # Once a plant has dipped below 50, persist `was_unhealthy=True` so we
    # can detect the recovery later (now health >= 80 + flag set).
    try:
        if plant.get('health_score', 100) < 50 and not plant.get('was_unhealthy'):
            await db.plants.update_one({"id": plant_id}, {"$set": {"was_unhealthy": True}})
            plant['was_unhealthy'] = True
    except Exception:
        pass
    # Phase 14 Part 4.4 — surface status reason
    plant['status'] = calculate_plant_status(plant)
    plant['status_reason'] = compute_status_reason(plant, plant['status'])
    return serialize_doc(plant)

@api_router.patch("/plants/{plant_id}")
async def update_plant(plant_id: str, input: PlantUpdate, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    if 'watering_frequency_days' in updates:
        now = datetime.now(timezone.utc)
        last_watered = plant.get('last_watered_at', now.isoformat())
        if isinstance(last_watered, str):
            last_watered = datetime.fromisoformat(last_watered)
        updates['next_water_due'] = (last_watered + timedelta(days=updates['watering_frequency_days'])).isoformat()
        updates['watering_frequency_source'] = 'user'
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.plants.update_one({"id": plant_id}, {"$set": updates})
    updated = await db.plants.find_one({"id": plant_id})
    updated['status'] = calculate_plant_status(updated)
    return serialize_doc(updated)

@api_router.delete("/plants/{plant_id}")
async def delete_plant(plant_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.plants.update_one(
        {"id": plant_id, "user_id": current_user['user_id']},
        {"$set": {"is_archived": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Plant not found")
    return {"message": "Plant archived"}

@api_router.post("/plants/{plant_id}/ai-schedule")
async def ai_schedule(plant_id: str, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    user = await db.users.find_one({"id": current_user['user_id']})
    location = user.get('location', 'Unknown') if user else 'Unknown'
    try:
        result = await suggest_watering_schedule(
            plant.get('common_name', ''), plant.get('latin_name', ''),
            plant.get('grow_medium', 'soil'), location
        )
        await db.plants.update_one(
            {"id": plant_id},
            {"$set": {
                "watering_frequency_days": result.get('days', 7),
                "watering_frequency_source": "ai",
                "watering_frequency_set_at": datetime.now(timezone.utc).isoformat(),
                "schedule_review_acknowledged_at": None,
                "next_water_due": (datetime.now(timezone.utc) + timedelta(days=result.get('days', 7))).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return result
    except Exception as e:
        logger.error(f"AI schedule error: {e}")
        raise HTTPException(status_code=500, detail=f"AI scheduling failed: {str(e)}")

@api_router.get("/plants/{plant_id}/timeline")
async def get_plant_timeline(plant_id: str, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    logs = await db.care_logs.find({"plant_id": plant_id}, {"_id": 0}).sort("logged_at", -1).limit(50).to_list(50)
    return [serialize_doc(l) for l in logs]

@api_router.get("/plants/{plant_id}/biography")
async def get_plant_biography(plant_id: str, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    if plant.get('biography'):
        return {"biography": plant['biography'], "cached": True}
    return {"biography": None, "cached": False}

@api_router.post("/plants/{plant_id}/generate-biography")
async def gen_biography(plant_id: str, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    care_count = await db.care_logs.count_documents({"plant_id": plant_id})
    plant_data = {
        "common_name": plant.get('common_name'), "nickname": plant.get('nickname'),
        "care_summary": f"{care_count} care actions logged",
        "propagated_from": plant.get('propagated_from_user_id')
    }
    try:
        biography = await generate_plant_biography(plant_data)
        await db.plants.update_one({"id": plant_id}, {"$set": {"biography": biography}})
        return {"biography": biography, "cached": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ CARE LOG ROUTES ============

class CareLogCreate(BaseModel):
    # Phase 14A.2: support either a single `action` (legacy) OR `actions[]` for
    # multi-action logging in one sweep (e.g. water + mist + rotate).
    action: Optional[str] = None
    actions: Optional[List[str]] = None
    notes: Optional[str] = None
    root_length_cm: Optional[float] = None
    water_level_pct: Optional[int] = None

class BulkCareLogCreate(BaseModel):
    plant_ids: List[str]
    # Phase 14A.2: support either a single `action` (legacy) OR `actions[]`.
    action: Optional[str] = None
    actions: Optional[List[str]] = None
    notes: Optional[str] = None

# Phase 14A.2 — recognized care actions (validation + UI hints)
VALID_CARE_ACTIONS = {
    'water', 'mist', 'fertilize', 'rotate', 'prune', 'check',
    'change_water', 'flush', 'repot', 'propagate', 'photo',
    'clean', 'stake', 'inspect', 'health_check'
}

def _normalize_actions(single: Optional[str], many: Optional[List[str]]) -> List[str]:
    """Return deduped list of action strings, preserving order, rejecting empties."""
    seen = set()
    out: List[str] = []
    candidates: List[str] = []
    if many:
        candidates.extend([a for a in many if a])
    if single:
        candidates.append(single)
    for a in candidates:
        a = (a or '').strip()
        if not a or a in seen:
            continue
        seen.add(a)
        out.append(a)
    return out

@api_router.get("/plants/{plant_id}/care-logs")
async def get_care_logs(plant_id: str, current_user: dict = Depends(get_current_user)):
    logs = await db.care_logs.find(
        {"plant_id": plant_id, "user_id": current_user['user_id']}, {"_id": 0}
    ).sort("logged_at", -1).limit(100).to_list(100)
    return [serialize_doc(l) for l in logs]

@api_router.post("/plants/{plant_id}/care-logs")
async def create_care_log(plant_id: str, input: CareLogCreate, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    now = datetime.now(timezone.utc)
    actions = _normalize_actions(input.action, input.actions)
    if not actions:
        raise HTTPException(status_code=400, detail="At least one action is required")
    # Phase 14A.2: share a group_id across multi-action logs created together so
    # the timeline and care log views can collapse them into a single "care sweep".
    group_id = str(uuid.uuid4()) if len(actions) > 1 else None
    logs_out: List[dict] = []
    watering_applied = False
    for act in actions:
        log = {
            "id": str(uuid.uuid4()), "plant_id": plant_id,
            "user_id": current_user['user_id'], "action": act,
            "notes": input.notes or "", "photo_url": "",
            "root_length_cm": input.root_length_cm if act in ('propagate', 'check') else None,
            "water_level_pct": input.water_level_pct if act in ('water', 'change_water', 'flush') else None,
            "logged_at": now.isoformat(), "created_at": now.isoformat(),
            "group_id": group_id,
        }
        await db.care_logs.insert_one(log)
        logs_out.append(log)
        if act in ['water', 'mist', 'change_water', 'flush'] and not watering_applied:
            freq = plant.get('watering_frequency_days', 7)
            await db.plants.update_one(
                {"id": plant_id},
                {"$set": {
                    "last_watered_at": now.isoformat(),
                    "next_water_due": (now + timedelta(days=freq)).isoformat(),
                    "status": "healthy", "updated_at": now.isoformat()
                }}
            )
            watering_applied = True
    if not watering_applied:
        await db.plants.update_one({"id": plant_id}, {"$set": {"updated_at": now.isoformat()}})
    await update_streak(current_user['user_id'])
    await check_and_award_badges(current_user['user_id'])
    # Phase 11C — mission hook + first-care celebration signal
    user_doc = await db.users.find_one({"id": current_user['user_id']})
    first_care_pending = not bool((user_doc or {}).get('first_care_celebrated'))
    mission_completed = await missions_mod.on_care_log(db, current_user['user_id'], logs_out[0])
    # Legacy shape: return the primary (first) log for backward compatibility,
    # plus the full list under `_meta.logs` for the new multi-action UI.
    primary = serialize_doc({k: v for k, v in logs_out[0].items() if k != '_id'})
    primary['_meta'] = {
        'first_care_pending': first_care_pending,
        'mission_just_completed': bool(mission_completed),
        'mission': mission_completed,
        'actions': actions,
        'group_id': group_id,
        'logs': [serialize_doc({k: v for k, v in l.items() if k != '_id'}) for l in logs_out],
    }
    return primary

@api_router.post("/care-logs/bulk")
async def bulk_care_log(input: BulkCareLogCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    actions = _normalize_actions(input.action, input.actions)
    if not actions:
        raise HTTPException(status_code=400, detail="At least one action is required")
    if not input.plant_ids:
        raise HTTPException(status_code=400, detail="Select at least one plant")
    group_id = str(uuid.uuid4())
    logs: List[dict] = []
    plants_affected = 0
    for plant_id in input.plant_ids:
        plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
        if not plant:
            continue
        plants_affected += 1
        watering_applied = False
        for act in actions:
            log = {
                "id": str(uuid.uuid4()), "plant_id": plant_id,
                "user_id": current_user['user_id'], "action": act,
                "notes": input.notes or "", "photo_url": "",
                "logged_at": now.isoformat(), "created_at": now.isoformat(),
                "group_id": group_id,
            }
            await db.care_logs.insert_one(log)
            logs.append(log)
            if act in ['water', 'mist', 'change_water', 'flush'] and not watering_applied:
                freq = plant.get('watering_frequency_days', 7)
                await db.plants.update_one(
                    {"id": plant_id},
                    {"$set": {
                        "last_watered_at": now.isoformat(),
                        "next_water_due": (now + timedelta(days=freq)).isoformat(),
                        "status": "healthy", "updated_at": now.isoformat()
                    }}
                )
                watering_applied = True
    await update_streak(current_user['user_id'])
    await check_and_award_badges(current_user['user_id'])
    # Phase 11C — mission hook (any log)
    if logs:
        await missions_mod.on_care_log(db, current_user['user_id'], logs[-1])
    return {
        "logged": len(logs),
        "plants_affected": plants_affected,
        "actions": actions,
        "group_id": group_id,
    }

@api_router.get("/care-logs/due-today")
async def get_due_today(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).isoformat()
    plants = await db.plants.find({
        "user_id": current_user['user_id'],
        "is_archived": {"$ne": True},
        "next_water_due": {"$lte": tomorrow}
    }, {"_id": 0}).sort("next_water_due", 1).to_list(100)
    for p in plants:
        p['status'] = calculate_plant_status(p)
        p['status_reason'] = compute_status_reason(p, p['status'])
    return [serialize_doc(p) for p in plants]

# ============ FILE UPLOAD ============

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    allowed = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
    if ext.lower() not in allowed:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    path = generate_storage_path(current_user['user_id'], ext.lower())
    try:
        result = put_object(path, data, file.content_type or "image/png")
        file_doc = {
            "id": str(uuid.uuid4()), "storage_path": result["path"],
            "original_filename": file.filename,
            "content_type": file.content_type, "size": result["size"],
            "user_id": current_user['user_id'], "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.files.insert_one(file_doc)
        return {"path": result["path"], "id": file_doc["id"], "size": result["size"]}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/files/{path:path}")
async def download_file(path: str, auth: Optional[str] = None, current_user: dict = Depends(get_optional_user)):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found")

class ValidatePhotoInput(BaseModel):
    path: str  # storage path returned by /api/upload


PHOTO_VALIDATION_SYSTEM = (
    "You are a careful visual reviewer for Grove, a plant care app. "
    "Evaluate a user-submitted plant photo for basic quality so they get gentle, "
    "encouraging guidance before it becomes their plant's profile photo. "
    "Return ONLY a JSON object — no prose, no code fences."
)

PHOTO_VALIDATION_PROMPT = (
    "Look at this plant photo and check:\n"
    "1. Is there clearly a plant visible?\n"
    "2. Is the plant the main subject?\n"
    "3. Is the image extremely blurry?\n"
    "4. Is the image extremely dark?\n\n"
    "Return JSON with EXACTLY these fields:\n"
    "{\n"
    '  "hasPlant": boolean,\n'
    '  "isMainSubject": boolean,\n'
    '  "isBlurry": boolean,\n'
    '  "isDark": boolean,\n'
    '  "accepted": boolean,\n'
    '  "feedback": string\n'
    "}\n"
    "Rules: accepted = hasPlant AND isMainSubject AND NOT isBlurry AND NOT isDark. "
    "If accepted, set feedback to an empty string. "
    "If not accepted, feedback is ONE short warm sentence in American English naming "
    "the single biggest issue and suggesting a gentle fix."
)


@api_router.post("/plants/validate-photo")
async def validate_plant_photo(input: ValidatePhotoInput, current_user: dict = Depends(get_current_user)):
    """Run a Claude-vision quality check on a plant photo. Caches result per
    (user_id + photo hash) so the same photo is never validated twice."""
    import hashlib
    # Fetch the uploaded photo from storage
    try:
        data, content_type = get_object(input.path)
    except Exception:
        raise HTTPException(status_code=404, detail="Photo not found at that path")

    photo_hash = hashlib.sha256(data).hexdigest()

    # Cache
    cached = await db.photo_validations.find_one({
        "user_id": current_user['user_id'],
        "photo_hash": photo_hash,
    })
    if cached:
        return {
            "cached": True,
            "hasPlant": cached.get('hasPlant', True),
            "isMainSubject": cached.get('isMainSubject', True),
            "isBlurry": cached.get('isBlurry', False),
            "isDark": cached.get('isDark', False),
            "accepted": cached.get('accepted', True),
            "feedback": cached.get('feedback', ''),
        }

    # Call Claude vision
    import base64 as _b64
    img_b64 = _b64.b64encode(data).decode('utf-8')
    try:
        response = await call_claude_vision(PHOTO_VALIDATION_SYSTEM, PHOTO_VALIDATION_PROMPT, img_b64)
        parsed = parse_json_response(response)
    except Exception as e:
        logger.exception("Photo validation error")
        # If AI call fails, don't block the user — accept by default
        return {
            "cached": False,
            "hasPlant": True, "isMainSubject": True,
            "isBlurry": False, "isDark": False,
            "accepted": True, "feedback": "",
            "error": "validation_unavailable",
        }

    # Normalize
    has_plant = bool(parsed.get('hasPlant', True))
    is_main = bool(parsed.get('isMainSubject', True))
    is_blurry = bool(parsed.get('isBlurry', False))
    is_dark = bool(parsed.get('isDark', False))
    accepted = has_plant and is_main and not is_blurry and not is_dark
    feedback = str(parsed.get('feedback') or '').strip()
    if accepted:
        feedback = ''

    # Persist cache
    await db.photo_validations.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user['user_id'],
        "photo_hash": photo_hash,
        "path": input.path,
        "hasPlant": has_plant,
        "isMainSubject": is_main,
        "isBlurry": is_blurry,
        "isDark": is_dark,
        "accepted": accepted,
        "feedback": feedback,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "cached": False,
        "hasPlant": has_plant,
        "isMainSubject": is_main,
        "isBlurry": is_blurry,
        "isDark": is_dark,
        "accepted": accepted,
        "feedback": feedback,
    }


# ============ Phase 13 — AI plant identification (single + room scan + batch) ============

class IdentifyPlantInput(BaseModel):
    path: Optional[str] = None
    image_base64: Optional[str] = None


def _strip_b64_prefix(s: str) -> str:
    if not s:
        return ""
    if s.startswith("data:"):
        # data:image/jpeg;base64,XXXXX
        try:
            return s.split(",", 1)[1]
        except Exception:
            return s
    return s


async def _resolve_image_b64(payload: IdentifyPlantInput) -> str:
    """Return base64 (no prefix) for the photo. Prefers stored path."""
    import base64 as _b64
    if payload.path:
        try:
            data, _ = get_object(payload.path)
        except Exception:
            raise HTTPException(status_code=404, detail="Photo not found at that path")
        return _b64.b64encode(data).decode('utf-8')
    if payload.image_base64:
        return _strip_b64_prefix(payload.image_base64)
    raise HTTPException(status_code=400, detail="Provide either `path` or `image_base64`.")


IDENTIFY_SYSTEM = (
    "You are a botanist and plant health expert analyzing a plant photograph "
    "for the Grove app. Always answer in warm American English, never punitive. "
    "Return ONLY a single valid JSON object — no prose, no markdown, no code fences."
)

IDENTIFY_PROMPT = (
    "Identify the plant in this image and assess its visible health. "
    "Return ONLY a JSON object with EXACTLY these fields:\n"
    "{\n"
    '  "commonName": "string",\n'
    '  "latinName": "string",\n'
    '  "confidence": number (0.0-1.0),\n'
    '  "nicknameSuggestion": "string — one warm, personality-based nickname, 2-3 syllables max",\n'
    '  "wateringFrequencyDays": number,\n'
    '  "wateringReason": "string — one short sentence",\n'
    '  "healthScore": number (0-100),\n'
    '  "healthSummary": "string — one warm sentence about visible health",\n'
    '  "healthFlags": [\n'
    '    {"issue": "string", "severity": "low|medium|high", "suggestion": "string"}\n'
    '  ],\n'
    '  "growMedium": "soil|leca|water|unknown",\n'
    '  "isConfident": boolean\n'
    "}\n"
    "If the image is unclear, set isConfident=false but still give your best guess "
    "with a lower confidence score."
)


@api_router.post("/plants/identify")
async def identify_plant(input: IdentifyPlantInput, current_user: dict = Depends(get_current_user)):
    img_b64 = await _resolve_image_b64(input)
    # Default response shape — used both for AI-fail and low-confidence paths
    fallback = {
        "identified": False,
        "isConfident": False,
        "commonName": "",
        "latinName": "",
        "confidence": 0.0,
        "nicknameSuggestion": "",
        "wateringFrequencyDays": 7,
        "wateringReason": "",
        "healthScore": 80,
        "healthSummary": "",
        "healthFlags": [],
        "growMedium": "unknown",
    }
    try:
        response = await call_claude_vision(IDENTIFY_SYSTEM, IDENTIFY_PROMPT, img_b64)
        parsed = parse_json_response(response)
    except Exception:
        logger.exception("identify_plant Claude error")
        return {
            **fallback,
            "error": "identification_failed",
            "message": "Identification unavailable — you can enter details manually.",
        }
    # Normalize fields with defaults
    common = (parsed.get('commonName') or '').strip()
    latin = (parsed.get('latinName') or '').strip()
    confidence = float(parsed.get('confidence') or 0.0)
    confidence = max(0.0, min(1.0, confidence))
    is_confident = bool(parsed.get('isConfident', confidence >= 0.7))
    health_score = int(parsed.get('healthScore') or 80)
    health_score = max(0, min(100, health_score))
    flags_raw = parsed.get('healthFlags') or []
    flags: List[dict] = []
    for f in flags_raw if isinstance(flags_raw, list) else []:
        if isinstance(f, dict):
            flags.append({
                "issue": str(f.get('issue') or '')[:200],
                "severity": str(f.get('severity') or 'low'),
                "suggestion": str(f.get('suggestion') or '')[:240],
            })
    out = {
        "identified": is_confident and bool(common),
        "isConfident": is_confident,
        "commonName": common or "Unknown plant",
        "latinName": latin,
        "confidence": confidence,
        "nicknameSuggestion": (parsed.get('nicknameSuggestion') or '').strip()[:32],
        "wateringFrequencyDays": int(parsed.get('wateringFrequencyDays') or 7),
        "wateringReason": (parsed.get('wateringReason') or '').strip(),
        "healthScore": health_score,
        "healthSummary": (parsed.get('healthSummary') or '').strip(),
        "healthFlags": flags,
        "growMedium": parsed.get('growMedium') if parsed.get('growMedium') in ['soil', 'leca', 'water', 'unknown'] else 'unknown',
    }
    if not is_confident:
        out["message"] = "We're not fully sure on this one — try a closer photo in better light, or enter the name yourself."
    return out


ROOM_SCAN_SYSTEM = (
    "You are a botanist analyzing a room photo for the Grove app. "
    "Identify EVERY plant visible. Always answer in warm American English. "
    "Return ONLY a single valid JSON object — no prose, no markdown."
)

ROOM_SCAN_PROMPT = (
    "Find every plant in this image. For each, provide a bounding box as percentages "
    "of the full image (xPercent and yPercent are the top-left corner). "
    "Return ONLY JSON with EXACTLY these fields:\n"
    "{\n"
    '  "plantsFound": number,\n'
    '  "roomDescription": "string",\n'
    '  "plants": [\n'
    "    {\n"
    '      "id": "plant_1",\n'
    '      "commonName": "string",\n'
    '      "latinName": "string",\n'
    '      "confidence": number (0.0-1.0),\n'
    '      "nicknameSuggestion": "string",\n'
    '      "wateringFrequencyDays": number,\n'
    '      "healthScore": number (0-100),\n'
    '      "healthSummary": "string",\n'
    '      "growMedium": "soil|leca|water|unknown",\n'
    '      "boundingBox": {"xPercent": number, "yPercent": number, "widthPercent": number, "heightPercent": number},\n'
    '      "notes": "string"\n'
    "    }\n"
    "  ]\n"
    "}\n"
    "Include every visible plant, even partial ones. If unsure, lower the confidence rather than skipping. "
    "Return an empty plants array if no plants are visible."
)


def _safe_box(box: dict) -> Optional[dict]:
    """Clip to image bounds and reject implausibly small boxes (< 5% area)."""
    if not isinstance(box, dict):
        return None
    try:
        x = max(0.0, min(100.0, float(box.get('xPercent', 0))))
        y = max(0.0, min(100.0, float(box.get('yPercent', 0))))
        w = max(0.0, min(100.0 - x, float(box.get('widthPercent', 0))))
        h = max(0.0, min(100.0 - y, float(box.get('heightPercent', 0))))
    except Exception:
        return None
    area = w * h
    if area < 25.0:  # less than 5% × 5% of image — too small / implausible
        return None
    return {"xPercent": x, "yPercent": y, "widthPercent": w, "heightPercent": h}


@api_router.post("/plants/scan-room")
async def scan_room_removed(current_user: dict = Depends(get_current_user)):
    # Phase 14 Part 8.2 — room-photo identification removed entirely.
    raise HTTPException(status_code=410, detail="Room scan has been removed. Add plants one at a time.")


class BatchPlantItem(BaseModel):
    common_name: str
    latin_name: Optional[str] = None
    nickname: Optional[str] = None
    grow_medium: str = "soil"
    watering_frequency_days: Optional[int] = None
    photo_url: str  # already-uploaded storage path
    ai_identified: bool = True
    ai_confidence: Optional[float] = None
    ai_health_score: Optional[int] = None
    ai_health_summary: Optional[str] = None


class BatchPlantsInput(BaseModel):
    plants: List[BatchPlantItem]
    room: Optional[str] = None


@api_router.post("/plants/batch")
async def batch_create_plants(input: BatchPlantsInput, current_user: dict = Depends(get_current_user)):
    if not input.plants:
        raise HTTPException(status_code=400, detail="No plants supplied")

    user = await db.users.find_one({"id": current_user['user_id']})
    is_free = (user or {}).get('tier', 'free') == 'free'
    if is_free:
        existing = await db.plants.count_documents({"user_id": current_user['user_id'], "is_archived": {"$ne": True}})
        if existing + len(input.plants) > 15:
            raise HTTPException(
                status_code=403,
                detail=f"Free tier limited to 15 plants. You have {existing} and tried to add {len(input.plants)}."
            )

    now = datetime.now(timezone.utc)
    created: List[dict] = []
    failed: List[dict] = []
    for item in input.plants:
        try:
            if not item.photo_url:
                failed.append({"common_name": item.common_name, "error": "missing_photo_url"})
                continue
            wd = int(item.watering_frequency_days or 7)
            wd = max(1, min(365, wd))
            ai_conf = item.ai_confidence
            if ai_conf is not None:
                try:
                    ai_conf = max(0.0, min(1.0, float(ai_conf)))
                except Exception:
                    ai_conf = None
            ai_health = None
            if item.ai_health_score is not None:
                try:
                    ai_health = max(0, min(100, int(item.ai_health_score)))
                except Exception:
                    ai_health = None
            plant = {
                "id": str(uuid.uuid4()),
                "user_id": current_user['user_id'],
                "common_name": item.common_name,
                "latin_name": item.latin_name or "",
                "species_id": None,
                "nickname": item.nickname or "",
                "room": input.room or "",
                "grow_medium": item.grow_medium or "soil",
                "photo_url": item.photo_url,
                "notes": "",
                "photo_required_since": None,
                "acquired_date": now.date().isoformat(),
                "acquired_from": "",
                "propagated_from_plant_id": None,
                "propagated_from_user_id": None,
                "watering_frequency_days": wd,
                "watering_frequency_source": "ai",
                "last_watered_at": now.isoformat(),
                "next_water_due": (now + timedelta(days=wd)).isoformat(),
                "health_score": ai_health if ai_health is not None else 80,
                "status": "healthy",
                "is_archived": False,
                "ai_identified": bool(item.ai_identified),
                "ai_confidence": ai_conf,
                "ai_health_summary": (item.ai_health_summary or "")[:500],
                "ai_health_flags": [],
                "ai_species_confirmed": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }
            await db.plants.insert_one(plant)
            created.append(serialize_doc({k: v for k, v in plant.items() if k != '_id'}))
        except Exception as e:
            logger.exception("batch_create_plants per-item failure")
            failed.append({"common_name": item.common_name, "error": str(e)[:200]})

    if created:
        await check_and_award_badges(current_user['user_id'])

    return {"created": len(created), "failed": len(failed), "plants": created, "failures": failed}


@api_router.post("/plants/{plant_id}/photo")
async def upload_plant_photo(plant_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    data = await file.read()
    path = generate_storage_path(current_user['user_id'], ext.lower())
    try:
        result = put_object(path, data, file.content_type or "image/png")
        now_iso = datetime.now(timezone.utc).isoformat()
        # Phase 14A.2 — also append to the plant's photo gallery (cap 10). The
        # gallery is the source of truth for the photo-driven growth timeline
        # coming in Phase 14B.
        photo_entry = {
            "id": str(uuid.uuid4()),
            "path": result["path"],
            "taken_at": now_iso,
            "uploaded_at": now_iso,
            "caption": "",
            "is_cover": True,
        }
        # Demote any existing cover so there's exactly one cover.
        existing = list(plant.get('photos') or [])
        for p in existing:
            p['is_cover'] = False
        existing.insert(0, photo_entry)
        # Enforce 10-photo cap — prefer to keep the newest 10.
        if len(existing) > 10:
            existing = existing[:10]
        await db.plants.update_one(
            {"id": plant_id},
            {"$set": {
                "photo_url": result["path"],
                "photos": existing,
                "photo_required_since": None,
                "updated_at": now_iso,
            }}
        )
        file_doc = {
            "id": str(uuid.uuid4()), "storage_path": result["path"],
            "original_filename": file.filename, "content_type": file.content_type,
            "size": result["size"], "user_id": current_user['user_id'],
            "plant_id": plant_id, "is_deleted": False,
            "created_at": now_iso,
        }
        await db.files.insert_one(file_doc)
        return {"path": result["path"], "size": result["size"], "photo_id": photo_entry["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Phase 14A.2 — Multi-photo gallery endpoints. Up to 10 photos per plant, each
# with a `taken_at` timestamp that feeds the photo-driven growth timeline.

PLANT_PHOTO_CAP = 10

class PlantPhotoPatch(BaseModel):
    caption: Optional[str] = None
    taken_at: Optional[str] = None
    is_cover: Optional[bool] = None

@api_router.get("/plants/{plant_id}/photos")
async def list_plant_photos(plant_id: str, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    photos = list(plant.get('photos') or [])
    # Sort by taken_at desc, fallback to uploaded_at
    def _sort_key(p):
        return p.get('taken_at') or p.get('uploaded_at') or ''
    photos.sort(key=_sort_key, reverse=True)
    return {"photos": photos, "cap": PLANT_PHOTO_CAP, "count": len(photos)}

@api_router.post("/plants/{plant_id}/photos")
async def add_plant_photo(
    plant_id: str,
    file: UploadFile = File(...),
    taken_at: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    existing = list(plant.get('photos') or [])
    if len(existing) >= PLANT_PHOTO_CAP:
        raise HTTPException(
            status_code=400,
            detail=f"Photo limit reached ({PLANT_PHOTO_CAP}). Delete a photo to add a new one.",
        )
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "png"
    data = await file.read()
    path = generate_storage_path(current_user['user_id'], ext.lower())
    try:
        result = put_object(path, data, file.content_type or "image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    now_iso = datetime.now(timezone.utc).isoformat()
    # Validate taken_at (ISO8601). If invalid or missing, default to now.
    taken_iso = now_iso
    if taken_at:
        try:
            # Accept both naive date and full ISO; coerce to ISO-8601 UTC
            dt = datetime.fromisoformat(taken_at.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            taken_iso = dt.astimezone(timezone.utc).isoformat()
        except (ValueError, TypeError):
            taken_iso = now_iso
    is_first = len(existing) == 0
    photo_entry = {
        "id": str(uuid.uuid4()),
        "path": result["path"],
        "taken_at": taken_iso,
        "uploaded_at": now_iso,
        "caption": (caption or '').strip(),
        "is_cover": is_first,  # first photo auto-becomes cover
    }
    existing.append(photo_entry)
    update = {"photos": existing, "updated_at": now_iso}
    if is_first:
        update["photo_url"] = result["path"]
        update["photo_required_since"] = None
    await db.plants.update_one({"id": plant_id}, {"$set": update})
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "storage_path": result["path"],
        "original_filename": file.filename, "content_type": file.content_type,
        "size": result["size"], "user_id": current_user['user_id'],
        "plant_id": plant_id, "is_deleted": False,
        "created_at": now_iso,
    })
    return {"photo": photo_entry, "count": len(existing), "cap": PLANT_PHOTO_CAP}

@api_router.patch("/plants/{plant_id}/photos/{photo_id}")
async def update_plant_photo(
    plant_id: str, photo_id: str, input: PlantPhotoPatch,
    current_user: dict = Depends(get_current_user),
):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    photos = list(plant.get('photos') or [])
    idx = next((i for i, p in enumerate(photos) if p.get('id') == photo_id), -1)
    if idx < 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    target = photos[idx]
    if input.caption is not None:
        target['caption'] = input.caption.strip()
    if input.taken_at is not None:
        try:
            dt = datetime.fromisoformat(input.taken_at.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            target['taken_at'] = dt.astimezone(timezone.utc).isoformat()
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid taken_at timestamp")
    update = {"photos": photos, "updated_at": datetime.now(timezone.utc).isoformat()}
    if input.is_cover is True:
        for p in photos:
            p['is_cover'] = (p.get('id') == photo_id)
        update["photo_url"] = target.get('path', plant.get('photo_url', ''))
    await db.plants.update_one({"id": plant_id}, {"$set": update})
    return {"photo": target}

@api_router.delete("/plants/{plant_id}/photos/{photo_id}")
async def delete_plant_photo(plant_id: str, photo_id: str, current_user: dict = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    photos = list(plant.get('photos') or [])
    target = next((p for p in photos if p.get('id') == photo_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Photo not found")
    was_cover = bool(target.get('is_cover'))
    photos = [p for p in photos if p.get('id') != photo_id]
    update = {"photos": photos, "updated_at": datetime.now(timezone.utc).isoformat()}
    if was_cover:
        # Promote the newest remaining photo (by taken_at) as the new cover.
        if photos:
            newest = max(
                photos,
                key=lambda p: p.get('taken_at') or p.get('uploaded_at') or '',
            )
            for p in photos:
                p['is_cover'] = (p.get('id') == newest.get('id'))
            update["photos"] = photos
            update["photo_url"] = newest.get('path', '')
        else:
            update["photo_url"] = ''
    # Also soft-delete the file record for auditing
    try:
        await db.files.update_many(
            {"plant_id": plant_id, "storage_path": target.get('path')},
            {"$set": {"is_deleted": True}},
        )
    except Exception:
        pass
    await db.plants.update_one({"id": plant_id}, {"$set": update})
    return {"deleted": photo_id, "remaining": len(photos)}

# ============ ROOMS ============

@api_router.get("/rooms")
async def get_rooms(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": current_user['user_id'], "is_archived": {"$ne": True}, "room": {"$ne": ""}}},
        {"$group": {"_id": "$room", "count": {"$sum": 1}, "plants": {"$push": {"id": "$id", "common_name": "$common_name", "photo_url": "$photo_url", "status": "$status"}}}},
        {"$sort": {"_id": 1}}
    ]
    rooms = await db.plants.aggregate(pipeline).to_list(50)
    result = []
    for r in rooms:
        plants_preview = r['plants'][:4]
        result.append({
            "room": r['_id'], "count": r['count'],
            "plants": plants_preview, "overflow": max(0, r['count'] - 4)
        })
    return result

# ============ STATS ============

@api_router.get("/stats/me")
async def get_full_stats(current_user: dict = Depends(get_current_user)):
    return await get_user_stats(current_user['user_id'])

@api_router.get("/stats/me/care-hours")
async def get_care_hours(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": current_user['user_id']}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}}}
    ]
    breakdown = await db.care_logs.aggregate(pipeline).to_list(20)
    result = {}
    total_minutes = 0
    for item in breakdown:
        action = item['_id']
        count = item['count']
        minutes = CARE_ACTION_MINUTES.get(action, 1) * count
        total_minutes += minutes
        result[action] = {"count": count, "estimated_minutes": minutes}
    result['total_hours'] = round(total_minutes / 60, 1)
    return result

# ============ BOUQUET ROUTES (Phase 3) ============

class BouquetCreate(BaseModel):
    name: Optional[str] = None
    occasion: Optional[str] = None
    received_date: Optional[str] = None
    notes: Optional[str] = None
    personal_note: Optional[str] = None

class BouquetUpdate(BaseModel):
    name: Optional[str] = None
    occasion: Optional[str] = None
    notes: Optional[str] = None
    personal_note: Optional[str] = None
    is_active: Optional[bool] = None
    vase_life_achieved: Optional[int] = None

@api_router.get("/bouquets")
async def get_bouquets(current_user: dict = Depends(get_current_user)):
    bouquets = await db.bouquets.find(
        {"user_id": current_user['user_id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [serialize_doc(b) for b in bouquets]

@api_router.get("/bouquets/limits")
async def get_bouquet_limits(current_user: dict = Depends(get_current_user)):
    """Return tier-aware bouquet limit and usage so the frontend can render a counter/banner."""
    user = await db.users.find_one({"id": current_user['user_id']})
    tier = (user or {}).get('tier', 'free')
    active_count = await db.bouquets.count_documents({
        "user_id": current_user['user_id'],
        "is_active": True
    })
    total_count = await db.bouquets.count_documents({"user_id": current_user['user_id']})
    if tier == 'free':
        max_active = 2
        can_create = active_count < max_active
    else:
        max_active = None
        can_create = True
    return {
        "tier": tier,
        "active_count": active_count,
        "total_count": total_count,
        "max_active": max_active,
        "can_create": can_create,
    }

@api_router.post("/bouquets")
async def create_bouquet(input: BouquetCreate, current_user: dict = Depends(get_current_user)):
    # Free-tier limit: max 2 active bouquets. No gating on viewing/editing.
    user = await db.users.find_one({"id": current_user['user_id']})
    if user and user.get('tier', 'free') == 'free':
        active_count = await db.bouquets.count_documents({
            "user_id": current_user['user_id'],
            "is_active": True
        })
        if active_count >= 2:
            raise HTTPException(
                status_code=403,
                detail="You've reached the free tier limit of 2 active bouquets. Archive one to add another, or upgrade to track unlimited arrangements."
            )
    now = datetime.now(timezone.utc)
    slug = secrets.token_urlsafe(8)
    bouquet = {
        "id": str(uuid.uuid4()), "user_id": current_user['user_id'],
        "name": input.name or "My Bouquet",
        "occasion": input.occasion or "",
        "received_date": input.received_date or now.date().isoformat(),
        "photo_url": "", "public_slug": slug,
        "vase_life_expected": None, "vase_life_achieved": None,
        "notes": input.notes or "", "personal_note": input.personal_note or "",
        "florist_user_id": None, "studio_name": "",
        "is_active": True,
        "created_at": now.isoformat(), "updated_at": now.isoformat()
    }
    await db.bouquets.insert_one(bouquet)
    # Phase 14C.3.b — bouquet count badges
    await check_and_award_badges(current_user['user_id'])
    return serialize_doc({k: v for k, v in bouquet.items() if k != '_id'})

@api_router.get("/bouquets/{bouquet_id}")
async def get_bouquet(bouquet_id: str, current_user: dict = Depends(get_current_user)):
    bouquet = await db.bouquets.find_one({"id": bouquet_id, "user_id": current_user['user_id']})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    flowers = await db.bouquet_flowers.find({"bouquet_id": bouquet_id}, {"_id": 0}).to_list(50)
    care_logs = await db.bouquet_care_logs.find(
        {"bouquet_id": bouquet_id}, {"_id": 0}
    ).sort("logged_at", -1).to_list(50)
    result = serialize_doc(bouquet)
    result['flowers'] = [serialize_doc(f) for f in flowers]
    result['care_logs'] = [serialize_doc(l) for l in care_logs]
    return result

@api_router.patch("/bouquets/{bouquet_id}")
async def update_bouquet(bouquet_id: str, input: BouquetUpdate, current_user: dict = Depends(get_current_user)):
    bouquet = await db.bouquets.find_one({"id": bouquet_id, "user_id": current_user['user_id']})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.bouquets.update_one({"id": bouquet_id}, {"$set": updates})
    updated = await db.bouquets.find_one({"id": bouquet_id})
    return serialize_doc(updated)

@api_router.post("/bouquets/{bouquet_id}/identify")
async def identify_bouquet(bouquet_id: str, current_user: dict = Depends(get_current_user)):
    bouquet = await db.bouquets.find_one({"id": bouquet_id, "user_id": current_user['user_id']})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    # Check if bouquet has a photo
    if not bouquet.get('photo_url'):
        raise HTTPException(status_code=400, detail="Upload a bouquet photo first to identify flowers")
    try:
        # Download the photo
        photo_data, _ = get_object(bouquet['photo_url'])
        image_base64 = base64.b64encode(photo_data).decode('utf-8')
        system = "You are a professional florist and botanical expert. Always respond with valid JSON only, no markdown."
        prompt = """Identify all flowers and foliage visible in this bouquet. For each, return:
common_name, latin_name, estimated_stem_count, vase_life_days (realistic integer average), 
care_instructions (2 sentences), ai_confidence (0.0-1.0).
Return ONLY valid JSON array: [{ "common_name": "...", "latin_name": "...", "estimated_stem_count": N, "vase_life_days": N, "care_instructions": "...", "ai_confidence": 0.N }]"""
        response = await call_claude_vision(system, prompt, image_base64)
        flowers_data = parse_json_response(response)
        if isinstance(flowers_data, dict) and 'flowers' in flowers_data:
            flowers_data = flowers_data['flowers']
        if not isinstance(flowers_data, list):
            flowers_data = [flowers_data]
        # Save flowers
        min_vase_life = 999
        for f in flowers_data:
            flower_doc = {
                "id": str(uuid.uuid4()), "bouquet_id": bouquet_id,
                "common_name": f.get('common_name', 'Unknown'),
                "latin_name": f.get('latin_name', ''),
                "stem_count": f.get('estimated_stem_count', 1),
                "vase_life_days": f.get('vase_life_days', 7),
                "ai_confidence": f.get('ai_confidence', 0.5),
                "care_instructions": f.get('care_instructions', ''),
                "preserve_note": "", "removed_at": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.bouquet_flowers.insert_one(flower_doc)
            if flower_doc['vase_life_days'] < min_vase_life:
                min_vase_life = flower_doc['vase_life_days']
        if min_vase_life < 999:
            await db.bouquets.update_one(
                {"id": bouquet_id},
                {"$set": {"vase_life_expected": min_vase_life, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        return {"flowers": flowers_data, "vase_life_expected": min_vase_life if min_vase_life < 999 else None}
    except Exception as e:
        logger.error(f"Bouquet identification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Identification failed: {str(e)}")

@api_router.post("/bouquets/{bouquet_id}/identify-text")
async def identify_bouquet_text(bouquet_id: str, current_user: dict = Depends(get_current_user)):
    """Text-based identification when no photo available - describe the bouquet"""
    bouquet = await db.bouquets.find_one({"id": bouquet_id, "user_id": current_user['user_id']})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    description = bouquet.get('notes', '') or bouquet.get('name', 'mixed bouquet')
    try:
        system = "You are a professional florist. Always respond with valid JSON only."
        prompt = f"""Based on this bouquet description: "{description}"
Suggest likely flowers that would be in this arrangement. For each, return:
common_name, latin_name, estimated_stem_count, vase_life_days, care_instructions (2 sentences), ai_confidence (0.0-1.0).
Return ONLY valid JSON array: [{{ "common_name": "...", "latin_name": "...", "estimated_stem_count": 3, "vase_life_days": 7, "care_instructions": "...", "ai_confidence": 0.5 }}]"""
        response = await call_claude(system, prompt)
        flowers_data = parse_json_response(response)
        if isinstance(flowers_data, dict) and 'flowers' in flowers_data:
            flowers_data = flowers_data['flowers']
        if not isinstance(flowers_data, list):
            flowers_data = [flowers_data]
        min_vase_life = 999
        for f in flowers_data:
            flower_doc = {
                "id": str(uuid.uuid4()), "bouquet_id": bouquet_id,
                "common_name": f.get('common_name', 'Unknown'),
                "latin_name": f.get('latin_name', ''),
                "stem_count": f.get('estimated_stem_count', 1),
                "vase_life_days": f.get('vase_life_days', 7),
                "ai_confidence": f.get('ai_confidence', 0.3),
                "care_instructions": f.get('care_instructions', ''),
                "preserve_note": "", "removed_at": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.bouquet_flowers.insert_one(flower_doc)
            if flower_doc['vase_life_days'] < min_vase_life:
                min_vase_life = flower_doc['vase_life_days']
        if min_vase_life < 999:
            await db.bouquets.update_one(
                {"id": bouquet_id},
                {"$set": {"vase_life_expected": min_vase_life, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        return {"flowers": flowers_data, "vase_life_expected": min_vase_life if min_vase_life < 999 else None}
    except Exception as e:
        logger.error(f"Text identification failed: {e}")
        raise HTTPException(status_code=500, detail=f"Identification failed: {str(e)}")

@api_router.get("/bouquets/{bouquet_id}/care-plan")
async def get_bouquet_care_plan(bouquet_id: str, current_user: dict = Depends(get_current_user)):
    bouquet = await db.bouquets.find_one({"id": bouquet_id, "user_id": current_user['user_id']})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    flowers = await db.bouquet_flowers.find({"bouquet_id": bouquet_id}, {"_id": 0}).to_list(50)
    if not flowers:
        raise HTTPException(status_code=400, detail="No flowers identified yet. Identify flowers first.")
    # Check cache
    if bouquet.get('care_plan'):
        return bouquet['care_plan']
    try:
        flower_info = ", ".join([f"{f.get('common_name', '')} (vase life {f.get('vase_life_days', 7)}d)" for f in flowers])
        system = "You are a professional florist providing care advice. Always respond with valid JSON only."
        prompt = f"""Generate a care plan for a bouquet containing: {flower_info}.
Received on: {bouquet.get('received_date', 'today')}.
Base timeline on the shortest-lived flower.
Return ONLY valid JSON: {{ "vase_life_days": N, "immediate_steps": ["..."], "daily_steps": ["..."], "day_specific": [{{ "day": N, "action": "..." }}], "preserve_note": "..." }}"""
        response = await call_claude(system, prompt)
        care_plan = parse_json_response(response)
        await db.bouquets.update_one(
            {"id": bouquet_id},
            {"$set": {"care_plan": care_plan, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return care_plan
    except Exception as e:
        logger.error(f"Care plan generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Care plan failed: {str(e)}")

class BouquetCareLogCreate(BaseModel):
    action: str  # water_change | stem_recut | remove_flower | photo | note
    notes: Optional[str] = None

@api_router.post("/bouquets/{bouquet_id}/care-logs")
async def create_bouquet_care_log(bouquet_id: str, input: BouquetCareLogCreate, current_user: dict = Depends(get_current_user)):
    bouquet = await db.bouquets.find_one({"id": bouquet_id, "user_id": current_user['user_id']})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    log = {
        "id": str(uuid.uuid4()), "bouquet_id": bouquet_id,
        "action": input.action, "notes": input.notes or "",
        "photo_url": "", "logged_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bouquet_care_logs.insert_one(log)
    await update_streak(current_user['user_id'])
    return serialize_doc({k: v for k, v in log.items() if k != '_id'})

@api_router.post("/bouquets/{bouquet_id}/photo")
async def upload_bouquet_photo(bouquet_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    bouquet = await db.bouquets.find_one({"id": bouquet_id, "user_id": current_user['user_id']})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    data = await file.read()
    path = generate_storage_path(current_user['user_id'], ext.lower())
    try:
        result = put_object(path, data, file.content_type or "image/png")
        await db.bouquets.update_one(
            {"id": bouquet_id},
            {"$set": {"photo_url": result["path"], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"path": result["path"], "size": result["size"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Public bouquet page (no auth)
@api_router.get("/bouquets/public/{slug}")
async def get_public_bouquet(slug: str):
    bouquet = await db.bouquets.find_one({"public_slug": slug})
    if not bouquet:
        raise HTTPException(status_code=404, detail="Bouquet not found")
    flowers = await db.bouquet_flowers.find({"bouquet_id": bouquet['id']}, {"_id": 0}).to_list(50)
    care_plan = bouquet.get('care_plan')
    user = await db.users.find_one({"id": bouquet['user_id']})
    return {
        "name": bouquet.get('name', 'Bouquet'),
        "occasion": bouquet.get('occasion', ''),
        "received_date": bouquet.get('received_date'),
        "photo_url": bouquet.get('photo_url', ''),
        "vase_life_expected": bouquet.get('vase_life_expected'),
        "personal_note": bouquet.get('personal_note', ''),
        "studio_name": bouquet.get('studio_name', ''),
        "flowers": [serialize_doc(f) for f in flowers],
        "care_plan": care_plan,
        "owner_username": user.get('username', '') if user else '',
        "is_active": bouquet.get('is_active', True)
    }

# ============ SOCIAL FEED ROUTES (Phase 4) ============

class PostCreate(BaseModel):
    post_type: str = "plant_update"  # plant_update | bouquet | propagation | milestone | swap_complete
    caption: Optional[str] = None
    plant_id: Optional[str] = None
    bouquet_id: Optional[str] = None
    photo_url: Optional[str] = None
    milestone_type: Optional[str] = None

class CommentCreate(BaseModel):
    body: str
    photo_url: Optional[str] = None

@api_router.get("/feed")
async def get_feed(current_user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    skip = (page - 1) * limit
    # Get user's grove memberships
    memberships = await db.grove_members.find({"user_id": current_user['user_id']}).to_list(50)
    grove_ids = [m['grove_id'] for m in memberships]
    # Get all grove member user_ids
    member_user_ids = set()
    if grove_ids:
        members = await db.grove_members.find({"grove_id": {"$in": grove_ids}}).to_list(500)
        member_user_ids = {m['user_id'] for m in members}
    # Include own posts and grove members' posts
    member_user_ids.add(current_user['user_id'])
    posts = await db.posts.find(
        {"user_id": {"$in": list(member_user_ids)}}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    # Enrich posts with user info
    enriched = []
    # Bulk fetch reactions for all post IDs in this page
    post_id_list = [p['id'] for p in posts]
    reactions_all = []
    if post_id_list:
        reactions_all = await db.reactions.find(
            {"post_id": {"$in": post_id_list}}, {"_id": 0}
        ).to_list(5000)
    reactions_by_post = {}
    for r in reactions_all:
        reactions_by_post.setdefault(r['post_id'], []).append(r)
    for post in posts:
        user = await db.users.find_one({"id": post['user_id']})
        post_data = serialize_doc(post)
        post_data['username'] = user.get('username', 'Unknown') if user else 'Unknown'
        post_data['display_name'] = user.get('display_name', '') if user else ''
        post_data['avatar_url'] = user.get('avatar_url', '') if user else ''
        # Pre-testing diagnostic: surface verified flags so the FeedPage
        # can render the Verified Pro checkmark next to the author's name
        # when the user has both flags set.
        post_data['verified_user'] = bool(user.get('verified_user')) if user else False
        post_data['verified_by_admin'] = bool(user.get('verified_by_admin')) if user else False
        # Back-compat kudos
        kudos = await db.kudos.find_one({"post_id": post['id'], "user_id": current_user['user_id']})
        post_data['user_gave_kudos'] = kudos is not None
        # Reactions counts + user's own reactions
        p_reactions = reactions_by_post.get(post['id'], [])
        counts = {"leaf": 0, "light": 0, "cutting": 0}
        user_types = []
        for r in p_reactions:
            rt = r.get('type')
            if rt in counts:
                counts[rt] += 1
            if r.get('user_id') == current_user['user_id'] and rt in counts:
                user_types.append(rt)
        post_data['reactions'] = counts
        post_data['user_reactions'] = user_types
        # Get plant info if applicable
        if post.get('plant_id'):
            plant = await db.plants.find_one({"id": post['plant_id']})
            if plant:
                post_data['plant_name'] = plant.get('nickname') or plant.get('common_name', '')
                post_data['plant_latin_name'] = plant.get('latin_name', '')
        enriched.append(post_data)
    return {"posts": enriched, "page": page, "limit": limit}

@api_router.post("/posts")
async def create_post(input: PostCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    post = {
        "id": str(uuid.uuid4()), "user_id": current_user['user_id'],
        "plant_id": input.plant_id, "bouquet_id": input.bouquet_id,
        "post_type": input.post_type, "caption": input.caption or "",
        "photo_url": input.photo_url or "", "milestone_type": input.milestone_type,
        "kudos_count": 0, "comment_count": 0,
        "created_at": now.isoformat()
    }
    await db.posts.insert_one(post)
    # Phase 11C — community_engage mission
    await missions_mod.on_community_action(db, current_user['user_id'], 'post')
    # Phase 14C.3.b — post_first / post_10 badges + photo_post family
    await check_and_award_badges(current_user['user_id'])
    return serialize_doc({k: v for k, v in post.items() if k != '_id'})

@api_router.get("/posts/{post_id}")
async def get_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    user = await db.users.find_one({"id": post['user_id']})
    result = serialize_doc(post)
    result['username'] = user.get('username', '') if user else ''
    result['display_name'] = user.get('display_name', '') if user else ''
    return result

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.posts.delete_one({"id": post_id, "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted"}

@api_router.post("/posts/{post_id}/kudos")
async def add_kudos(post_id: str, current_user: dict = Depends(get_current_user)):
    existing = await db.kudos.find_one({"post_id": post_id, "user_id": current_user['user_id']})
    if existing:
        raise HTTPException(status_code=400, detail="Already gave kudos")
    await db.kudos.insert_one({
        "id": str(uuid.uuid4()), "post_id": post_id,
        "user_id": current_user['user_id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.posts.update_one({"id": post_id}, {"$inc": {"kudos_count": 1}})
    # Phase 14C.3.b — kudos_given_first for the giver, kudos_received_first for
    # the post's author. Both checks are idempotent.
    await check_and_award_badges(current_user['user_id'])
    target_post = await db.posts.find_one({"id": post_id}, {"user_id": 1})
    if target_post and target_post.get("user_id") and target_post["user_id"] != current_user["user_id"]:
        await check_and_award_badges(target_post["user_id"])
    return {"message": "Kudos given"}

@api_router.delete("/posts/{post_id}/kudos")
async def remove_kudos(post_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.kudos.delete_one({"post_id": post_id, "user_id": current_user['user_id']})
    if result.deleted_count > 0:
        await db.posts.update_one({"id": post_id}, {"$inc": {"kudos_count": -1}})
    return {"message": "Kudos removed"}

# === Grove reactions: leaf / light / cutting ===
REACTION_TYPES = {"leaf", "light", "cutting"}

class ReactionInput(BaseModel):
    type: str

@api_router.get("/posts/{post_id}/reactions")
async def get_post_reactions(post_id: str, current_user: dict = Depends(get_current_user)):
    reactions = await db.reactions.find({"post_id": post_id}, {"_id": 0}).to_list(1000)
    counts = {t: 0 for t in REACTION_TYPES}
    user_types = set()
    for r in reactions:
        rt = r.get('type')
        if rt in counts:
            counts[rt] += 1
        if r.get('user_id') == current_user['user_id']:
            user_types.add(rt)
    return {"counts": counts, "user_reactions": list(user_types)}

@api_router.post("/posts/{post_id}/reactions")
async def add_reaction(post_id: str, input: ReactionInput, current_user: dict = Depends(get_current_user)):
    if input.type not in REACTION_TYPES:
        raise HTTPException(status_code=400, detail="Invalid reaction type")
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    existing = await db.reactions.find_one({
        "post_id": post_id, "user_id": current_user['user_id'], "type": input.type
    })
    if existing:
        return {"added": False, "type": input.type}
    await db.reactions.insert_one({
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "user_id": current_user['user_id'],
        "type": input.type,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Notify the post author of the reaction (respects prefs; auto-suppresses self)
    actor = await db.users.find_one({"id": current_user['user_id']})
    actor_username = (actor or {}).get('username', 'someone')
    plant_name = ""
    if post.get('plant_id'):
        p = await db.plants.find_one({"id": post['plant_id']})
        if p:
            plant_name = p.get('nickname') or p.get('common_name', '')
    reaction_labels = {"leaf": "Leaf", "light": "Light", "cutting": "Cutting"}
    body_suffix = f" on your {plant_name} post." if plant_name else " on your post."
    await create_notification(
        user_id=post['user_id'],
        ntype="kudos_received",
        title=f"@{actor_username} left a reaction",
        body=f"{reaction_labels.get(input.type, input.type.title())}{body_suffix}",
        entity_type="post",
        entity_id=post_id,
        data={"reaction_type": input.type, "from_username": actor_username},
        actor_id=current_user['user_id'],
    )
    # "cutting" reaction auto-adds to wishlist
    if input.type == "cutting":
        existing_wish = await db.wishlist_items.find_one({
            "user_id": current_user['user_id'],
            "source_post_id": post_id
        })
        if not existing_wish:
            common_name = ""
            latin_name = ""
            plant_id = post.get('plant_id')
            if plant_id:
                plant = await db.plants.find_one({"id": plant_id})
                if plant:
                    common_name = plant.get('common_name', '') or plant.get('nickname', '')
                    latin_name = plant.get('latin_name', '')
            # Fallback: use caption snippet so users still get a wishlist entry for photo/caption-only posts
            if not common_name:
                caption = (post.get('caption') or '').strip()
                common_name = (caption[:60] + '…') if len(caption) > 60 else (caption or 'Grove cutting')
            await db.wishlist_items.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": current_user['user_id'],
                "plant_id": plant_id,
                "source_post_id": post_id,
                "common_name": common_name,
                "latin_name": latin_name,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    # Phase 11C — community_engage mission
    await missions_mod.on_community_action(db, current_user['user_id'], 'reaction')
    return {"added": True, "type": input.type}

@api_router.delete("/posts/{post_id}/reactions/{reaction_type}")
async def remove_reaction(post_id: str, reaction_type: str, current_user: dict = Depends(get_current_user)):
    if reaction_type not in REACTION_TYPES:
        raise HTTPException(status_code=400, detail="Invalid reaction type")
    result = await db.reactions.delete_one({
        "post_id": post_id, "user_id": current_user['user_id'], "type": reaction_type
    })
    return {"removed": result.deleted_count > 0}

@api_router.get("/wishlist")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    items = await db.wishlist_items.find(
        {"user_id": current_user['user_id']}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return [serialize_doc(i) for i in items]

@api_router.delete("/wishlist/{item_id}")
async def remove_wishlist_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.wishlist_items.delete_one({"id": item_id, "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    return {"removed": True}

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, current_user: dict = Depends(get_current_user)):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    enriched = []
    for c in comments:
        user = await db.users.find_one({"id": c['user_id']})
        comment_data = serialize_doc(c)
        comment_data['username'] = user.get('username', '') if user else ''
        comment_data['display_name'] = user.get('display_name', '') if user else ''
        enriched.append(comment_data)
    return enriched

@api_router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, input: CommentCreate, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comment = {
        "id": str(uuid.uuid4()), "post_id": post_id,
        "user_id": current_user['user_id'], "body": input.body,
        "photo_url": input.photo_url or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(comment)
    await db.posts.update_one({"id": post_id}, {"$inc": {"comment_count": 1}})
    user = await db.users.find_one({"id": current_user['user_id']})
    actor_username = (user or {}).get('username', 'someone')
    # Notify post author of the new comment
    preview = (input.body or '')[:90]
    await create_notification(
        user_id=post['user_id'],
        ntype="comment_received",
        title=f"@{actor_username} commented",
        body=preview if preview else "Left a comment on your post.",
        entity_type="post",
        entity_id=post_id,
        data={"from_username": actor_username, "comment_preview": preview},
        actor_id=current_user['user_id'],
    )
    result = serialize_doc({k: v for k, v in comment.items() if k != '_id'})
    result['username'] = user.get('username', '') if user else ''
    result['display_name'] = user.get('display_name', '') if user else ''
    # Phase 11C — community_engage mission
    await missions_mod.on_community_action(db, current_user['user_id'], 'comment')
    return result

# ============ GROVES ROUTES (Phase 4) ============

class GroveCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_private: bool = False

@api_router.get("/groves")
async def get_groves(current_user: dict = Depends(get_current_user)):
    # Get user's groves
    memberships = await db.grove_members.find({"user_id": current_user['user_id']}).to_list(50)
    grove_ids = [m['grove_id'] for m in memberships]
    groves = await db.groves.find({"id": {"$in": grove_ids}}, {"_id": 0}).to_list(50)
    result = []
    for g in groves:
        member_count = await db.grove_members.count_documents({"grove_id": g['id']})
        grove_data = serialize_doc(g)
        grove_data['member_count'] = member_count
        # Check role
        membership = next((m for m in memberships if m['grove_id'] == g['id']), None)
        grove_data['user_role'] = membership.get('role', 'member') if membership else None
        result.append(grove_data)
    return result

@api_router.post("/groves")
async def create_grove(input: GroveCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    grove_id = str(uuid.uuid4())
    grove = {
        "id": grove_id, "name": input.name,
        "description": input.description or "",
        "is_private": input.is_private,
        "created_by": current_user['user_id'],
        "created_at": now.isoformat()
    }
    await db.groves.insert_one(grove)
    # Auto-join creator as admin
    await db.grove_members.insert_one({
        "id": str(uuid.uuid4()), "grove_id": grove_id,
        "user_id": current_user['user_id'], "role": "admin",
        "joined_at": now.isoformat()
    })
    return serialize_doc({k: v for k, v in grove.items() if k != '_id'})

@api_router.get("/groves/discover")
async def discover_groves(current_user: dict = Depends(get_current_user)):
    # Get public groves user hasn't joined
    memberships = await db.grove_members.find({"user_id": current_user['user_id']}).to_list(50)
    joined_ids = {m['grove_id'] for m in memberships}
    all_public = await db.groves.find({"is_private": False}, {"_id": 0}).limit(20).to_list(20)
    result = []
    for g in all_public:
        if g['id'] not in joined_ids:
            member_count = await db.grove_members.count_documents({"grove_id": g['id']})
            grove_data = serialize_doc(g)
            grove_data['member_count'] = member_count
            result.append(grove_data)
    return result

@api_router.get("/groves/{grove_id}")
async def get_grove(grove_id: str, current_user: dict = Depends(get_current_user)):
    grove = await db.groves.find_one({"id": grove_id})
    if not grove:
        raise HTTPException(status_code=404, detail="Grove not found")
    member_count = await db.grove_members.count_documents({"grove_id": grove_id})
    membership = await db.grove_members.find_one({"grove_id": grove_id, "user_id": current_user['user_id']})
    result = serialize_doc(grove)
    result['member_count'] = member_count
    result['user_role'] = membership.get('role') if membership else None
    result['is_member'] = membership is not None
    return result

@api_router.post("/groves/{grove_id}/join")
async def join_grove(grove_id: str, current_user: dict = Depends(get_current_user)):
    grove = await db.groves.find_one({"id": grove_id})
    if not grove:
        raise HTTPException(status_code=404, detail="Grove not found")
    existing = await db.grove_members.find_one({"grove_id": grove_id, "user_id": current_user['user_id']})
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    await db.grove_members.insert_one({
        "id": str(uuid.uuid4()), "grove_id": grove_id,
        "user_id": current_user['user_id'], "role": "member",
        "joined_at": datetime.now(timezone.utc).isoformat()
    })
    # Phase 14C.3.b — grove_joined_first
    await check_and_award_badges(current_user['user_id'])
    return {"message": "Joined grove"}

@api_router.delete("/groves/{grove_id}/leave")
async def leave_grove(grove_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.grove_members.delete_one({"grove_id": grove_id, "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not a member")
    return {"message": "Left grove"}

@api_router.get("/groves/{grove_id}/members")
async def get_grove_members(grove_id: str, current_user: dict = Depends(get_current_user)):
    members = await db.grove_members.find({"grove_id": grove_id}).to_list(100)
    result = []
    for m in members:
        user = await db.users.find_one({"id": m['user_id']})
        if user:
            result.append({
                "user_id": m['user_id'],
                "username": user.get('username', ''),
                "display_name": user.get('display_name', ''),
                "avatar_url": user.get('avatar_url', ''),
                "role": m.get('role', 'member'),
                "joined_at": m.get('joined_at'),
                # Pre-testing diagnostic: surface verified flags so the
                # member list can render the Verified Pro checkmark.
                "verified_user": bool(user.get('verified_user')),
                "verified_by_admin": bool(user.get('verified_by_admin')),
            })
    return result

@api_router.get("/groves/{grove_id}/feed")
async def get_grove_feed(grove_id: str, current_user: dict = Depends(get_current_user), page: int = 1, limit: int = 20):
    members = await db.grove_members.find({"grove_id": grove_id}).to_list(200)
    member_ids = [m['user_id'] for m in members]
    skip = (page - 1) * limit
    posts = await db.posts.find(
        {"user_id": {"$in": member_ids}}, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    enriched = []
    for post in posts:
        user = await db.users.find_one({"id": post['user_id']})
        post_data = serialize_doc(post)
        post_data['username'] = user.get('username', '') if user else ''
        post_data['display_name'] = user.get('display_name', '') if user else ''
        # Pre-testing diagnostic: surface verified flags for Grove feed.
        post_data['verified_user'] = bool(user.get('verified_user')) if user else False
        post_data['verified_by_admin'] = bool(user.get('verified_by_admin')) if user else False
        kudos = await db.kudos.find_one({"post_id": post['id'], "user_id": current_user['user_id']})
        post_data['user_gave_kudos'] = kudos is not None
        if post.get('plant_id'):
            plant = await db.plants.find_one({"id": post['plant_id']})
            if plant:
                post_data['plant_name'] = plant.get('nickname') or plant.get('common_name', '')
                post_data['plant_latin_name'] = plant.get('latin_name', '')
        enriched.append(post_data)
    return {"posts": enriched, "page": page, "limit": limit}


# ============ PHASE 14C.3.c — GROVE CHAT (5s polling, no WebSockets) ============
#
# Per-Grove chat. Messages are visible only to current members of the grove.
# Polling via `since` cursor (ISO timestamp). No WebSockets.
#
# Schema (db.grove_messages):
#   id              str (uuid4)
#   grove_id        str
#   user_id         str (author)
#   body            str  (trimmed; <= 4000 chars; may be empty if photo present)
#   photo_path      str | None  (storage path returned by /api/upload)
#   created_at      str (ISO)
#   updated_at      str (ISO)
#   edited          bool
#   is_deleted      bool      (soft delete; row stays for badge counts + audit)
#   deleted_at      str | None
#   deleted_by      str | None  (user_id; sender or grove owner/admin)

MAX_CHAT_BODY_LEN = 4000
CHAT_POLL_LIMIT_DEFAULT = 50
CHAT_POLL_LIMIT_MAX = 200


async def _require_grove_membership(grove_id: str, user_id: str) -> dict:
    grove = await db.groves.find_one({"id": grove_id})
    if not grove:
        raise HTTPException(status_code=404, detail="Grove not found")
    membership = await db.grove_members.find_one({"grove_id": grove_id, "user_id": user_id})
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member of this Grove to access chat.")
    return {"grove": grove, "membership": membership}


async def _hydrate_message(msg: dict) -> dict:
    """Attach author display fields. Soft-deleted messages still hydrate so
    UIs can show a tombstone, but we strip body/photo to avoid leaking content."""
    user = await db.users.find_one({"id": msg.get("user_id")}) if msg.get("user_id") else None
    out = serialize_doc(msg)
    out["author_username"] = (user or {}).get("username", "")
    out["author_display_name"] = (user or {}).get("display_name", "")
    out["author_avatar_url"] = (user or {}).get("avatar_url", "")
    if out.get("is_deleted"):
        out["body"] = ""
        out["photo_path"] = None
    return out


class GroveMessageCreate(BaseModel):
    body: Optional[str] = ""
    photo_path: Optional[str] = None


class GroveMessageEdit(BaseModel):
    body: str


@api_router.get("/groves/{grove_id}/messages")
async def list_grove_messages(
    grove_id: str,
    since: Optional[str] = None,  # ISO timestamp; returns messages created strictly after
    limit: int = CHAT_POLL_LIMIT_DEFAULT,
    current_user: dict = Depends(get_current_user),
):
    await _require_grove_membership(grove_id, current_user["user_id"])
    limit = max(1, min(limit, CHAT_POLL_LIMIT_MAX))
    query: dict = {"grove_id": grove_id}
    if since:
        # Strictly-after semantics so the polling client doesn't replay the
        # last cursor message on every tick.
        query["created_at"] = {"$gt": since}
        # When polling, return oldest-first up to `limit` so newer messages
        # appended below the cursor in time order.
        cursor = db.grove_messages.find(query).sort("created_at", 1).limit(limit)
        rows = await cursor.to_list(limit)
    else:
        # Initial load: return the most-recent `limit` messages, but in
        # chronological order so the UI can append at the bottom.
        cursor = db.grove_messages.find(query).sort("created_at", -1).limit(limit)
        rows = await cursor.to_list(limit)
        rows.reverse()
    items = [await _hydrate_message(r) for r in rows]
    # Server-side hint for the next poll cursor — clients should use the last
    # `created_at` in the returned list, but we return it explicitly so empty
    # poll responses can still echo back the same cursor without bookkeeping.
    next_cursor = items[-1]["created_at"] if items else since
    return {
        "grove_id": grove_id,
        "items": items,
        "next_cursor": next_cursor,
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@api_router.post("/groves/{grove_id}/messages")
async def create_grove_message(
    grove_id: str,
    body: GroveMessageCreate,
    current_user: dict = Depends(get_current_user),
):
    await _require_grove_membership(grove_id, current_user["user_id"])
    text = (body.body or "").strip()
    photo_path = (body.photo_path or "").strip() or None
    if not text and not photo_path:
        raise HTTPException(status_code=400, detail="Message must include text or a photo.")
    if len(text) > MAX_CHAT_BODY_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"Message too long ({len(text)} chars; max {MAX_CHAT_BODY_LEN}).",
        )
    if photo_path:
        # Soft validation: ensure the path was uploaded by this user (prevents
        # cross-user path borrowing). The /upload endpoint stores user_id on
        # files. If the file row is missing we still allow but log.
        f = await db.files.find_one({"storage_path": photo_path})
        if f and f.get("user_id") and f["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="That photo isn't yours to attach.")

    now_iso = datetime.now(timezone.utc).isoformat()
    msg = {
        "id": str(uuid.uuid4()),
        "grove_id": grove_id,
        "user_id": current_user["user_id"],
        "body": text,
        "photo_path": photo_path,
        "created_at": now_iso,
        "updated_at": now_iso,
        "edited": False,
        "is_deleted": False,
        "deleted_at": None,
        "deleted_by": None,
    }
    await db.grove_messages.insert_one(msg)
    # Phase 14C.3.c — grove_chat_first / grove_chat_50
    try:
        await check_and_award_badges(current_user["user_id"])
    except Exception:
        pass
    return await _hydrate_message(msg)


@api_router.patch("/groves/{grove_id}/messages/{message_id}")
async def edit_grove_message(
    grove_id: str,
    message_id: str,
    body: GroveMessageEdit,
    current_user: dict = Depends(get_current_user),
):
    await _require_grove_membership(grove_id, current_user["user_id"])
    msg = await db.grove_messages.find_one({"id": message_id, "grove_id": grove_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.get("is_deleted"):
        raise HTTPException(status_code=410, detail="Message has been deleted")
    if msg.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")
    new_body = (body.body or "").strip()
    if not new_body and not msg.get("photo_path"):
        raise HTTPException(status_code=400, detail="Message must include text or a photo.")
    if len(new_body) > MAX_CHAT_BODY_LEN:
        raise HTTPException(
            status_code=400,
            detail=f"Message too long ({len(new_body)} chars; max {MAX_CHAT_BODY_LEN}).",
        )
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.grove_messages.update_one(
        {"id": message_id},
        {"$set": {"body": new_body, "edited": True, "updated_at": now_iso}},
    )
    msg = await db.grove_messages.find_one({"id": message_id})
    return await _hydrate_message(msg)


@api_router.delete("/groves/{grove_id}/messages/{message_id}")
async def delete_grove_message(
    grove_id: str,
    message_id: str,
    current_user: dict = Depends(get_current_user),
):
    membership_ctx = await _require_grove_membership(grove_id, current_user["user_id"])
    msg = await db.grove_messages.find_one({"id": message_id, "grove_id": grove_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.get("is_deleted"):
        return {"deleted": True, "already": True}
    is_sender = msg.get("user_id") == current_user["user_id"]
    is_grove_admin = membership_ctx["membership"].get("role") in ("owner", "admin")
    user_doc = await db.users.find_one({"id": current_user["user_id"]}) or {}
    is_site_admin = bool(user_doc.get("is_admin"))
    if not (is_sender or is_grove_admin or is_site_admin):
        raise HTTPException(status_code=403, detail="You can only delete your own messages.")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.grove_messages.update_one(
        {"id": message_id},
        {"$set": {
            "is_deleted": True,
            "deleted_at": now_iso,
            "deleted_by": current_user["user_id"],
            "updated_at": now_iso,
        }},
    )
    return {"deleted": True, "by": "sender" if is_sender else ("grove_admin" if is_grove_admin else "site_admin")}



# ============ STARTUP ============

@app.on_event("startup")
async def startup():
    logger.info("Starting Grove API...")
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed (non-fatal): {e}")
    await seed_database(db)
    await seed_trivia(db)
    logger.info("Grove API ready")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# Include router and middleware
# ============ GOALS ROUTES ============

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    goal_type: str  # 'streak_days', 'care_logs_count', 'plant_count', 'bouquet_vase_life', 'custom'
    target_value: int
    end_date: Optional[str] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    current_value: Optional[int] = None
    status: Optional[str] = None

@api_router.get("/goals")
async def get_goals(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user['user_id']}
    if status:
        query['status'] = status
    goals = await db.goals.find(query).sort("created_at", -1).to_list(100)
    return [serialize_doc(g) for g in goals]

@api_router.post("/goals")
async def create_goal(input: GoalCreate, current_user: dict = Depends(get_current_user)):
    goal_id = str(uuid.uuid4())
    goal = {
        "id": goal_id,
        "user_id": current_user['user_id'],
        "title": input.title,
        "description": input.description or "",
        "goal_type": input.goal_type,
        "target_value": input.target_value,
        "current_value": 0,
        "status": "active",
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": input.end_date,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.goals.insert_one(goal)
    return serialize_doc(goal)

@api_router.patch("/goals/{goal_id}")
async def update_goal(goal_id: str, input: GoalUpdate, current_user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": current_user['user_id']})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    updates = {k: v for k, v in input.model_dump().items() if v is not None}
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.goals.update_one({"id": goal_id}, {"$set": updates})
    updated = await db.goals.find_one({"id": goal_id})
    return serialize_doc(updated)

@api_router.post("/goals/{goal_id}/complete")
async def complete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": current_user['user_id']})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.goals.update_one(
        {"id": goal_id},
        {"$set": {"status": "completed", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    # Create notification
    await create_notification(
        user_id=current_user['user_id'],
        ntype="goal_completed",
        title="Goal completed!",
        body=f"Congrats! You completed: {goal['title']}",
        entity_type="goal",
        entity_id=goal_id,
    )
    updated = await db.goals.find_one({"id": goal_id})
    return serialize_doc(updated)

# ============ CHALLENGES ROUTES ============

@api_router.get("/challenges")
async def get_challenge_templates(current_user: dict = Depends(get_current_user)):
    templates = await db.challenge_templates.find({}, {"_id": 0}).to_list(100)
    return [serialize_doc(t) for t in templates]

@api_router.post("/challenges/{slug}/start")
async def start_challenge(slug: str, current_user: dict = Depends(get_current_user)):
    template = await db.challenge_templates.find_one({"slug": slug})
    if not template:
        raise HTTPException(status_code=404, detail="Challenge not found")
    # Create a goal from the template
    goal_id = str(uuid.uuid4())
    end_date = None
    if template.get('duration_days'):
        end_date = (datetime.now(timezone.utc) + timedelta(days=template['duration_days'])).isoformat()
    goal = {
        "id": goal_id,
        "user_id": current_user['user_id'],
        "title": template['title'],
        "description": template.get('description', ''),
        "goal_type": template['goal_type'],
        "target_value": template['target_value'],
        "current_value": 0,
        "status": "active",
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": end_date,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.goals.insert_one(goal)
    return serialize_doc(goal)

# ============ NOTIFICATIONS ROUTES ============

# Per-user notification preferences. Defaults are true except kudos_received (false) per spec.
DEFAULT_NOTIFICATION_PREFS = {
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

# Map notification type -> preference key that controls whether it should be created.
# Keep this mapping narrow: most types are always recorded in-app even if push/email is off.
# These are the types that respect an opt-out for IN-APP creation per user's prefs.
NOTIFICATION_OPT_OUT_KEYS = {
    "kudos_received": "push_kudos_received",
}


async def get_user_notification_prefs(user_id: str) -> dict:
    user = await db.users.find_one({"id": user_id})
    prefs = (user or {}).get("notification_preferences") or {}
    merged = {**DEFAULT_NOTIFICATION_PREFS, **prefs}
    return merged


async def create_notification(
    user_id: str,
    ntype: str,
    title: str,
    body: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    data: Optional[dict] = None,
    actor_id: Optional[str] = None,
) -> Optional[dict]:
    """Centralized notification creator. Returns None if user has opted out of this type.
    Also suppresses self-notifications (actor_id == user_id)."""
    if actor_id and actor_id == user_id:
        return None
    # Respect in-app opt-outs
    opt_key = NOTIFICATION_OPT_OUT_KEYS.get(ntype)
    if opt_key:
        prefs = await get_user_notification_prefs(user_id)
        if not prefs.get(opt_key, True):
            return None
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": ntype,
        "title": title,
        "body": body,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "data": data or {},
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notifications.insert_one(doc)
    return doc


@api_router.get("/notifications")
async def get_notifications(limit: int = 50, current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user['user_id']}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    unread_count = await db.notifications.count_documents(
        {"user_id": current_user['user_id'], "is_read": False}
    )
    return {"notifications": [serialize_doc(n) for n in notifications], "unread_count": unread_count}


@api_router.get("/notifications/unread-count")
async def get_notifications_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents(
        {"user_id": current_user['user_id'], "is_read": False}
    )
    return {"unread_count": count}


@api_router.post("/notifications/mark-read")
async def mark_notification_read(notification_ids: List[str], current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"id": {"$in": notification_ids}, "user_id": current_user['user_id']},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}


@api_router.patch("/notifications/{notification_id}/read")
async def mark_single_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user['user_id']},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


@api_router.post("/notifications/mark-all-read")
@api_router.patch("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_many(
        {"user_id": current_user['user_id'], "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "modified_count": result.modified_count}


@api_router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.delete_one(
        {"id": notification_id, "user_id": current_user['user_id']}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}


# ---- Notification preferences ----

class NotificationPreferencesInput(BaseModel):
    push_care_due: Optional[bool] = None
    push_care_overdue: Optional[bool] = None
    push_streak_at_risk: Optional[bool] = None
    push_streak_milestone: Optional[bool] = None
    push_swap_match: Optional[bool] = None
    push_swap_message: Optional[bool] = None
    push_kudos_received: Optional[bool] = None
    push_sitter_logged: Optional[bool] = None
    push_bloom_hour: Optional[bool] = None
    push_bouquet_reminder: Optional[bool] = None
    push_grove_challenge: Optional[bool] = None
    email_digest: Optional[bool] = None
    email_swap_match: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


@api_router.get("/users/me/notification-preferences")
async def get_notification_preferences(current_user: dict = Depends(get_current_user)):
    prefs = await get_user_notification_prefs(current_user['user_id'])
    return prefs


@api_router.patch("/users/me/notification-preferences")
async def update_notification_preferences(
    input: NotificationPreferencesInput,
    current_user: dict = Depends(get_current_user)
):
    existing = await get_user_notification_prefs(current_user['user_id'])
    updates = {k: v for k, v in input.dict().items() if v is not None}
    new_prefs = {**existing, **updates}
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$set": {"notification_preferences": new_prefs}}
    )
    return new_prefs

# ============ DAILY MISSIONS + FIRST 90 SECONDS (Phase 11C) ============

@api_router.get("/missions/daily")
async def get_daily_mission(current_user: dict = Depends(get_current_user)):
    return await missions_mod.get_or_assign_daily_mission(db, current_user['user_id'])


@api_router.post("/missions/daily/complete")
async def complete_daily_mission(current_user: dict = Depends(get_current_user)):
    result = await missions_mod.manual_complete(db, current_user['user_id'])
    if not result:
        raise HTTPException(status_code=400, detail="No mission to complete")
    return result


@api_router.post("/missions/health-check")
async def mission_health_check(current_user: dict = Depends(get_current_user)):
    """Frontend pings this when the user opens a plant's health panel."""
    result = await missions_mod.on_health_check(db, current_user['user_id'])
    return {"completed": bool(result), "mission": result}


@api_router.post("/users/me/celebrate-first-care")
async def celebrate_first_care(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get('first_care_celebrated'):
        return {"already": True}
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$set": {
            "first_care_celebrated": True,
            "first_care_celebrated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"already": False}


@api_router.post("/users/me/dismiss-first-session-banner")
async def dismiss_first_session_banner(current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$set": {
            "first_session_banner_dismissed": True,
            "first_session_banner_dismissed_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"dismissed": True}

# ============ FLORIST PRO ROUTES ============

class PortfolioItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    photo_url: Optional[str] = None
    tags: Optional[List[str]] = []

@api_router.get("/florist/portfolio")
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    if user.get('tier') not in ['pro', 'florist_pro']:
        raise HTTPException(status_code=403, detail="Florist Pro tier required")
    items = await db.portfolio_items.find({"user_id": current_user['user_id']}).sort("created_at", -1).to_list(100)
    return [serialize_doc(i) for i in items]

@api_router.post("/florist/portfolio")
async def create_portfolio_item(input: PortfolioItemCreate, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    if user.get('tier') not in ['pro', 'florist_pro']:
        raise HTTPException(status_code=403, detail="Florist Pro tier required")
    item_id = str(uuid.uuid4())
    item = {
        "id": item_id,
        "user_id": current_user['user_id'],
        "title": input.title,
        "description": input.description or "",
        "photo_url": input.photo_url or "",
        "tags": input.tags or [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.portfolio_items.insert_one(item)
    return serialize_doc(item)

@api_router.delete("/florist/portfolio/{item_id}")
async def delete_portfolio_item(item_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.portfolio_items.delete_one({"id": item_id, "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}

# ============ ENCYCLOPEDIA ROUTES ============

@api_router.get("/encyclopedia/species")
async def get_species_list(
    q: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_optional_user)
):
    skip = (page - 1) * limit
    query = {}
    if q and len(q) >= 2:
        regex = {"$regex": q, "$options": "i"}
        query = {"$or": [{"common_name": regex}, {"latin_name": regex}]}
    species = await db.species.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.species.count_documents(query)
    return {
        "species": [serialize_doc(s) for s in species],
        "total": total,
        "page": page,
        "limit": limit
    }

@api_router.get("/encyclopedia/species/{species_id}")
async def get_species_detail(species_id: str, current_user: dict = Depends(get_optional_user)):
    species = await db.species.find_one({"id": species_id}, {"_id": 0})
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    # Get count of plants in collections
    plant_count = await db.plants.count_documents({"species_id": species_id, "is_archived": {"$ne": True}})
    species_data = serialize_doc(species)
    species_data['in_collections_count'] = plant_count
    # Phase 14B.2 — hydrate companion entries with the linked species' ids and
    # display names so the frontend can render and link them in one fetch.
    raw_companions = species_data.get('companions') or []
    if raw_companions:
        slugs = [c.get('slug') for c in raw_companions if c.get('slug')]
        linked = await db.species.find(
            {"slug": {"$in": slugs}},
            {"_id": 0, "id": 1, "slug": 1, "common_name": 1, "latin_name": 1, "default_light_level": 1, "default_watering_days": 1},
        ).to_list(50)
        by_slug = {l['slug']: l for l in linked}
        hydrated = []
        for c in raw_companions:
            link = by_slug.get(c.get('slug'))
            if not link:
                continue
            hydrated.append({
                "id": link['id'],
                "slug": link['slug'],
                "common_name": link['common_name'],
                "latin_name": link['latin_name'],
                "light": link.get('default_light_level'),
                "watering_days": link.get('default_watering_days'),
                "reasoning": c.get('reasoning', ''),
            })
        species_data['companions'] = hydrated
    return species_data

# ============ Phase 14B.2 — THEMED GUILDS + SPECIES PERFORMANCE ============

@api_router.get("/guilds")
async def list_guilds(current_user: dict = Depends(get_optional_user)):
    """List all curated themed guilds with a lightweight species preview."""
    guilds = await db.guilds.find({}, {"_id": 0}).to_list(100)
    if not guilds:
        return {"guilds": []}
    # Hydrate species previews (id + name + first photo) for each guild
    all_species_ids = list({sid for g in guilds for sid in g.get('species_ids', [])})
    species_lookup = {}
    if all_species_ids:
        rows = await db.species.find(
            {"id": {"$in": all_species_ids}},
            {"_id": 0, "id": 1, "common_name": 1, "latin_name": 1, "slug": 1, "default_light_level": 1},
        ).to_list(200)
        species_lookup = {r['id']: r for r in rows}
    out = []
    for g in guilds:
        species_preview = []
        for sid in g.get('species_ids', []):
            s = species_lookup.get(sid)
            if s:
                species_preview.append({
                    "id": s['id'],
                    "slug": s.get('slug'),
                    "common_name": s['common_name'],
                    "latin_name": s['latin_name'],
                    "light": s.get('default_light_level'),
                })
        out.append({
            "id": g['id'],
            "slug": g['slug'],
            "name": g['name'],
            "subtitle": g.get('subtitle', ''),
            "accent_color": g.get('accent_color', '#3B6D11'),
            "tags": g.get('tags', []),
            "species_count": len(species_preview),
            "species": species_preview,
        })
    return {"guilds": out}

@api_router.get("/guilds/{slug}")
async def get_guild_detail(slug: str, current_user: dict = Depends(get_optional_user)):
    guild = await db.guilds.find_one({"slug": slug}, {"_id": 0})
    if not guild:
        raise HTTPException(status_code=404, detail="Guild not found")
    rows = await db.species.find(
        {"id": {"$in": guild.get('species_ids', [])}},
        {"_id": 0},
    ).to_list(50)
    by_id = {r['id']: serialize_doc(r) for r in rows}
    species_full = [by_id[sid] for sid in guild.get('species_ids', []) if sid in by_id]
    return {
        "id": guild['id'],
        "slug": guild['slug'],
        "name": guild['name'],
        "subtitle": guild.get('subtitle', ''),
        "description": guild.get('description', ''),
        "design_notes": guild.get('design_notes', ''),
        "accent_color": guild.get('accent_color', '#3B6D11'),
        "tags": guild.get('tags', []),
        "species": species_full,
    }

# Phase 14B.2 — Species-level community performance reports.
#
# Aggregates anonymized data across the entire user base for a given species:
#   1. Success rate at 1 year (alive_at_1yr / total_with_>=1yr_history)
#   2. Avg days from acquisition to first bloom (when bloom care logs exist)
#   3. Most-common reported problems (from care logs and plant statuses)
#   4. Watering cadence among healthy plants (median of watering_frequency_days)
#
# Hardiness-zone breakdowns come in 14C; for now we only aggregate overall.

PROBLEM_KEYWORDS = {
    "yellow leaves": ["yellow"],
    "leaf drop": ["drop", "dropping", "shed"],
    "wilting": ["wilt", "wilting", "limp"],
    "root rot": ["rot", "mushy", "soft"],
    "pests": ["pest", "spider mite", "mealy", "scale", "thrip", "fungus gnat", "aphid"],
    "brown tips": ["brown tip", "crispy", "crispy edges", "brown edges"],
    "stretched / leggy": ["leggy", "stretched", "etiolated"],
}

def _extract_problems(text: str) -> list:
    if not text:
        return []
    t = text.lower()
    found = []
    for label, keys in PROBLEM_KEYWORDS.items():
        if any(k in t for k in keys):
            found.append(label)
    return found

@api_router.get("/encyclopedia/species/{species_id}/performance")
async def get_species_performance(species_id: str, current_user: dict = Depends(get_optional_user)):
    species = await db.species.find_one({"id": species_id}, {"_id": 0})
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    # Pull all plants (including archived) so survival is computable
    plants = await db.plants.find(
        {"species_id": species_id},
        {"_id": 0, "id": 1, "user_id": 1, "status": 1, "is_archived": 1,
         "watering_frequency_days": 1, "created_at": 1, "deceased_at": 1},
    ).to_list(2000)
    total_plants = len(plants)
    unique_users = len({p.get('user_id') for p in plants if p.get('user_id')})
    # Phase 14C — fetch hardiness zones for the relevant users so we can
    # break stats down by zone.
    user_zones = {}
    if plants:
        user_ids = list({p.get('user_id') for p in plants if p.get('user_id')})
        user_rows = await db.users.find(
            {"id": {"$in": user_ids}},
            {"_id": 0, "id": 1, "hardiness_zone": 1, "hardiness_zone_system": 1},
        ).to_list(2000)
        user_zones = {u['id']: u for u in user_rows}
    now = datetime.now(timezone.utc)
    # 1) Success rate at 1y — limited to plants with ≥1y of recorded history
    cohort_one_year = []
    survivors_one_year = 0
    for p in plants:
        try:
            created = datetime.fromisoformat((p.get('created_at') or '').replace('Z', '+00:00'))
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
        except Exception:
            continue
        age_days = (now - created).total_seconds() / 86400
        if age_days < 365:
            continue
        cohort_one_year.append(p)
        if not p.get('is_archived') and p.get('status') not in ('deceased', 'critical'):
            survivors_one_year += 1
    success_rate_1y = (
        round(survivors_one_year / len(cohort_one_year) * 100)
        if cohort_one_year else None
    )
    # 2) Avg days to first bloom — uses care logs with action='bloom' or note keyword
    bloom_logs = await db.care_logs.find(
        {"plant_id": {"$in": [p['id'] for p in plants]}, "action": "bloom"},
        {"_id": 0, "plant_id": 1, "logged_at": 1},
    ).to_list(2000)
    days_to_bloom = []
    plants_by_id = {p['id']: p for p in plants}
    seen_first = set()
    for bl in sorted(bloom_logs, key=lambda x: x.get('logged_at') or ''):
        pid = bl.get('plant_id')
        if pid in seen_first:
            continue
        seen_first.add(pid)
        plant = plants_by_id.get(pid)
        if not plant:
            continue
        try:
            created = datetime.fromisoformat((plant.get('created_at') or '').replace('Z', '+00:00'))
            bloom_at = datetime.fromisoformat(bl['logged_at'].replace('Z', '+00:00'))
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            if bloom_at.tzinfo is None:
                bloom_at = bloom_at.replace(tzinfo=timezone.utc)
            days_to_bloom.append((bloom_at - created).total_seconds() / 86400)
        except Exception:
            continue
    avg_days_to_bloom = (
        round(sum(days_to_bloom) / len(days_to_bloom)) if days_to_bloom else None
    )
    # 3) Common problems — scan care log notes for keyword hits
    note_logs = await db.care_logs.find(
        {"plant_id": {"$in": [p['id'] for p in plants]}, "notes": {"$ne": ""}},
        {"_id": 0, "notes": 1},
    ).to_list(5000)
    problem_counts = {}
    for log in note_logs:
        for prob in _extract_problems(log.get('notes', '')):
            problem_counts[prob] = problem_counts.get(prob, 0) + 1
    common_problems = sorted(
        [{"label": k, "count": v} for k, v in problem_counts.items()],
        key=lambda x: x['count'], reverse=True,
    )[:5]
    # 4) Successful watering cadence — median freq among healthy plants
    healthy_freqs = sorted(
        p.get('watering_frequency_days') for p in plants
        if p.get('status') == 'healthy' and p.get('watering_frequency_days')
    )
    median_water_days = None
    if healthy_freqs:
        mid = len(healthy_freqs) // 2
        median_water_days = (
            healthy_freqs[mid] if len(healthy_freqs) % 2
            else round((healthy_freqs[mid - 1] + healthy_freqs[mid]) / 2)
        )
    # Confidence label drives the disclosure wording on the frontend
    confidence = (
        "low" if total_plants < 5
        else ("emerging" if total_plants < 25 else "established")
    )
    # Phase 14C — by-hardiness-zone breakdown. Each zone shows survival % when
    # the cohort is large enough (≥3 plants ≥1y old per zone).
    by_zone = {}
    for p in plants:
        u = user_zones.get(p.get('user_id'))
        if not u or not u.get('hardiness_zone'):
            continue
        zone = u['hardiness_zone']
        bucket = by_zone.setdefault(zone, {
            'zone': zone,
            'system': u.get('hardiness_zone_system', 'USDA'),
            'total': 0,
            'cohort_one_year': 0,
            'survivors_one_year': 0,
        })
        bucket['total'] += 1
        try:
            created = datetime.fromisoformat((p.get('created_at') or '').replace('Z', '+00:00'))
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            age_days = (datetime.now(timezone.utc) - created).total_seconds() / 86400
            if age_days >= 365:
                bucket['cohort_one_year'] += 1
                if not p.get('is_archived') and p.get('status') not in ('deceased', 'critical'):
                    bucket['survivors_one_year'] += 1
        except Exception:
            pass
    by_hardiness_zone = []
    for z in sorted(by_zone.keys()):
        b = by_zone[z]
        rate = (
            round(b['survivors_one_year'] / b['cohort_one_year'] * 100)
            if b['cohort_one_year'] >= 3 else None
        )
        by_hardiness_zone.append({
            'zone': b['zone'],
            'system': b['system'],
            'total_plants': b['total'],
            'cohort_one_year': b['cohort_one_year'],
            'success_rate_1y_pct': rate,
        })
    return {
        "species_id": species_id,
        "species_common_name": species.get('common_name'),
        "sample": {
            "total_plants": total_plants,
            "unique_growers": unique_users,
            "cohort_one_year": len(cohort_one_year),
            "confidence": confidence,
        },
        "success_rate_1y_pct": success_rate_1y,
        "avg_days_to_first_bloom": avg_days_to_bloom,
        "common_problems": common_problems,
        "median_watering_days_healthy": median_water_days,
        "by_hardiness_zone": by_hardiness_zone,
    }

# Cached AI narrative summary of the performance report. Cache TTL 7 days.
@api_router.get("/encyclopedia/species/{species_id}/narrative")
async def get_species_narrative(species_id: str, current_user: dict = Depends(get_optional_user)):
    cached = await db.species_narratives.find_one({"species_id": species_id})
    now = datetime.now(timezone.utc)
    if cached:
        try:
            generated_at = datetime.fromisoformat(cached['generated_at'].replace('Z', '+00:00'))
            if generated_at.tzinfo is None:
                generated_at = generated_at.replace(tzinfo=timezone.utc)
            if (now - generated_at).total_seconds() < 7 * 86400:
                return {
                    "narrative": cached['narrative'],
                    "generated_at": cached['generated_at'],
                    "from_cache": True,
                }
        except Exception:
            pass
    # Build the performance payload first so we can prompt with structured stats
    species = await db.species.find_one({"id": species_id}, {"_id": 0})
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    perf = await get_species_performance(species_id, current_user)
    # Skip narrative when sample size is too small to be meaningful
    if perf['sample']['total_plants'] == 0:
        return {
            "narrative": "Not enough growers in Grove yet to summarize how this species fares in the community. As more people add it to their collections, this section will update.",
            "generated_at": now.isoformat(),
            "from_cache": False,
            "skipped_reason": "no_data",
        }
    # Generate via Claude; fall back to a deterministic template on failure
    narrative = None
    try:
        narrative = await ai_service.summarize_species_performance(species, perf)
    except Exception as e:
        logger.warning(f"Species narrative generation failed: {e}")
    if not narrative:
        # Deterministic fallback so the surface is never empty
        bits = []
        if perf['success_rate_1y_pct'] is not None:
            bits.append(
                f"{perf['success_rate_1y_pct']}% of growers in Grove keep this plant alive past one year"
                f" (across {perf['sample']['cohort_one_year']} plants with at least a year of history)."
            )
        if perf['median_watering_days_healthy'] is not None:
            bits.append(
                f"Healthy specimens are watered roughly every {perf['median_watering_days_healthy']} days."
            )
        if perf['common_problems']:
            top = perf['common_problems'][0]['label']
            bits.append(f"The most commonly reported issue is {top}.")
        if perf['avg_days_to_first_bloom']:
            bits.append(
                f"From acquisition to first bloom takes about {perf['avg_days_to_first_bloom']} days on average."
            )
        narrative = " ".join(bits) if bits else (
            "Early data — not enough patterns yet to summarize. Check back as more growers add this species."
        )
    await db.species_narratives.update_one(
        {"species_id": species_id},
        {"$set": {
            "species_id": species_id,
            "narrative": narrative,
            "generated_at": now.isoformat(),
        }},
        upsert=True,
    )
    return {
        "narrative": narrative,
        "generated_at": now.isoformat(),
        "from_cache": False,
    }

# Phase 14C — WANT LIST + SWAP GATING

class WantListAddBody(BaseModel):
    species_id: str
    note: Optional[str] = None
    priority: Optional[str] = "medium"  # "low" | "medium" | "high"

@api_router.get("/users/me/wants")
async def list_my_wants(current_user: dict = Depends(get_current_user)):
    """Return the user's want list, hydrated with species metadata."""
    wants = await db.want_list.find(
        {"user_id": current_user['user_id']},
        {"_id": 0},
    ).sort("created_at", -1).to_list(200)
    if not wants:
        return {"wants": []}
    species_ids = [w['species_id'] for w in wants]
    species = await db.species.find(
        {"id": {"$in": species_ids}},
        {"_id": 0, "id": 1, "common_name": 1, "latin_name": 1, "slug": 1,
         "default_light_level": 1, "default_watering_days": 1, "flags": 1},
    ).to_list(200)
    by_id = {s['id']: s for s in species}
    out = []
    for w in wants:
        s = by_id.get(w['species_id'])
        if not s:
            continue
        out.append({
            "id": w['id'],
            "species_id": w['species_id'],
            "species": s,
            "note": w.get('note', ''),
            "priority": w.get('priority', 'medium'),
            "created_at": w.get('created_at'),
        })
    return {"wants": out}

@api_router.post("/users/me/wants")
async def add_to_want_list(body: WantListAddBody, current_user: dict = Depends(get_current_user)):
    species = await db.species.find_one({"id": body.species_id})
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    existing = await db.want_list.find_one({
        "user_id": current_user['user_id'],
        "species_id": body.species_id,
    })
    if existing:
        return {"already": True, "id": existing.get('id')}
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": current_user['user_id'],
        "species_id": body.species_id,
        "note": (body.note or '').strip(),
        "priority": body.priority or 'medium',
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.want_list.insert_one(entry)
    return {"added": True, "id": entry['id']}

@api_router.delete("/users/me/wants/{species_id}")
async def remove_from_want_list(species_id: str, current_user: dict = Depends(get_current_user)):
    res = await db.want_list.delete_one({
        "user_id": current_user['user_id'],
        "species_id": species_id,
    })
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not on your want list")
    return {"removed": True}

# Phase 14C — 1-month "adjust your AI schedule?" nudges. When a plant's
# watering schedule was AI-suggested and ≥30 days have passed without the user
# touching the cadence, surface a single nudge so they can confirm/adjust.
# This closes the loop on the "AI-suggested" label.
AI_SCHEDULE_REVIEW_DAYS = 30

def _is_schedule_review_due(plant: dict) -> bool:
    if plant.get('watering_frequency_source') != 'ai':
        return False
    set_at = (
        plant.get('watering_frequency_set_at')
        or plant.get('updated_at')
        or plant.get('created_at')
    )
    if not set_at:
        return False
    try:
        ts = datetime.fromisoformat(set_at.replace('Z', '+00:00'))
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        days = (datetime.now(timezone.utc) - ts).total_seconds() / 86400
        return days >= AI_SCHEDULE_REVIEW_DAYS
    except Exception:
        return False

@api_router.get("/notifications/schedule-reviews")
async def list_schedule_review_nudges(current_user: dict = Depends(get_current_user)):
    """Plants whose AI-suggested watering schedule is due for review.
    Suppress plants the user already dismissed (review_acknowledged_at within
    the same window) so the nudge isn't spammy."""
    plants = await db.plants.find(
        {"user_id": current_user['user_id'], "is_archived": {"$ne": True}},
        {"_id": 0},
    ).to_list(500)
    due = []
    for p in plants:
        if not _is_schedule_review_due(p):
            continue
        ack = p.get('schedule_review_acknowledged_at')
        if ack:
            try:
                ack_ts = datetime.fromisoformat(ack.replace('Z', '+00:00'))
                if ack_ts.tzinfo is None:
                    ack_ts = ack_ts.replace(tzinfo=timezone.utc)
                age = (datetime.now(timezone.utc) - ack_ts).total_seconds() / 86400
                if age < AI_SCHEDULE_REVIEW_DAYS:
                    continue
            except Exception:
                pass
        due.append({
            "plant_id": p.get('id'),
            "common_name": p.get('common_name'),
            "nickname": p.get('nickname'),
            "photo_url": p.get('photo_url'),
            "watering_frequency_days": p.get('watering_frequency_days'),
        })
    return {"plants": due, "count": len(due)}

@api_router.post("/plants/{plant_id}/schedule-review/acknowledge")
async def acknowledge_schedule_review(plant_id: str, current_user: dict = Depends(get_current_user)):
    """User saw the nudge and either confirmed or adjusted — either way,
    suppress the nudge for another 30 days."""
    plant = await db.plants.find_one({"id": plant_id, "user_id": current_user['user_id']})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    await db.plants.update_one(
        {"id": plant_id},
        {"$set": {
            "schedule_review_acknowledged_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"acknowledged": True}

# ============ PHASE 14C.3 — 8-SECTION PACT VERIFICATION FLOW ============
#
# Per Supplement v2 Part C: Verification is a deliberate, high-friction flow.
# Each of the 8 community pact sections must be acknowledged with its own
# checkbox. There is no "agree to all" shortcut — the friction is the feature.
#
# Pact version: '1.0'. If the pact text changes in the future, bump
# CURRENT_PACT_VERSION; users with a stale `verification_pact_version` must
# re-verify before their next swap.
#
# Endpoints:
#   POST /api/users/me/verification/start
#   POST /api/users/me/verification/confirm-email
#   POST /api/users/me/verification/phone     (body: {phone?: str, skip?: bool})
#   POST /api/users/me/verification/agree     (body: {acknowledgments: {1..8: bool}, pact_version: '1.0'})
#   GET  /api/users/me/verification           (current state)

CURRENT_PACT_VERSION = "1.0"
PACT_REQUIRED_SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

# Lazy-seed the Verified badge so it's available the moment a user
# completes the pact (Phase 14C.3.b will replace this stub with the full
# 170-badge catalog seed).
async def _ensure_verified_badge() -> dict:
    badge = await db.badges.find_one({"slug": "verified_user"})
    if badge:
        return badge
    doc = {
        "id": str(uuid.uuid4()),
        "slug": "verified_user",
        "name": "Verified",
        "description": "Signed the Grove community pact and joined the verified swappers.",
        "category": "Community",
        "icon": "shield-check",
        "tier": None,
        "earnable": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.badges.insert_one(doc)
    return doc

async def _award_badge_idempotent(user_id: str, slug: str):
    """Generic badge award. Skips if user already has it."""
    badge = await db.badges.find_one({"slug": slug})
    if not badge:
        return None
    existing = await db.user_badges.find_one({"user_id": user_id, "badge_slug": slug})
    if existing:
        return existing
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "badge_id": badge["id"],
        "badge_slug": slug,
        "earned_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.user_badges.insert_one(entry)
    return entry


def _serialize_verification(user: dict) -> dict:
    """Public verification-state snapshot for the UI."""
    return {
        "verification_started_at": user.get("verification_started_at"),
        "verification_email_confirmed": bool(user.get("verification_email_confirmed")),
        "verification_email_confirmed_at": user.get("verification_email_confirmed_at"),
        "verification_phone": user.get("verification_phone"),
        "verification_phone_skipped": bool(user.get("verification_phone_skipped")),
        "is_verified": bool(user.get("is_verified")),
        "verified_user": bool(user.get("verified_user") or user.get("is_verified")),
        "verified_at": user.get("verified_at"),
        "pact_signed_at": user.get("pact_signed_at"),
        "verification_pact_version": user.get("verification_pact_version"),
        "current_pact_version": CURRENT_PACT_VERSION,
        "needs_reverification": bool(
            user.get("is_verified")
            and user.get("verification_pact_version")
            and user.get("verification_pact_version") != CURRENT_PACT_VERSION
        ),
        "verified_by_admin": bool(user.get("verified_by_admin")),
    }


@api_router.get("/users/me/verification")
async def get_verification_status(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    return _serialize_verification(user)


@api_router.post("/users/me/verification/start")
async def start_verification(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if not user.get("verification_started_at"):
        updates["verification_started_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": current_user["user_id"]}, {"$set": updates})
    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    return _serialize_verification(user)


@api_router.post("/users/me/verification/confirm-email")
async def confirm_verification_email(current_user: dict = Depends(get_current_user)):
    """Soft confirmation: the user is asserting the email on file is one they
    check. We do not send a confirmation link in this MVP; that's a future
    plumbing job. We just record the assertion + a timestamp."""
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {
            "verification_email_confirmed": True,
            "verification_email_confirmed_at": now_iso,
            "updated_at": now_iso,
        }},
    )
    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    return _serialize_verification(user)


class VerificationPhoneBody(BaseModel):
    phone: Optional[str] = None
    skip: Optional[bool] = False


@api_router.post("/users/me/verification/phone")
async def set_verification_phone(
    body: VerificationPhoneBody,
    current_user: dict = Depends(get_current_user),
):
    now_iso = datetime.now(timezone.utc).isoformat()
    updates: dict = {"updated_at": now_iso}
    if body.skip:
        updates["verification_phone_skipped"] = True
        # don't blank an existing phone if user changes their mind to skip;
        # they can clear it explicitly via PATCH /users/me if they want.
    elif body.phone:
        cleaned = body.phone.strip()
        if len(cleaned) < 4:
            raise HTTPException(status_code=400, detail="Phone number is too short")
        if len(cleaned) > 32:
            raise HTTPException(status_code=400, detail="Phone number is too long")
        updates["verification_phone"] = cleaned
        updates["verification_phone_skipped"] = False
    else:
        raise HTTPException(status_code=400, detail="Provide a phone number or set skip=true")
    await db.users.update_one({"id": current_user["user_id"]}, {"$set": updates})
    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    return _serialize_verification(user)


class VerificationAgreeBody(BaseModel):
    # The 8 numbered acknowledgements from Supplement v2 Part C. Keys are
    # accepted as ints OR string-ints to be lenient with JSON conventions.
    acknowledgments: Dict[str, bool]
    pact_version: Optional[str] = None


@api_router.post("/users/me/verification/agree")
async def agree_to_pact(
    body: VerificationAgreeBody,
    current_user: dict = Depends(get_current_user),
):
    # Normalise keys to ints
    acks: dict = {}
    for k, v in (body.acknowledgments or {}).items():
        try:
            acks[int(k)] = bool(v)
        except (ValueError, TypeError):
            continue
    missing = [n for n in PACT_REQUIRED_SECTIONS if not acks.get(n)]
    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "pact_incomplete",
                "message": "All 8 sections must be acknowledged before verification can complete.",
                "missing_sections": missing,
            },
        )
    pact_version = (body.pact_version or CURRENT_PACT_VERSION).strip()
    if pact_version != CURRENT_PACT_VERSION:
        raise HTTPException(
            status_code=400,
            detail=f"Pact version mismatch. Expected '{CURRENT_PACT_VERSION}', got '{pact_version}'.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    updates = {
        "is_verified": True,
        "verified_user": True,
        "verified_at": now_iso,
        "pact_signed_at": now_iso,
        "verification_pact_version": pact_version,
        "verification_completed_at": now_iso,
        "verification_acknowledgments": {str(n): True for n in PACT_REQUIRED_SECTIONS},
        "updated_at": now_iso,
    }
    # If admin had previously fast-tracked them, clear that flag — this is
    # now a self-completed verification.
    if not (await db.users.find_one({"id": current_user["user_id"]}) or {}).get("verified_by_admin"):
        updates["verified_by_admin"] = False
    await db.users.update_one({"id": current_user["user_id"]}, {"$set": updates})

    # Lazy-seed and award the Verified badge.
    await _ensure_verified_badge()
    await _award_badge_idempotent(current_user["user_id"], "verified_user")

    user = await db.users.find_one({"id": current_user["user_id"]}) or {}
    return {
        **_serialize_verification(user),
        "badge_awarded": "verified_user",
    }



# ============ ADMIN/DEMO ROUTES ============

# Phase 14C — Manual subscription + verification grants. Per the scoping
# round, verified-Pro is admin-only (no automated payment yet). This is also
# the path the demo seed uses to mark Clare as verified for testing.

class AdminVerifyBody(BaseModel):
    is_verified: Optional[bool] = None
    subscription_tier: Optional[str] = None  # "free" | "pro"
    pro_active: Optional[bool] = None
    pro_started_at: Optional[str] = None
    pact_signed_at: Optional[str] = None

@api_router.post("/admin/users/{user_id}/verify")
async def admin_verify_user(
    user_id: str, body: AdminVerifyBody,
    current_user: dict = Depends(get_current_user),
):
    admin = await db.users.find_one({"id": current_user['user_id']})
    if not admin or not admin.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="At least one field required")
    if 'is_verified' in updates and updates['is_verified'] and 'pact_signed_at' not in updates:
        # Mark a server-recorded pact_signed_at when the admin is fast-tracking
        # verification without the user manually completing the pact UI (Clare
        # in the demo seed). Audit by updated_at + is_verified_by_admin.
        updates['pact_signed_at'] = datetime.now(timezone.utc).isoformat()
        updates['verified_by_admin'] = True
    if 'subscription_tier' in updates and updates['subscription_tier'] == 'pro':
        if 'pro_active' not in updates:
            updates['pro_active'] = True
        if 'pro_started_at' not in updates:
            updates['pro_started_at'] = datetime.now(timezone.utc).isoformat()
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user_id}, {"$set": updates})
    user = await db.users.find_one({"id": user_id})
    return serialize_doc({k: v for k, v in user.items() if k != 'password_hash'})

# Phase 14C — Swap-eligibility helper. Three conditions all true:
# (1) account ≥ 90 days old, (2) pro_active, (3) is_verified.
def _swap_eligibility(user: dict) -> dict:
    if not user:
        return {"eligible": False, "missing": ["account"], "reasons": ["No account"]}
    missing = []
    reasons = []
    # 1. Account age
    try:
        created = datetime.fromisoformat((user.get('created_at') or '').replace('Z', '+00:00'))
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age_days = (datetime.now(timezone.utc) - created).total_seconds() / 86400
    except Exception:
        age_days = 0
    if age_days < 90:
        missing.append("account_age")
        reasons.append(f"Account is {int(age_days)} days old. Swaps unlock at 90 days.")
    # 2. Pro
    if not user.get('pro_active'):
        missing.append("pro")
        reasons.append("Active Pro subscription required.")
    # 3. Verified
    if not user.get('is_verified'):
        missing.append("verified")
        reasons.append("One-time verification required.")
    return {
        "eligible": len(missing) == 0,
        "missing": missing,
        "reasons": reasons,
        "account_age_days": int(age_days),
        "pro_active": bool(user.get('pro_active')),
        "is_verified": bool(user.get('is_verified')),
    }

@api_router.get("/swaps/eligibility")
async def get_swap_eligibility(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    return _swap_eligibility(user)

@api_router.get("/admin/demo/status")
async def get_demo_status(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    if not user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get status for all test accounts
    test_users = ["mayagreens", "rootsandstems", "clarenolan_studio", "groveling"]
    status_data = []
    
    for username in test_users:
        user_doc = await db.users.find_one({"username": username})
        if not user_doc:
            continue
        
        streak = await db.streaks.find_one({"user_id": user_doc['id']})
        plants_count = await db.plants.count_documents({"user_id": user_doc['id'], "is_archived": {"$ne": True}})
        bouquets_count = await db.bouquets.count_documents({"user_id": user_doc['id'], "is_active": True})
        
        # Check unlocks
        current_streak = streak.get('current_streak', 0) if streak else 0
        unlocks = {
            "social_feed": current_streak >= 7,
            "swaps": current_streak >= 30,
            "collection_showcase": plants_count >= 10
        }
        
        # Last care log
        last_care = await db.care_logs.find_one(
            {"user_id": user_doc['id']},
            sort=[("logged_at", -1)]
        )
        
        status_data.append({
            "username": username,
            "display_name": user_doc.get('display_name', username),
            "tier": user_doc.get('tier', 'free'),
            "current_streak": current_streak,
            "plants_count": plants_count,
            "active_bouquets": bouquets_count,
            "unlocks": unlocks,
            "last_care_log": last_care['logged_at'] if last_care else None
        })
    
    return {"accounts": status_data}

@api_router.post("/admin/demo/reset/{username}")
async def reset_test_account(username: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']})
    if not user or not user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")

    if username not in ["mayagreens", "rootsandstems", "clarenolan_studio", "groveling"]:
        raise HTTPException(status_code=400, detail="Invalid test account")

    # Dynamically import to avoid loading seed module at startup
    try:
        from seed_testing import (
            clear_test_account,
            seed_maya, seed_james, seed_clare, seed_groveling,
        )
    except Exception as e:
        logger.exception("Failed importing seed_testing")
        raise HTTPException(status_code=500, detail=f"Seeding module unavailable: {e}")

    # Cascading delete across all collections
    await clear_test_account(db, username)

    # Re-seed the specific account
    try:
        if username == "mayagreens":
            await seed_maya(db)
        elif username == "rootsandstems":
            await seed_james(db)
        elif username == "clarenolan_studio":
            await seed_clare(db)
        elif username == "groveling":
            await seed_groveling(db)
    except Exception as e:
        logger.exception(f"Seeding failed for {username}")
        raise HTTPException(status_code=500, detail=f"Reset cleared data but reseed failed: {e}")

    return {"success": True, "message": f"Reset and reseeded @{username}"}

@api_router.post("/admin/demo/quick-state")
async def set_quick_state(
    username: str,
    action: str,
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"id": current_user['user_id']})
    if not user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    target_user = await db.users.find_one({"username": username})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle quick state actions
    if action == "set_streak_6":
        await db.streaks.update_one(
            {"user_id": target_user['id']},
            {"$set": {"current_streak": 6}}
        )
        return {"success": True, "message": "Streak set to 6 days"}
    
    elif action == "set_streak_7":
        await db.streaks.update_one(
            {"user_id": target_user['id']},
            {"$set": {"current_streak": 7}}
        )
        # Create notification
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": target_user['id'],
            "type": "unlock",
            "title": "Social feed unlocked!",
            "body": "You've maintained a 7-day streak. The community feed is now available.",
            "entity_type": "unlock",
            "entity_id": "social_feed",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"success": True, "message": "Streak set to 7 days, feed unlocked"}
    
    elif action == "set_streak_30":
        await db.streaks.update_one(
            {"user_id": target_user['id']},
            {"$set": {"current_streak": 30}}
        )
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": target_user['id'],
            "type": "unlock",
            "title": "Swap matching unlocked!",
            "body": "30-day streak achieved! You can now swap plants with other grove members.",
            "entity_type": "unlock",
            "entity_id": "swaps",
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"success": True, "message": "Streak set to 30 days, swaps unlocked"}
    
    else:
        return {"success": False, "message": "Unknown action"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
