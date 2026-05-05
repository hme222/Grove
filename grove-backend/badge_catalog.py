"""Phase 14C.3.b — 170-Badge catalog (Supplement v2 Part B, verbatim).

This module is the single source of truth for the entire Grove badge catalog.
DO NOT add badges here without updating BADGE_SEED_VERSION below — the seed
script wipes and re-seeds db.badges whenever the version string changes so
that production stays in sync with this file.

Each badge dict uses a stable snake_case `slug`. The slug is referenced by
demo seed data (e.g., Maya's `plant_collector_bronze`, James's
`aroid_enthusiast`, Clare's `verified_pro`) so do not rename existing slugs.

Per Supplement v2 § B.7 — tier replacement logic:
   When a user earns a higher tier within a `family`, the lower tiers are
   preserved in their history but excluded from the public 3-badge display.
   The display picker enforces this via BADGE_FAMILIES below.

Per scoping round + user message:
   60 badges have full earning logic (`earnable=True` AND in EARNABLE_SLUGS).
   The remaining 110 are seeded with `earnable=False` so they only appear in
   the gallery as "Granted by Grove" placeholders, awardable via the admin
   grant endpoint until the relevant event source ships.
"""
from typing import List, Dict, Optional

BADGE_SEED_VERSION = "14c3c-177-v2"


def _b(slug: str, name: str, category: str, subcategory: str,
       description: str, icon: str = "award",
       tier: Optional[str] = None,
       earnable: bool = False,
       family: Optional[str] = None,
       family_order: int = 0) -> Dict:
    return {
        "slug": slug,
        "name": name,
        "category": category,
        "subcategory": subcategory,
        "description": description,  # === unlock_hint per spec
        "icon": icon,
        "icon_type": icon,  # back-compat with existing GET /users/me/badges hydration
        "tier": tier,
        "earnable": earnable,
        "family": family,
        "family_order": family_order,
    }


# Slugs that have backend-wired earning logic (top 60+1 per user message).
# Everything else is admin-grantable + visible in the gallery as locked.
EARNABLE_SLUGS = {
    # Streak (9)
    "streak_7", "streak_14", "streak_30", "streak_60", "streak_100",
    "streak_180", "streak_365", "streak_500", "streak_1000",
    # Watering (6)
    "watering_first", "watering_10", "watering_50", "watering_100",
    "watering_500", "watering_1000",
    # Fertilizing (4)
    "fert_first", "fert_25", "fert_100", "fert_500",
    # Repotting (4)
    "repot_first", "repot_5", "repot_25", "repot_50",
    # Pruning (3)
    "prune_first", "prune_25", "prune_100",
    # Propagation (5)
    "prop_first", "prop_5", "prop_25", "prop_50", "prop_100",
    # Health (1)
    "health_hero",
    # Plant rescue (1)
    "plant_rescue",
    # Plant counts (7)
    "plant_first", "plant_5",
    "plant_collector_bronze", "plant_collector_silver", "plant_collector_gold",
    "plant_collector_platinum", "plant_collector_legendary",
    # Bouquet counts (6)
    "bouquet_first", "bouquet_5",
    "bouquet_collector_bronze", "bouquet_collector_silver",
    "bouquet_collector_gold", "bouquet_collector_platinum",
    # Species variety (4)
    "species_5", "species_10", "species_25", "species_50",
    # Posts (2)
    "post_first", "post_10",
    # Kudos (2)
    "kudos_given_first", "kudos_received_first",
    # Groves (1)
    "grove_joined_first",
    # Grove chat (2) — Phase 14C.3.c
    "grove_chat_first",
    "grove_chat_50",
    # Verification (1) — already shipped in 14C.3.a
    "verified_user",
    # Swaps (1) — auto-awards once swap completion data exists
    "swap_first",
    # Tutorial (1)
    "light_reader",
    # Time milestones (3)
    "grove_1_month", "grove_6_months", "grove_1_year",
}


