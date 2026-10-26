"""Sync every curated species row in Atlas with curated_species.py, without a re-seed.

Updates the content fields of each species that already exists (matched by slug) and leaves
ids, photos, created_at and everything else alone. Species not in the database are only reported.

Run from grove-backend with the usual .env (MONGO_URL, DB_NAME):
  python3 scripts/sync_species_content.py            # dry run: prints what would change, writes nothing
  python3 scripts/sync_species_content.py --apply    # writes a backup JSON first, then updates

The backup goes to scripts/species-backup-<timestamp>.json (previous values of every changed field).
To undo, $set the fields back from it. The backup files are git-ignored.
"""
import argparse
import asyncio
import json
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from curated_species import CURATED_SPECIES
from seed import build_species_doc

# Stored per row, not content: never overwritten.
KEEP = {"id", "created_at", "photo_library_count"}


async def main(apply):
    load_dotenv(os.path.join(ROOT, ".env"))
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    plan, backup, missing, field_counts = [], [], [], {}
    for species in CURATED_SPECIES:
        slug = species["slug"]
        current = await db.species.find_one({"slug": slug}, {"_id": 0})
        if not current:
            missing.append(slug)
            continue
        wanted = {k: v for k, v in build_species_doc(species).items() if k not in KEEP}
        changed = {k: v for k, v in wanted.items() if current.get(k) != v}
        if not changed:
            continue
        for k in changed:
            field_counts[k] = field_counts.get(k, 0) + 1
        backup.append({"slug": slug, **{k: current.get(k) for k in changed}})
        plan.append((slug, changed))
        print(f"{slug}: {', '.join(sorted(changed))}")
    print(f"\n{len(plan)} species would change; not in the database: {missing or 'none'}")
    print("Fields touched (species count):", dict(sorted(field_counts.items())))
    if not plan:
        return
    if not apply:
        print("\nDry run only. Re-run with --apply to write.")
        return
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = os.path.join(HERE, f"species-backup-{stamp}.json")
    with open(path, "w") as fh:
        json.dump(backup, fh, indent=1, default=str)
    print(f"\nBackup written to {path}")
    for slug, changed in plan:
        result = await db.species.update_one({"slug": slug}, {"$set": changed})
        print(f"{slug}: matched {result.matched_count}, modified {result.modified_count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    asyncio.run(main(parser.parse_args().apply))
