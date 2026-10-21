"""
Search The Met and Smithsonian Open Access (both CC0) for botanical illustrations
of each Grove species, download candidates, score them, and write a contact sheet
for visual review. Nothing is written to the database.

Usage:
    python find_museum_illustrations.py                  # all species
    python find_museum_illustrations.py monstera-deliciosa hoya-carnosa

Env:
    SI_API_KEY   free key from https://api.data.gov/signup (falls back to
                 DEMO_KEY, which allows only ~30 requests per hour)

Output (grove/tmp/museum_candidates/):
    index.html         contact sheet, best score first within each species
    candidates.json    machine-readable candidates for import
    <slug>/*.jpg       preview images (max 1000px)
"""
import asyncio
import html
import io
import json
import os
import re
import sys
from pathlib import Path

import aiohttp
from PIL import Image

from illustration_quality import analyze

HEADERS = {"User-Agent": "GroveApp/1.0 (grove.app; contact@grove.app)"}
OUT_DIR = Path(__file__).resolve().parent.parent / "tmp" / "museum_candidates"
PER_SOURCE = 5
PREVIEW_WIDTH = 1000

# v1/search was retired 2026-10-01; v1.1 is Elastic-backed (fuzzy), paginated by offset/limit.
MET_SEARCH = "https://collectionapi.metmuseum.org/public/collection/v1.1/search"
MET_OBJECT = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{}"
SI_SEARCH = "https://api.si.edu/openaccess/api/v1.0/search"

# slug -> (search names, words one of which must appear in the record's title/tags).
# Synonyms and older names are included because museums catalogue under the name
# in use when the plate was made.
SPECIES = {
    "monstera-deliciosa": (["Monstera deliciosa", "Monstera"], ["monstera"]),
    "epipremnum-aureum": (["Epipremnum aureum", "Scindapsus aureus", "Pothos aureus"], ["epipremnum", "scindapsus", "pothos"]),
    "dracaena-trifasciata": (["Sansevieria trifasciata", "Sansevieria"], ["sansevieria", "dracaena"]),
    "chlorophytum-comosum": (["Chlorophytum comosum", "Chlorophytum"], ["chlorophytum"]),
    "aloe-vera": (["Aloe vera", "Aloe barbadensis", "Aloe"], ["aloe"]),
    "spathiphyllum-wallisii": (["Spathiphyllum wallisii", "Spathiphyllum"], ["spathiphyllum"]),
    "philodendron-pink-princess": (["Philodendron erubescens", "Philodendron"], ["philodendron"]),
    "anthurium-warocqueanum": (["Anthurium warocqueanum", "Anthurium"], ["anthurium"]),
    "zamioculcas-zamiifolia": (["Zamioculcas zamiifolia", "Zamioculcas"], ["zamioculcas"]),
    "ficus-elastica": (["Ficus elastica"], ["ficus elastica"]),
    "ficus-lyrata": (["Ficus lyrata", "Ficus pandurata"], ["ficus lyrata", "ficus pandurata"]),
    "goeppertia-orbifolia": (["Calathea orbifolia", "Goeppertia", "Calathea"], ["calathea", "goeppertia"]),
    "strelitzia-reginae": (["Strelitzia reginae", "Strelitzia"], ["strelitzia"]),
    "rudbeckia-hirta": (["Rudbeckia hirta", "Rudbeckia"], ["rudbeckia"]),
    "hedera-helix": (["Hedera helix", "Hedera"], ["hedera"]),
    "eucalyptus-polyanthemos": (["Eucalyptus polyanthemos", "Eucalyptus"], ["eucalyptus"]),
    "eustoma-grandiflorum": (["Eustoma grandiflorum", "Lisianthus", "Eustoma"], ["eustoma", "lisianthus"]),
    "anemone-coronaria": (["Anemone coronaria", "Anemone"], ["anemone"]),
    "hoya-carnosa": (["Hoya carnosa", "Hoya"], ["hoya"]),
    "curio-rowleyanus": (["Senecio rowleyanus", "Curio rowleyanus"], ["rowleyanus"]),
    "nephrolepis-exaltata": (["Nephrolepis exaltata", "Nephrolepis"], ["nephrolepis"]),
    "crassula-ovata": (["Crassula ovata", "Crassula portulacea", "Crassula"], ["crassula"]),
    "dahlia-cafe-au-lait": (["Dahlia pinnata", "Dahlia"], ["dahlia"]),
    "echinacea-purpurea": (["Echinacea purpurea", "Rudbeckia purpurea", "Echinacea"], ["echinacea", "purpurea"]),
    "rosa-juliet-ausjameson": (["Rosa"], ["rose", "roses", "rosa rugosa", "rosa gallica"]),
}


