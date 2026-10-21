"""
Audit the botanical illustration currently shown for each species, score it, and
optionally clear the weakest ones.

Read-only by default. The species page already falls back to the next source
(BHL plate -> Wikipedia photo), so clearing a weak illustration is safe.

Usage:
    python audit_illustrations.py                      # report only
    python audit_illustrations.py --threshold 70       # flag anything scoring below 70 (default 60)
    python audit_illustrations.py --apply              # clear the flagged ones

--apply first writes the values it removes to
tmp/illustration_audit/removed-<timestamp>.json so they can be restored.
"""
import argparse
import asyncio
import io
import json
import os
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

import aiohttp
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from illustration_quality import analyze

load_dotenv(Path(__file__).parent / ".env")

HEADERS = {"User-Agent": "GroveApp/1.0 (grove.app; contact@grove.app)"}
OUT_DIR = Path(__file__).resolve().parent.parent / "tmp" / "illustration_audit"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"

COMMONS_FIELDS = [
    "botanical_illustration", "botanical_illustration_thumb",
    "botanical_illustration_title", "botanical_illustration_license",
    "botanical_illustration_source",
]
BHL_RESET = {
    "bhl_illustrations": [], "bhl_primary_illustration": None,
    "bhl_primary_thumbnail": None, "bhl_illustration_count": 0,
}


# Problems the pixel heuristic can't see (it can't tell a photo from a plate), found by
# looking at every current image on 2026-10-21. Keep this list up to date when you re-review.
MANUAL_FLAGS = {
    "ficus-lyrata": "photograph with text overlays, not an illustration",
    "anthurium-warocqueanum": "photograph, not an illustration",
    "eucalyptus-polyanthemos": "black-and-white photo of a tree beside a house",
    "eustoma-grandiflorum": "thick black scan border around the drawing",
    "monstera-deliciosa": "dark, murky page scan",
}


def current_image(s):
    """The image the species page shows first, mirroring SpeciesDetailPage.js."""
    if s.get("botanical_illustration"):
        return "commons", s["botanical_illustration"], s.get("botanical_illustration_thumb")
    if s.get("bhl_primary_illustration"):
        return "bhl", s["bhl_primary_illustration"], s.get("bhl_primary_thumbnail")
    return None, None, None


def wide_thumb(full_url, width=960):
    """Commons /thumb/ URL at a standard width, so the scorer sees more than 500px."""
    if "/commons/" not in full_url or "/thumb/" in full_url:
        return full_url
    base, rest = full_url.split("/commons/", 1)
    fname = rest.rsplit("/", 1)[-1]
    ext = fname.rsplit(".", 1)[-1].lower()
    suffix = ".jpg" if ext in ("tif", "tiff") else ""
    if ext == "svg":
        suffix = ".png"
    return f"{base}/commons/thumb/{rest}/{width}px-{fname}{suffix}"


async def commons_size(session, full_url):
    """Original pixel size of a Commons file, or None."""
    fname = urllib.parse.unquote(full_url.rsplit("/", 1)[-1])
    params = {"action": "query", "titles": f"File:{fname}", "prop": "imageinfo", "iiprop": "size", "format": "json"}
    try:
        async with session.get(COMMONS_API, params=params, headers=HEADERS) as resp:
            data = await resp.json(content_type=None)
        page = next(iter(data["query"]["pages"].values()))
        info = page["imageinfo"][0]
        return info["width"], info["height"]
    except Exception:  # noqa: BLE001
        return None


async def score_species(session, s):
    kind, full, thumb = current_image(s)
    if not kind:
        return {"slug": s["slug"], "kind": None, "score": None, "flags": ["no illustration"]}
    src_size = await commons_size(session, full) if kind == "commons" else None
    # Commons only serves standard thumbnail widths (500, 960, ...) and rejects ones wider
    # than the original, both with HTTP 400.
    width = 960 if src_size and src_size[0] >= 960 else 500
    fetch_url = wide_thumb(full, width) if kind == "commons" else full
    try:
        async with session.get(fetch_url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=90)) as resp:
            if resp.status != 200:
                return {"slug": s["slug"], "kind": kind, "url": full, "score": 0, "flags": [f"image unreachable (HTTP {resp.status})"]}
            raw = await resp.read()
        result = analyze(raw, source_size=src_size)
    except Exception as e:  # noqa: BLE001
        return {"slug": s["slug"], "kind": kind, "url": full, "score": 0, "flags": [f"image unreadable ({e.__class__.__name__})"]}
    return {"slug": s["slug"], "kind": kind, "url": full, **result}


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=int, default=60, help="flag scores below this (default 60)")
    ap.add_argument("--apply", action="store_true", help="clear the flagged illustrations in the database")
    args = ap.parse_args()

    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ.get("DB_NAME", "grove_db")]
    species = await db.species.find({}).to_list(200)

    async with aiohttp.ClientSession() as session:
        results = [await score_species(session, s) for s in species]

    for r in results:
        if r["slug"] in MANUAL_FLAGS and r["score"] is not None:
            r["score"] = min(r["score"], 40)
            r["flags"] = r["flags"] + [f"manual review: {MANUAL_FLAGS[r['slug']]}"]

    results.sort(key=lambda r: (r["score"] is None, r["score"] if r["score"] is not None else 0))
    print(f"{'score':>5}  {'slug':<28} {'from':<8} issues")
    for r in results:
        score = "-" if r["score"] is None else r["score"]
        mark = "  <-- weak" if r["score"] is not None and r["score"] < args.threshold else ""
        print(f"{score:>5}  {r['slug']:<28} {r['kind'] or '':<8} {', '.join(r['flags']) or 'ok'}{mark}")

    weak = [r for r in results if r["score"] is not None and r["score"] < args.threshold]
    missing = [r for r in results if r["score"] is None]
    print(f"\n{len(weak)} below {args.threshold}, {len(missing)} with no illustration, {len(results) - len(weak) - len(missing)} passing.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "latest-report.json").write_text(json.dumps(results, indent=2), encoding="utf-8")

    if not args.apply:
        if weak:
            print("Dry run: nothing changed. Re-run with --apply to clear the weak ones.")
        return
    if not weak:
        print("Nothing to clear.")
        return

    by_slug = {s["slug"]: s for s in species}
    backup = {}
    for r in weak:
        s = by_slug[r["slug"]]
        fields = COMMONS_FIELDS if r["kind"] == "commons" else list(BHL_RESET)
        backup[r["slug"]] = {f: s.get(f) for f in fields}
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_path = OUT_DIR / f"removed-{stamp}.json"
    backup_path.write_text(json.dumps(backup, indent=2, default=str), encoding="utf-8")

    for r in weak:
        s = by_slug[r["slug"]]
        update = {"$unset": {f: "" for f in COMMONS_FIELDS}} if r["kind"] == "commons" else {"$set": BHL_RESET}
        await db.species.update_one({"id": s["id"]}, update)
        print(f"  cleared {r['kind']} illustration for {r['slug']}")
    print(f"\nBackup of removed values: {backup_path}")


if __name__ == "__main__":
    asyncio.run(main())