# ---------------------------------------------------------------------------
# B.1 Care category (44 badges)
# ---------------------------------------------------------------------------
_CARE_BADGES: List[Dict] = [
    # Streak — 9
    _b("streak_7", "First week", "Care", "Streak",
       "Care for plants 7 days in a row", icon="flame", earnable=True,
       family="streak", family_order=1),
    _b("streak_14", "Two weeks strong", "Care", "Streak",
       "14 days in a row", icon="flame", earnable=True,
       family="streak", family_order=2),
    _b("streak_30", "One month rhythm", "Care", "Streak",
       "30 days in a row", icon="flame", tier="bronze", earnable=True,
       family="streak", family_order=3),
    _b("streak_60", "Two months steady", "Care", "Streak",
       "60 days in a row", icon="flame", tier="silver", earnable=True,
       family="streak", family_order=4),
    _b("streak_100", "Hundred-day grower", "Care", "Streak",
       "100 days in a row", icon="flame", tier="gold", earnable=True,
       family="streak", family_order=5),
    _b("streak_180", "Half a year of care", "Care", "Streak",
       "180 days in a row", icon="flame", tier="gold", earnable=True,
       family="streak", family_order=6),
    _b("streak_365", "A year of rhythm", "Care", "Streak",
       "365 days in a row", icon="flame", tier="platinum", earnable=True,
       family="streak", family_order=7),
    _b("streak_500", "The dedicated", "Care", "Streak",
       "500 days in a row", icon="flame", tier="platinum", earnable=True,
       family="streak", family_order=8),
    _b("streak_1000", "The lifer", "Care", "Streak",
       "1000 days in a row", icon="flame", tier="platinum", earnable=True,
       family="streak", family_order=9),

    # Watering — 6
    _b("watering_first", "First drink", "Care", "Watering",
       "Log your first watering", icon="droplets", earnable=True,
       family="watering", family_order=1),
    _b("watering_10", "Ten drinks", "Care", "Watering",
       "Log 10 waterings", icon="droplets", earnable=True,
       family="watering", family_order=2),
    _b("watering_50", "Fifty pours", "Care", "Watering",
       "Log 50 waterings", icon="droplets", tier="bronze", earnable=True,
       family="watering", family_order=3),
    _b("watering_100", "Century waterer", "Care", "Watering",
       "Log 100 waterings", icon="droplets", tier="silver", earnable=True,
       family="watering", family_order=4),
    _b("watering_500", "Faithful waterer", "Care", "Watering",
       "Log 500 waterings", icon="droplets", tier="gold", earnable=True,
       family="watering", family_order=5),
    _b("watering_1000", "Thousand pours", "Care", "Watering",
       "Log 1000 waterings", icon="droplets", tier="platinum", earnable=True,
       family="watering", family_order=6),

    # Fertilizing — 4
    _b("fert_first", "First feeding", "Care", "Fertilizing",
       "Log your first fertilization", icon="sparkles", earnable=True,
       family="fert", family_order=1),
    _b("fert_25", "Steady feeder", "Care", "Fertilizing",
       "Log 25 fertilizations", icon="sparkles", tier="bronze", earnable=True,
       family="fert", family_order=2),
    _b("fert_100", "Nutrition expert", "Care", "Fertilizing",
       "Log 100 fertilizations", icon="sparkles", tier="silver", earnable=True,
       family="fert", family_order=3),
    _b("fert_500", "Master fertilizer", "Care", "Fertilizing",
       "Log 500 fertilizations", icon="sparkles", tier="gold", earnable=True,
       family="fert", family_order=4),

    # Repotting — 4
    _b("repot_first", "First repot", "Care", "Repotting",
       "Repot your first plant", icon="flower-2", earnable=True,
       family="repot", family_order=1),
    _b("repot_5", "Pot-up apprentice", "Care", "Repotting",
       "Repot 5 plants", icon="flower-2", earnable=True,
       family="repot", family_order=2),
    _b("repot_25", "Pot-up expert", "Care", "Repotting",
       "Repot 25 plants", icon="flower-2", tier="silver", earnable=True,
       family="repot", family_order=3),
    _b("repot_50", "Pot-up master", "Care", "Repotting",
       "Repot 50 plants", icon="flower-2", tier="gold", earnable=True,
       family="repot", family_order=4),

    # Pruning — 3
    _b("prune_first", "First trim", "Care", "Pruning",
       "Log your first pruning", icon="scissors", earnable=True,
       family="prune", family_order=1),
    _b("prune_25", "Steady pruner", "Care", "Pruning",
       "Log 25 prunings", icon="scissors", tier="bronze", earnable=True,
       family="prune", family_order=2),
    _b("prune_100", "Sharp shears", "Care", "Pruning",
       "Log 100 prunings", icon="scissors", tier="gold", earnable=True,
       family="prune", family_order=3),

    # Misting — 3 (schema only)
    _b("mist_first", "First mist", "Care", "Misting",
       "Log your first misting", icon="cloud-rain",
       family="mist", family_order=1),
    _b("mist_50", "Mist regular", "Care", "Misting",
       "Log 50 mistings", icon="cloud-rain", tier="bronze",
       family="mist", family_order=2),
    _b("mist_200", "Humidity hero", "Care", "Misting",
       "Log 200 mistings", icon="cloud-rain", tier="silver",
       family="mist", family_order=3),

    # Propagation — 5
    _b("prop_first", "First cutting", "Care", "Propagation",
       "Log your first propagation", icon="sprout", earnable=True,
       family="prop", family_order=1),
    _b("prop_5", "Propagator", "Care", "Propagation",
       "Successfully propagate 5 plants", icon="sprout", earnable=True,
       family="prop", family_order=2),
    _b("prop_25", "Propagation expert", "Care", "Propagation",
       "Successfully propagate 25 plants", icon="sprout", tier="silver",
       earnable=True, family="prop", family_order=3),
    _b("prop_50", "Propagation master", "Care", "Propagation",
       "Successfully propagate 50 plants", icon="sprout", tier="gold",
       earnable=True, family="prop", family_order=4),
    _b("prop_100", "Propagation legend", "Care", "Propagation",
       "Successfully propagate 100 plants", icon="sprout", tier="platinum",
       earnable=True, family="prop", family_order=5),

    # Care patterns — 5 (schema only)
    _b("morning_waterer", "Early bird", "Care", "Care patterns",
       "Log 10 care actions before 9 AM", icon="sun"),
    _b("weekend_gardener", "Weekend gardener", "Care", "Care patterns",
       "10 weekend care sessions", icon="calendar"),
    _b("sunday_devotee", "Sunday ritual", "Care", "Care patterns",
       "4 consecutive Sunday care sessions", icon="calendar"),
    _b("holiday_survivor", "Holiday survivor", "Care", "Care patterns",
       "Maintain streak through 7+ day vacation", icon="palm-tree"),
    _b("comeback_kid", "Welcome back", "Care", "Care patterns",
       "Resume care after a 30+ day break", icon="rotate-ccw"),

    # Health management — 7
    _b("health_hero", "Health hero", "Care", "Health management",
       "Get 5 plants to a health score of 100", icon="heart-pulse",
       tier="bronze", earnable=True,
       family="health_hero", family_order=1),
    _b("health_hero_25", "Health virtuoso", "Care", "Health management",
       "Get 25 plants to 100", icon="heart-pulse", tier="silver",
       family="health_hero", family_order=2),
    _b("plant_rescue", "Plant rescue", "Care", "Health management",
       "Bring a red-status plant back to green", icon="hand-heart",
       earnable=True,
       family="plant_rescue", family_order=1),
    _b("plant_rescue_5", "Rescue ranger", "Care", "Health management",
       "Rescue 5 red-status plants", icon="hand-heart", tier="bronze",
       family="plant_rescue", family_order=2),
    _b("plant_rescue_25", "Rescue specialist", "Care", "Health management",
       "Rescue 25 red-status plants", icon="hand-heart", tier="silver",
       family="plant_rescue", family_order=3),
    _b("steady_hand", "Steady hand", "Care", "Health management",
       "Keep all plants green for 30 days straight", icon="check-circle"),
    _b("diagnostic_detective", "Diagnostic detective", "Care", "Health management",
       "Correctly identify 3 plant problems via Greenhouse",
       icon="search-check"),
]


