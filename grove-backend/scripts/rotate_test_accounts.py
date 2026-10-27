"""Rotate the password of every seeded test account, so the old password in the public git history stops working.

Covers: maya.testing, james.testing, clare.testing, groveling.testing, test@grove.app (the old test-login user)
and the supporting grove members created by seed_testing.py (any *.testing@grove.app address).

Run from grove-backend with the usual .env plus a NEW GROVE_TEST_PASSWORD (at least 12 characters):
  python3 scripts/rotate_test_accounts.py                      # dry run: lists the accounts it would change
  python3 scripts/rotate_test_accounts.py --apply              # rehashes their passwords
  python3 scripts/rotate_test_accounts.py --apply --revoke-admin   # also clears is_admin on all of them except the keep list

--keep-admin NAME[,NAME]   usernames that stay admin when --revoke-admin is used (default: groveling, so the demo panel still works).

It never prints the password. Existing sessions stop working at their next refresh because refresh tokens are signed against
the user record only if you also rotate JWT_SECRET; to force every session out, change JWT_SECRET on the server as well.
"""
import argparse
import asyncio
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
TEST_EMAIL = re.compile(r"(\.testing@grove\.app|^test@grove\.app)$")


async def main(apply, revoke_admin, keep):
    load_dotenv(os.path.join(ROOT, ".env"))
    password = os.environ.get("GROVE_TEST_PASSWORD", "").strip()
    if len(password) < 12:
        sys.exit("Set a NEW GROVE_TEST_PASSWORD (at least 12 characters) in grove-backend/.env first.")
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
    users = await db.users.find({"email": {"$regex": r"(\.testing@grove\.app|^test@grove\.app)$"}}, {"_id": 0, "id": 1, "email": 1, "username": 1, "is_admin": 1}).to_list(100)
    users = [u for u in users if TEST_EMAIL.search(u.get("email", ""))]
    if not users:
        print("No test accounts found.")
        return
    new_hash = pwd_context.hash(password)
    for u in users:
        admin_now = bool(u.get("is_admin"))
        will_drop_admin = revoke_admin and admin_now and u.get("username") not in keep
        print(f"{u.get('username')} <{u['email']}> admin={admin_now}" + ("  -> admin revoked" if will_drop_admin else "") + "  -> password rotated")
    if not apply:
        print(f"\n{len(users)} accounts. Dry run only; re-run with --apply to write.")
        return
    for u in users:
        update = {"password_hash": new_hash}
        if revoke_admin and u.get("is_admin") and u.get("username") not in keep:
            update["is_admin"] = False
        result = await db.users.update_one({"id": u["id"]}, {"$set": update})
        print(f"{u['email']}: matched {result.matched_count}, modified {result.modified_count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--revoke-admin", action="store_true")
    parser.add_argument("--keep-admin", default="groveling")
    args = parser.parse_args()
    asyncio.run(main(args.apply, args.revoke_admin, {n.strip() for n in args.keep_admin.split(",") if n.strip()}))
