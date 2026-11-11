"""Look up one Wikimedia Commons photo per species, with its author and license, and write species_photos.json.

Run by hand (needs only the standard library):  python3 fetch_species_photo_credits.py
- Only the lead photo of the Wikipedia article for the species itself is used. Genus and cultivar stand-ins are skipped,
  so a photo is never of a different plant than the name beside it.
- Only CC0, public domain, CC BY and CC BY-SA files are kept. The author and license come from each file's own
  Commons page, not from a blanket statement.
- Requests are one at a time with a pause, and the User-Agent says who is asking.
"""
import ast
import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
UA = "FloraGrove/1.0 (https://github.com/hme222/Grove; plant care app photo credits)"
API = "https://en.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"
SKIP = {
    "rosa-juliet-ausjameson": "stand-in article, not the species",
    "dahlia-cafe-au-lait": "stand-in article, not the species",
    "eucalyptus-polyanthemos": "stand-in article, not the species",
    "dahlia-pinnata": "not one of the app's species",
    # Looked at each picture: these lead photos do not help someone recognize the plant at thumbnail size.
    "aloe-vera": "lead image is a collage",
    "ficus-lyrata": "lead image is a distant hedge-like tree",
    "dracaena-marginata": "lead image is a landscape",
    "pachira-aquatica": "lead image is a close-up of the flower only",
}
OK_LICENSE = re.compile(r"^(CC0|Public domain|PD|CC BY(-SA)?( \d\.\d)?)", re.I)


def get(base, **params):
    url = base + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": "2"})
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def strip(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s or ""))).strip()


def clean_author(a):
    """Commons 'Artist' fields carry file names and notes. Keep the name."""
    a = re.sub(r"^[^:]*\.(jpe?g|png|tiff?):\s*", "", a, flags=re.I)
    a = re.sub(r"\s*derivative work:.*$", "", a, flags=re.I)
    m = re.match(r"No machine-readable author provided\.\s*(.+?)\s+assumed", a, flags=re.I)
    if m:
        a = m.group(1)
    a = re.sub(r"^author is\s+", "", a, flags=re.I).rstrip(". ")
    a = re.sub(r"^(Flickr user|User:|en:User:)\s*", "", a)
    return a.strip()


def species_map():
    tree = ast.parse((HERE / "import_wiki_images.py").read_text())
    for node in tree.body:
        if isinstance(node, ast.Assign) and getattr(node.targets[0], "id", "") == "SPECIES_WIKI_MAP":
            return ast.literal_eval(node.value)
    raise SystemExit("SPECIES_WIKI_MAP not found")


def lead_file(article):
    d = get(API, action="query", titles=urllib.parse.unquote(article), prop="pageimages", piprop="name", redirects=1)
    page = d["query"]["pages"][0]
    return page.get("pageimage"), page.get("title")


def file_info(name, width=240):
    d = get(COMMONS, action="query", titles="File:" + name, prop="imageinfo", iiprop="url|extmetadata|mime", iiurlwidth=width)
    page = d["query"]["pages"][0]
    info = (page.get("imageinfo") or [None])[0]
    return info


def main():
    out, skipped = {}, {}
    for slug, article in species_map().items():
        if slug in SKIP:
            skipped[slug] = SKIP[slug]
            continue
        try:
            name, title = lead_file(article)
            if not name:
                skipped[slug] = "no lead image"
                continue
            info = file_info(name)
            time.sleep(0.5)
            big = file_info(name, 640) if info else None
            if not info or not info.get("mime", "").startswith("image/") or info["mime"] == "image/svg+xml":
                skipped[slug] = "not a photo"
                continue
            meta = info.get("extmetadata", {})
            lic = strip(meta.get("LicenseShortName", {}).get("value"))
            if not OK_LICENSE.match(lic):
                skipped[slug] = f"license not accepted: {lic or 'unknown'}"
                continue
            author = clean_author(strip(meta.get("Artist", {}).get("value")))
            if not author:
                skipped[slug] = "no author recorded"
                continue
            out[slug] = {
                "article": title,
                "file": name,
                "thumb_url": info["thumburl"],
                "photo_url": (big or info)["thumburl"],
                "page_url": info["descriptionurl"],
                "author": author,
                "license": lic,
                "license_url": strip(meta.get("LicenseUrl", {}).get("value")),
            }
        except Exception as e:  # keep going; report at the end
            skipped[slug] = f"error: {e}"
        time.sleep(0.5)
    (HERE / "species_photos.json").write_text(json.dumps({"photos": out, "skipped": skipped}, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(out)} photos with credits, {len(skipped)} skipped")
    for k, v in skipped.items():
        print("  skipped", k, "-", v)


if __name__ == "__main__":
    main()