# ---------------------------------------------------------------------------
# B.2 Collection category (38 badges)
# ---------------------------------------------------------------------------
_COLLECTION_BADGES: List[Dict] = [
    # Plant counts — 7
    _b("plant_first", "First plant", "Collection", "Plant counts",
       "Add your first plant", icon="leaf", earnable=True,
       family="plant_count", family_order=1),
    _b("plant_5", "Five and growing", "Collection", "Plant counts",
       "Reach 5 plants", icon="leaf", earnable=True,
       family="plant_count", family_order=2),
    _b("plant_collector_bronze", "Plant collector", "Collection", "Plant counts",
       "Reach 10 plants", icon="leaf", tier="bronze", earnable=True,
       family="plant_count", family_order=3),
    _b("plant_collector_silver", "Serious collector", "Collection", "Plant counts",
       "Reach 25 plants", icon="leaf", tier="silver", earnable=True,
       family="plant_count", family_order=4),
    _b("plant_collector_gold", "Master collector", "Collection", "Plant counts",
       "Reach 50 plants", icon="leaf", tier="gold", earnable=True,
       family="plant_count", family_order=5),
    _b("plant_collector_platinum", "Plant whisperer", "Collection", "Plant counts",
       "Reach 100 plants", icon="leaf", tier="platinum", earnable=True,
       family="plant_count", family_order=6),
    _b("plant_collector_legendary", "The grove keeper", "Collection", "Plant counts",
       "Reach 200 plants", icon="trees", tier="platinum", earnable=True,
       family="plant_count", family_order=7),

    # Bouquet counts — 6
    _b("bouquet_first", "First bouquet", "Collection", "Bouquet counts",
       "Track your first bouquet", icon="flower", earnable=True,
       family="bouquet_count", family_order=1),
    _b("bouquet_5", "Bouquet enthusiast", "Collection", "Bouquet counts",
       "Track 5 bouquets", icon="flower", earnable=True,
       family="bouquet_count", family_order=2),
    _b("bouquet_collector_bronze", "Bouquet collector", "Collection", "Bouquet counts",
       "Track 10 bouquets", icon="flower", tier="bronze", earnable=True,
       family="bouquet_count", family_order=3),
    _b("bouquet_collector_silver", "Vase virtuoso", "Collection", "Bouquet counts",
       "Track 25 bouquets", icon="flower", tier="silver", earnable=True,
       family="bouquet_count", family_order=4),
    _b("bouquet_collector_gold", "Cut flower master", "Collection", "Bouquet counts",
       "Track 50 bouquets", icon="flower", tier="gold", earnable=True,
       family="bouquet_count", family_order=5),
    _b("bouquet_collector_platinum", "Floral fixture", "Collection", "Bouquet counts",
       "Track 100 bouquets", icon="flower", tier="platinum", earnable=True,
       family="bouquet_count", family_order=6),

    # Species variety — 4
    _b("species_5", "Variety seeker", "Collection", "Species variety",
       "Grow 5 different species", icon="book-open", earnable=True,
       family="species_variety", family_order=1),
    _b("species_10", "Species explorer", "Collection", "Species variety",
       "Grow 10 different species", icon="book-open", tier="bronze",
       earnable=True, family="species_variety", family_order=2),
    _b("species_25", "Species expert", "Collection", "Species variety",
       "Grow 25 different species", icon="book-open", tier="silver",
       earnable=True, family="species_variety", family_order=3),
    _b("species_50", "Species master", "Collection", "Species variety",
       "Grow 50 different species", icon="book-open", tier="gold",
       earnable=True, family="species_variety", family_order=4),

    # Plant types — firsts (14, schema only)
    _b("first_indoor", "Indoor pioneer", "Collection", "Plant type firsts",
       "Add your first indoor plant", icon="home"),
    _b("first_outdoor", "Outdoor pioneer", "Collection", "Plant type firsts",
       "Add your first outdoor plant", icon="trees"),
    _b("first_propagation_in_collection", "Cutting carer", "Collection", "Plant type firsts",
       "Add your first propagation", icon="sprout"),
    _b("first_rare", "Rare find", "Collection", "Plant type firsts",
       "Add your first rare plant", icon="gem"),
    _b("first_native", "Native steward", "Collection", "Plant type firsts",
       "Add your first native plant", icon="map-pin"),
    _b("first_pollinator", "Pollinator friend", "Collection", "Plant type firsts",
       "Add your first pollinator-supporting plant", icon="flower-2"),
    _b("first_edible", "First harvest", "Collection", "Plant type firsts",
       "Add your first edible plant", icon="apple"),
    _b("first_herb", "Herb beginner", "Collection", "Plant type firsts",
       "Add your first herb", icon="leaf"),
    _b("first_succulent", "Succulent starter", "Collection", "Plant type firsts",
       "Add your first succulent", icon="trees"),
    _b("first_orchid", "Orchid keeper", "Collection", "Plant type firsts",
       "Add your first orchid", icon="flower"),
    _b("first_fern", "Fern friend", "Collection", "Plant type firsts",
       "Add your first fern", icon="leaf"),
    _b("first_aroid", "Aroid lover", "Collection", "Plant type firsts",
       "Add your first aroid", icon="leaf"),
    _b("first_carnivore", "Carnivore curator", "Collection", "Plant type firsts",
       "Add your first carnivorous plant", icon="leaf"),
    _b("first_bonsai", "Bonsai beginner", "Collection", "Plant type firsts",
       "Add your first bonsai", icon="trees"),

    # Special collections — 6 (schema only)
    _b("full_sun_club", "Full sun club", "Collection", "Special collections",
       "10 sun-loving plants in your collection", icon="sun"),
    _b("shade_collective", "Shade collective", "Collection", "Special collections",
       "10 low-light plants in your collection", icon="cloud"),
    _b("tropical_paradise", "Tropical paradise", "Collection", "Special collections",
       "15 tropical plants in your collection", icon="palm-tree"),
    _b("desert_dweller", "Desert dweller", "Collection", "Special collections",
       "10 cacti or succulents", icon="trees"),
    _b("pollinator_garden", "Pollinator garden", "Collection", "Special collections",
       "10 pollinator-supporting plants", icon="flower-2"),
    _b("native_garden", "Native garden", "Collection", "Special collections",
       "10 native plants", icon="map-pin"),

    # Rooms — 2 (schema only)
    _b("full_house", "Full house", "Collection", "Rooms",
       "Plants in 5+ different rooms", icon="home"),
    _b("bathroom_jungle", "Bathroom jungle", "Collection", "Rooms",
       "5+ plants in a single room", icon="trees"),
]