# Smithsonian units that hold illustrations (Libraries, Cooper Hewitt, American Art).
# Excluded on purpose: NMNH botany, whose plant records are herbarium specimen sheets.
SI_ILLUSTRATION_UNITS = {"SIL", "CHNDM", "SAAM"}


def relevant(text, words):
    """Whole-word match, so "rosa" doesn't match "Salvator Rosa" less than a word would."""
    return any(re.search(rf"\b{re.escape(w)}\b", text, re.I) for w in words)


async def get_json(session, url, **params):
    async with session.get(url, params=params, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=30)) as resp:
        if resp.status == 429:
            raise RuntimeError("rate limited (429)")
        if resp.status != 200:
            print(f"    HTTP {resp.status} from {url.split('?')[0].rsplit('/', 2)[-2]}/{url.rsplit('/', 1)[-1][:30]}")
            return None
        return await resp.json(content_type=None)


async def search_met(session, names, words):
    """Met open-access (isPublicDomain) objects with images, filtered to the species."""
    found = {}
    for name in names:
        data = await get_json(session, MET_SEARCH, q=name, hasImages="true", isPublicDomain="true", limit=40)
        for oid in (data or {}).get("objectIDs") or []:
            found.setdefault(oid, name)
        if len(found) >= PER_SOURCE * 4:
            break
    out = []
    for oid in list(found)[:60]:
        await asyncio.sleep(0.1)  # stay well under the Met's request limit
        obj = await get_json(session, MET_OBJECT.format(oid))
        if not obj or not obj.get("isPublicDomain") or not obj.get("primaryImage"):
            continue
        tags = " ".join(t.get("term", "") for t in obj.get("tags") or [])
        if not relevant(f"{obj.get('title', '')} {tags}", words):
            continue
        out.append({
            "source": "met",
            "id": str(oid),
            "title": obj.get("title", ""),
            "artist": obj.get("artistDisplayName", ""),
            "date": obj.get("objectDate", ""),
            "license": "CC0 (The Met Open Access)",
            "image_url": obj["primaryImage"],
            "page_url": obj.get("objectURL", ""),
        })
        if len(out) >= PER_SOURCE:
            break
    return out


async def search_si(session, names, words, api_key):
    """Smithsonian Open Access illustration records (library/art units) with a CC0 image."""
    out, seen = [], set()
    for name in names[:1]:  # one search per species keeps DEMO_KEY under its hourly quota
        data = await get_json(
            session, SI_SEARCH,
            q=f'"{name}" AND online_media_type:"Images"', rows=100, api_key=api_key,
        )
        for row in (data or {}).get("response", {}).get("rows", []):
            content = row.get("content", {})
            desc = content.get("descriptiveNonRepeating", {})
            title = (desc.get("title") or {}).get("content", "")
            media = (desc.get("online_media") or {}).get("media") or []
            cc0 = [m for m in media if (m.get("usage") or {}).get("access") == "CC0" and m.get("type") == "Images"]
            if desc.get("unit_code") not in SI_ILLUSTRATION_UNITS:
                continue
            if not cc0 or row["id"] in seen or not relevant(title, words):
                continue
            seen.add(row["id"])
            url = cc0[0].get("content", "")
            if "ids.si.edu" in url and "max=" not in url:
                url += ("&" if "?" in url else "?") + "max=1600"
            out.append({
                "source": "smithsonian",
                "id": row["id"],
                "title": title,
                "artist": "",
                "date": "",
                "license": "CC0 (Smithsonian Open Access)",
                "image_url": url,
                "page_url": desc.get("record_link", ""),
            })
            if len(out) >= PER_SOURCE:
                return out
    return out


