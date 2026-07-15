"""
Clean BHL illustrations — keep only proper botanical plates.
Removes catalog pages, magazine text, photos, ads, etc.
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# Page IDs that passed visual review (clean botanical illustration plates only)
KEEP_BY_SPECIES = {
    # Peace Lily: Addisonia plate 738 + Spathiphyllum commutatum plate
    "spathiphyllum-wallisii": {4468818, 665537},
    # Philodendron Pink Princess: Flore des serres plate of P. erubescens
    "philodendron-erubescens": {27763529},
    # Coneflower: Addisonia plate of Echinacea purpurea
    "echinacea-purpurea": {4506038},
    # Garden Rose 'Juliet': Addisonia plates of Rosa Silver Moon + Rosa rugosa
    "rosa-juliet-ausjameson": {28890217, 4511902},
}


async def main():
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        print("ERROR: MONGO_URL not set")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get("DB_NAME", "grove_db")]

    species_list = await db.species.find({}).to_list(100)
    print(f"Found {len(species_list)} species\n")

    for s in species_list:
        slug = s.get("slug", "")
        name = s.get("common_name", slug)
        illos = s.get("bhl_illustrations", [])
        if not illos:
            continue

        keep_ids = KEEP_BY_SPECIES.get(slug, set())

        if not keep_ids:
            # No passing images — clear all BHL fields
            await db.species.update_one(
                {"id": s["id"]},
                {"$set": {
                    "bhl_illustrations": [],
                    "bhl_primary_illustration": None,
                    "bhl_primary_thumbnail": None,
                    "bhl_illustration_count": 0,
                }},
            )
            print(f"  {name}: CLEARED all {len(illos)} illustrations (none passed)")
        else:
            # Filter to only keep passing page IDs
            kept = [i for i in illos if i.get("page_id") in keep_ids]
            primary = kept[0] if kept else None
            await db.species.update_one(
                {"id": s["id"]},
                {"$set": {
                    "bhl_illustrations": kept,
                    "bhl_primary_illustration": primary.get("full_image_url") if primary else None,
                    "bhl_primary_thumbnail": primary.get("thumbnail_url") if primary else None,
                    "bhl_illustration_count": len(kept),
                }},
            )
            print(f"  {name}: KEPT {len(kept)} of {len(illos)} illustrations")

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
