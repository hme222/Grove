"""Grant Pro to accounts without a payment: friends and family, founders, or a one-off comp.

The grant is a `pro_until` date and a `pro_source` on the account (see entitlements.py), not anything tied to a
TestFlight install, so it carries over to the App Store version. It never shortens a grant that is already running.

Run from grove-backend with the usual .env:
  python3 scripts/grant_pro.py --source friends_family --until 2027-01-31 --emails a@example.com,b@example.com
  python3 scripts/grant_pro.py --source founder --until 2027-12-15 --file founders.txt          # one email per line
  python3 scripts/grant_pro.py ... --apply                                                      # write it

Without --apply it only prints what it would do. Emails that match no account are listed, not created: a person has to
sign up first. The end date is the last day of access (23:59:59 UTC that day).
"""
import argparse
import asyncio
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

import entitlements


def read_emails(args):
    emails = [e.strip().lower() for e in (args.emails or "").split(",") if e.strip()]
    if args.file:
        with open(args.file, encoding="utf-8") as fh:
            emails += [line.strip().lower() for line in fh if line.strip() and not line.startswith("#")]
    return list(dict.fromkeys(emails))


async def main(args):
    emails = read_emails(args)
    if not emails:
        sys.exit("Give at least one email with --emails or --file.")
    try:
        until = datetime.strptime(args.until, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    except ValueError:
        sys.exit("--until must be a date like 2027-01-31.")
    load_dotenv(os.path.join(ROOT, ".env"))
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ.get("DB_NAME", "grove_db")]
    changes, missing = [], []
    for email in emails:
        user = await db.users.find_one({"email": email}, {"_id": 0, "id": 1, "email": 1, "tier": 1, "pro_until": 1, "pro_source": 1})
        if not user:
            missing.append(email)
            continue
        new_until, action, note = entitlements.plan_grant(user, until, args.source)
        print(f"{email}: {action}" + (f" ({note})" if note else "") + (f" -> Pro until {new_until.date()}" if action in ("grant", "extend") else ""))
        if action in ("grant", "extend"):
            changes.append((user["id"], new_until))
    for email in missing:
        print(f"{email}: no account yet, nothing to grant")
    print(f"\n{len(changes)} to change, {len(missing)} without an account.")
    if not args.apply:
        print("Dry run only; re-run with --apply to write.")
        return
    for user_id, new_until in changes:
        await db.users.update_one({"id": user_id}, {"$set": {"pro_until": new_until.isoformat(), "pro_source": args.source}})
    print("Done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, choices=entitlements.GRANT_SOURCES)
    parser.add_argument("--until", required=True, help="last day of access, YYYY-MM-DD")
    parser.add_argument("--emails", help="comma-separated emails")
    parser.add_argument("--file", help="a text file with one email per line (# starts a comment)")
    parser.add_argument("--apply", action="store_true", help="write the grants (default is a dry run)")
    asyncio.run(main(parser.parse_args()))