async def fetch_and_score(session, cand, slug):
    """Download, save a 1000px preview, attach quality metrics. Returns False on failure."""
    try:
        async with session.get(cand["image_url"], headers=HEADERS, timeout=aiohttp.ClientTimeout(total=90)) as resp:
            if resp.status != 200:
                return False
            raw = await resp.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:  # noqa: BLE001 - one bad download shouldn't stop the run
        print(f"    download failed ({cand['id']}): {e}")
        return False
    src_size = img.size
    if img.width > PREVIEW_WIDTH:
        img = img.resize((PREVIEW_WIDTH, int(img.height * PREVIEW_WIDTH / img.width)), Image.LANCZOS)
    folder = OUT_DIR / slug
    folder.mkdir(parents=True, exist_ok=True)
    fname = f"{cand['source']}-{re.sub(r'[^A-Za-z0-9_-]', '_', cand['id'])}.jpg"
    img.save(folder / fname, quality=88)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    cand.update(analyze(buf.getvalue(), source_size=src_size))
    cand["preview"] = f"{slug}/{fname}"
    return True


def write_sheet(results):
    rows = []
    for slug, cands in results.items():
        cells = []
        for c in cands:
            flags = ", ".join(c["flags"]) or "none"
            tone = "good" if c["score"] >= 80 else "ok" if c["score"] >= 60 else "weak"
            cells.append(
                f'<figure class="{tone}"><img src="{html.escape(c["preview"])}" loading="lazy">'
                f'<figcaption><b>{c["score"]}</b> · {c["width"]}×{c["height"]} · {html.escape(c["source"])}<br>'
                f'{html.escape(c["title"][:80])}<br><small>flags: {html.escape(flags)}</small><br>'
                f'<a href="{html.escape(c["page_url"])}">record</a> · <code>{html.escape(c["source"])}:{html.escape(c["id"])}</code>'
                f'</figcaption></figure>'
            )
        body = "".join(cells) or "<p>No candidates found.</p>"
        rows.append(f"<h2>{html.escape(slug)}</h2><div class='row'>{body}</div>")
    page = (
        "<!doctype html><meta charset='utf-8'><title>Museum candidates</title>"
        "<style>body{font:14px system-ui;margin:24px;background:#faf8f3}"
        ".row{display:flex;gap:16px;overflow-x:auto;padding-bottom:12px}"
        "figure{margin:0;flex:0 0 280px}img{width:280px;height:340px;object-fit:contain;background:#fff;border:3px solid #ccc}"
        ".good img{border-color:#4a8f4a}.ok img{border-color:#d4a62a}.weak img{border-color:#c0504d}"
        "figcaption{font-size:12px;margin-top:6px}</style>"
        "<h1>Museum candidates (CC0)</h1><p>Green ≥80, amber ≥60, red below. "
        "Pick by eye; the score only screens out obvious problems.</p>" + "".join(rows)
    )
    (OUT_DIR / "index.html").write_text(page, encoding="utf-8")


async def main():
    slugs = sys.argv[1:] or list(SPECIES)
    unknown = [s for s in slugs if s not in SPECIES]
    if unknown:
        sys.exit(f"Unknown slug(s): {', '.join(unknown)}")

    api_key = os.environ.get("SI_API_KEY", "DEMO_KEY")
    if api_key == "DEMO_KEY":
        print("SI_API_KEY not set: using DEMO_KEY (~30 requests/hour). Get a free key at https://api.data.gov/signup\n")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = {}
    si_ok = True
    async with aiohttp.ClientSession() as session:
        for slug in slugs:
            names, words = SPECIES[slug]
            print(f"=== {slug}")
            cands = []
            try:
                cands += await search_met(session, names, words)
            except Exception as e:  # noqa: BLE001
                print(f"  Met search failed: {e}")
            if si_ok:
                try:
                    cands += await search_si(session, names, words, api_key)
                except Exception as e:  # noqa: BLE001
                    print(f"  Smithsonian search failed: {e} - skipping Smithsonian for the rest of this run")
                    si_ok = False
            scored = [c for c in cands if await fetch_and_score(session, c, slug)]
            scored.sort(key=lambda c: c["score"], reverse=True)
            results[slug] = scored
            for c in scored:
                print(f"  {c['score']:>3}  {c['source']:<11} {c['title'][:60]}  {', '.join(c['flags'])}")
            if not scored:
                print("  no usable candidates")

    (OUT_DIR / "candidates.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    write_sheet(results)
    total = sum(len(v) for v in results.values())
    print(f"\n{total} candidates for {len(results)} species -> {OUT_DIR / 'index.html'}")


if __name__ == "__main__":
    asyncio.run(main())
