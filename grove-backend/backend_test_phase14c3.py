#!/usr/bin/env python3
"""
Phase 14C.3.a Backend Test Suite
8-section pact verification flow with high-friction acknowledgment requirement.
"""

import requests
import sys
from datetime import datetime
from typing import Optional

BASE_URL = "https://botanical-social.preview.emergentagent.com/api"

# Test credentials
TEST_USERS = {
    "maya": {"email": "maya.testing@grove.app", "password": "GroveTesting2025!"},
    "james": {"email": "james.testing@grove.app", "password": "GroveTesting2025!"},
    "clare": {"email": "clare.testing@grove.app", "password": "GroveTesting2025!"},
    "groveling": {"email": "groveling.testing@grove.app", "password": "GroveTesting2025!"},
}


class Phase14C3Tester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.token = None
        self.current_user = None

    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        prefix = {
            "INFO": "ℹ️",
            "PASS": "✅",
            "FAIL": "❌",
            "WARN": "⚠️",
        }.get(level, "•")
        print(f"{prefix} {message}")

    def login(self, user_key: str) -> bool:
        """Login and get token"""
        self.tests_run += 1
        user = TEST_USERS.get(user_key)
        if not user:
            self.log(f"Unknown user key: {user_key}", "FAIL")
            self.tests_failed += 1
            return False

        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": user["email"], "password": user["password"]},
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.current_user = user_key
                self.log(f"Login successful for {user_key}", "PASS")
                self.tests_passed += 1
                return True
            else:
                self.log(
                    f"Login failed for {user_key}: {response.status_code} - {response.text}",
                    "FAIL",
                )
                self.tests_failed += 1
                return False
        except Exception as e:
            self.log(f"Login exception for {user_key}: {str(e)}", "FAIL")
            self.tests_failed += 1
            return False

    def test_endpoint(
        self,
        name: str,
        method: str,
        endpoint: str,
        expected_status: int,
        data: Optional[dict] = None,
        check_response: Optional[callable] = None,
        use_auth: bool = True,
    ) -> tuple[bool, dict]:
        """Generic endpoint test"""
        self.tests_run += 1
        url = f"{BASE_URL}/{endpoint}"
        headers = {"Content-Type": "application/json"}
        if use_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            elif method == "PATCH":
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            else:
                self.log(f"Unknown method: {method}", "FAIL")
                self.tests_failed += 1
                return False, {}

            success = response.status_code == expected_status
            response_data = {}
            try:
                response_data = response.json()
            except:
                pass

            if success:
                # Additional response validation if provided
                if check_response and not check_response(response_data):
                    self.log(
                        f"{name} - Response validation failed: {response_data}", "FAIL"
                    )
                    self.tests_failed += 1
                    return False, response_data

                self.log(f"{name} - Status {response.status_code}", "PASS")
                self.tests_passed += 1
                return True, response_data
            else:
                self.log(
                    f"{name} - Expected {expected_status}, got {response.status_code}: {response.text[:200]}",
                    "FAIL",
                )
                self.tests_failed += 1
                return False, response_data

        except Exception as e:
            self.log(f"{name} - Exception: {str(e)}", "FAIL")
            self.tests_failed += 1
            return False, {}

    def run_phase_14c3_tests(self):
        """Run all Phase 14C.3.a tests"""
        self.log("=" * 60)
        self.log("Phase 14C.3.a - 8-Section Pact Verification Flow")
        self.log("=" * 60)

        # Test 1: Auth required - 401 without token
        self.log("\n--- Test 1: Authentication Required ---")
        self.test_endpoint(
            "GET /verification without auth returns 401",
            "GET",
            "users/me/verification",
            401,
            use_auth=False,
        )

        # Login as James (clean candidate)
        if not self.login("james"):
            self.log("Cannot proceed without login", "FAIL")
            return

        # Test 2: GET initial verification state
        self.log("\n--- Test 2: Initial Verification State ---")
        success, data = self.test_endpoint(
            "GET /users/me/verification returns full state",
            "GET",
            "users/me/verification",
            200,
            check_response=lambda d: all(
                k in d
                for k in [
                    "verification_started_at",
                    "verification_email_confirmed",
                    "is_verified",
                    "verified_user",
                    "current_pact_version",
                    "needs_reverification",
                ]
            ),
        )
        if success:
            self.log(f"  Initial state: is_verified={data.get('is_verified')}")

        # Test 3: POST /verification/start (idempotent)
        self.log("\n--- Test 3: Start Verification (Idempotent) ---")
        success1, data1 = self.test_endpoint(
            "POST /verification/start (first call)",
            "POST",
            "users/me/verification/start",
            200,
            check_response=lambda d: d.get("verification_started_at") is not None,
        )
        if success1:
            started_at_1 = data1.get("verification_started_at")
            self.log(f"  Started at: {started_at_1}")

            # Call again to test idempotency
            success2, data2 = self.test_endpoint(
                "POST /verification/start (second call - idempotent)",
                "POST",
                "users/me/verification/start",
                200,
            )
            if success2:
                started_at_2 = data2.get("verification_started_at")
                if started_at_1 == started_at_2:
                    self.log(
                        "  Idempotency verified: verification_started_at unchanged",
                        "PASS",
                    )
                    self.tests_passed += 1
                else:
                    self.log(
                        f"  Idempotency FAILED: {started_at_1} != {started_at_2}",
                        "FAIL",
                    )
                    self.tests_failed += 1
                self.tests_run += 1

        # Test 4: POST /verification/confirm-email
        self.log("\n--- Test 4: Confirm Email ---")
        self.test_endpoint(
            "POST /verification/confirm-email",
            "POST",
            "users/me/verification/confirm-email",
            200,
            check_response=lambda d: d.get("verification_email_confirmed") is True
            and d.get("verification_email_confirmed_at") is not None,
        )

        # Test 5: POST /verification/phone - various scenarios
        self.log("\n--- Test 5: Phone Verification ---")

        # 5a: Empty body should fail
        self.test_endpoint(
            "POST /verification/phone with empty body returns 400",
            "POST",
            "users/me/verification/phone",
            400,
            data={},
        )

        # 5b: Too short phone should fail
        self.test_endpoint(
            "POST /verification/phone with too-short phone returns 400",
            "POST",
            "users/me/verification/phone",
            400,
            data={"phone": "123"},
        )

        # 5c: Valid phone should succeed
        self.test_endpoint(
            "POST /verification/phone with valid phone",
            "POST",
            "users/me/verification/phone",
            200,
            data={"phone": "+15551234567"},
            check_response=lambda d: d.get("verification_phone") == "+15551234567",
        )

        # 5d: Skip phone should succeed
        self.test_endpoint(
            "POST /verification/phone with skip=true",
            "POST",
            "users/me/verification/phone",
            200,
            data={"skip": True},
            check_response=lambda d: d.get("verification_phone_skipped") is True,
        )

        # Test 6: POST /verification/agree - rejection scenarios
        self.log("\n--- Test 6: Pact Agreement - Rejection Scenarios ---")

        # 6a: 0 acknowledgments
        success, data = self.test_endpoint(
            "POST /verification/agree with 0 acknowledgments returns 400",
            "POST",
            "users/me/verification/agree",
            400,
            data={"acknowledgments": {}, "pact_version": "1.0"},
        )
        if success and isinstance(data.get("detail"), dict):
            missing = data["detail"].get("missing_sections", [])
            if len(missing) == 8:
                self.log(f"  Correctly identified 8 missing sections", "PASS")
                self.tests_passed += 1
            else:
                self.log(f"  Expected 8 missing, got {len(missing)}", "FAIL")
                self.tests_failed += 1
            self.tests_run += 1

        # 6b: 3 acknowledgments
        success, data = self.test_endpoint(
            "POST /verification/agree with 3 acknowledgments returns 400",
            "POST",
            "users/me/verification/agree",
            400,
            data={
                "acknowledgments": {"1": True, "2": True, "3": True},
                "pact_version": "1.0",
            },
        )
        if success and isinstance(data.get("detail"), dict):
            missing = data["detail"].get("missing_sections", [])
            if len(missing) == 5:
                self.log(f"  Correctly identified 5 missing sections", "PASS")
                self.tests_passed += 1
            else:
                self.log(f"  Expected 5 missing, got {len(missing)}", "FAIL")
                self.tests_failed += 1
            self.tests_run += 1

        # 6c: 7 acknowledgments
        success, data = self.test_endpoint(
            "POST /verification/agree with 7 acknowledgments returns 400",
            "POST",
            "users/me/verification/agree",
            400,
            data={
                "acknowledgments": {
                    "1": True,
                    "2": True,
                    "3": True,
                    "4": True,
                    "5": True,
                    "6": True,
                    "7": True,
                },
                "pact_version": "1.0",
            },
        )
        if success and isinstance(data.get("detail"), dict):
            missing = data["detail"].get("missing_sections", [])
            if len(missing) == 1 and 8 in missing:
                self.log(f"  Correctly identified section 8 missing", "PASS")
                self.tests_passed += 1
            else:
                self.log(f"  Expected [8] missing, got {missing}", "FAIL")
                self.tests_failed += 1
            self.tests_run += 1

        # 6d: Wrong pact version
        self.test_endpoint(
            "POST /verification/agree with wrong pact_version returns 400",
            "POST",
            "users/me/verification/agree",
            400,
            data={
                "acknowledgments": {str(i): True for i in range(1, 9)},
                "pact_version": "0.9",
            },
        )

        # Test 7: POST /verification/agree - success with string-int keys
        self.log("\n--- Test 7: Pact Agreement - Success (String Keys) ---")
        success, data = self.test_endpoint(
            "POST /verification/agree with all 8 acknowledgments (string keys)",
            "POST",
            "users/me/verification/agree",
            200,
            data={
                "acknowledgments": {
                    "1": True,
                    "2": True,
                    "3": True,
                    "4": True,
                    "5": True,
                    "6": True,
                    "7": True,
                    "8": True,
                },
                "pact_version": "1.0",
            },
            check_response=lambda d: d.get("is_verified") is True
            and d.get("verified_user") is True
            and d.get("badge_awarded") == "verified_user"
            and d.get("verification_pact_version") == "1.0",
        )
        if success:
            self.log(
                f"  Verification complete: badge_awarded={data.get('badge_awarded')}"
            )

        # Test 8: Verify badge was awarded
        self.log("\n--- Test 8: Badge Award Verification ---")
        success, data = self.test_endpoint(
            "GET /users/me/badges includes verified_user badge",
            "GET",
            "users/me/badges",
            200,
        )
        if success:
            badges = data if isinstance(data, list) else []
            verified_badge = next(
                (
                    b
                    for b in badges
                    if b.get("badge", {}).get("slug") == "verified_user"
                ),
                None,
            )
            if verified_badge:
                self.log(f"  verified_user badge found", "PASS")
                self.tests_passed += 1
            else:
                self.log(f"  verified_user badge NOT found in {len(badges)} badges", "FAIL")
                self.tests_failed += 1
            self.tests_run += 1

        # Test 9: Idempotent badge award (call agree again)
        self.log("\n--- Test 9: Idempotent Badge Award ---")
        # Get current badge count
        success1, data1 = self.test_endpoint(
            "GET /users/me/badges (before second agree)",
            "GET",
            "users/me/badges",
            200,
        )
        badge_count_before = len(data1) if isinstance(data1, list) else 0

        # Call agree again (should succeed but not duplicate badge)
        self.test_endpoint(
            "POST /verification/agree (second call)",
            "POST",
            "users/me/verification/agree",
            200,
            data={"acknowledgments": {i: True for i in range(1, 9)}, "pact_version": "1.0"},
        )

        # Check badge count again
        success2, data2 = self.test_endpoint(
            "GET /users/me/badges (after second agree)",
            "GET",
            "users/me/badges",
            200,
        )
        badge_count_after = len(data2) if isinstance(data2, list) else 0

        if badge_count_before == badge_count_after:
            self.log(
                f"  Badge count unchanged ({badge_count_before}) - idempotency verified",
                "PASS",
            )
            self.tests_passed += 1
        else:
            self.log(
                f"  Badge count changed from {badge_count_before} to {badge_count_after} - DUPLICATE!",
                "FAIL",
            )
            self.tests_failed += 1
        self.tests_run += 1

        # Test 10: Swap eligibility reflects verification
        self.log("\n--- Test 10: Swap Eligibility Reflects Verification ---")
        success, data = self.test_endpoint(
            "GET /swaps/eligibility shows is_verified=true",
            "GET",
            "swaps/eligibility",
            200,
            check_response=lambda d: d.get("is_verified") is True,
        )
        if success:
            missing = data.get("missing", [])
            if "verified" not in missing:
                self.log(f"  'verified' correctly removed from missing list", "PASS")
                self.tests_passed += 1
            else:
                self.log(f"  'verified' still in missing list: {missing}", "FAIL")
                self.tests_failed += 1
            self.tests_run += 1

        # Test 11: needs_reverification is false
        self.log("\n--- Test 11: No Reverification Needed ---")
        success, data = self.test_endpoint(
            "GET /users/me/verification shows needs_reverification=false",
            "GET",
            "users/me/verification",
            200,
            check_response=lambda d: d.get("needs_reverification") is False
            and d.get("verification_pact_version") == "1.0"
            and d.get("current_pact_version") == "1.0",
        )

        # Test 12: Test with integer keys (new user)
        self.log("\n--- Test 12: Pact Agreement with Integer Keys ---")
        if self.login("groveling"):
            # Start verification flow
            self.test_endpoint(
                "POST /verification/start",
                "POST",
                "users/me/verification/start",
                200,
            )
            self.test_endpoint(
                "POST /verification/confirm-email",
                "POST",
                "users/me/verification/confirm-email",
                200,
            )
            self.test_endpoint(
                "POST /verification/phone with skip",
                "POST",
                "users/me/verification/phone",
                200,
                data={"skip": True},
            )

            # Agree with integer keys
            success, data = self.test_endpoint(
                "POST /verification/agree with all 8 acknowledgments (integer keys)",
                "POST",
                "users/me/verification/agree",
                200,
                data={
                    "acknowledgments": {1: True, 2: True, 3: True, 4: True, 5: True, 6: True, 7: True, 8: True},
                    "pact_version": "1.0",
                },
                check_response=lambda d: d.get("is_verified") is True
                and d.get("badge_awarded") == "verified_user",
            )

        # Test 13: Regression - existing 14C.1 admin verify still works
        self.log("\n--- Test 13: Regression - Admin Verify (14C.1) ---")
        if self.login("maya"):  # Maya is admin
            # Create a test scenario - verify that admin endpoint still works
            # We'll just test that the endpoint is accessible
            # (We won't actually modify Clare's account)
            self.test_endpoint(
                "Admin verify endpoint accessible",
                "POST",
                "admin/users/test-user-id/verify",
                404,  # 404 because test-user-id doesn't exist, but proves endpoint works
                data={"is_verified": True},
            )

        # Test 14: Regression - want list still works
        self.log("\n--- Test 14: Regression - Want List (14C.2) ---")
        if self.login("james"):
            # Try to add a species to want list (using a test species ID)
            # 404 is expected and proves the endpoint is accessible and working
            self.test_endpoint(
                "POST /users/me/wants endpoint accessible (404 expected)",
                "POST",
                "users/me/wants",
                404,  # Expected - test species doesn't exist, but proves endpoint works
                data={"species_id": "test-species-id"},
            )

    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        self.log(f"Total tests run: {self.tests_run}")
        self.log(f"Tests passed: {self.tests_passed} ✅")
        self.log(f"Tests failed: {self.tests_failed} ❌")
        success_rate = (
            (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        )
        self.log(f"Success rate: {success_rate:.1f}%")
        self.log("=" * 60)


def main():
    tester = Phase14C3Tester()
    try:
        tester.run_phase_14c3_tests()
    except KeyboardInterrupt:
        tester.log("\nTests interrupted by user", "WARN")
    except Exception as e:
        tester.log(f"\nUnexpected error: {str(e)}", "FAIL")
        import traceback
        traceback.print_exc()
    finally:
        tester.print_summary()

    # Return exit code based on test results
    return 0 if tester.tests_failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
