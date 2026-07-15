"""
Search Wikimedia Commons for botanical illustrations for all species.
Downloads candidates for visual review.
"""
import asyncio
import os
import json
from dotenv import load_dotenv
import aiohttp

load_dotenv()

HEADERS = {"User-Agent": "GroveApp/1.0 (grove.app; contact@grove.app)"}

# Species that need botanical illustrations (slug -> search terms)
SPECIES_SEARCH = {
    "monstera-deliciosa": ["Monstera deliciosa botanical illustration", "Monstera deliciosa drawing"],
    "epipremnum-aureum": ["Epipremnum aureum botanical", "Pothos aureus illustration", "Scindapsus aureus botanical"],
    "dracaena-trifasciata": ["Sansevieria trifasciata botanical illustration", "Sansevieria botanical plate"],
    "chlorophytum-comosum": ["Chlorophytum comosum botanical illustration", "Chlorophytum comosum drawing"],
    "aloe-vera": ["Aloe vera botanical illustration plate", "Aloe vera vintage illustration"],
    "anthurium-warocqueanum": ["Anthurium botanical illustration", "Anthurium warocqueanum"],
    "zamioculcas-zamiifolia": ["Zamioculcas zamiifolia botanical", "Zamioculcas illustration"],
    "ficus-elastica": ["Ficus elastica botanical illustration", "Ficus elastica drawing plate"],
    "ficus-lyrata": ["Ficus lyrata botanical illustration", "Ficus lyrata drawing"],
    "goeppertia-orbifolia": ["Calathea orbifolia botanical", "Goeppertia botanical illustration", "Calathea botanical plate"],
    "strelitzia-reginae": ["Strelitzia reginae botanical illustration plate"],
    "rudbeckia-hirta": ["Rudbeckia hirta botanical illustration plate"],
    "hedera-helix": ["Hedera helix botanical illustration plate"],
    "eucalyptus-polyanthemos": ["Eucalyptus botanical illustration plate", "Eucalyptus cinerea botanical"],
    "eustoma-grandiflorum": ["Eustoma grandiflorum botanical", "Lisianthus botanical illustration", "Eustoma illustration"],
    "anemone-coronaria": ["Anemone coronaria botanical illustration plate"],
    "hoya-carnosa": ["Hoya carnosa botanical illustration", "Hoya botanical plate"],
    "curio-rowleyanus": ["Senecio rowleyanus botanical", "Curio rowleyanus illustration", "Senecio botanical plate"],
    "nephrolepis-exaltata": ["Nephrolepis exaltata botanical illustration", "Boston fern botanical plate"],
    "crassula-ovata": ["Crassula ovata botanical illustration", "Crassula botanical plate"],
    "dahlia-cafe-au-lait": ["Dahlia botanical illustration plate", "Dahlia pinnata botanical"],
}

COMMONS_API = "https://commons.wikimedia.org/w/api.php"


async def search_commons(session, query, limit=5):
    """Search Wikimedia Commons for images."""
    params = {
        "action": "query",
        "generator": "search",
        "gsrnamespace": "6",  # File namespace
        "gsrsearch": query,
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size",
        "iiurlwidth": "500",
        "format": "json",
    }
    try:
        async with session.get(COMMONS_API, params=params, headers=HEADERS) as resp:
            if resp.status != 200:
                return []
            data = await resp.json()
            pages = data.get("query", {}).get("pages", {})
            results = []
            for pid, page in sorted(pages.items(), key=lambda x: x[1].get("index", 99)):
                info = page.get("imageinfo", [{}])[0]
                meta = info.get("extmetadata", {})
                results.append({
                    "title": page.get("title", ""),
                    "thumb_url": info.get("thumburl", ""),
                    "full_url": info.get("url", ""),
                    "width": info.get("width", 0),
                    "height": info.get("height", 0),
                    "license": meta.get("LicenseShortName", {}).get("value", ""),
                    "description": meta.get("ImageDescription", {}).get("value", "")[:200],
                })
            return results
    except Exception as e:
        print(f"  Error: {e}")
        return []


async def main():
    output = {}

    async with aiohttp.ClientSession() as session:
        for slug, queries in SPECIES_SEARCH.items():
            print(f"\n=== {slug} ===")
            all_results = []
            seen_urls = set()

            for q in queries:
                results = await search_commons(session, q, limit=5)
                for r in results:
                    if r["full_url"] not in seen_urls:
                        seen_urls.add(r["full_url"])
                        all_results.append(r)
                await asyncio.sleep(0.3)

            # Filter: prefer images with "botanical", "plate", "illustration" in title/description
            # and that are public domain or CC
            for r in all_results[:8]:
                print(f"  {r['title']}")
                print(f"    License: {r['license']}")
                print(f"    Thumb: {r['thumb_url'][:100]}")

            output[slug] = all_results[:8]

    # Save results for review
    with open("/tmp/bhl_check/commons_candidates.json", "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n\nSaved {sum(len(v) for v in output.values())} candidates to /tmp/bhl_check/commons_candidates.json")


if __name__ == "__main__":
    asyncio.run(main())
