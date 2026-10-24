"""
Import Wikipedia lead images for all species missing primary images.
Uses the Wikipedia REST API (free, no key needed).
Images are CC/Public Domain from Wikimedia Commons.
"""
import asyncio
import os
import time
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import aiohttp

load_dotenv()

# Map species slug -> Wikipedia article title
SPECIES_WIKI_MAP = {
    "monstera-deliciosa": "Monstera_deliciosa",
    "epipremnum-aureum": "Epipremnum_aureum",
    "dracaena-trifasciata": "Dracaena_trifasciata",
    "chlorophytum-comosum": "Chlorophytum_comosum",
    "aloe-vera": "Aloe_vera",
    "spathiphyllum-wallisii": "Spathiphyllum_wallisii",
    "philodendron-pink-princess": "Philodendron_erubescens",
    "anthurium-warocqueanum": "Anthurium_warocqueanum",
    "zamioculcas-zamiifolia": "Zamioculcas_zamiifolia",
    "ficus-elastica": "Ficus_elastica",
    "ficus-lyrata": "Ficus_lyrata",
    "goeppertia-orbifolia": "Goeppertia_orbifolia",
    "strelitzia-reginae": "Strelitzia_reginae",
    "rudbeckia-hirta": "Rudbeckia_hirta",
    "echinacea-purpurea": "Echinacea_purpurea",
    "hedera-helix": "Hedera_helix",
    "rosa-juliet-ausjameson": "Rosa_Juliet",
    "eucalyptus-polyanthemos": "Eucalyptus_cinerea",
    "eustoma-grandiflorum": "Eustoma_grandiflorum",
    "anemone-coronaria": "Anemone_coronaria",
    "hoya-carnosa": "Hoya_carnosa",
    "curio-rowleyanus": "Curio_rowleyanus",
    "nephrolepis-exaltata": "Nephrolepis_exaltata",
    "crassula-ovata": "Crassula_ovata",
    "dahlia-pinnata": "Dahlia_pinnata",
    "dahlia-cafe-au-lait": "Dahlia_pinnata",
    "phalaenopsis": "Phalaenopsis",
    "chamaedorea-elegans": "Chamaedorea_elegans",
    "aglaonema-modestum": "Aglaonema_modestum",
    "dracaena-fragrans": "Dracaena_fragrans",
    "schlumbergera-buckleyi": "Schlumbergera_%C3%97_buckleyi",
    "haworthiopsis-fasciata": "Haworthiopsis_fasciata",
    "echeveria-elegans": "Echeveria_elegans",
    "sedum-morganianum": "Sedum_morganianum",
    "beaucarnea-recurvata": "Beaucarnea_recurvata",
    "pachira-aquatica": "Pachira_aquatica",
    "aspidistra-elatior": "Aspidistra_elatior",
    "peperomia-obtusifolia": "Peperomia_obtusifolia",
    "dracaena-marginata": "Dracaena_marginata",
    "kalanchoe-blossfeldiana": "Kalanchoe_blossfeldiana",
    "opuntia-microdasys": "Opuntia_microdasys",
}

# Fallback article names if the primary doesn't have an image
FALLBACKS = {
    "rosa-juliet-ausjameson": ["Garden_roses", "Rosa_(genus)"],
    "hoya-carnosa": ["Hoya_carnosa", "Hoya_(plant)"],
    "curio-rowleyanus": ["Curio_rowleyanus", "Senecio_rowleyanus"],
    "eucalyptus-polyanthemos": ["Eucalyptus_cinerea", "Eucalyptus_polyanthemos", "Eucalyptus"],
    "dahlia-cafe-au-lait": ["Dahlia_pinnata", "Dahlia"],
    "spathiphyllum-wallisii": ["Spathiphyllum"],
    "schlumbergera-buckleyi": ["Schlumbergera"],
    "haworthiopsis-fasciata": ["Haworthia_fasciata", "Haworthiopsis"],
}

WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"
HEADERS = {
    "User-Agent": "GroveApp/1.0 (grove.app; contact@grove.app) python-aiohttp",
    "Accept": "application/json",
}


async def fetch_wiki_image(session, article_title):
    """Fetch the lead image from a Wikipedia article."""
    url = WIKI_API.format(article_title)
    try:
        async with session.get(url, headers=HEADERS) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            original = data.get("originalimage", {})
            thumbnail = data.get("thumbnail", {})
            if not original.get("source"):
                return None
            return {
                "original_url": original["source"],
                "thumbnail_url": thumbnail.get("source", ""),
                "width": original.get("width", 0),
                "height": original.get("height", 0),
                "source": "wikipedia",
                "article": article_title,
                "license": "CC/Public Domain (Wikimedia Commons)",
            }
    except Exception as e:
        print(f"    Error fetching {article_title}: {e}")
        return None


async def main():
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        print("ERROR: MONGO_URL not set")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get("DB_NAME", "grove_db")]

    species_list = await db.species.find({}).to_list(100)
    print(f"Found {len(species_list)} species\n")

    async with aiohttp.ClientSession() as session:
        for s in species_list:
            slug = s.get("slug", "")
            name = s.get("common_name", slug)

            # Skip species that already have a BHL primary image
            if s.get("bhl_primary_thumbnail"):
                print(f"  {name}: SKIP (already has BHL illustration)")
                continue

            wiki_title = SPECIES_WIKI_MAP.get(slug)
            if not wiki_title:
                print(f"  {name}: SKIP (no Wikipedia mapping for slug '{slug}')")
                continue

            # Try primary article
            img = await fetch_wiki_image(session, wiki_title)

            # Try fallbacks if primary failed
            if not img and slug in FALLBACKS:
                for fallback in FALLBACKS[slug]:
                    img = await fetch_wiki_image(session, fallback)
                    if img:
                        break

            if not img:
                print(f"  {name}: MISS (no image found on Wikipedia)")
                continue

            # Store as wiki_image fields on the species document
            await db.species.update_one(
                {"id": s["id"]},
                {"$set": {
                    "wiki_image": img["original_url"],
                    "wiki_thumbnail": img["thumbnail_url"],
                    "wiki_image_source": img["source"],
                    "wiki_image_article": img["article"],
                    "wiki_image_license": img["license"],
                }},
            )
            print(f"  {name}: OK ({img['original_url'][:80]}...)")

            # Rate limit: be polite to Wikipedia
            await asyncio.sleep(0.5)

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