# ---------------------------------------------------------------------------
# B.3 Community category (28 badges)
# ---------------------------------------------------------------------------
_COMMUNITY_BADGES: List[Dict] = [
    # Posts — 6
    _b("post_first", "First share", "Community", "Posts",
       "Make your first post", icon="message-square", earnable=True,
       family="post", family_order=1),
    _b("post_10", "Regular contributor", "Community", "Posts",
       "10 posts", icon="message-square", earnable=True,
       family="post", family_order=2),
    _b("post_50", "Active voice", "Community", "Posts",
       "50 posts", icon="message-square", tier="bronze",
       family="post", family_order=3),
    _b("post_100", "Community pillar", "Community", "Posts",
       "100 posts", icon="message-square", tier="silver",
       family="post", family_order=4),
    _b("photo_post_first", "First photo shared", "Community", "Posts",
       "Share your first photo post", icon="image",
       family="photo_post", family_order=1),
    _b("photo_post_25", "Visual storyteller", "Community", "Posts",
       "25 photo posts", icon="image", tier="bronze",
       family="photo_post", family_order=2),

    # Kudos — 7
    _b("kudos_given_first", "First cheer", "Community", "Kudos",
       "Give your first kudos", icon="heart", earnable=True,
       family="kudos_given", family_order=1),
    _b("kudos_given_50", "Generous spirit", "Community", "Kudos",
       "Give 50 kudos", icon="heart", tier="bronze",
       family="kudos_given", family_order=2),
    _b("kudos_given_250", "Cheerleader", "Community", "Kudos",
       "Give 250 kudos", icon="heart", tier="silver",
       family="kudos_given", family_order=3),
    _b("kudos_received_first", "First nod", "Community", "Kudos",
       "Receive your first kudos", icon="heart", earnable=True,
       family="kudos_received", family_order=1),
    _b("kudos_received_25", "Appreciated", "Community", "Kudos",
       "Receive 25 kudos", icon="heart",
       family="kudos_received", family_order=2),
    _b("kudos_received_100", "Beloved", "Community", "Kudos",
       "Receive 100 kudos", icon="heart", tier="silver",
       family="kudos_received", family_order=3),
    _b("kudos_received_500", "Adored", "Community", "Kudos",
       "Receive 500 kudos", icon="heart", tier="gold",
       family="kudos_received", family_order=4),

    # Groves — 7
    _b("grove_joined_first", "First Grove", "Community", "Groves",
       "Join your first Grove", icon="users", earnable=True,
       family="grove_joined", family_order=1),
    _b("grove_joined_5", "Multi-Grove member", "Community", "Groves",
       "Join 5 Groves", icon="users",
       family="grove_joined", family_order=2),
    _b("grove_chat_first", "First chat", "Community", "Groves",
       "Send your first Grove chat message", icon="message-circle",
       earnable=True,
       family="grove_chat", family_order=1),
    _b("grove_chat_50", "Chatty member", "Community", "Groves",
       "Send 50 chat messages", icon="message-circle",
       earnable=True,
       family="grove_chat", family_order=2),
    _b("grove_regular", "Grove regular", "Community", "Groves",
       "Active in a Grove for 30 days", icon="users"),
    _b("grove_ambassador", "Grove ambassador", "Community", "Groves",
       "50+ posts in a single Grove", icon="users", tier="bronze"),
    _b("grove_suggester", "Friend matchmaker", "Community", "Groves",
       "Suggest a Grove that a friend joined", icon="user-plus"),

    # Swaps — 6 (verified_user is earnable, swap_first auto-awards once swap data exists)
    _b("verified_user", "Verified", "Community", "Swaps",
       "Complete user verification", icon="shield-check", earnable=True),
    _b("swap_first", "First swap", "Community", "Swaps",
       "Complete your first plant swap", icon="repeat", earnable=True,
       family="swap", family_order=1),
    _b("swap_5", "Trusted swapper", "Community", "Swaps",
       "Complete 5 swaps", icon="repeat",
       family="swap", family_order=2),
    _b("swap_25", "Swap veteran", "Community", "Swaps",
       "Complete 25 swaps", icon="repeat", tier="silver",
       family="swap", family_order=3),
    _b("seed_swap_first", "First seed swap", "Community", "Swaps",
       "Complete your first seed swap", icon="sprout",
       family="seed_swap", family_order=1),
    _b("seed_swap_10", "Seed steward", "Community", "Swaps",
       "Complete 10 seed swaps", icon="sprout", tier="bronze",
       family="seed_swap", family_order=2),
    _b("cross_country_swap", "Cross-country swap", "Community", "Swaps",
       "Complete a swap across state/region lines", icon="map"),

    # Helping — 2
    _b("helped_a_friend", "Helped a friend", "Community", "Helping",
       "Your propagation went to another user", icon="hand-heart",
       family="mentor", family_order=1),
    _b("mentor", "Mentor", "Community", "Helping",
       "5 of your propagations went to others", icon="hand-heart",
       tier="bronze", family="mentor", family_order=2),
]


