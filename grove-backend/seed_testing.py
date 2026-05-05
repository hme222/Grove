"""
Grove Test Account Seeding Script

Creates three fully populated test accounts with realistic data:
- Maya Chen (@mayagreens) - New beginner, 6 weeks
- James Okafor (@rootsandstems) - Power user, 14 months, 47 plants
- Clare Nolan (@clarenolan_studio) - Florist Pro, 8 months

Plus 6 supporting grove member accounts.
"""

import asyncio
import uuid
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Common test password
TEST_PASSWORD = "GroveTesting2025!"

async def clear_test_account(db, username):
    """Clear all data for a test account (cascading delete across all Grove collections)."""
    user = await db.users.find_one({"username": username})
    if not user:
        return

    user_id = user['id']
    print(f"  Clearing existing data for @{username}...")

    # Collect entity IDs we'll need for cascading deletes of child docs
    plant_ids = [p['id'] async for p in db.plants.find({"user_id": user_id}, {"id": 1})]
    bouquet_ids = [b['id'] async for b in db.bouquets.find({"user_id": user_id}, {"id": 1})]
    post_ids = [p['id'] async for p in db.posts.find({"user_id": user_id}, {"id": 1})]

    # Cascade: plants → care_logs (already scoped by user_id), timelines
    # Cascade: bouquets → bouquet_flowers, bouquet_care_logs
    if bouquet_ids:
        await db.bouquet_flowers.delete_many({"bouquet_id": {"$in": bouquet_ids}})
        await db.bouquet_care_logs.delete_many({"bouquet_id": {"$in": bouquet_ids}})
    # Cascade: posts → kudos, comments
    if post_ids:
        await db.kudos.delete_many({"post_id": {"$in": post_ids}})
        await db.comments.delete_many({"post_id": {"$in": post_ids}})

    # Direct deletions scoped by user_id
    collections_by_user = [
        "plants", "care_logs", "bouquets",
        "posts", "comments", "kudos",
        "goals", "notifications",
        "portfolio_items", "user_goals", "user_challenges",
        "grove_members", "user_badges", "user_unlocks",
        "reactions", "wishlist_items",
        "user_missions",
        # Phase 14C / 14C.3 — fixture cleanup
        "want_list",          # Phase 14C.2 want list entries
        "grove_messages",     # Phase 14C.3.c chat messages
    ]
    for coll_name in collections_by_user:
        try:
            await db[coll_name].delete_many({"user_id": user_id})
        except Exception:
            pass

    # Streak + user row
    await db.streaks.delete_many({"user_id": user_id})
    await db.users.delete_one({"id": user_id})

def days_ago(days):
    """Get ISO datetime N days ago"""
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

