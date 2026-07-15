"""
Fetch botanical illustrations from the Biodiversity Heritage Library (BHL) API
for all 25 curated Grove species and store them in MongoDB.

Usage:
    python import_bhl_illustrations.py

Requires MONGO_URL env var (reads from .env).
"""

import os
import json
import time
import asyncio
import logging
import urllib.parse
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import urllib.request

load_dotenv(Path(__file__).parent / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

BHL_API_KEY = "1b99b60b-4ae3-4bcc-9680-919389ec74a2"
BHL_BASE = "https://www.biodiversitylibrary.org/api3"
MAX_ILLUSTRATIONS_PER_SPECIES = 5  # Keep it reasonable

# Species to search — use genus-level names for cultivars since BHL won't have them
SPECIES_SEARCH_MAP = {
    "Monstera deliciosa": "Monstera deliciosa",
    "Epipremnum aureum": "Epipremnum aureum",
    "Dracaena trifasciata": "Dracaena trifasciata",
    "Chlorophytum comosum": "Chlorophytum comosum",
    "Aloe vera": "Aloe vera",
    "Spathiphyllum wallisii": "Spathiphyllum wallisii",
    "Philodendron erubescens 'Pink Princess'": "Philodendron erubescens",
    "Anthurium warocqueanum": "Anthurium warocqueanum",
    "Zamioculcas zamiifolia": "Zamioculcas zamiifolia",
    "Ficus elastica": "Ficus elastica",
    "Ficus lyrata": "Ficus lyrata",
    "Goeppertia orbifolia": "Goeppertia orbifolia",
    "Strelitzia reginae": "Strelitzia reginae",
    "Rudbeckia hirta": "Rudbeckia hirta",
    "Echinacea purpurea": "Echinacea purpurea",
    "Hedera helix": "Hedera helix",
    "Rosa 'Juliet' (Auspoly)": "Rosa",
    "Eucalyptus polyanthemos": "Eucalyptus polyanthemos",
    "Eustoma grandiflorum": "Eustoma grandiflorum",
    "Anemone coronaria": "Anemone coronaria",
    "Hoya carnosa": "Hoya carnosa",
    "Curio rowleyanus": "Curio rowleyanus",
    "Nephrolepis exaltata": "Nephrolepis exaltata",
    "Crassula ovata": "Crassula ovata",
    "Dahlia 'Café au Lait'": "Dahlia",
}

# Fallback: if exact species returns nothing, try genus only
def genus_of(name: str) -> str:
    return name.split()[0]


def bhl_request(op: str, params: dict) -> dict:
    """Synchronous BHL API request."""
    params["op"] = op
    params["apikey"] = BHL_API_KEY
    params["format"] = "json"
    url = f"{BHL_BASE}?{urllib.parse.urlencode(params)}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Grove-App/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            if not raw:
                return {"Status": "ok", "Result": []}
            return json.loads(raw)
    except Exception as e:
        logger.error(f"BHL request failed: {op} {params} — {e}")
        return {"Status": "error", "Result": []}


def fetch_illustrations(search_name: str) -> list:
    """Fetch illustration page URLs for a species from BHL."""
    data = bhl_request("GetNameMetadata", {"name": search_name})
    results = data.get("Result", [])
    if not results:
        return []

    illustrations = []
    for result in results:
        if not result:
            continue
        for title in result.get("Titles", []):
            for item in title.get("Items", []):
                for page in item.get("Pages", []):
                    page_types = [t.get("PageTypeName") for t in page.get("PageTypes", [])]
                    if "Illustration" in page_types:
                        illustrations.append({
                            "page_id": page.get("PageID"),
                            "source_title": title.get("ShortTitle", ""),
                            "publication_date": title.get("PublicationDate", ""),
                            "thumbnail_url": page.get("ThumbnailUrl", ""),
                            "full_image_url": page.get("FullSizeImageUrl", ""),
                            "page_url": page.get("PageUrl", ""),
                            "source": "biodiversitylibrary.org",
                        })
                    if len(illustrations) >= MAX_ILLUSTRATIONS_PER_SPECIES:
                        return illustrations[:MAX_ILLUSTRATIONS_PER_SPECIES]
    return illustrations[:MAX_ILLUSTRATIONS_PER_SPECIES]


async def main():
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        logger.error("MONGO_URL not set")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get("DB_NAME", "grove_db")]

    total_found = 0
    total_species = 0

    for latin_name, search_name in SPECIES_SEARCH_MAP.items():
        logger.info(f"Fetching illustrations for {latin_name} (searching: {search_name})...")

        illustrations = fetch_illustrations(search_name)

        # Fallback to genus-only search if no results
        if not illustrations and " " in search_name:
            genus = genus_of(search_name)
            logger.info(f"  No results for '{search_name}', trying genus '{genus}'...")
            illustrations = fetch_illustrations(genus)

        if not illustrations:
            logger.warning(f"  No illustrations found for {latin_name}")
            time.sleep(0.5)
            continue

        logger.info(f"  Found {len(illustrations)} illustrations")
        total_found += len(illustrations)
        total_species += 1

        # Update the species document in MongoDB
        result = await db.species.update_one(
            {"latin_name": latin_name},
            {"$set": {
                "bhl_illustrations": illustrations,
                "bhl_illustration_count": len(illustrations),
                "bhl_primary_illustration": illustrations[0]["full_image_url"] if illustrations else None,
                "bhl_primary_thumbnail": illustrations[0]["thumbnail_url"] if illustrations else None,
            }}
        )
        if result.matched_count == 0:
            logger.warning(f"  Species '{latin_name}' not found in DB — skipping update")
        else:
            logger.info(f"  Updated DB for {latin_name}")

        # Be polite to the API
        time.sleep(1)

    logger.info(f"\nDone! Found {total_found} illustrations across {total_species} species.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