# ---------------------------------------------------------------------------
# B.4 Achievement category (32 badges)
# ---------------------------------------------------------------------------
_ACHIEVEMENT_BADGES: List[Dict] = [
    # Plant lifecycle — 6
    _b("first_bloom", "First bloom", "Achievement", "Plant lifecycle",
       "One of your plants flowered", icon="flower",
       family="bloom", family_order=1),
    _b("bloom_collector", "Bloom collector", "Achievement", "Plant lifecycle",
       "5 different plants bloomed in your care", icon="flower",
       tier="bronze", family="bloom", family_order=2),
    _b("first_fruit", "First fruit", "Achievement", "Plant lifecycle",
       "One of your plants fruited", icon="apple"),
    _b("pollinator_visit", "Pollinator host", "Achievement", "Plant lifecycle",
       "A pollinator visited your plant (verified post)", icon="flower-2"),
    _b("first_cutting_taken", "Cutting taker", "Achievement", "Plant lifecycle",
       "Take your first cutting from a plant", icon="scissors"),
    _b("seed_to_maturity", "Seed to plant", "Achievement", "Plant lifecycle",
       "Grow a plant from seed to maturity", icon="sprout"),

    # Time milestones — 9
    _b("grove_1_month", "One month in", "Achievement", "Time milestones",
       "1 month with Grove", icon="calendar", earnable=True,
       family="grove_age", family_order=1),
    _b("grove_6_months", "Half a year in", "Achievement", "Time milestones",
       "6 months with Grove", icon="calendar", earnable=True,
       family="grove_age", family_order=2),
    _b("grove_1_year", "One year in", "Achievement", "Time milestones",
       "1 year with Grove", icon="calendar", tier="bronze", earnable=True,
       family="grove_age", family_order=3),
    _b("grove_2_years", "Two years in", "Achievement", "Time milestones",
       "2 years with Grove", icon="calendar", tier="silver",
       family="grove_age", family_order=4),
    _b("grove_5_years", "Five years in", "Achievement", "Time milestones",
       "5 years with Grove", icon="calendar", tier="gold",
       family="grove_age", family_order=5),
    _b("plant_alive_1y", "One year alive", "Achievement", "Time milestones",
       "Kept a single plant alive 1 year", icon="leaf",
       family="plant_alive", family_order=1),
    _b("plant_alive_2y", "Two years alive", "Achievement", "Time milestones",
       "Kept a single plant alive 2 years", icon="leaf", tier="bronze",
       family="plant_alive", family_order=2),
    _b("plant_alive_5y", "Five years alive", "Achievement", "Time milestones",
       "Kept a single plant alive 5 years", icon="leaf", tier="silver",
       family="plant_alive", family_order=3),
    _b("plant_alive_10y", "A decade alive", "Achievement", "Time milestones",
       "Kept a single plant alive 10 years", icon="leaf", tier="gold",
       family="plant_alive", family_order=4),

    # Knowledge — 8
    _b("light_reader", "Light reader", "Achievement", "Knowledge",
       "Complete the lighting tutorial", icon="sun", earnable=True),
    _b("watering_scholar", "Watering scholar", "Achievement", "Knowledge",
       "Complete the watering tutorial", icon="droplets"),
    _b("propagation_master", "Propagation master", "Achievement", "Knowledge",
       "Complete the propagation tutorial", icon="sprout"),
    _b("pest_detective", "Pest detective", "Achievement", "Knowledge",
       "Complete the pest ID tutorial", icon="bug"),
    _b("repotting_ready", "Repotting ready", "Achievement", "Knowledge",
       "Complete the repotting tutorial", icon="flower-2"),
    _b("greenhouse_browser", "Greenhouse browser", "Achievement", "Knowledge",
       "Read 25 encyclopedia entries", icon="book-open"),
    _b("citation_reader", "Citation reader", "Achievement", "Knowledge",
       "Tap through to 10 source citations", icon="book-open"),
    _b("all_tutorials", "Tutorial graduate", "Achievement", "Knowledge",
       "Complete all 5 core tutorials", icon="graduation-cap",
       tier="bronze"),

    # Care milestones — 4
    _b("successful_repot", "Repot success", "Achievement", "Care milestones",
       "Repot a plant; it survives 30 days", icon="flower-2"),
    _b("successful_propagation", "Propagation success", "Achievement", "Care milestones",
       "Propagate a plant; it survives 60 days", icon="sprout"),
    _b("holiday_mode_used", "Holiday hero", "Achievement", "Care milestones",
       "Use holiday mode successfully", icon="palm-tree"),
    _b("sitter_used", "Plant sitter", "Achievement", "Care milestones",
       "Used a plant sitter for 7+ days", icon="hand-heart"),

    # Florist Pro — 8
    _b("care_sheet_first", "First care sheet", "Achievement", "Florist Pro",
       "Generate your first client care sheet", icon="file-text",
       family="care_sheet", family_order=1),
    _b("care_sheet_10", "Care sheet creator", "Achievement", "Florist Pro",
       "Generate 10 care sheets", icon="file-text",
       family="care_sheet", family_order=2),
    _b("care_sheet_50", "Care sheet expert", "Achievement", "Florist Pro",
       "Generate 50 care sheets", icon="file-text", tier="silver",
       family="care_sheet", family_order=3),
    _b("care_sheet_100", "Care sheet master", "Achievement", "Florist Pro",
       "Generate 100 care sheets", icon="file-text", tier="gold",
       family="care_sheet", family_order=4),
    _b("qr_scan_first", "First scan", "Achievement", "Florist Pro",
       "Receive your first QR scan", icon="qr-code",
       family="qr_scan", family_order=1),
    _b("qr_scan_25", "Scan-worthy", "Achievement", "Florist Pro",
       "Receive 25 QR scans", icon="qr-code", tier="bronze",
       family="qr_scan", family_order=2),
    _b("qr_scan_500", "Trusted source", "Achievement", "Florist Pro",
       "Receive 500 QR scans", icon="qr-code", tier="gold",
       family="qr_scan", family_order=3),
    _b("sourcing_insight", "Sourcing strategist", "Achievement", "Florist Pro",
       "Apply your first sourcing insight", icon="trending-up"),
]


