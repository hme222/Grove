#!/usr/bin/env python3
"""
Phase 14C.3.c — Grove Chat Backend Tests
Tests per-grove MongoDB-backed chat with 5-second polling (no WebSockets).
Messages support text + 1 photo. Soft-delete for sender's own messages;
grove owner/admin AND site admin can delete any. Edit own only.
Auto-awards grove_chat_first (1st msg) and grove_chat_50 (50th msg) badges.
"""
import requests
import sys
import time
from datetime import datetime, timezone
from typing import Optional

BASE_URL = "https://botanical-social.preview.emergentagent.com/api"

# Test credentials from review_request
CLARE = {"email": "clare.testing@grove.app", "password": "GroveTesting2025!"}
MAYA = {"email": "maya.testing@grove.app", "password": "GroveTesting2025!"}
JAMES = {"email": "james.testing@grove.app", "password": "GroveTesting2025!"}
GROVELING = {"email": "groveling.testing@grove.app", "password": "GroveTesting2025!"}

# Test grove (Clare is owner/admin)
TEST_GROVE_ID = "fb7a60cf-d5a2-4596-8e2d-770df396c5d3"


class ChatTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failed_tests = []
        self.tokens = {}
        self.user_ids = {}

    def log(self, msg: str):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

    def test(self, name: str, condition: bool, error_msg: str = ""):
        self.tests_run += 1
        if condition:
            self.tests_passed += 1
            self.log(f"✅ PASS: {name}")
            return True
        else:
            self.tests_failed += 1
            self.failed_tests.append(f"{name}: {error_msg}")
            self.log(f"❌ FAIL: {name}")
            if error_msg:
                self.log(f"   Error: {error_msg}")
            return False

    def login(self, user_key: str, creds: dict) -> Optional[str]:
        """Login and store token + user_id"""
        try:
            resp = requests.post(f"{BASE_URL}/auth/login", json=creds, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                self.tokens[user_key] = data.get("token") or data.get("access_token")
                self.user_ids[user_key] = data.get("user", {}).get("id") or data.get("user_id")
                self.log(f"✓ Logged in as {user_key} (user_id: {self.user_ids[user_key]})")
                return self.tokens[user_key]
            else:
                self.log(f"✗ Login failed for {user_key}: {resp.status_code} {resp.text}")
                return None
        except Exception as e:
            self.log(f"✗ Login exception for {user_key}: {e}")
            return None

    def headers(self, user_key: str) -> dict:
        return {
            "Authorization": f"Bearer {self.tokens.get(user_key, '')}",
            "Content-Type": "application/json"
        }

    def get_messages(self, user_key: str, grove_id: str, since: Optional[str] = None, limit: int = 50):
        """GET /api/groves/{grove_id}/messages"""
        params = {"limit": limit}
        if since:
            params["since"] = since
        try:
            resp = requests.get(
                f"{BASE_URL}/groves/{grove_id}/messages",
                headers=self.headers(user_key),
                params=params,
                timeout=15
            )
            return resp
        except requests.exceptions.Timeout:
            self.log(f"TIMEOUT in get_messages after 15s")
            return None
        except Exception as e:
            self.log(f"Exception in get_messages: {type(e).__name__}: {e}")
            return None

    def post_message(self, user_key: str, grove_id: str, body: str = "", photo_path: Optional[str] = None):
        """POST /api/groves/{grove_id}/messages"""
        payload = {"body": body}
        if photo_path:
            payload["photo_path"] = photo_path
        try:
            resp = requests.post(
                f"{BASE_URL}/groves/{grove_id}/messages",
                headers=self.headers(user_key),
                json=payload,
                timeout=15
            )
            return resp
        except requests.exceptions.Timeout:
            self.log(f"TIMEOUT in post_message after 15s")
            return None
        except Exception as e:
            self.log(f"Exception in post_message: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return None

    def patch_message(self, user_key: str, grove_id: str, message_id: str, body: str):
        """PATCH /api/groves/{grove_id}/messages/{message_id}"""
        try:
            resp = requests.patch(
                f"{BASE_URL}/groves/{grove_id}/messages/{message_id}",
                headers=self.headers(user_key),
                json={"body": body},
                timeout=15
            )
            return resp
        except requests.exceptions.Timeout:
            self.log(f"TIMEOUT in patch_message after 15s")
            return None
        except Exception as e:
            self.log(f"Exception in patch_message: {type(e).__name__}: {e}")
            return None

    def delete_message(self, user_key: str, grove_id: str, message_id: str):
        """DELETE /api/groves/{grove_id}/messages/{message_id}"""
        try:
            resp = requests.delete(
                f"{BASE_URL}/groves/{grove_id}/messages/{message_id}",
                headers=self.headers(user_key),
                timeout=15
            )
            return resp
        except requests.exceptions.Timeout:
            self.log(f"TIMEOUT in delete_message after 15s")
            return None
        except Exception as e:
            self.log(f"Exception in delete_message: {type(e).__name__}: {e}")
            return None

    def get_badges(self, user_key: str):
        """GET /api/users/me/badges"""
        try:
            resp = requests.get(
                f"{BASE_URL}/users/me/badges",
                headers=self.headers(user_key),
                timeout=10
            )
            return resp
        except Exception as e:
            self.log(f"Exception in get_badges: {e}")
            return None

    def get_badge_catalog(self, user_key: str):
        """GET /api/users/me/badges/catalog"""
        try:
            resp = requests.get(
                f"{BASE_URL}/users/me/badges/catalog",
                headers=self.headers(user_key),
                timeout=10
            )
            return resp
        except Exception as e:
            self.log(f"Exception in get_badge_catalog: {e}")
            return None

    def upload_file(self, user_key: str, filename: str = "test.jpg"):
        """POST /api/upload - returns storage_path"""
        try:
            files = {"file": (filename, b"fake image data", "image/jpeg")}
            resp = requests.post(
                f"{BASE_URL}/upload",
                headers={"Authorization": f"Bearer {self.tokens.get(user_key, '')}"},
                files=files,
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                # Upload endpoint returns "path" not "storage_path"
                return data.get("path") or data.get("storage_path")
            else:
                self.log(f"Upload failed: {resp.status_code} {resp.text}")
            return None
        except Exception as e:
            self.log(f"Exception in upload_file: {e}")
            return None

    def run_all_tests(self):
        self.log("=" * 80)
        self.log("Phase 14C.3.c — Grove Chat Backend Tests")
        self.log("=" * 80)

        # Login all users
        self.log("\n--- Logging in test users ---")
        self.login("clare", CLARE)
        self.login("maya", MAYA)
        self.login("james", JAMES)
        self.login("groveling", GROVELING)
        
        if "clare" not in self.tokens or not self.tokens.get("clare"):
            self.log("CRITICAL: Clare login failed. Aborting.")
            return
        if "maya" not in self.tokens or not self.tokens.get("maya"):
            self.log("CRITICAL: Maya login failed. Aborting.")
            return

        # Test 1: GET messages - 401 without token
        self.log("\n--- Test 1: GET messages - 401 without token ---")
        resp = requests.get(f"{BASE_URL}/groves/{TEST_GROVE_ID}/messages", timeout=10)
        self.test(
            "GET /api/groves/{grove_id}/messages returns 401 without token",
            resp.status_code == 401,
            f"Expected 401, got {resp.status_code}"
        )

        # Test 2: GET messages - 404 for unknown grove_id
        self.log("\n--- Test 2: GET messages - 404 for unknown grove_id ---")
        resp = self.get_messages("clare", "unknown-grove-id-12345")
        self.test(
            "GET /api/groves/{grove_id}/messages returns 404 for unknown grove_id",
            resp is not None and resp.status_code == 404,
            f"Expected 404, got {resp.status_code if resp else 'None'}"
        )

        # Test 3: GET messages - 200 for member (Clare is member)
        self.log("\n--- Test 3: GET messages - 200 for member ---")
        resp = self.get_messages("clare", TEST_GROVE_ID)
        if self.test(
            "GET /api/groves/{grove_id}/messages returns 200 for member",
            resp is not None and resp.status_code == 200,
            f"Expected 200, got {resp.status_code if resp else 'None'}"
        ):
            data = resp.json()
            self.test(
                "Response includes items, next_cursor, server_time, grove_id",
                all(k in data for k in ["items", "next_cursor", "server_time", "grove_id"]),
                f"Missing keys in response: {data.keys()}"
            )
            self.test(
                "grove_id matches request",
                data.get("grove_id") == TEST_GROVE_ID,
                f"Expected {TEST_GROVE_ID}, got {data.get('grove_id')}"
            )

        # Test 4: POST message - 403 for non-member
        # Note: All test users might be members. We'll try Maya on a different grove if needed.
        # For now, skip this test or use a grove Maya hasn't joined.
        self.log("\n--- Test 4: POST message - 403 for non-member (SKIPPED - need non-member setup) ---")
        # This would require finding a grove Maya isn't a member of

        # Test 5: POST message - 400 if both body and photo_path are empty
        self.log("\n--- Test 5: POST message - 400 if both body and photo_path are empty ---")
        resp = self.post_message("clare", TEST_GROVE_ID, body="", photo_path=None)
        self.test(
            "POST /api/groves/{grove_id}/messages returns 400 if both body and photo_path are empty",
            resp is not None and resp.status_code == 400,
            f"Expected 400, got {resp.status_code if resp else 'None'}: {resp.text if resp else ''}"
        )

        # Test 6: POST message - 400 if body > 4000 chars
        self.log("\n--- Test 6: POST message - 400 if body > 4000 chars ---")
        long_body = "x" * 4001
        resp = self.post_message("clare", TEST_GROVE_ID, body=long_body)
        self.test(
            "POST /api/groves/{grove_id}/messages returns 400 if body > 4000 chars",
            resp is not None and resp.status_code == 400,
            f"Expected 400, got {resp.status_code if resp else 'None'}"
        )

        # Test 7: POST message - 200 with valid body
        self.log("\n--- Test 7: POST message - 200 with valid body ---")
        test_body = f"Test message at {datetime.now().isoformat()}"
        resp = self.post_message("clare", TEST_GROVE_ID, body=test_body)
        message_id = None
        if self.test(
            "POST /api/groves/{grove_id}/messages returns 200 with valid body",
            resp is not None and resp.status_code == 200,
            f"Expected 200, got {resp.status_code if resp else 'None'}: {resp.text if resp else ''}"
        ):
            data = resp.json()
            message_id = data.get("id")
            required_fields = ["id", "grove_id", "user_id", "body", "photo_path", "created_at", 
                             "updated_at", "edited", "is_deleted", "author_username", 
                             "author_display_name", "author_avatar_url"]
            self.test(
                "Response includes all required fields",
                all(k in data for k in required_fields),
                f"Missing fields: {[k for k in required_fields if k not in data]}"
            )
            self.test(
                "edited=false for new message",
                data.get("edited") == False,
                f"Expected False, got {data.get('edited')}"
            )
            self.test(
                "is_deleted=false for new message",
                data.get("is_deleted") == False,
                f"Expected False, got {data.get('is_deleted')}"
            )

        # Test 8: GET messages with no `since` - returns most-recent N in chronological order
        self.log("\n--- Test 8: GET messages with no `since` - chronological order ---")
        resp = self.get_messages("clare", TEST_GROVE_ID, limit=10)
        if self.test(
            "GET /api/groves/{grove_id}/messages with no `since` returns 200",
            resp is not None and resp.status_code == 200,
            f"Expected 200, got {resp.status_code if resp else 'None'}"
        ):
            data = resp.json()
            items = data.get("items", [])
            if len(items) > 1:
                # Check chronological order (oldest first)
                is_chronological = all(
                    items[i]["created_at"] <= items[i+1]["created_at"] 
                    for i in range(len(items)-1)
                )
                self.test(
                    "Messages are in chronological order (oldest first)",
                    is_chronological,
                    "Messages not in chronological order"
                )

        # Test 9: GET messages with `since` - returns only messages strictly newer
        self.log("\n--- Test 9: GET messages with `since` - strictly newer messages ---")
        # Get current messages
        resp1 = self.get_messages("clare", TEST_GROVE_ID, limit=10)
        if resp1 and resp1.status_code == 200:
            cursor = resp1.json().get("next_cursor")
            # Post a new message
            new_msg_body = f"New message after cursor at {datetime.now().isoformat()}"
            resp_post = self.post_message("clare", TEST_GROVE_ID, body=new_msg_body)
            if resp_post and resp_post.status_code == 200:
                time.sleep(0.5)  # Brief wait
                # Poll with cursor
                resp2 = self.get_messages("clare", TEST_GROVE_ID, since=cursor, limit=10)
                if self.test(
                    "GET with `since` returns 200",
                    resp2 and resp2.status_code == 200,
                    f"Expected 200, got {resp2.status_code if resp2 else 'None'}"
                ):
                    items = resp2.json().get("items", [])
                    # Should include the new message
                    found_new = any(item.get("body") == new_msg_body for item in items)
                    self.test(
                        "New message appears in poll response",
                        found_new,
                        f"New message not found in {len(items)} items"
                    )
                    # All messages should be strictly after cursor
                    all_after = all(item["created_at"] > cursor for item in items)
                    self.test(
                        "All messages are strictly after cursor (no replay)",
                        all_after,
                        "Some messages are not strictly after cursor"
                    )

        # Test 10: PATCH message - 200 when sender edits own message
        self.log("\n--- Test 10: PATCH message - sender edits own ---")
        if message_id:
            edited_body = "Edited message body"
            resp = self.patch_message("clare", TEST_GROVE_ID, message_id, edited_body)
            if self.test(
                "PATCH /api/groves/{grove_id}/messages/{message_id} returns 200 for sender",
                resp is not None and resp.status_code == 200,
                f"Expected 200, got {resp.status_code if resp else 'None'}: {resp.text if resp else ''}"
            ):
                data = resp.json()
                self.test(
                    "edited=true after edit",
                    data.get("edited") == True,
                    f"Expected True, got {data.get('edited')}"
                )
                self.test(
                    "Body updated correctly",
                    data.get("body") == edited_body,
                    f"Expected '{edited_body}', got '{data.get('body')}'"
                )

        # Test 11: PATCH message - 403 when non-sender tries to edit
        self.log("\n--- Test 11: PATCH message - 403 when non-sender tries to edit ---")
        if message_id and "maya" in self.tokens:
            resp = self.patch_message("maya", TEST_GROVE_ID, message_id, "Maya's edit attempt")
            self.test(
                "PATCH returns 403 when non-sender tries to edit",
                resp is not None and resp.status_code == 403,
                f"Expected 403, got {resp.status_code if resp else 'None'}"
            )

        # Test 12: PATCH message - 404 for unknown message
        self.log("\n--- Test 12: PATCH message - 404 for unknown message ---")
        resp = self.patch_message("clare", TEST_GROVE_ID, "unknown-message-id", "Edit")
        self.test(
            "PATCH returns 404 for unknown message",
            resp is not None and resp.status_code == 404,
            f"Expected 404, got {resp.status_code if resp else 'None'}"
        )

        # Test 13: PATCH message - 400 for empty body when no photo
        self.log("\n--- Test 13: PATCH message - 400 for empty body when no photo ---")
        if message_id:
            resp = self.patch_message("clare", TEST_GROVE_ID, message_id, "")
            self.test(
                "PATCH returns 400 for empty body when no photo attached",
                resp is not None and resp.status_code == 400,
                f"Expected 400, got {resp.status_code if resp else 'None'}"
            )

        # Test 14: PATCH message - 400 for body > 4000 chars
        self.log("\n--- Test 14: PATCH message - 400 for body > 4000 chars ---")
        if message_id:
            long_edit = "y" * 4001
            resp = self.patch_message("clare", TEST_GROVE_ID, message_id, long_edit)
            self.test(
                "PATCH returns 400 for body > 4000 chars",
                resp is not None and resp.status_code == 400,
                f"Expected 400, got {resp.status_code if resp else 'None'}"
            )

        # Test 15: DELETE message - 200 when sender deletes own
        self.log("\n--- Test 15: DELETE message - sender deletes own ---")
        # Create a new message to delete
        resp_post = self.post_message("clare", TEST_GROVE_ID, body="Message to delete")
        if resp_post and resp_post.status_code == 200:
            delete_msg_id = resp_post.json().get("id")
            resp = self.delete_message("clare", TEST_GROVE_ID, delete_msg_id)
            if self.test(
                "DELETE returns 200 when sender deletes own",
                resp is not None and resp.status_code == 200,
                f"Expected 200, got {resp.status_code if resp else 'None'}: {resp.text if resp else ''}"
            ):
                data = resp.json()
                self.test(
                    "Response includes deleted=true",
                    data.get("deleted") == True,
                    f"Expected True, got {data.get('deleted')}"
                )
                self.test(
                    "by='sender' for sender delete",
                    data.get("by") == "sender",
                    f"Expected 'sender', got {data.get('by')}"
                )

                # Test 16: Verify tombstone behavior
                self.log("\n--- Test 16: Verify tombstone behavior after DELETE ---")
                resp_get = self.get_messages("clare", TEST_GROVE_ID, limit=50)
                if resp_get and resp_get.status_code == 200:
                    items = resp_get.json().get("items", [])
                    deleted_msg = next((m for m in items if m.get("id") == delete_msg_id), None)
                    if deleted_msg:
                        self.test(
                            "Deleted message has is_deleted=true",
                            deleted_msg.get("is_deleted") == True,
                            f"Expected True, got {deleted_msg.get('is_deleted')}"
                        )
                        self.test(
                            "Deleted message has body='' (tombstone)",
                            deleted_msg.get("body") == "",
                            f"Expected '', got '{deleted_msg.get('body')}'"
                        )
                        self.test(
                            "Deleted message has photo_path=null (tombstone)",
                            deleted_msg.get("photo_path") is None,
                            f"Expected None, got {deleted_msg.get('photo_path')}"
                        )

        # Test 17: DELETE message - idempotent (re-delete returns already=true)
        self.log("\n--- Test 17: DELETE message - idempotent ---")
        if delete_msg_id:
            resp = self.delete_message("clare", TEST_GROVE_ID, delete_msg_id)
            if self.test(
                "DELETE is idempotent (returns 200 on re-delete)",
                resp is not None and resp.status_code == 200,
                f"Expected 200, got {resp.status_code if resp else 'None'}"
            ):
                data = resp.json()
                self.test(
                    "Response includes already=true on re-delete",
                    data.get("already") == True,
                    f"Expected True, got {data.get('already')}"
                )

        # Test 18: DELETE message - 404 for unknown message
        self.log("\n--- Test 18: DELETE message - 404 for unknown message ---")
        resp = self.delete_message("clare", TEST_GROVE_ID, "unknown-message-id-xyz")
        self.test(
            "DELETE returns 404 for unknown message",
            resp is not None and resp.status_code == 404,
            f"Expected 404, got {resp.status_code if resp else 'None'}"
        )

        # Test 19: DELETE message - 403 when non-sender, non-admin tries to delete
        self.log("\n--- Test 19: DELETE message - 403 when non-sender, non-admin tries to delete ---")
        # Create a message as Clare, try to delete as Maya (if Maya is not admin)
        # Note: Review request says all test users have is_admin=true, so this might pass
        resp_post = self.post_message("clare", TEST_GROVE_ID, body="Clare's message for delete test")
        if resp_post and resp_post.status_code == 200:
            msg_id = resp_post.json().get("id")
            if "maya" in self.tokens:
                resp = self.delete_message("maya", TEST_GROVE_ID, msg_id)
                # Maya is is_admin=true, so she can delete as site admin
                # This test will likely pass with by='site_admin'
                if resp is not None and resp.status_code == 200:
                    self.log("   Note: Maya deleted as site admin (is_admin=true)")
                    self.test(
                        "DELETE by site admin returns by='site_admin'",
                        resp.json().get("by") == "site_admin",
                        f"Expected 'site_admin', got {resp.json().get('by')}"
                    )
                else:
                    self.test(
                        "DELETE returns 403 when non-sender, non-admin tries to delete",
                        resp is not None and resp.status_code == 403,
                        f"Expected 403, got {resp.status_code if resp else 'None'}"
                    )

        # Test 20: DELETE message - grove owner/admin can delete
        self.log("\n--- Test 20: DELETE message - grove owner/admin can delete ---")
        # Maya posts, Clare (grove owner) deletes
        if "maya" in self.tokens:
            resp_post = self.post_message("maya", TEST_GROVE_ID, body="Maya's message for admin delete")
            if resp_post and resp_post.status_code == 200:
                msg_id = resp_post.json().get("id")
                resp = self.delete_message("clare", TEST_GROVE_ID, msg_id)
                if self.test(
                    "DELETE by grove owner/admin returns 200",
                    resp is not None and resp.status_code == 200,
                    f"Expected 200, got {resp.status_code if resp else 'None'}"
                ):
                    data = resp.json()
                    # Clare is both grove admin AND site admin, so by could be either
                    self.test(
                        "by='grove_admin' or 'site_admin' for admin delete",
                        data.get("by") in ["grove_admin", "site_admin"],
                        f"Expected 'grove_admin' or 'site_admin', got {data.get('by')}"
                    )

        # Test 21: PATCH message - 410 for already-deleted message
        self.log("\n--- Test 21: PATCH message - 410 for already-deleted message ---")
        if delete_msg_id:
            resp = self.patch_message("clare", TEST_GROVE_ID, delete_msg_id, "Try to edit deleted")
            self.test(
                "PATCH returns 410 for already-deleted message",
                resp is not None and resp.status_code == 410,
                f"Expected 410, got {resp.status_code if resp else 'None'}"
            )

        # Test 22: POST message with photo - cross-user attachment validation
        self.log("\n--- Test 22: POST message with photo - cross-user attachment validation ---")
        # Upload a file as Clare
        clare_photo = self.upload_file("clare", "clare_photo.jpg")
        if clare_photo:
            self.log(f"   Clare uploaded photo: {clare_photo}")
            # Try to use Clare's photo as Maya
            if "maya" in self.tokens:
                resp = self.post_message("maya", TEST_GROVE_ID, body="Maya using Clare's photo", photo_path=clare_photo)
                self.test(
                    "POST returns 403 when using another user's photo",
                    resp is not None and resp.status_code == 403,
                    f"Expected 403, got {resp.status_code if resp else 'None'}: {resp.text if resp else ''}"
                )

        # Test 23: POST message with own photo - should succeed
        self.log("\n--- Test 23: POST message with own photo - should succeed ---")
        maya_photo = self.upload_file("maya", "maya_photo.jpg")
        if maya_photo and "maya" in self.tokens:
            self.log(f"   Maya uploaded photo: {maya_photo}")
            resp = self.post_message("maya", TEST_GROVE_ID, body="Maya's photo message", photo_path=maya_photo)
            self.test(
                "POST with own photo returns 200",
                resp is not None and resp.status_code == 200,
                f"Expected 200, got {resp.status_code if resp else 'None'}: {resp.text if resp else ''}"
            )

        # Test 24: Badge auto-award - grove_chat_first
        self.log("\n--- Test 24: Badge auto-award - grove_chat_first ---")
        # Check if Clare has grove_chat_first badge
        resp = self.get_badges("clare")
        if resp is not None and resp.status_code == 200:
            badges = resp.json()
            badge_slugs = [b.get("badge", {}).get("slug") for b in badges]
            self.test(
                "grove_chat_first badge awarded after 1st message",
                "grove_chat_first" in badge_slugs,
                f"grove_chat_first not found in badges: {badge_slugs}"
            )

        # Test 25: Badge catalog - grove_chat_first and grove_chat_50 are earnable
        self.log("\n--- Test 25: Badge catalog - grove_chat_first and grove_chat_50 are earnable ---")
        resp = self.get_badge_catalog("clare")
        if resp is not None and resp.status_code == 200:
            data = resp.json()
            # Catalog endpoint returns {items: [...], total: N, earned_count: M, ...}
            catalog = data.get("items", [])
            
            chat_first = next((b for b in catalog if b.get("slug") == "grove_chat_first"), None)
            chat_50 = next((b for b in catalog if b.get("slug") == "grove_chat_50"), None)
            self.test(
                "grove_chat_first exists in catalog",
                chat_first is not None,
                "grove_chat_first not found in catalog"
            )
            if chat_first:
                self.test(
                    "grove_chat_first is earnable=true",
                    chat_first.get("earnable") == True,
                    f"Expected True, got {chat_first.get('earnable')}"
                )
            self.test(
                "grove_chat_50 exists in catalog",
                chat_50 is not None,
                "grove_chat_50 not found in catalog"
            )
            if chat_50:
                self.test(
                    "grove_chat_50 is earnable=true",
                    chat_50.get("earnable") == True,
                    f"Expected True, got {chat_50.get('earnable')}"
                )

        # Test 26: Badge catalog - 177 entries
        self.log("\n--- Test 26: Badge catalog - 177 entries ---")
        resp = self.get_badge_catalog("clare")
        if resp is not None and resp.status_code == 200:
            data = resp.json()
            catalog = data.get("items", [])
            self.test(
                "Badge catalog contains 177 entries",
                len(catalog) == 177,
                f"Expected 177, got {len(catalog)}"
            )

        # Test 27: Regression - verification flow still works
        self.log("\n--- Test 27: Regression - verification flow still works ---")
        resp = requests.get(
            f"{BASE_URL}/users/me/verification",
            headers=self.headers("clare"),
            timeout=10
        )
        self.test(
            "GET /api/users/me/verification returns 200",
            resp.status_code == 200,
            f"Expected 200, got {resp.status_code}"
        )

        # Test 28: Regression - badge display picker still works
        self.log("\n--- Test 28: Regression - badge display picker still works ---")
        # Get Clare's badges
        resp = self.get_badges("clare")
        if resp is not None and resp.status_code == 200:
            badges = resp.json()
            if len(badges) >= 1:
                # Pick first badge
                first_slug = badges[0].get("badge", {}).get("slug")
                resp_put = requests.put(
                    f"{BASE_URL}/users/me/badges/displayed",
                    headers=self.headers("clare"),
                    json={"badge_slugs": [first_slug]},
                    timeout=10
                )
                self.test(
                    "PUT /api/users/me/badges/displayed returns 200",
                    resp_put.status_code == 200,
                    f"Expected 200, got {resp_put.status_code}: {resp_put.text}"
                )

        # Test 29: Polling stability - rapid GETs with same cursor
        self.log("\n--- Test 29: Polling stability - rapid GETs with same cursor ---")
        resp1 = self.get_messages("clare", TEST_GROVE_ID, limit=10)
        if resp1 and resp1.status_code == 200:
            cursor = resp1.json().get("next_cursor")
            items1 = resp1.json().get("items", [])
            # Rapid second GET with same cursor
            resp2 = self.get_messages("clare", TEST_GROVE_ID, since=cursor, limit=10)
            if resp2 and resp2.status_code == 200:
                items2 = resp2.json().get("items", [])
                self.test(
                    "Rapid GETs with same cursor return consistent results",
                    len(items2) == 0,  # No new messages, should be empty
                    f"Expected 0 items, got {len(items2)}"
                )

        # Test 30: Membership gate on PATCH/DELETE
        self.log("\n--- Test 30: Membership gate on PATCH/DELETE ---")
        # This would require a user who was a member but left the grove
        # For now, we'll skip this test as it requires complex setup
        self.log("   (SKIPPED - requires user who left grove)")

        # Print summary
        self.log("\n" + "=" * 80)
        self.log(f"TESTS COMPLETE: {self.tests_passed}/{self.tests_run} passed ({self.tests_failed} failed)")
        self.log("=" * 80)
        
        if self.failed_tests:
            self.log("\nFailed tests:")
            for ft in self.failed_tests:
                self.log(f"  - {ft}")

        return self.tests_failed == 0


def main():
    tester = ChatTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