def hours_ago(hours):
    """Get ISO datetime N hours ago"""
    return (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()


def today_iso_date():
    """ISO date string for today (YYYY-MM-DD)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def _grant_seed_badge(db, user_id, slug):
    """Pre-grant a badge during seed. Idempotent — skips if already held."""
    badge = await db.badges.find_one({"slug": slug})
    if not badge:
        return False
    existing = await db.user_badges.find_one({"user_id": user_id, "badge_slug": slug})
    if existing:
        return False
    await db.user_badges.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "badge_id": badge["id"],
        "badge_slug": slug,
        "earned_at": datetime.now(timezone.utc).isoformat(),
        "granted_by_seed": True,
    })
    return True


# Test groves seed — created on demand by seeders that need them.
# Phase 14C.3.c: James needs 5 grove memberships per fixture spec.
TEST_GROVES_SEED = [
    {"name": "Aroid Society", "description": "For aroid lovers — Monstera, Philodendron, Anthurium and beyond."},
    {"name": "Houseplant Hobbyists", "description": "Casual houseplant talk for everyday growers."},
    {"name": "Rare & Exotic", "description": "Rare cultivars, variegates, and harder-to-find species."},
    {"name": "Propagation Project", "description": "Cuttings, water rooting, and seed sharing."},
    {"name": "London Growers", "description": "UK-based growers swapping tips for damp climates and short winters."},
]


async def ensure_test_groves(db, owner_user_id=None):
    """Ensure all TEST_GROVES_SEED groves exist. Returns list of grove ids in order.

    If a grove with the same name already exists, it is reused (no duplicate).
    A test grove always has the seeded user (or the first admin found) as owner.
    """
    if owner_user_id is None:
        admin = await db.users.find_one({"is_admin": True})
        owner_user_id = admin["id"] if admin else None
    grove_ids = []
    for spec in TEST_GROVES_SEED:
        existing = await db.groves.find_one({"name": spec["name"]})
        if existing:
            grove_ids.append(existing["id"])
            continue
        gid = str(uuid.uuid4())
        await db.groves.insert_one({
            "id": gid,
            "name": spec["name"],
            "description": spec["description"],
            "creator_id": owner_user_id,
            "is_private": False,
            "is_seed": True,
            "member_count": 1 if owner_user_id else 0,
            "created_at": days_ago(120),
            "updated_at": days_ago(120),
        })
        if owner_user_id:
            await db.grove_members.insert_one({
                "id": str(uuid.uuid4()),
                "grove_id": gid,
                "user_id": owner_user_id,
                "role": "member",
                "joined_at": days_ago(120),
            })
        grove_ids.append(gid)
    return grove_ids

async def seed_maya(db):
    """Seed Maya Chen - Beginner, 6 weeks in"""
    print("\n=== Seeding Maya Chen (@mayagreens) ===")
    
    # Clear existing
    await clear_test_account(db, "mayagreens")
    
    # User
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": "mayagreens",
        "email": "maya.testing@grove.app",
        "password_hash": hash_password(TEST_PASSWORD),
        "display_name": "Maya Chen",
        "bio": "New to plants. Trying not to kill them 🌱",
        "location": "Brooklyn, NY",
        "profile_public": True,
        "care_public": False,
        "collection_public": True,
        "streak_public": True,
        "tier": "free",
        "onboarding_complete": True,
        "is_admin": True,
        "is_florist": False,
        "first_care_celebrated": True,
        "first_session_banner_dismissed": True,
        # Pre-testing audit: account is now 28 days old so the tooltip
        # 30-day window is still ACTIVE during user-testing sessions
        # (spec requires created_at within last 30 days).
        "created_at": days_ago(28),
        "updated_at": hours_ago(1),
        # Pre-testing audit: section tutorials cleared so all 4 fire on
        # first visit during testing. Lighting tutorial still unread (no
        # light_reader badge granted) — that's part of the test.
        "tutorials_seen": [],
        "is_verified": False,
        "verified_user": False,
        "verified_by_admin": False,
        "verification_pact_version": None,
        "pact_signed_at": None,
        "verification_email_confirmed": False,
        "hardiness_zone": "7a",
        "hardiness_zone_source": "zip-prefix",
        "hardiness_zone_system": "USDA",
        "location_country": "US",
        "location_postcode": "112",
        "personality_title": "The Careful Beginner",
        "personality_body": "You're six weeks in and already logging more consistently than most owners manage in six months. You gravitate toward forgiving species — which is exactly the right move. Your Spider Plant is the one to watch: a little more attention and she'll reward you."
    }
    await db.users.insert_one(user)
    print(f"  ✓ Created user: @mayagreens")
    
    # Streak — active today (12-day streak per testing script v2)
    streak = {
        "user_id": user_id,
        "current_streak": 12,
        "longest_streak": 12,
        "last_log_date": today_iso_date(),
        "updated_at": hours_ago(1)
    }
    await db.streaks.insert_one(streak)
    print(f"  ✓ Streak: 12 days (active today)")
    
    # Plants
    plants_data = [
        {"common_name": "Pothos", "nickname": "Percy", "room": "living room", "watering_frequency_days": 7, "health_score": 88, "last_watered_days_ago": 5, "status": "amber"},
        {"common_name": "Snake Plant", "nickname": "Sandra", "room": "bedroom", "watering_frequency_days": 14, "health_score": 94, "last_watered_days_ago": 3, "status": "green"},
        {"common_name": "Spider Plant", "nickname": "", "room": "kitchen", "watering_frequency_days": 7, "health_score": 76, "last_watered_days_ago": 8, "status": "red"},
        {"common_name": "Aloe Vera", "nickname": "", "room": "bathroom windowsill", "watering_frequency_days": 14, "health_score": 91, "last_watered_days_ago": 2, "status": "green"},
        {"common_name": "Peace Lily", "nickname": "", "room": "living room", "watering_frequency_days": 7, "health_score": 82, "last_watered_days_ago": 6, "status": "amber"},
        {"common_name": "Rubber Plant", "nickname": "Rudy", "room": "living room", "watering_frequency_days": 10, "health_score": 71, "last_watered_days_ago": 9, "status": "red"},
    ]
    
    plant_ids = []
    for i, pdata in enumerate(plants_data):
        plant_id = str(uuid.uuid4())
        plant_ids.append(plant_id)
        
        last_watered = days_ago(pdata["last_watered_days_ago"])
        next_water_due_date = (datetime.fromisoformat(last_watered.replace('Z', '+00:00')) + timedelta(days=pdata["watering_frequency_days"])).isoformat()
        
        plant = {
            "id": plant_id,
            "user_id": user_id,
            "common_name": pdata["common_name"],
            "nickname": pdata["nickname"],
            "latin_name": "",
            "grow_medium": "soil",
            "room": pdata["room"],
            "watering_frequency_days": pdata["watering_frequency_days"],
            "health_score": pdata["health_score"],
            "last_watered": last_watered,
            "next_water_due": next_water_due_date,
            "status": pdata["status"],
            "is_archived": False,
            "acquired_date": days_ago(28 - i * 2),
            "created_at": days_ago(28 - i * 2),
            "updated_at": last_watered
        }
        await db.plants.insert_one(plant)
    print(f"  ✓ Created 6 plants")
    
    # Care logs (~25 entries over 4 weeks)
    care_count = 0
    for plant_id in plant_ids:
        for day in range(28, 0, -3):
            if day % 7 <= 4:  # Mon-Fri logging pattern
                care_log = {
                    "id": str(uuid.uuid4()),
                    "plant_id": plant_id,
                    "user_id": user_id,
                    "action": "water" if care_count % 6 != 0 else ("photo" if care_count % 12 == 0 else "mist"),
                    "notes": "",
                    "logged_at": days_ago(day),
                    "created_at": days_ago(day)
                }
                await db.care_logs.insert_one(care_log)
                care_count += 1
    print(f"  ✓ Created {care_count} care logs")
    
    # Bouquet
    bouquet_id = str(uuid.uuid4())
    bouquet = {
        "id": bouquet_id,
        "user_id": user_id,
        "name": "Birthday flowers from mum",
        "occasion": "gift",
        "received_date": days_ago(21),
        "vase_life_expected": 8,
        "vase_life_achieved": 10,
        "is_active": False,
        "created_at": days_ago(21)
    }
    await db.bouquets.insert_one(bouquet)
    
    # Bouquet flowers
    flowers = ["Rose", "Gypsophila", "Freesia", "Eucalyptus"]
    for flower in flowers:
        await db.bouquet_flowers.insert_one({
            "id": str(uuid.uuid4()),
            "bouquet_id": bouquet_id,
            "common_name": flower,
            "latin_name": "",
            "count": 3 if flower == "Rose" else 1,
            "created_at": days_ago(21)
        })
    print(f"  ✓ Created 1 bouquet with 4 flowers")
    
    # Posts
    posts_data = [
        {"content": "She's growing so fast! Third new leaf this week", "kudos": 4, "days_ago": 14},
        {"content": "Percy is thriving in his corner. Never expected to love a plant this much", "kudos": 7, "days_ago": 7},
        {"content": "Birthday flowers from mum - hoping to keep them alive longer than usual!", "kudos": 11, "days_ago": 21},
    ]
    
    for pdata in posts_data:
        post_id = str(uuid.uuid4())
        post = {
            "id": post_id,
            "user_id": user_id,
            "content": pdata["content"],
            "photo_urls": [],
            "kudos_count": pdata["kudos"],
            "comment_count": 2 if pdata["kudos"] > 10 else 0,
            "created_at": days_ago(pdata["days_ago"])
        }
        await db.posts.insert_one(post)
    print(f"  ✓ Created 3 social posts")
    
    # Goals
    goal1 = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": "Keep all 6 plants alive for 90 days",
        "description": "My first big goal!",
        "goal_type": "custom",
        "target_value": 90,
        "current_value": 42,
        "status": "active",
        "start_date": days_ago(42),
        "end_date": None,
        "created_at": days_ago(42),
        "updated_at": days_ago(1)
    }
    goal2 = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": "Try tracking a bouquet",
        "description": "",
        "goal_type": "custom",
        "target_value": 1,
        "current_value": 1,
        "status": "completed",
        "start_date": days_ago(25),
        "end_date": None,
        "created_at": days_ago(25),
        "updated_at": days_ago(21)
    }
    await db.goals.insert_many([goal1, goal2])
    print(f"  ✓ Created 2 goals")
    
    # Phase 14C.2 — want list (3 species per user-testing spec: Monstera
    # deliciosa, Philodendron pink princess, Bird of Paradise).
    want_slugs = ["monstera-deliciosa", "philodendron-pink-princess", "strelitzia-reginae"]
    species_docs = await db.species.find({"slug": {"$in": want_slugs}}).to_list(10)
    for s in species_docs:
        await db.want_list.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "species_id": s["id"],
            "note": "",
            "priority": "medium",
            "created_at": days_ago(7),
        })
    print(f"  ✓ Want list: {len(species_docs)} species")
    
    # Pre-testing audit: 8 starter badges aligned verbatim to the
    # user-testing script. These are seeded (granted_by_seed=True) so they
    # show up in Maya's gallery even though some (e.g., streak_14) are
    # ahead of her live stats — the live stats stay consistent with her
    # 12-day streak. NOT verified (so the verification flow is part of the
    # testing demo).
    maya_badges = [
        "plant_first", "plant_5",            # 6 plants
        "watering_first",                    # ~25 care logs
        "streak_7", "streak_14",             # 12-day streak with seeded history up to 14
        "kudos_received_first",              # community engagement
        "prop_first",                        # started propagating
        "grove_joined_first",                # Phase 14 badge unification
    ]
    for slug in maya_badges:
        await _grant_seed_badge(db, user_id, slug)
    print(f"  ✓ Granted {len(maya_badges)} starter badges")

    # Pre-testing audit: 3 display badges — narratively selected to tell
    # Maya's "growing beginner" story (collection growth, streak building,
    # first propagation).
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"displayed_badges": [
            "plant_5", "streak_14", "prop_first"
        ]}}
    )
    print(f"  ✓ Featured 3 badges on profile")
    
    print(f"✅ Maya Chen complete: @mayagreens / {TEST_PASSWORD}")
    return user_id

async def seed_james(db):
    """Seed James Okafor - Power user, 47 plants, 14 months"""
    print("\n=== Seeding James Okafor (@rootsandstems) ===")
    
    await clear_test_account(db, "rootsandstems")
    
    # User
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": "rootsandstems",
        "email": "james.testing@grove.app",
        "password_hash": hash_password(TEST_PASSWORD),
        "display_name": "James Okafor",
        "bio": "Aroid obsessive. Propagation enthusiast. North London.",
        "location": "London, UK",
        "profile_public": True,
        "care_public": True,
        "collection_public": True,
        "streak_public": True,
        "tier": "pro",
        "onboarding_complete": True,
        "is_admin": True,
        "is_florist": False,
        "first_care_celebrated": True,
        "first_session_banner_dismissed": True,
        "created_at": days_ago(420),
        "updated_at": hours_ago(2),
        # Pre-testing audit: lighting tutorial marked SEEN so the
        # light_reader badge (below) is consistent with the UI flag and
        # James won't get the lighting intro modal during testing.
        "tutorials_seen": ["care", "greenhouse", "collection", "grove", "lighting"],
        "is_verified": True,
        "verified_user": True,
        "verified_by_admin": False,
        "verification_pact_version": "1.0",
        "pact_signed_at": days_ago(90),
        "verified_at": days_ago(90),
        "verification_email_confirmed": True,
        "verification_completed_at": days_ago(90),
        "pro_active": True,
        "subscription_status": "active",
        "hardiness_zone": "9a",
        "hardiness_zone_source": "postcode-area",
        "hardiness_zone_system": "RHS",
        "location_country": "UK",
        "location_postcode": "N1",
        "personality_title": "The Patient Cultivator",
        "personality_body": "You gravitate toward slow-growing aroids and let them lead — rarely over-watering, always noticing before it becomes a problem. Your grove leans tropical and architectural. You propagate more than you buy, and three members of the community are growing plants that started in your collection. Your consistency score puts you in the top 8% of Grove."
    }
    await db.users.insert_one(user)
    print(f"  ✓ Created user: @rootsandstems")
    
    # Streak — 100-day active streak per testing script v2
    streak = {
        "user_id": user_id,
        "current_streak": 100,
        "longest_streak": 100,
        "last_log_date": today_iso_date(),
        "updated_at": hours_ago(2)
    }
    await db.streaks.insert_one(streak)
    print(f"  ✓ Streak: 100 days (active today)")
    
    # Key plants with detail
    key_plants = [
        {"common_name": "Monstera deliciosa", "latin_name": "Monstera deliciosa", "nickname": "Delia", "room": "living room", "days": 7, "health": 96, "last_watered": 2, "status": "green", "age_days": 390},
        {"common_name": "Monstera Thai Constellation", "latin_name": "Monstera deliciosa 'Thai Constellation'", "nickname": "Stella", "room": "living room", "days": 10, "health": 89, "last_watered": 4, "status": "green", "age_days": 240},
        {"common_name": "Philodendron gloriosum", "latin_name": "Philodendron gloriosum", "nickname": "", "room": "office", "days": 7, "health": 93, "last_watered": 1, "status": "green", "age_days": 300},
        {"common_name": "Pothos", "latin_name": "Epipremnum aureum", "nickname": "The OG", "room": "kitchen", "days": 7, "health": 88, "last_watered": 5, "status": "blue", "age_days": 60, "propagating": True},
        {"common_name": "Fiddle Leaf Fig", "latin_name": "Ficus lyrata", "nickname": "Franklin", "room": "bedroom", "days": 7, "health": 64, "last_watered": 8, "status": "red", "age_days": 180},
        {"common_name": "Alocasia zebrina", "latin_name": "Alocasia zebrina", "nickname": "", "room": "bathroom", "days": 7, "health": 91, "last_watered": 1, "status": "green", "age_days": 150},
        {"common_name": "Hoya kerrii", "latin_name": "Hoya kerrii", "nickname": "", "room": "office", "days": 14, "health": 95, "last_watered": 3, "status": "green", "age_days": 120},
        {"common_name": "Calathea ornata", "latin_name": "Calathea ornata", "nickname": "", "room": "living room", "days": 7, "health": 78, "last_watered": 2, "status": "green", "age_days": 200, "grow_medium": "leca"},
    ]
    
    plant_ids = []
    for pdata in key_plants:
        plant_id = str(uuid.uuid4())
        plant_ids.append(plant_id)
        
        last_watered = days_ago(pdata["last_watered"])
        next_water = (datetime.fromisoformat(last_watered.replace('Z', '+00:00')) + timedelta(days=pdata["days"])).isoformat()
        
        plant = {
            "id": plant_id,
            "user_id": user_id,
            "common_name": pdata["common_name"],
            "latin_name": pdata.get("latin_name", ""),
            "nickname": pdata["nickname"],
            "grow_medium": pdata.get("grow_medium", "soil"),
            "room": pdata["room"],
            "watering_frequency_days": pdata["days"],
            "health_score": pdata["health"],
            "last_watered": last_watered,
            "next_water_due": next_water,
            "status": pdata["status"],
            "is_archived": False,
            "acquired_date": days_ago(pdata["age_days"]),
            "propagating": pdata.get("propagating", False),
            "created_at": days_ago(pdata["age_days"]),
            "updated_at": last_watered
        }
        await db.plants.insert_one(plant)
    
    # Bulk remaining plants (39 more to reach 47 total)
    bulk_plants = [
        "Anthurium clarinervium", "Rhaphidophora tetrasperma", "Scindapsus pictus",
        "Peperomia obtusifolia", "Peperomia argyreia", "Begonia maculata",
        "Fern (Asplenium)", "Hoya carnosa", "Philodendron micans",
        "Syngonium podophyllum", "Maranta leuconeura", "Tradescantia zebrina",
        "Pilea peperomioides", "Chlorophytum comosum", "Dracaena marginata",
    ]
    
    for i, name in enumerate(bulk_plants * 3):  # Repeat to get 39
        if len(plant_ids) >= 47:
            break
        plant_id = str(uuid.uuid4())
        plant_ids.append(plant_id)
        
        plant = {
            "id": plant_id,
            "user_id": user_id,
            "common_name": name,
            "latin_name": name,
            "nickname": "",
            "grow_medium": "soil",
            "room": ["living room", "office", "bedroom", "bathroom"][i % 4],
            "watering_frequency_days": [7, 10, 14][i % 3],
            "health_score": 75 + (i % 20),
            "last_watered": days_ago(1 + i % 5),
            "next_water_due": days_ago(-6 + i % 10),
            "status": "green",
            "is_archived": False,
            "acquired_date": days_ago(30 + i * 5),
            "created_at": days_ago(30 + i * 5),
            "updated_at": days_ago(1)
        }
        await db.plants.insert_one(plant)
    
    print(f"  ✓ Created 47 plants")
    
    # Care logs (340+ entries)
    care_count = 0
    for plant_id in plant_ids[:10]:  # Detailed logs for first 10 plants
        for week in range(60):
            if week % 2 == 0:  # Saturday care routine
                for action in ["water", "photo"] if week % 4 == 0 else ["water"]:
                    care_log = {
                        "id": str(uuid.uuid4()),
                        "plant_id": plant_id,
                        "user_id": user_id,
                        "action": action,
                        "notes": "",
                        "logged_at": days_ago(420 - week * 7),
                        "created_at": days_ago(420 - week * 7)
                    }
                    await db.care_logs.insert_one(care_log)
                    care_count += 1
    
    print(f"  ✓ Created {care_count} care logs")
    
    # Bouquets
    bouquets = [
        {"name": "Partner's birthday", "occasion": "birthday", "days_ago": 90, "expected": 9, "achieved": 12},
        {"name": "Housewarming", "occasion": "gift", "days_ago": 180, "expected": 7, "achieved": 8},
    ]
    
    for bdata in bouquets:
        bouquet_id = str(uuid.uuid4())
        bouquet = {
            "id": bouquet_id,
            "user_id": user_id,
            "name": bdata["name"],
            "occasion": bdata["occasion"],
            "received_date": days_ago(bdata["days_ago"]),
            "vase_life_expected": bdata["expected"],
            "vase_life_achieved": bdata["achieved"],
            "is_active": False,
            "created_at": days_ago(bdata["days_ago"])
        }
        await db.bouquets.insert_one(bouquet)
    
    print(f"  ✓ Created 2 bouquets")
    
    # Goals
    goals = [
        {"title": "Propagate 5 plants this season", "type": "care_logs_count", "target": 5, "current": 3, "status": "active", "age": 90},
        {"title": "Keep Fiddle Leaf alive 90 days", "type": "custom", "target": 90, "current": 71, "status": "active", "age": 71},
        {"title": "Track 3 bouquets and beat vase life", "type": "custom", "target": 3, "current": 2, "status": "active", "age": 180},
    ]
    
    for gdata in goals:
        goal = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": gdata["title"],
            "description": "",
            "goal_type": gdata["type"],
            "target_value": gdata["target"],
            "current_value": gdata["current"],
            "status": gdata["status"],
            "start_date": days_ago(gdata["age"]),
            "end_date": None,
            "created_at": days_ago(gdata["age"]),
            "updated_at": days_ago(1)
        }
        await db.goals.insert_one(goal)
    
    print(f"  ✓ Created 3 goals")
    
    # Phase 14C.3.b — 5 Grove memberships per testing script v2.
    # ensure_test_groves() creates the 5 themed groves if they don't yet
    # exist (idempotent across reseeds).
    grove_ids = await ensure_test_groves(db, owner_user_id=user_id)
    for gid in grove_ids:
        existing = await db.grove_members.find_one({"grove_id": gid, "user_id": user_id})
        if not existing:
            await db.grove_members.insert_one({
                "id": str(uuid.uuid4()),
                "grove_id": gid,
                "user_id": user_id,
                "role": "member",
                "joined_at": days_ago(180),
            })
    print(f"  ✓ Joined {len(grove_ids)} groves")
    
    # Phase 14C.3.b — ~30 badges per testing script v2.
    # Power-user spread: streak 100, 47 plants, 100+ care actions across
    # multiple types, 5 groves, verified, 1 year on Grove, kudos given +
    # received, etc. Pre-seeded so the gallery has substance from session 1.
    james_badges = [
        # Streak family (5 of 9)
        "streak_7", "streak_14", "streak_30", "streak_60", "streak_100",
        # Watering (3 of 6)
        "watering_first", "watering_10", "watering_50",
        # Fertilizing (2 of 4)
        "fert_first", "fert_25",
        # Repotting (2 of 4)
        "repot_first", "repot_5",
        # Pruning (2 of 3)
        "prune_first", "prune_25",
        # Propagation (3 of 5)
        "prop_first", "prop_5", "prop_25",
        # Plant counts (5 of 7)
        "plant_first", "plant_5", "plant_collector_bronze",
        "plant_collector_silver", "plant_collector_gold",
        # Species variety (3 of 4)
        "species_5", "species_10", "species_25",
        # Community
        "post_first", "post_10",
        "kudos_given_first", "kudos_received_first",
        "grove_joined_first",
        # Verification + time
        "verified_user",
        "grove_1_month", "grove_6_months", "grove_1_year",
        # Pre-testing audit additions (per user-testing script):
        # - light_reader: earned by reading the lighting tutorial
        # - aroid_enthusiast: admin-granted niche badge (not in 63 wired)
        "light_reader",
        "aroid_enthusiast",
    ]
    granted = 0
    for slug in james_badges:
        if await _grant_seed_badge(db, user_id, slug):
            granted += 1
    print(f"  ✓ Granted {granted} badges (target 32)")

    # Pre-testing audit: 3 display badges — tells James's "power user +
    # aroid specialist" story as required by the user-testing script.
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"displayed_badges": [
            "plant_collector_gold", "streak_100", "aroid_enthusiast"
        ]}}
    )
    print(f"  ✓ Featured 3 badges on profile")

    # Pre-testing audit: want list (4 species) including Anthurium
    # warocqueanum per spec.
    want_slugs_james = [
        "anthurium-warocqueanum",
        "monstera-deliciosa",
        "philodendron-pink-princess",
        "strelitzia-reginae",
    ]
    species_docs = await db.species.find({"slug": {"$in": want_slugs_james}}).to_list(10)
    for s in species_docs:
        existing = await db.want_list.find_one({"user_id": user_id, "species_id": s["id"]})
        if existing:
            continue
        await db.want_list.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "species_id": s["id"],
            "note": "",
            "priority": "medium",
            "created_at": days_ago(30),
        })
    print(f"  ✓ Want list: {len(species_docs)} species")

    # Pre-testing audit: seed grove chat history in at least 2 groves so
    # testers see an active community when opening chat tabs.
    from random import choice
    chat_seeds = [
        # grove_ids[0] = Aroid Society
        (0, "James just moved my gloriosum into brighter light. Already opening new leaves.", 14),
        (0, "Anyone have experience with Anthurium warocqueanum? Mine's velvety but slow.", 10),
        (0, "My Thai Constellation finally threw a pure white leaf today 🤍", 3),
        # grove_ids[3] = Propagation Project
        (3, "Three cuttings in water, one in LECA — LECA wins every time for me.", 9),
        (3, "Sharing a Philodendron micans cutting with a friend — propagation is community.", 5),
        (3, "Rooting hormone = overrated for pothos. Fresh water + warmth does it.", 2),
    ]
    for grove_idx, body, d_ago in chat_seeds:
        if grove_idx >= len(grove_ids):
            continue
        now_iso = days_ago(d_ago)
        await db.grove_messages.insert_one({
            "id": str(uuid.uuid4()),
            "grove_id": grove_ids[grove_idx],
            "user_id": user_id,
            "body": body,
            "photo_path": None,
            "edited": False,
            "is_deleted": False,
            "deleted_at": None,
            "deleted_by": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        })
    print(f"  ✓ Seeded {len(chat_seeds)} chat messages across 2 groves")

    # Pre-testing diagnostic: seed one James-authored post so testers can
    # confirm — side-by-side with Clare's seeded post on the same shared
    # groves — that the Verified Pro checkmark renders on Clare's name
    # but NOT on James's (he has verified_user=true but verified_by_admin
    # is false, so he's verified-but-not-pro).
    james_post = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "caption": "My Anthurium warocqueanum threw its biggest leaf yet this morning — 38cm across. Velvet finish, deep emerald veining. Worth the wait.",
        "photo_url": "",
        "plant_id": None,
        "kudos_count": 9,
        "comment_count": 0,
        "created_at": days_ago(1),
        "updated_at": days_ago(1),
    }
    await db.posts.insert_one(james_post)
    print(f"  ✓ Seeded 1 feed post")
    
    print(f"✅ James Okafor complete: @rootsandstems / {TEST_PASSWORD}")
    return user_id

async def seed_clare(db):
    """Seed Clare Nolan - Florist Pro, 8 months"""
    print("\n=== Seeding Clare Nolan (@clarenolan_studio) ===")
    
    await clear_test_account(db, "clarenolan_studio")
    
    # User
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "username": "clarenolan_studio",
        "email": "clare.testing@grove.app",
        "password_hash": hash_password(TEST_PASSWORD),
        "display_name": "Clare Nolan",
        "bio": "Floral designer. 18 years. London. Weddings, events, editorial.",
        "location": "London, UK",
        "profile_public": True,
        "care_public": False,
        "collection_public": True,
        "streak_public": False,
        "tier": "florist_pro",
        "onboarding_complete": True,
        "is_admin": True,
        "is_florist": True,
        "studio_name": "Clare Nolan Studio",
        "studio_location": "East London",
        "portfolio_public": True,
        "first_care_celebrated": True,
        "first_session_banner_dismissed": True,
        "created_at": days_ago(240),
        "updated_at": hours_ago(3),
        # Phase 14C fixtures — testing script v2:
        # Clare is the Florist Pro persona. Verified + Pro + 240 days ⇒
        # eligible for swaps end-to-end. She has read all 5 core tutorials
        # (the Florist Pro persona is the most experienced).
        "tutorials_seen": ["care", "greenhouse", "collection", "grove", "lighting"],
        "is_verified": True,
        "verified_user": True,
        "verified_by_admin": True,
        "verification_pact_version": "1.0",
        "pact_signed_at": days_ago(120),
        "verified_at": days_ago(120),
        "verification_email_confirmed": True,
        "verification_completed_at": days_ago(120),
        "pro_active": True,
        "subscription_status": "active",
        "florist_pro_active": True,
        # Pre-testing audit: hardiness zone set to 8b (USDA) per spec
        # ("West Coast florist" is only a narrative framing; her London
        # location is unchanged to avoid ripple effects on other fixtures).
        "hardiness_zone": "8b",
        "hardiness_zone_source": "manual",
        "hardiness_zone_system": "USDA",
        "location_country": "UK",
        "location_postcode": "E2",
        "personality_title": "The Studio Grower",
        "personality_body": "Your personal collection is small but purposeful — every plant in your studio earns its place. Your real expertise shows in the bouquet data: 18 arrangements tracked, consistently beating expected vase life by nearly 2 days."
    }
    await db.users.insert_one(user)
    print(f"  ✓ Created user: @clarenolan_studio")
    
    # Pre-testing audit: 60-day current streak per user-testing spec.
    streak = {
        "user_id": user_id,
        "current_streak": 60,
        "longest_streak": 60,
        "last_log_date": today_iso_date(),
        "updated_at": hours_ago(3)
    }
    await db.streaks.insert_one(streak)
    
    # Plants (8 personal plants)
    plants_data = [
        {"common_name": "Monstera deliciosa", "room": "living room", "days": 7, "health": 88},
        {"common_name": "Fiddle Leaf Fig", "room": "studio", "days": 7, "health": 79},
        {"common_name": "Olive tree", "room": "garden", "days": 30, "health": 92},
        {"common_name": "Eucalyptus", "room": "garden", "days": 7, "health": 95},
        {"common_name": "Rose bush", "room": "garden", "days": 7, "health": 88},
        {"common_name": "Lavender", "room": "garden", "days": 7, "health": 91},
        {"common_name": "Pothos", "room": "studio", "days": 7, "health": 84},
        {"common_name": "Succulent", "room": "studio windowsill", "days": 30, "health": 92},
    ]
    
    for pdata in plants_data:
        plant_id = str(uuid.uuid4())
        plant = {
            "id": plant_id,
            "user_id": user_id,
            "common_name": pdata["common_name"],
            "latin_name": "",
            "nickname": "",
            "grow_medium": "soil",
            "room": pdata["room"],
            "watering_frequency_days": pdata["days"],
            "health_score": pdata["health"],
            "last_watered": days_ago(2),
            "next_water_due": days_ago(-5),
            "status": "green" if pdata["health"] > 85 else "amber",
            "is_archived": False,
            "acquired_date": days_ago(240),
            # Pre-testing diagnostic: Clare's plants need recent created_at
            # so a couple bubble up into the swap deck (top 20 by created_at)
            # and testers can see her Verified Pro checkmark next to the
            # owner badge on at least one swap card.
            "created_at": days_ago(2 + i),
            "updated_at": days_ago(2)
        }
        await db.plants.insert_one(plant)
    
    print(f"  ✓ Created 8 plants")
    
    # Bouquets (18 professional arrangements)
    bouquet_names = [
        ("Sarah & James — Wedding", "wedding", 0, 10, None, True),
        ("Emma Thompson — Birthday", "birthday", 3, 9, 9, True),
        ("Harrington Corporate — Monday", "corporate", 1, 14, None, True),
        ("Past Wedding 1", "wedding", 30, 10, 12, False),
        ("Past Anniversary", "anniversary", 60, 8, 10, False),
        ("Past Corporate", "corporate", 90, 12, 14, False),
    ]
    
    for i, (name, occasion, days_ago_val, expected, achieved, active) in enumerate(bouquet_names[:6]):
        bouquet_id = str(uuid.uuid4())
        bouquet = {
            "id": bouquet_id,
            "user_id": user_id,
            "name": name,
            "occasion": occasion,
            "received_date": days_ago(days_ago_val),
            "vase_life_expected": expected,
            "vase_life_achieved": achieved,
            "is_active": active,
            "florist_arrangement": True,
            "created_at": days_ago(days_ago_val)
        }
        await db.bouquets.insert_one(bouquet)
    
    print(f"  ✓ Created 6 bouquets (18 total in production)")
    
    # Portfolio items
    portfolio_items = [
        {"title": "Spring Wedding Arch", "description": "Cascading seasonal blooms with locally sourced foliage"},
        {"title": "Editorial Shoot — Vogue", "description": "Minimalist mono-botanical arrangements"},
        {"title": "Corporate Event — Tech Launch", "description": "Modern architectural arrangements with tropical elements"},
    ]
    
    for item_data in portfolio_items:
        item = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": item_data["title"],
            "description": item_data["description"],
            "photo_url": "",
            "tags": [],
            "created_at": days_ago(60)
        }
        await db.portfolio_items.insert_one(item)
    
    print(f"  ✓ Created 3 portfolio items")
    
    # Phase 14C.3.b — ~35 badges per testing script v2.
    # Florist Pro persona spread: 8 months on Grove, verified pro, 18
    # bouquets tracked (we seed 6 here but the gallery shows the full
    # production set), 8 plants, all 5 tutorials read, multi-month streak.
    clare_badges = [
        # Streak family (4 of 9) — 60-day current covers streak_60
        "streak_7", "streak_14", "streak_30", "streak_60",
        # Watering (3 of 6)
        "watering_first", "watering_10", "watering_50",
        # Fertilizing (1 of 4)
        "fert_first",
        # Repotting (1 of 4)
        "repot_first",
        # Pruning (1 of 3)
        "prune_first",
        # Propagation (1 of 5)
        "prop_first",
        # Plant counts (3 of 7)
        "plant_first", "plant_5",
        # Bouquet counts (6 of 6) — 18 bouquets tracked in production;
        # pre-testing audit adds bouquet_collector_gold (previously missing)
        "bouquet_first", "bouquet_5",
        "bouquet_collector_bronze", "bouquet_collector_silver",
        "bouquet_collector_gold",
        # Species variety (1 of 4)
        "species_5",
        # Community
        "post_first", "post_10",
        "kudos_given_first", "kudos_received_first",
        "grove_joined_first",
        # Verification + time
        "verified_user",
        "grove_1_month", "grove_6_months",
        # Knowledge — all 5 tutorials seen + greenhouse browser
        "light_reader", "watering_scholar", "propagation_master",
        "pest_detective", "repotting_ready", "all_tutorials",
        # Florist Pro identity (admin-grantable)
        "verified_pro",
        # Florist Pro count badges
        "care_sheet_first", "care_sheet_10",
        "qr_scan_first",
        # Aesthetics — 18 wedding arrangements + studio
        "wedding_florist",
    ]
    granted = 0
    for slug in clare_badges:
        if await _grant_seed_badge(db, user_id, slug):
            granted += 1
    print(f"  ✓ Granted {granted} badges (target 35)")
    
    # Ensure Clare is a member of the test groves so chat is testable
    grove_ids = await ensure_test_groves(db, owner_user_id=user_id)
    for gid in grove_ids[:3]:  # Clare joins 3 of the 5 themed groves
        existing = await db.grove_members.find_one({"grove_id": gid, "user_id": user_id})
        if not existing:
            await db.grove_members.insert_one({
                "id": str(uuid.uuid4()),
                "grove_id": gid,
                "user_id": user_id,
                "role": "member",
                "joined_at": days_ago(120),
            })
    print(f"  ✓ Joined 3 themed groves")
    
    # Pre-testing audit: Clare's display badges — 3 strongest Florist Pro
    # signals per user-testing spec (verified_pro, bouquet_collector_gold,
    # wedding_florist).
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"displayed_badges": [
            "verified_pro", "bouquet_collector_gold", "wedding_florist"
        ]}}
    )
    print(f"  ✓ Featured 3 badges on profile")

    # Pre-testing audit: want list (4 species) per spec incl. David Austin
    # Juliet rose and Lisianthus.
    want_slugs_clare = [
        "rosa-juliet-ausjameson",
        "eustoma-grandiflorum",
        "strelitzia-reginae",
        "monstera-deliciosa",
    ]
    species_docs = await db.species.find({"slug": {"$in": want_slugs_clare}}).to_list(10)
    for s in species_docs:
        existing = await db.want_list.find_one({"user_id": user_id, "species_id": s["id"]})
        if existing:
            continue
        await db.want_list.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "species_id": s["id"],
            "note": "",
            "priority": "medium",
            "created_at": days_ago(60),
        })
    print(f"  ✓ Want list: {len(species_docs)} species")

    # Pre-testing diagnostic: seed one Clare-authored post so testers can
    # see the Verified Pro checkmark next to her username in the main
    # feed (and on grove feed posts). Without an authored post there's
    # nowhere on /feed for the checkmark to render.
    clare_post = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "caption": "First lisianthus stems of the season — these are headed into a wedding bouquet on Saturday. Soft butter yellow, just opening.",
        "photo_url": "",
        "plant_id": None,
        "kudos_count": 4,
        "comment_count": 0,
        "created_at": days_ago(2),
        "updated_at": days_ago(2),
    }
    await db.posts.insert_one(clare_post)
    print(f"  ✓ Seeded 1 feed post")

    print(f"✅ Clare Nolan complete: @clarenolan_studio / {TEST_PASSWORD}")
    return user_id

async def seed_supporting_accounts(db):
    """Seed 6 lightweight supporting grove members"""
    print("\n=== Seeding 6 Supporting Grove Members ===")
    
    usernames = ["mossandleaf", "rootandgrove", "ferngrove", "leaflight", "grovekeeper", "morningcuttings"]
    
    for username in usernames:
        await clear_test_account(db, username)
        
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "username": username,
            "email": f"{username}@grove.app",
            "password_hash": hash_password(TEST_PASSWORD),
            "display_name": username.title().replace("and", " & "),
            "bio": "Plant enthusiast 🌿",
            "location": ["London", "Brooklyn", "Manchester"][len(username) % 3],
            "profile_public": True,
            "tier": "free",
            "onboarding_complete": True,
            "is_admin": False,
            "created_at": days_ago(100 + len(username) * 10),
            "updated_at": days_ago(5)
        }
        await db.users.insert_one(user)
        
        # Streak
        streak = {
            "user_id": user_id,
            "current_streak": 5 + (len(username) % 25),
            "longest_streak": 10 + (len(username) % 30),
            "last_log_date": days_ago(2).split('T')[0],
            "updated_at": days_ago(2)
        }
        await db.streaks.insert_one(streak)
        
        # 2-3 plants
        for i in range(2 + len(username) % 2):
            plant_id = str(uuid.uuid4())
            plant = {
                "id": plant_id,
                "user_id": user_id,
                "common_name": ["Pothos", "Snake Plant", "Monstera"][i % 3],
                "nickname": "",
                "grow_medium": "soil",
                "room": "living room",
                "watering_frequency_days": 7,
                "health_score": 80 + i * 5,
                "last_watered": days_ago(3),
                "next_water_due": days_ago(-4),
                "status": "green",
                "is_archived": False,
                "acquired_date": days_ago(60),
                "created_at": days_ago(60),
                "updated_at": days_ago(3)
            }
            await db.plants.insert_one(plant)
        
        print(f"  ✓ Created @{username}")
    
    print(f"✅ Supporting accounts complete")

async def seed_groveling(db):
    """Seed Groveling — brand-new user with no plants/logs (Phase 11 'first 90 seconds' demo)."""
    print("\n=== Seeding Groveling (@groveling) ===")
    await clear_test_account(db, "groveling")

    user_id = str(uuid.uuid4())
    # created_at within the last hour so the FirstSessionBanner is visible.
    just_now_iso = datetime.now(timezone.utc).isoformat()
    user = {
        "id": user_id,
        "username": "groveling",
        "email": "groveling.testing@grove.app",
        "password_hash": hash_password(TEST_PASSWORD),
        "display_name": "Groveling",
        "bio": "Just signed up.",
        "location": "",
        "avatar_url": "",
        "profile_public": True,
        "care_public": False,
        "collection_public": True,
        "streak_public": True,
        "tier": "free",
        "onboarding_complete": True,
        "is_admin": True,
        "is_florist": False,
        "studio_name": "",
        "studio_location": "",
        "portfolio_public": False,
        "first_care_celebrated": False,
        "first_session_banner_dismissed": False,
        "created_at": just_now_iso,
        "updated_at": just_now_iso,
        "personality_title": "",
        "personality_body": "",
    }
    await db.users.insert_one(user)
    print(f"  ✓ Created user: @groveling (clean slate)")

    # Empty streak record so streak APIs work.
    await db.streaks.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "current_streak": 0,
        "longest_streak": 0,
        "last_log_date": None,
        "paused": False,
        "created_at": just_now_iso,
        "updated_at": just_now_iso,
    })
    await db.user_unlocks.insert_one({
        "user_id": user_id,
        "swipe_unlocked": False,
        "social_feed_unlocked": False,
        "collection_showcase_unlocked": False,
        "swap_unlocked": False,
        "updated_at": just_now_iso,
    })
    print(f"  ✓ Streak: 0 days, no plants, no logs")


async def main():
    """Main seeding function"""
    print("\n" + "="*60)
    print("GROVE TEST ACCOUNT SEEDING")
    print("="*60)
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("ERROR: MONGO_URL environment variable not set")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'grove_db')]
    
    print(f"\n📦 Connected to MongoDB: {os.environ.get('DB_NAME', 'grove_db')}")
    
    # Seed accounts
    await seed_maya(db)
    await seed_james(db)
    await seed_clare(db)
    await seed_groveling(db)
    await seed_supporting_accounts(db)
    
    print("\n" + "="*60)
    print("✅ TEST ACCOUNT SEEDING COMPLETE")
    print("="*60)
    print("\n📋 Test Account Credentials:")
    print("   Username: mayagreens")
    print("   Email: maya.testing@grove.app")
    print(f"   Password: {TEST_PASSWORD}")
    print("")
    print("   Username: rootsandstems")
    print("   Email: james.testing@grove.app")
    print(f"   Password: {TEST_PASSWORD}")
    print("")
    print("   Username: clarenolan_studio")
    print("   Email: clare.testing@grove.app")
    print(f"   Password: {TEST_PASSWORD}")
    print("\n🔐 All accounts have admin access to demo panel")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