# ---------------------------------------------------------------------------
# B.5 Seasonal & niche category (28 badges)
# ---------------------------------------------------------------------------
_SEASONAL_NICHE_BADGES: List[Dict] = [
    # Seasonal events — 7 (schema only; admin-grantable yearly)
    _b("spring_2026", "Spring 2026", "Seasonal & niche", "Seasonal events",
       "Active during Spring 2026", icon="flower"),
    _b("summer_2026", "Summer 2026", "Seasonal & niche", "Seasonal events",
       "Active during Summer 2026", icon="sun"),
    _b("fall_2026", "Fall 2026", "Seasonal & niche", "Seasonal events",
       "Active during Fall 2026", icon="leaf"),
    _b("winter_2026", "Winter 2026", "Seasonal & niche", "Seasonal events",
       "Active during Winter 2026", icon="snowflake"),
    _b("earth_day_2026", "Earth Day 2026", "Seasonal & niche", "Seasonal events",
       "Participated in Earth Day 2026 events", icon="globe"),
    _b("pollinator_week_2026", "Pollinator Week 2026", "Seasonal & niche", "Seasonal events",
       "Joined Pollinator Week 2026", icon="flower-2"),
    _b("native_plant_month_2026", "Native Plant Month 2026", "Seasonal & niche", "Seasonal events",
       "Active during Native Plant Month 2026", icon="map-pin"),

    # Plant niches — 11
    _b("aroid_enthusiast", "Aroid enthusiast", "Seasonal & niche", "Plant niches",
       "Grow 10 aroids", icon="leaf"),
    _b("orchid_grower", "Orchid grower", "Seasonal & niche", "Plant niches",
       "Grow 5 orchids", icon="flower"),
    _b("carnivore_keeper", "Carnivore keeper", "Seasonal & niche", "Plant niches",
       "Grow 3 carnivorous plants", icon="leaf"),
    _b("cactus_collector", "Cactus collector", "Seasonal & niche", "Plant niches",
       "Grow 10 cacti", icon="trees"),
    _b("succulent_specialist", "Succulent specialist", "Seasonal & niche", "Plant niches",
       "Grow 15 succulents", icon="trees"),
    _b("fern_friend", "Fern friend", "Seasonal & niche", "Plant niches",
       "Grow 10 ferns", icon="leaf"),
    _b("air_plant_lover", "Air plant lover", "Seasonal & niche", "Plant niches",
       "Grow 10 air plants", icon="leaf"),
    _b("hoya_hunter", "Hoya hunter", "Seasonal & niche", "Plant niches",
       "Grow 5 hoyas", icon="leaf"),
    _b("philodendron_fan", "Philodendron fan", "Seasonal & niche", "Plant niches",
       "Grow 5 philodendrons", icon="leaf"),
    _b("monstera_maven", "Monstera maven", "Seasonal & niche", "Plant niches",
       "Grow 5 different monstera species/cultivars", icon="leaf"),
    _b("wedding_florist", "Wedding florist", "Seasonal & niche", "Plant niches",
       "Track 25 wedding-related arrangements (Florist Pro)", icon="heart"),

    # Aesthetics — 5
    _b("cottagecore", "Cottagecore", "Seasonal & niche", "Aesthetics",
       "Grow 5 cottage-garden plants", icon="flower"),
    _b("indoor_jungle", "Indoor jungle", "Seasonal & niche", "Aesthetics",
       "40+ tropicals indoors", icon="trees"),
    _b("wildflower_steward", "Wildflower steward", "Seasonal & niche", "Aesthetics",
       "10 native wildflowers", icon="flower-2"),
    _b("edible_garden", "Edible gardener", "Seasonal & niche", "Aesthetics",
       "5+ edible plants", icon="apple"),
    _b("herb_garden", "Herb gardener", "Seasonal & niche", "Aesthetics",
       "5+ herbs", icon="leaf"),

    # Identity & ecology — 5
    _b("verified_pro", "Verified Pro", "Seasonal & niche", "Identity & ecology",
       "Granted by Grove team — verified professional or influencer",
       icon="shield-check"),
    _b("plant_grandparent", "Plant grandparent", "Seasonal & niche", "Identity & ecology",
       "5+ of your plants now live with others", icon="users"),
    _b("conservation_conscious", "Conservation conscious", "Seasonal & niche", "Identity & ecology",
       "Replaced an invasive plant with a native", icon="leaf"),
    _b("sustainability_champion", "Sustainability champion", "Seasonal & niche", "Identity & ecology",
       "Verified local sourcing pattern (Florist Pro)", icon="trending-up"),
    _b("biodiversity_builder", "Biodiversity builder", "Seasonal & niche", "Identity & ecology",
       "15+ species across 3 ecological niches", icon="trees"),
]


