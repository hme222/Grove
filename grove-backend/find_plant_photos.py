"""
Find free-to-use photos on Wikimedia Commons for the plants in the seeded test
accounts, download previews, and build contact-sheet PNGs for visual review.
Nothing is written to the database.

Usage:
    python find_plant_photos.py                 # every plant name
    python find_plant_photos.py "Hoya kerrii"   # just these

Output (grove/tmp/plant_photo_candidates/):
    sheet-<n>.png      labeled contact sheets, candidates numbered 1..N per plant
    candidates.json    file title, thumbnail URL, size, license and author per candidate
"""
import asyncio
import html
import io
import json
import re
import sys
from pathlib import Path

import aiohttp
from PIL import Image, ImageDraw

HEADERS = {"User-Agent": "GroveApp/1.0 (grove.app; contact@grove.app)"}
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
OUT_DIR = Path(__file__).resolve().parent.parent / "tmp" / "plant_photo_candidates"

THUMB_WIDTH = 960  # Commons only serves standard widths (500, 960, 1280, ...)
MIN_WIDTH, MIN_HEIGHT = 1500, 1000
PER_PLANT = 4
ALLOWED_LICENSES = ("cc0", "public domain", "cc by", "cc-by", "pd")
SKIP_TITLE = re.compile(
    r"herbarium|illustration|drawing|plate|map|stamp|diagram|painting|engraving|"
    r"botanical magazine|pressed|seed|fruit market|leaf litter|\.svg|\.tif|\.png|\.gif|"
    r"bride|groom|woman|women|man |girl|boy|people|portrait|couple|wearing|ceremony|crowd",
    re.I,
)

# Name used in seed_testing.py -> Commons search term
PLANTS = {
    "Aloe Vera": "Aloe vera",
    "Peace Lily": "Spathiphyllum wallisii",
    "Pothos": "Epipremnum aureum",
    "Rubber Plant": "Ficus elastica",
    "Snake Plant": "Dracaena trifasciata",
    "Spider Plant": "Chlorophytum comosum",
    "Alocasia zebrina": "Alocasia zebrina",
    "Anthurium clarinervium": "Anthurium clarinervium",
    "Begonia maculata": "Begonia maculata",
    "Calathea ornata": "Calathea ornata",
    "Dracaena marginata": "Dracaena marginata",
    "Fern (Asplenium)": "Asplenium nidus",
    "Fiddle Leaf Fig": "Ficus lyrata",
    "Hoya carnosa": "Hoya carnosa",
    "Hoya kerrii": "Hoya kerrii",
    "Maranta leuconeura": "Maranta leuconeura",
    "Monstera Thai Constellation": "Monstera deliciosa variegata",
    "Monstera deliciosa": "Monstera deliciosa",
    "Peperomia argyreia": "Peperomia argyreia",
    "Peperomia obtusifolia": "Peperomia obtusifolia",
    "Philodendron gloriosum": "Philodendron gloriosum",
    "Philodendron micans": "Philodendron hederaceum micans",
    "Pilea peperomioides": "Pilea peperomioides",
    "Rhaphidophora tetrasperma": "Rhaphidophora tetrasperma",
    "Scindapsus pictus": "Scindapsus pictus",
    "Syngonium podophyllum": "Syngonium podophyllum",
    "Tradescantia zebrina": "Tradescantia zebrina",
    "Eucalyptus": "Eucalyptus cinerea",
    "Lavender": "Lavandula angustifolia",
    "Olive tree": "Olea europaea",
    "Rose bush": "Rosa garden bush flowers",
    "Succulent": "Echeveria elegans",
    # Seeded posts, bouquets and florist portfolio pieces (see seed_photos.py SCENES)
    "Lisianthus": "Eustoma grandiflorum",
    "Anthurium warocqueanum": "Anthurium warocqueanum",
    "Bouquet: gift": "flower bouquet gift",
    "Bouquet: birthday": "birthday bouquet flowers",
    "Bouquet: wedding": "wedding bouquet flowers",
    "Bouquet: corporate": "flower arrangement lobby",
    "Bouquet: anniversary": "red roses bouquet",
    "Portfolio: wedding arch": "wedding flower arch",
    "Portfolio: minimal arrangement": "minimalist flower arrangement vase",
    "Portfolio: tropical arrangement": "tropical flower arrangement",
}


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


async def search(session, term):
    params = {
        "action": "query", "generator": "search", "gsrnamespace": "6",
        "gsrsearch": f"{term} filetype:bitmap", "gsrlimit": "30",
        "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime",
        "iiurlwidth": str(THUMB_WIDTH), "format": "json",
    }
    async with session.get(COMMONS_API, params=params, headers=HEADERS) as resp:
        data = await resp.json(content_type=None)
    pages = sorted((data.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    out = []
    for p in pages:
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        title = p.get("title", "")
        if info.get("mime") != "image/jpeg" or SKIP_TITLE.search(title):
            continue
        if info.get("width", 0) < MIN_WIDTH or info.get("height", 0) < MIN_HEIGHT:
            continue
        if not any(lic.lower().startswith(a) for a in ALLOWED_LICENSES):
            continue
        out.append({
            "title": title,
            "thumb_url": info.get("thumburl", ""),
            "width": info["width"], "height": info["height"],
            "license": lic,
            "author": strip_tags(meta.get("Artist", {}).get("value", ""))[:80],
            "page_url": info.get("descriptionurl", ""),
        })
        if len(out) >= PER_PLANT:
            break
    return out


async def fetch(session, url):
    try:
        async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            if resp.status != 200:
                return None
            return Image.open(io.BytesIO(await resp.read())).convert("RGB")
    except Exception:  # noqa: BLE001 - a missing preview shouldn't stop the run
        return None


async def main():
    names = sys.argv[1:] or list(PLANTS)
    unknown = [n for n in names if n not in PLANTS]
    if unknown:
        sys.exit(f"Unknown plant(s): {', '.join(unknown)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results, rows = {}, []
    async with aiohttp.ClientSession() as session:
        for name in names:
            cands = await search(session, PLANTS[name])
            for c in cands:
                c["image"] = await fetch(session, c["thumb_url"])
            cands = [c for c in cands if c["image"]]
            print(f"{name:<30} {len(cands)} candidates")
            results[name] = [{k: v for k, v in c.items() if k != "image"} for c in cands]
            rows.append((name, cands))
            await asyncio.sleep(0.3)

    tile_w, tile_h, label_h = 240, 240, 18
    per_sheet = 8
    for n in range(0, len(rows), per_sheet):
        chunk = rows[n:n + per_sheet]
        sheet = Image.new("RGB", (PER_PLANT * tile_w, len(chunk) * (tile_h + label_h)), "white")
        draw = ImageDraw.Draw(sheet)
        for r, (name, cands) in enumerate(chunk):
            y = r * (tile_h + label_h)
            draw.text((4, y + 3), name, fill="black")
            for i, c in enumerate(cands):
                im = c["image"].copy()
                im.thumbnail((tile_w - 4, tile_h - 4))
                x = i * tile_w
                sheet.paste(im, (x + 2, y + label_h))
                draw.rectangle((x + 2, y + label_h, x + 20, y + label_h + 14), fill="black")
                draw.text((x + 6, y + label_h + 1), str(i + 1), fill="white")
        sheet.save(OUT_DIR / f"sheet-{n // per_sheet + 1}.png")

    (OUT_DIR / "candidates.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nSheets and candidates.json -> {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
