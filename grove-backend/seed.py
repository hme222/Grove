import uuid
from datetime import datetime, timezone
from curated_species import CURATED_SPECIES
from curated_companions import COMPANIONS
from curated_guilds import CURATED_GUILDS
from badge_catalog import BADGE_CATALOG, BADGE_SEED_VERSION

SPECIES_SEED_VERSION = "14b2-curated-25-companions-guilds"

SPECIES_DATA = [
    {"common_name": "Monstera Deliciosa", "latin_name": "Monstera deliciosa", "family": "Araceae", "native_habitat": "Central America", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Let top inch of soil dry between waterings. Appreciates humidity."},
    {"common_name": "Snake Plant", "latin_name": "Dracaena trifasciata", "family": "Asparagaceae", "native_habitat": "West Africa", "default_watering_days": 14, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Tolerates low light. Very drought tolerant. Water when soil is completely dry."},
    {"common_name": "Pothos", "latin_name": "Epipremnum aureum", "family": "Araceae", "native_habitat": "Southeast Asia", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Adaptable to various light conditions. Water when top inch of soil is dry."},
    {"common_name": "Fiddle Leaf Fig", "latin_name": "Ficus lyrata", "family": "Moraceae", "native_habitat": "West Africa", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Consistent watering schedule. Sensitive to changes."},
    {"common_name": "Peace Lily", "latin_name": "Spathiphyllum wallisii", "family": "Araceae", "native_habitat": "Central America", "default_watering_days": 5, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Low to medium light. Keep soil consistently moist. Wilts when thirsty."},
    {"common_name": "ZZ Plant", "latin_name": "Zamioculcas zamiifolia", "family": "Araceae", "native_habitat": "East Africa", "default_watering_days": 14, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Tolerates low light and neglect. Water when soil is completely dry."},
    {"common_name": "Rubber Plant", "latin_name": "Ficus elastica", "family": "Moraceae", "native_habitat": "Southeast Asia", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Water when top few inches of soil are dry."},
    {"common_name": "Boston Fern", "latin_name": "Nephrolepis exaltata", "family": "Nephrolepidaceae", "native_habitat": "Americas", "default_watering_days": 3, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Indirect light. Keep soil consistently moist. High humidity preferred."},
    {"common_name": "Aloe Vera", "latin_name": "Aloe barbadensis", "family": "Asphodelaceae", "native_habitat": "Arabian Peninsula", "default_watering_days": 14, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright direct light. Water deeply but infrequently. Well-draining soil."},
    {"common_name": "Spider Plant", "latin_name": "Chlorophytum comosum", "family": "Asparagaceae", "native_habitat": "Southern Africa", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Water when top inch is dry. Easy to propagate."},
    {"common_name": "Philodendron", "latin_name": "Philodendron hederaceum", "family": "Araceae", "native_habitat": "Central America", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Medium indirect light. Water when top inch of soil is dry."},
    {"common_name": "Calathea", "latin_name": "Calathea orbifolia", "family": "Marantaceae", "native_habitat": "South America", "default_watering_days": 5, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Medium indirect light. Keep soil moist. High humidity. Use filtered water."},
    {"common_name": "String of Pearls", "latin_name": "Senecio rowleyanus", "family": "Asteraceae", "native_habitat": "South Africa", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "toxic", "care_summary": "Bright indirect light. Allow soil to dry between waterings. Trailing habit."},
    {"common_name": "Bird of Paradise", "latin_name": "Strelitzia reginae", "family": "Strelitziaceae", "native_habitat": "South Africa", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright direct to indirect light. Water when top inch is dry. Large leaves."},
    {"common_name": "Chinese Money Plant", "latin_name": "Pilea peperomioides", "family": "Urticaceae", "native_habitat": "China", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Allow soil to dry slightly. Easy to share pups."},
    {"common_name": "Jade Plant", "latin_name": "Crassula ovata", "family": "Crassulaceae", "native_habitat": "South Africa", "default_watering_days": 14, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright light. Water thoroughly when soil is completely dry. Succulent."},
    {"common_name": "Prayer Plant", "latin_name": "Maranta leuconeura", "family": "Marantaceae", "native_habitat": "Brazil", "default_watering_days": 5, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Medium indirect light. Keep soil moist. Leaves fold up at night."},
    {"common_name": "English Ivy", "latin_name": "Hedera helix", "family": "Araliaceae", "native_habitat": "Europe", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "toxic", "care_summary": "Bright to medium indirect light. Keep soil evenly moist. Trailing vine."},
    {"common_name": "Orchid", "latin_name": "Phalaenopsis spp.", "family": "Orchidaceae", "native_habitat": "Southeast Asia", "default_watering_days": 7, "default_grow_medium": "other", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Water when roots turn silvery. Special orchid mix."},
    {"common_name": "Croton", "latin_name": "Codiaeum variegatum", "family": "Euphorbiaceae", "native_habitat": "Southeast Asia", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright light for best color. Keep soil moist. High humidity."},
    {"common_name": "Dracaena", "latin_name": "Dracaena marginata", "family": "Asparagaceae", "native_habitat": "Madagascar", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "toxic", "care_summary": "Low to bright indirect light. Water when top half of soil is dry."},
    {"common_name": "Hoya", "latin_name": "Hoya carnosa", "family": "Apocynaceae", "native_habitat": "Asia", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Allow soil to dry between waterings. Waxy leaves."},
    {"common_name": "Alocasia", "latin_name": "Alocasia amazonica", "family": "Araceae", "native_habitat": "Southeast Asia", "default_watering_days": 5, "default_grow_medium": "soil", "toxicity": "toxic", "care_summary": "Bright indirect light. Keep soil moist but not soggy. High humidity."},
    {"common_name": "Tradescantia", "latin_name": "Tradescantia zebrina", "family": "Commelinaceae", "native_habitat": "Mexico", "default_watering_days": 5, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Keep soil moist. Easy to propagate from cuttings."},
    {"common_name": "Peperomia", "latin_name": "Peperomia obtusifolia", "family": "Piperaceae", "native_habitat": "South America", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Medium to bright indirect light. Allow top inch to dry. Compact growth."},
    {"common_name": "Succulent Mix", "latin_name": "Various Crassulaceae", "family": "Crassulaceae", "native_habitat": "Various arid regions", "default_watering_days": 14, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright direct light. Water sparingly. Well-draining soil essential."},
    {"common_name": "Cactus", "latin_name": "Various Cactaceae", "family": "Cactaceae", "native_habitat": "Americas", "default_watering_days": 21, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Full sun. Water very sparingly. Well-draining cactus mix."},
    {"common_name": "Anthurium", "latin_name": "Anthurium andraeanum", "family": "Araceae", "native_habitat": "South America", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Keep soil moist. High humidity for best blooms."},
    {"common_name": "Begonia", "latin_name": "Begonia rex", "family": "Begoniaceae", "native_habitat": "Southeast Asia", "default_watering_days": 5, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Medium indirect light. Keep soil moist. Avoid getting leaves wet."},
    {"common_name": "Swiss Cheese Plant", "latin_name": "Monstera adansonii", "family": "Araceae", "native_habitat": "Central America", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Water when top inch is dry. Trailing or climbing."},
    {"common_name": "Lavender", "latin_name": "Lavandula angustifolia", "family": "Lamiaceae", "native_habitat": "Mediterranean", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Full sun. Well-draining soil. Drought tolerant once established."},
    {"common_name": "Rose", "latin_name": "Rosa spp.", "family": "Rosaceae", "native_habitat": "Asia", "default_watering_days": 3, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Full sun. Regular deep watering. Prune for shape and health."},
    {"common_name": "Dieffenbachia", "latin_name": "Dieffenbachia seguine", "family": "Araceae", "native_habitat": "Central America", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "toxic", "care_summary": "Medium indirect light. Keep soil moist. Toxic if ingested."},
    {"common_name": "Parlor Palm", "latin_name": "Chamaedorea elegans", "family": "Arecaceae", "native_habitat": "Mexico", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Low to medium indirect light. Keep soil moist. Pet-friendly."},
    {"common_name": "Majesty Palm", "latin_name": "Ravenea rivularis", "family": "Arecaceae", "native_habitat": "Madagascar", "default_watering_days": 5, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Keep soil consistently moist. High humidity."},
    {"common_name": "Air Plant", "latin_name": "Tillandsia spp.", "family": "Bromeliaceae", "native_habitat": "Central America", "default_watering_days": 7, "default_grow_medium": "other", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Soak weekly for 20 min. No soil needed."},
    {"common_name": "Ficus Benjamina", "latin_name": "Ficus benjamina", "family": "Moraceae", "native_habitat": "Southeast Asia", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Water when top inch is dry. Dislikes being moved."},
    {"common_name": "Schefflera", "latin_name": "Schefflera arboricola", "family": "Araliaceae", "native_habitat": "Taiwan", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Water when top inch is dry. Umbrella-shaped leaves."},
    {"common_name": "Cast Iron Plant", "latin_name": "Aspidistra elatior", "family": "Asparagaceae", "native_habitat": "Japan", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Low light tolerant. Nearly indestructible. Water when soil is dry."},
    {"common_name": "Satin Pothos", "latin_name": "Scindapsus pictus", "family": "Araceae", "native_habitat": "Southeast Asia", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Medium indirect light. Allow soil to dry slightly. Silver variegation."},
    {"common_name": "String of Hearts", "latin_name": "Ceropegia woodii", "family": "Apocynaceae", "native_habitat": "South Africa", "default_watering_days": 10, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Allow soil to dry between waterings. Trailing succulent vine."},
    {"common_name": "Nerve Plant", "latin_name": "Fittonia albivenis", "family": "Acanthaceae", "native_habitat": "South America", "default_watering_days": 3, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Low to medium light. Keep soil consistently moist. Dramatic wilter."},
    {"common_name": "Norfolk Island Pine", "latin_name": "Araucaria heterophylla", "family": "Araucariaceae", "native_habitat": "Norfolk Island", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Keep soil evenly moist. High humidity."},
    {"common_name": "Wandering Jew", "latin_name": "Tradescantia fluminensis", "family": "Commelinaceae", "native_habitat": "South America", "default_watering_days": 5, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright indirect light. Keep soil moist. Fast growing and easy to propagate."},
    {"common_name": "Yucca", "latin_name": "Yucca elephantipes", "family": "Asparagaceae", "native_habitat": "Central America", "default_watering_days": 14, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Bright direct to indirect light. Drought tolerant. Water when soil is dry."},
    {"common_name": "Christmas Cactus", "latin_name": "Schlumbergera bridgesii", "family": "Cactaceae", "native_habitat": "Brazil", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Keep soil lightly moist. Blooms in winter."},
    {"common_name": "Staghorn Fern", "latin_name": "Platycerium bifurcatum", "family": "Polypodiaceae", "native_habitat": "Australia", "default_watering_days": 7, "default_grow_medium": "other", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Mount on board. Soak or mist regularly."},
    {"common_name": "Aglaonema", "latin_name": "Aglaonema commutatum", "family": "Araceae", "native_habitat": "Southeast Asia", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "mild", "care_summary": "Low to medium light. Water when top inch is dry. Colorful foliage."},
    {"common_name": "Money Tree", "latin_name": "Pachira aquatica", "family": "Malvaceae", "native_habitat": "Central America", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Water when top inch is dry. Braided trunk."},
    {"common_name": "Bromeliad", "latin_name": "Guzmania lingulata", "family": "Bromeliaceae", "native_habitat": "Central America", "default_watering_days": 7, "default_grow_medium": "soil", "toxicity": "non-toxic", "care_summary": "Bright indirect light. Keep central cup filled with water. Epiphytic."},
]

CHALLENGE_TEMPLATES_DATA = [
    {"slug": "streak-7", "title": "7-Day Streak", "description": "Log care every day for 7 days straight", "goal_type": "streak_days", "target_value": 7, "duration_days": 7},
    {"slug": "streak-30", "title": "30-Day Dedication", "description": "Maintain a 30-day care streak", "goal_type": "streak_days", "target_value": 30, "duration_days": 30},
    {"slug": "grow-10", "title": "Grow to 10", "description": "Build a collection of 10 plants", "goal_type": "plant_count", "target_value": 10, "duration_days": None},
    {"slug": "propagate-5", "title": "Propagation Pro", "description": "Successfully propagate 5 plants this season", "goal_type": "care_logs_count", "target_value": 5, "duration_days": 90},
    {"slug": "care-100", "title": "Care Champion", "description": "Log 100 care actions", "goal_type": "care_logs_count", "target_value": 100, "duration_days": None},
    {"slug": "bouquet-3", "title": "Bouquet Season", "description": "Track 3 bouquets this month", "goal_type": "custom", "target_value": 3, "duration_days": 30},
    {"slug": "fiddle-90", "title": "Fiddle Leaf 90-Day", "description": "Keep a Fiddle Leaf Fig alive for 90 days", "goal_type": "custom", "target_value": 90, "duration_days": 90},
]

BADGES_DATA = [
    {"slug": "first_plant", "name": "First Leaf", "description": "Added your first plant", "icon_type": "leaf"},
    {"slug": "plant_parent_10", "name": "Plant Parent", "description": "Growing 10 plants", "icon_type": "leaf"},
    {"slug": "green_thumb_25", "name": "Green Thumb", "description": "Growing 25 plants", "icon_type": "leaf"},
    {"slug": "jungle_50", "name": "Urban Jungle", "description": "Growing 50 plants", "icon_type": "crown"},
    {"slug": "streak_7", "name": "Week Warrior", "description": "7-day care streak", "icon_type": "flame"},
    {"slug": "streak_30", "name": "Monthly Maven", "description": "30-day care streak", "icon_type": "flame"},
    {"slug": "streak_100", "name": "Centurion", "description": "100-day care streak", "icon_type": "flame"},
    {"slug": "streak_365", "name": "Year-Round Grower", "description": "365-day care streak", "icon_type": "crown"},
    {"slug": "first_prop", "name": "First Cutting", "description": "Propagated your first plant", "icon_type": "leaf"},
    {"slug": "prop_master", "name": "Propagation Master", "description": "10 successful propagations", "icon_type": "leaf"},
    {"slug": "first_swap", "name": "First Swap", "description": "Completed your first plant swap", "icon_type": "heart"},
    {"slug": "swap_5", "name": "Swap Champion", "description": "5 successful swaps", "icon_type": "heart"},
    {"slug": "first_bouquet", "name": "Bloom Begins", "description": "Tracked your first bouquet", "icon_type": "flower"},
    {"slug": "bouquet_10", "name": "Bouquet Collector", "description": "10 bouquets tracked", "icon_type": "flower"},
    {"slug": "care_log_100", "name": "Dedicated Carer", "description": "100 care actions logged", "icon_type": "heart"},
    {"slug": "care_log_500", "name": "Care Expert", "description": "500 care actions logged", "icon_type": "crown"},
    {"slug": "photo_10", "name": "Plant Photographer", "description": "10 plant photos shared", "icon_type": "leaf"},
    {"slug": "grove_creator", "name": "Grove Founder", "description": "Created your first grove", "icon_type": "leaf"},
    {"slug": "survivor", "name": "Steady Grower", "description": "Consistently thriving collection with 10+ plants", "icon_type": "crown"},
    {"slug": "diversity", "name": "Diverse Collection", "description": "10 different species in collection", "icon_type": "leaf"},
]

CHALLENGES_DATA = [
    {"title": "7-Day Streak Starter", "description": "Log care every day for 7 days", "type": "personal", "target_metric": "streak_days", "target_value": 7, "badge_awarded": "streak_7"},
    {"title": "30-Day Dedication", "description": "Maintain a 30-day care streak", "type": "personal", "target_metric": "streak_days", "target_value": 30, "badge_awarded": "streak_30"},
    {"title": "Green Thumb Journey", "description": "Grow your collection to 10 plants", "type": "personal", "target_metric": "species_logged", "target_value": 10, "badge_awarded": "plant_parent_10"},
    {"title": "Propagation Pioneer", "description": "Successfully propagate 3 plants", "type": "personal", "target_metric": "propagations", "target_value": 3, "badge_awarded": "first_prop"},
    {"title": "Spring Growth Sprint", "description": "Log 50 care actions this spring", "type": "seasonal", "target_metric": "care_logs", "target_value": 50},
    {"title": "Summer Hydration", "description": "Water all your plants on schedule for 2 weeks", "type": "seasonal", "target_metric": "care_logs", "target_value": 28},
    {"title": "Grove Team Streak", "description": "Every grove member logs care today", "type": "grove", "target_metric": "streak_days", "target_value": 1},
    {"title": "Community Photo Day", "description": "Share 5 plant photos this week", "type": "grove", "target_metric": "care_logs", "target_value": 5},
    {"title": "Bouquet Season", "description": "Track 3 bouquets this month", "type": "seasonal", "target_metric": "bouquets", "target_value": 3, "badge_awarded": "first_bouquet"},
    {"title": "Diversity Explorer", "description": "Add 5 different species to your collection", "type": "personal", "target_metric": "species_logged", "target_value": 5},
]

ROOMS = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Balcony", "Patio", "Greenhouse", "Hallway", "Dining Room"]

async def seed_database(db):
    """Seed the database with initial data if empty."""
    # Phase 14B.1 — replace the legacy 50+ species with the user's 25-species
    # curated catalog. We version the seed so re-runs only fire once the
    # catalog actually changes.
    seed_meta = await db.app_meta.find_one({"key": "species_seed_version"})
    current_version = (seed_meta or {}).get("value")
    if current_version != SPECIES_SEED_VERSION:
        # Wipe species + clear stale species_id links on plants so the new
        # catalog becomes the source of truth.
        await db.species.delete_many({})
        await db.plants.update_many({}, {"$unset": {"species_id": ""}})
        species_docs = []
        for s in CURATED_SPECIES:
            doc = {
                "id": str(uuid.uuid4()),
                **s,
                # Phase 14B.2 — companion list (slugs only here; the API
                # hydrates these with the linked species' name + id at read time
                # so the wire shape gives the frontend everything it needs).
                "companions": COMPANIONS.get(s["slug"], []),
                "encyclopedia_entry": (
                    f"{s['common_name']} ({s['latin_name']}) belongs to the {s['family']} family, "
                    f"native to {s.get('native_range') or s.get('native_habitat', 'unknown')}. "
                    f"{s['care_summary']}"
                ),
                "photo_library_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            species_docs.append(doc)
        if species_docs:
            await db.species.insert_many(species_docs)
            try:
                await db.species.create_index("latin_name", unique=True)
                await db.species.create_index("slug", unique=True)
                await db.species.create_index([("common_name", "text"), ("latin_name", "text")])
            except Exception:
                pass
        await db.app_meta.update_one(
            {"key": "species_seed_version"},
            {"$set": {"key": "species_seed_version", "value": SPECIES_SEED_VERSION}},
            upsert=True,
        )
        print(f"Seeded {len(species_docs)} curated species (v{SPECIES_SEED_VERSION})")
        # Phase 14B.2 — themed guilds. Resolve species slugs → ids before
        # inserting so the runtime never has to translate.
        slug_to_id = {s["slug"]: s["id"] for s in species_docs}
        await db.guilds.delete_many({})
        guild_docs = []
        for g in CURATED_GUILDS:
            species_ids = [slug_to_id[slug] for slug in g["species_slugs"] if slug in slug_to_id]
            if not species_ids:
                continue
            guild_docs.append({
                "id": str(uuid.uuid4()),
                "slug": g["slug"],
                "name": g["name"],
                "subtitle": g.get("subtitle", ""),
                "description": g["description"],
                "design_notes": g.get("design_notes", ""),
                "species_ids": species_ids,
                "species_slugs": g["species_slugs"],
                "accent_color": g.get("accent_color", "#3B6D11"),
                "tags": g.get("tags", []),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        if guild_docs:
            await db.guilds.insert_many(guild_docs)
            try:
                await db.guilds.create_index("slug", unique=True)
            except Exception:
                pass
            print(f"Seeded {len(guild_docs)} themed guilds")
    else:
        # Ensure indexes exist regardless
        species_count = await db.species.count_documents({})
        if species_count == 0:
            print("WARNING: species seed version current but collection empty — re-seeding")
            await db.app_meta.delete_one({"key": "species_seed_version"})
            return await seed_database(db)

    # Phase 14C.3.b — versioned 170-badge catalog seed.
    # When BADGE_SEED_VERSION changes we wipe db.badges and re-seed from
    # badge_catalog.py. user_badges entries are kept as-is (their badge_slug
    # is the stable foreign key); the seed re-creates db.badges docs with
    # fresh ids and we re-link the user_badges.badge_id by slug.
    badge_meta = await db.app_meta.find_one({"key": "badge_seed_version"})
    current_badge_version = (badge_meta or {}).get("value")
    if current_badge_version != BADGE_SEED_VERSION:
        print(f"Reseeding badges: {current_badge_version} -> {BADGE_SEED_VERSION}")
        # 1) Wipe existing badges
        await db.badges.delete_many({})
        # 2) Insert all 170 from the catalog
        badges_docs = []
        slug_to_new_id = {}
        for b in BADGE_CATALOG:
            new_id = str(uuid.uuid4())
            slug_to_new_id[b["slug"]] = new_id
            badges_docs.append({"id": new_id, **b,
                                "created_at": datetime.now(timezone.utc).isoformat()})
        if badges_docs:
            await db.badges.insert_many(badges_docs)
        # 3) Ensure unique slug index
        try:
            await db.badges.create_index("slug", unique=True)
        except Exception:
            pass
        # 4) Re-link existing user_badges.badge_id by slug so historic
        #    awards don't lose their hydration target.
        cursor = db.user_badges.find({})
        async for ub in cursor:
            slug = ub.get("badge_slug")
            new_id = slug_to_new_id.get(slug)
            if new_id and ub.get("badge_id") != new_id:
                await db.user_badges.update_one(
                    {"id": ub["id"]}, {"$set": {"badge_id": new_id}}
                )
        # 5) Record the new seed version
        await db.app_meta.update_one(
            {"key": "badge_seed_version"},
            {"$set": {"key": "badge_seed_version", "value": BADGE_SEED_VERSION}},
            upsert=True,
        )
        print(f"Seeded {len(badges_docs)} badges from catalog")
    else:
        # Safety net: ensure collection isn't empty even if version matches
        existing_count = await db.badges.count_documents({})
        if existing_count == 0:
            await db.app_meta.delete_one({"key": "badge_seed_version"})
            return await seed_database(db)

    challenges_count = await db.challenges.count_documents({})
    if challenges_count == 0:
        challenge_docs = []
        for c in CHALLENGES_DATA:
            doc = {
                "id": str(uuid.uuid4()),
                **c,
                "is_active": True,
                "start_date": None,
                "end_date": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            challenge_docs.append(doc)
        await db.challenges.insert_many(challenge_docs)
        print(f"Seeded {len(challenge_docs)} challenges")
    
    # Seed challenge templates
    templates_count = await db.challenge_templates.count_documents({})
    if templates_count == 0:
        template_docs = []
        for t in CHALLENGE_TEMPLATES_DATA:
            doc = {
                "id": str(uuid.uuid4()),
                **t,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            template_docs.append(doc)
        await db.challenge_templates.insert_many(template_docs)
        await db.challenge_templates.create_index("slug", unique=True)
        print(f"Seeded {len(template_docs)} challenge templates")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.plants.create_index("user_id")
    await db.plants.create_index([("user_id", 1), ("status", 1)])
    await db.care_logs.create_index([("plant_id", 1), ("logged_at", -1)])
    await db.care_logs.create_index("user_id")
    await db.streaks.create_index("user_id", unique=True)
    await db.goals.create_index("user_id")
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.portfolio_items.create_index("user_id")
    print("Database indexes created")
