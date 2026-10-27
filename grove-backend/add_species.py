"""Add curated species that are missing from the database, with a Wikipedia image each.

Additive and safe to re-run: it never deletes anything and never touches a species that already
exists, so their photos and illustrations stay. The full seed in seed.py wipes and rebuilds the
catalog when its version changes; use this script to grow the catalog without that.

Usage (reads MONGO_URL and DB_NAME from .env):
    python3 add_species.py
"""
import asyncio
import os

import aiohttp
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from curated_species import CURATED_SPECIES
from import_wiki_images import FALLBACKS, SPECIES_WIKI_MAP, fetch_wiki_image
from seed import build_species_doc

load_dotenv()


async def main():
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        print("ERROR: MONGO_URL not set")
        return
    db = AsyncIOMotorClient(mongo_url)[os.environ.get("DB_NAME", "grove_db")]

    have_slug = {d["slug"] async for d in db.species.find({}, {"slug": 1})}
    have_latin = {d["latin_name"] async for d in db.species.find({}, {"latin_name": 1})}
    missing = [s for s in CURATED_SPECIES if s["slug"] not in have_slug and s["latin_name"] not in have_latin]
    if not missing:
        print("Nothing to add: every curated species is already in the database.")
        return

    async with aiohttp.ClientSession() as session:
        for s in missing:
            doc = build_species_doc(s)
            title = SPECIES_WIKI_MAP.get(s["slug"])
            img = await fetch_wiki_image(session, title) if title else None
            for fallback in FALLBACKS.get(s["slug"], []) if not img else []:
                img = await fetch_wiki_image(session, fallback)
                if img:
                    break
            if img:
                doc.update({
                    "wiki_image": img["original_url"],
                    "wiki_thumbnail": img["thumbnail_url"],
                    "wiki_image_source": img["source"],
                    "wiki_image_article": img["article"],
                    "wiki_image_license": img["license"],
                })
            await db.species.insert_one(doc)
            print(f"  added {s['common_name']} ({s['slug']}) {'with image' if img else 'without image'}")
            await asyncio.sleep(0.5)  # be polite to Wikipedia
    print(f"Added {len(missing)} species.")


if __name__ == "__main__":
    asyncio.run(main())
