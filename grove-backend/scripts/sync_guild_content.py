"""Sync the four curated guilds' text in Atlas with curated_guilds.py, without a re-seed.

Updates name, subtitle, description, design_notes and tags (matched by slug). Species links, ids and
members are left alone. Run from grove-backend:
  python3 scripts/sync_guild_content.py            # dry run
  python3 scripts/sync_guild_content.py --apply    # backup JSON first, then update
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

from curated_guilds import CURATED_GUILDS

FIELDS = ["name", "subtitle", "description", "design_notes", "tags"]


async def main(apply):
    load_dotenv(os.path.join(ROOT, ".env"))
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    plan, backup = [], []
    for guild in CURATED_GUILDS:
        current = await db.guilds.find_one({"slug": guild["slug"]}, {"_id": 0})
        if not current:
            print(f"{guild['slug']}: not in the database")
            continue
        changed = {f: guild[f] for f in FIELDS if f in guild and current.get(f) != guild[f]}
        if not changed:
            print(f"{guild['slug']}: up to date")
            continue
        print(f"{guild['slug']}: {', '.join(sorted(changed))}")
        backup.append({"slug": guild["slug"], **{f: current.get(f) for f in changed}})
        plan.append((guild["slug"], changed))
    if not plan:
        return
    if not apply:
        print("\nDry run only. Re-run with --apply to write.")
        return
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = os.path.join(HERE, f"species-backup-guilds-{stamp}.json")
    with open(path, "w") as fh:
        json.dump(backup, fh, indent=1, default=str)
    print(f"\nBackup written to {path}")
    for slug, changed in plan:
        result = await db.guilds.update_one({"slug": slug}, {"$set": changed})
        print(f"{slug}: matched {result.matched_count}, modified {result.modified_count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    asyncio.run(main(parser.parse_args().apply))