# ---------------------------------------------------------------------------
# Public exports
# ---------------------------------------------------------------------------
BADGE_CATALOG: List[Dict] = (
    _CARE_BADGES + _COLLECTION_BADGES + _COMMUNITY_BADGES
    + _ACHIEVEMENT_BADGES + _SEASONAL_NICHE_BADGES
)


# Build the family map: family_slug -> ordered list of slugs (lowest tier first).
def _build_families() -> Dict[str, List[str]]:
    fams: Dict[str, List[Dict]] = {}
    for b in BADGE_CATALOG:
        fam = b.get("family")
        if not fam:
            continue
        fams.setdefault(fam, []).append(b)
    return {
        fam: [x["slug"] for x in sorted(members, key=lambda x: x.get("family_order", 0))]
        for fam, members in fams.items()
    }


BADGE_FAMILIES: Dict[str, List[str]] = _build_families()

# Reverse index: slug -> family name (or None)
SLUG_TO_FAMILY: Dict[str, str] = {
    slug: fam for fam, slugs in BADGE_FAMILIES.items() for slug in slugs
}


# Sanity-check counts at import time (helps catch typos in long edits).
# Note: Supplement v2 § B.6 summary table claims 170 total, but the actual
# badge listings in B.1-B.5 ladder out to 177. We trust the listings as the
# source of truth and treat the header "~170" as approximate.
assert len(BADGE_CATALOG) == 177, f"BADGE_CATALOG must contain 177 entries, found {len(BADGE_CATALOG)}"
_seen_slugs = set()
for _b_doc in BADGE_CATALOG:
    if _b_doc["slug"] in _seen_slugs:
        raise RuntimeError(f"Duplicate badge slug: {_b_doc['slug']}")
    _seen_slugs.add(_b_doc["slug"])
assert "verified_user" in EARNABLE_SLUGS
assert len(EARNABLE_SLUGS) == 63, f"EARNABLE_SLUGS should contain 63 slugs, found {len(EARNABLE_SLUGS)}"
