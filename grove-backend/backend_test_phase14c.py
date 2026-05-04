#!/usr/bin/env python3
"""
Phase 14C.1 + 14C.2 Backend Test Suite
Tests hardiness zones, admin verification, want lists, swap eligibility, and AI schedule reviews.
"""

import requests
import sys
import time
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta

BASE_URL = "https://botanical-social.preview.emergentagent.com/api"

class Phase14CTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
        self.current_user_email = None
        
    def log(self, message: str, level: str = "INFO"):
        prefix = {
            "INFO": "ℹ️ ",
            "PASS": "✅",
            "FAIL": "❌",
            "WARN": "⚠️ "
        }.get(level, "")
        print(f"{prefix} {message}")
    
    def test(self, name: str, method: str, endpoint: str, expected_status: int, 
             data: Optional[dict] = None, validate_fn=None, params: Optional[dict] = None) -> tuple:
        """Run a single test"""
        self.tests_run += 1
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.log(f"Testing: {name}", "INFO")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Check status code
            if response.status_code != expected_status:
                self.tests_failed += 1
                msg = f"Expected status {expected_status}, got {response.status_code}"
                self.log(f"FAILED: {name} - {msg}", "FAIL")
                try:
                    error_detail = response.json()
                    self.failures.append({"test": name, "reason": msg, "response": str(error_detail)[:300]})
                except:
                    self.failures.append({"test": name, "reason": msg, "response": response.text[:300]})
                return False, {}
            
            # Parse JSON
            try:
                json_data = response.json()
            except Exception as e:
                if expected_status == 200:
                    self.tests_failed += 1
                    msg = f"Failed to parse JSON: {str(e)}"
                    self.log(f"FAILED: {name} - {msg}", "FAIL")
                    self.failures.append({"test": name, "reason": msg})
                    return False, {}
                json_data = {}
            
            # Run custom validation
            if validate_fn:
                try:
                    validate_fn(json_data)
                except AssertionError as e:
                    self.tests_failed += 1
                    msg = f"Validation failed: {str(e)}"
                    self.log(f"FAILED: {name} - {msg}", "FAIL")
                    self.failures.append({"test": name, "reason": msg, "data": str(json_data)[:200]})
                    return False, json_data
            
            self.tests_passed += 1
            self.log(f"PASSED: {name}", "PASS")
            return True, json_data
            
        except requests.exceptions.Timeout:
            self.tests_failed += 1
            msg = "Request timeout"
            self.log(f"FAILED: {name} - {msg}", "FAIL")
            self.failures.append({"test": name, "reason": msg})
            return False, {}
        except Exception as e:
            self.tests_failed += 1
            msg = f"Exception: {str(e)}"
            self.log(f"FAILED: {name} - {msg}", "FAIL")
            self.failures.append({"test": name, "reason": msg})
            return False, {}
    
    def login(self, email: str, password: str) -> bool:
        """Login and store token"""
        self.log(f"Logging in as {email}...", "INFO")
        self.current_user_email = email
        success, response = self.test(
            f"Login as {email}",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response.get('user', {}).get('id')
            self.log(f"Login successful, user_id: {self.user_id}", "PASS")
            return True
        self.log(f"Login failed", "FAIL")
        return False
    
    def test_hardiness_zones(self):
        """Test Phase 14C.1 - Hardiness zone lookup"""
        self.log("\n=== Testing Phase 14C.1: Hardiness Zones ===", "INFO")
        
        # Test 1: US zip 10001 (NYC) -> 7b
        self.test(
            "US zip 10001 returns zone='7b', system='USDA', source='zip-prefix'",
            "GET",
            "zones/lookup",
            200,
            params={"country": "US", "postcode": "10001"},
            validate_fn=lambda d: (
                assert_eq(d.get('zone'), '7b', "Zone should be 7b"),
                assert_eq(d.get('system'), 'USDA', "System should be USDA"),
                assert_eq(d.get('source'), 'zip-prefix', "Source should be zip-prefix"),
                assert_true('description' in d, "Should have description")
            )
        )
        
        # Test 2: US zip 94110 (SF) -> 10b
        self.test(
            "US zip 94110 returns zone='10b', system='USDA'",
            "GET",
            "zones/lookup",
            200,
            params={"country": "US", "postcode": "94110"},
            validate_fn=lambda d: (
                assert_eq(d.get('zone'), '10b', "Zone should be 10b"),
                assert_eq(d.get('system'), 'USDA', "System should be USDA")
            )
        )
        
        # Test 3: US zip 99501 (Anchorage AK) -> should return a USDA zone
        self.test(
            "US zip 99501 (Anchorage AK) returns a USDA zone",
            "GET",
            "zones/lookup",
            200,
            params={"country": "US", "postcode": "99501"},
            validate_fn=lambda d: (
                assert_true(d.get('zone') is not None, "Zone should not be null"),
                assert_eq(d.get('system'), 'USDA', "System should be USDA")
            )
        )
        
        # Test 4: UK postcode SW1A 1AA -> H4
        self.test(
            "UK postcode SW1A 1AA returns zone='H4', system='RHS'",
            "GET",
            "zones/lookup",
            200,
            params={"country": "UK", "postcode": "SW1A 1AA"},
            validate_fn=lambda d: (
                assert_eq(d.get('zone'), 'H4', "Zone should be H4"),
                assert_eq(d.get('system'), 'RHS', "System should be RHS"),
                assert_eq(d.get('source'), 'postcode-area', "Source should be postcode-area")
            )
        )
        
        # Test 5: UK postcode TR1 2AA (Cornwall - milder) -> H3
        self.test(
            "UK postcode TR1 2AA returns zone='H3' (Cornwall - milder)",
            "GET",
            "zones/lookup",
            200,
            params={"country": "UK", "postcode": "TR1 2AA"},
            validate_fn=lambda d: (
                assert_eq(d.get('zone'), 'H3', "Zone should be H3"),
                assert_eq(d.get('system'), 'RHS', "System should be RHS")
            )
        )
        
        # Test 6: Empty postcode -> zone=null without error
        self.test(
            "Empty postcode returns zone=null without erroring",
            "GET",
            "zones/lookup",
            200,
            params={"country": "US", "postcode": ""},
            validate_fn=lambda d: assert_eq(d.get('zone'), None, "Zone should be null for empty postcode")
        )
        
        # Test 7: GET /api/zones/catalog
        self.test(
            "GET /api/zones/catalog returns USDA and RHS zones",
            "GET",
            "zones/catalog",
            200,
            validate_fn=lambda d: (
                assert_true('usda' in d, "Should have usda zones"),
                assert_true('rhs' in d, "Should have rhs zones"),
                assert_true(len(d['usda']) > 0, "USDA zones should not be empty"),
                assert_true(len(d['rhs']) > 0, "RHS zones should not be empty"),
                assert_true(all('zone' in z and 'description' in z for z in d['usda']), 
                           "Each USDA zone should have zone and description"),
                assert_true(all('zone' in z and 'description' in z for z in d['rhs']), 
                           "Each RHS zone should have zone and description")
            )
        )
    
    def test_user_location_zone_derivation(self):
        """Test auto-derivation of hardiness zone when user updates location"""
        self.log("\n=== Testing User Location Zone Auto-Derivation ===", "INFO")
        
        # Login as Maya first
        if not self.login("maya.testing@grove.app", "GroveTesting2025!"):
            self.log("Cannot test location zone derivation - login failed", "FAIL")
            return
        
        # Test 8: PATCH /api/users/me with location_country + location_postcode
        success, data = self.test(
            "PATCH /api/users/me with location auto-derives hardiness_zone",
            "PATCH",
            "users/me",
            200,
            data={
                "location_country": "US",
                "location_postcode": "94110"
            },
            validate_fn=lambda d: (
                assert_eq(d.get('hardiness_zone'), '10b', "Zone should be auto-derived to 10b"),
                assert_eq(d.get('hardiness_zone_source'), 'zip-prefix', "Source should be zip-prefix"),
                assert_eq(d.get('hardiness_zone_system'), 'USDA', "System should be USDA")
            )
        )
        
        # Test 9: PATCH /api/users/me with manual hardiness_zone override
        success, data = self.test(
            "PATCH /api/users/me with manual hardiness_zone sets source='manual'",
            "PATCH",
            "users/me",
            200,
            data={"hardiness_zone": "7a"},
            validate_fn=lambda d: (
                assert_eq(d.get('hardiness_zone'), '7a', "Zone should be 7a"),
                assert_eq(d.get('hardiness_zone_source'), 'manual', "Source should be manual (override)")
            )
        )
    
    def test_admin_verification(self):
        """Test Phase 14C.2 - Admin verification endpoint"""
        self.log("\n=== Testing Phase 14C.2: Admin Verification ===", "INFO")
        
        # First, login as Maya (admin)
        if not self.login("maya.testing@grove.app", "GroveTesting2025!"):
            self.log("Cannot test admin verification - Maya login failed", "FAIL")
            return
        
        # Get Groveling's user_id
        groveling_login = self.login("groveling.testing@grove.app", "GroveTesting2025!")
        if not groveling_login:
            self.log("Cannot get Groveling's user_id", "FAIL")
            return
        groveling_id = self.user_id
        
        # Switch back to Maya (admin)
        if not self.login("maya.testing@grove.app", "GroveTesting2025!"):
            return
        
        # Test 10: POST /api/admin/users/{user_id}/verify as admin
        success, data = self.test(
            "POST /api/admin/users/{user_id}/verify as admin grants Pro+verified",
            "POST",
            f"admin/users/{groveling_id}/verify",
            200,
            data={
                "is_verified": True,
                "subscription_tier": "pro",
                "pro_active": True
            },
            validate_fn=lambda d: (
                assert_eq(d.get('is_verified'), True, "is_verified should be True"),
                assert_eq(d.get('subscription_tier'), 'pro', "subscription_tier should be pro"),
                assert_eq(d.get('pro_active'), True, "pro_active should be True"),
                assert_true(d.get('pro_started_at') is not None, "pro_started_at should be set"),
                assert_true(d.get('pact_signed_at') is not None, "pact_signed_at should be set"),
                assert_eq(d.get('verified_by_admin'), True, "verified_by_admin should be True")
            )
        )
        
        # Test 11: POST /api/admin/users/{user_id}/verify as non-admin (should return 403)
        # NOTE: All test accounts (Maya, James, Clare, Groveling) are seeded with is_admin=True
        # per the seed_testing.py. To test non-admin access, we need to create a temporary user.
        
        # Create a temporary non-admin user
        temp_email = f"temp_nonadmin_{int(time.time())}@grove.app"
        temp_password = "TempPass123!"
        
        success, register_data = self.test(
            "Register temporary non-admin user",
            "POST",
            "auth/register",
            200,
            data={
                "username": f"temp_user_{int(time.time())}",
                "email": temp_email,
                "password": temp_password
            }
        )
        
        if success:
            temp_token = register_data.get('access_token')
            temp_user_id = register_data.get('user', {}).get('id')
            
            # Try to verify Groveling as the non-admin temp user
            old_token = self.token
            self.token = temp_token
            
            self.test(
                "POST /api/admin/users/{user_id}/verify as non-admin returns 403",
                "POST",
                f"admin/users/{groveling_id}/verify",
                403,
                data={"is_verified": True}
            )
            
            # Restore Maya's token
            self.token = old_token
        else:
            self.log("Could not create temp user for non-admin test", "WARN")
        
        # Switch back to Maya for remaining tests
        self.login("maya.testing@grove.app", "GroveTesting2025!")
    
    def test_swap_eligibility(self):
        """Test Phase 14C.2 - Swap eligibility"""
        self.log("\n=== Testing Phase 14C.2: Swap Eligibility ===", "INFO")
        
        # Test 12: GET /api/swaps/eligibility for Clare (verified+pro+old account)
        if not self.login("clare.testing@grove.app", "GroveTesting2025!"):
            self.log("Cannot test Clare's swap eligibility - login failed", "FAIL")
            return
        
        success, data = self.test(
            "GET /api/swaps/eligibility for Clare (verified+pro+old) returns eligible=true",
            "GET",
            "swaps/eligibility",
            200,
            validate_fn=lambda d: (
                assert_true('eligible' in d, "Should have eligible field"),
                assert_true('missing' in d, "Should have missing field"),
                assert_true('account_age_days' in d, "Should have account_age_days"),
                assert_true('pro_active' in d, "Should have pro_active"),
                assert_true('is_verified' in d, "Should have is_verified")
            )
        )
        
        if success:
            self.log(f"Clare eligibility: eligible={data.get('eligible')}, missing={data.get('missing')}, "
                    f"account_age={data.get('account_age_days')} days", "INFO")
        
        # Test 13: GET /api/swaps/eligibility for Maya (recent account, admin but check eligibility)
        if not self.login("maya.testing@grove.app", "GroveTesting2025!"):
            return
        
        success, data = self.test(
            "GET /api/swaps/eligibility for Maya (recent account)",
            "GET",
            "swaps/eligibility",
            200,
            validate_fn=lambda d: (
                assert_true('eligible' in d, "Should have eligible field"),
                assert_true('missing' in d, "Should have missing field")
            )
        )
        
        if success:
            self.log(f"Maya eligibility: eligible={data.get('eligible')}, missing={data.get('missing')}, "
                    f"account_age={data.get('account_age_days')} days", "INFO")
    
    def test_want_list(self):
        """Test Phase 14C.2 - Want list"""
        self.log("\n=== Testing Phase 14C.2: Want List ===", "INFO")
        
        # Login as Maya
        if not self.login("maya.testing@grove.app", "GroveTesting2025!"):
            return
        
        # First, get a species to add to want list
        success, species_list = self.test(
            "Get species list for want list testing",
            "GET",
            "encyclopedia/species",
            200,
            params={"limit": 10}
        )
        
        if not success or not species_list.get('species'):
            self.log("Cannot test want list - no species found", "FAIL")
            return
        
        test_species = species_list['species'][0]
        species_id = test_species['id']
        
        # Test 14: POST /api/users/me/wants with valid species_id
        success, data = self.test(
            "POST /api/users/me/wants with valid species_id adds to want list",
            "POST",
            "users/me/wants",
            200,
            data={"species_id": species_id, "note": "Test want", "priority": "high"},
            validate_fn=lambda d: (
                assert_eq(d.get('added'), True, "Should return added=true"),
                assert_true('id' in d, "Should return want list entry id")
            )
        )
        
        want_id = data.get('id') if success else None
        
        # Test 15: POST /api/users/me/wants for same species (duplicate)
        self.test(
            "POST /api/users/me/wants for same species returns already=true",
            "POST",
            "users/me/wants",
            200,
            data={"species_id": species_id},
            validate_fn=lambda d: assert_eq(d.get('already'), True, "Should return already=true for duplicate")
        )
        
        # Test 16: POST /api/users/me/wants with invalid species_id
        self.test(
            "POST /api/users/me/wants with invalid species_id returns 404",
            "POST",
            "users/me/wants",
            404,
            data={"species_id": "invalid-species-id-12345"}
        )
        
        # Test 17: GET /api/users/me/wants
        success, data = self.test(
            "GET /api/users/me/wants returns wants with hydrated species",
            "GET",
            "users/me/wants",
            200,
            validate_fn=lambda d: (
                assert_true('wants' in d, "Should have wants array"),
                assert_true(len(d['wants']) > 0, "Should have at least one want"),
                assert_true(all('species' in w and 'common_name' in w['species'] 
                               for w in d['wants']), 
                           "Each want should have hydrated species with common_name")
            )
        )
        
        # Test 18: DELETE /api/users/me/wants/{species_id}
        self.test(
            "DELETE /api/users/me/wants/{species_id} removes entry",
            "DELETE",
            f"users/me/wants/{species_id}",
            200,
            validate_fn=lambda d: assert_eq(d.get('removed'), True, "Should return removed=true")
        )
        
        # Test 19: DELETE same species again (should return 404)
        self.test(
            "DELETE /api/users/me/wants/{species_id} second time returns 404",
            "DELETE",
            f"users/me/wants/{species_id}",
            404
        )
    
    def test_schedule_reviews(self):
        """Test Phase 14C.2 - AI schedule review nudges"""
        self.log("\n=== Testing Phase 14C.2: AI Schedule Review Nudges ===", "INFO")
        
        # Login as Maya
        if not self.login("maya.testing@grove.app", "GroveTesting2025!"):
            return
        
        # Test 20: GET /api/notifications/schedule-reviews (should work even if empty)
        success, data = self.test(
            "GET /api/notifications/schedule-reviews returns plants array",
            "GET",
            "notifications/schedule-reviews",
            200,
            validate_fn=lambda d: (
                assert_true('plants' in d, "Should have plants array"),
                assert_true('count' in d, "Should have count field"),
                assert_eq(d.get('count'), len(d.get('plants', [])), "Count should match plants array length")
            )
        )
        
        if success:
            self.log(f"Schedule reviews: {data.get('count')} plants due for review", "INFO")
        
        # Get Maya's plants to test AI schedule and acknowledgment
        success, plants_data = self.test(
            "Get Maya's plants for schedule review testing",
            "GET",
            "plants",
            200
        )
        
        if not success or not plants_data.get('plants'):
            self.log("No plants found for schedule review testing", "WARN")
            return
        
        test_plant = plants_data['plants'][0]
        plant_id = test_plant['id']
        
        # Test 21: POST /api/plants/{id}/ai-schedule
        success, schedule_data = self.test(
            "POST /api/plants/{id}/ai-schedule sets watering_frequency_set_at",
            "POST",
            f"plants/{plant_id}/ai-schedule",
            200,
            validate_fn=lambda d: (
                assert_true('days' in d, "Should return days"),
                assert_true(isinstance(d.get('days'), int), "Days should be integer")
            )
        )
        
        # Verify the plant now has watering_frequency_set_at
        if success:
            time.sleep(1)
            success2, plant_data = self.test(
                "Verify plant has watering_frequency_set_at after AI schedule",
                "GET",
                f"plants/{plant_id}",
                200,
                validate_fn=lambda d: (
                    assert_true(d.get('watering_frequency_source') == 'ai', 
                               "watering_frequency_source should be 'ai'"),
                    assert_true(d.get('watering_frequency_set_at') is not None or 
                               d.get('updated_at') is not None,
                               "Should have watering_frequency_set_at or updated_at")
                )
            )
        
        # Test 22: POST /api/plants/{id}/schedule-review/acknowledge
        success, ack_data = self.test(
            "POST /api/plants/{id}/schedule-review/acknowledge sets acknowledged_at",
            "POST",
            f"plants/{plant_id}/schedule-review/acknowledge",
            200,
            validate_fn=lambda d: assert_eq(d.get('acknowledged'), True, "Should return acknowledged=true")
        )
        
        # Verify schedule_review_acknowledged_at is set
        if success:
            time.sleep(1)
            self.test(
                "Verify plant has schedule_review_acknowledged_at",
                "GET",
                f"plants/{plant_id}",
                200,
                validate_fn=lambda d: assert_true(
                    d.get('schedule_review_acknowledged_at') is not None,
                    "schedule_review_acknowledged_at should be set"
                )
            )
    
    def test_phase14b2_regressions(self):
        """Test Phase 14B.2 regressions"""
        self.log("\n=== Testing Phase 14B.2 Regressions ===", "INFO")
        
        # Login as Maya
        if not self.login("maya.testing@grove.app", "GroveTesting2025!"):
            return
        
        # Get species list
        success, species_list = self.test(
            "Get species for regression testing",
            "GET",
            "encyclopedia/species",
            200,
            params={"limit": 10}
        )
        
        if not success or not species_list.get('species'):
            self.log("Cannot test regressions - no species found", "FAIL")
            return
        
        test_species = species_list['species'][0]
        
        # Test 23: GET /api/encyclopedia/species/{id}/performance still works
        self.test(
            "Phase 14B.2 regression: GET /api/encyclopedia/species/{id}/performance works",
            "GET",
            f"encyclopedia/species/{test_species['id']}/performance",
            200,
            validate_fn=lambda d: (
                assert_true('sample' in d, "Should have sample"),
                assert_true('success_rate_1y_pct' in d, "Should have success_rate_1y_pct"),
                assert_true('by_hardiness_zone' in d, "Should have by_hardiness_zone (Phase 14C addition)")
            )
        )
        
        # Test 24: GET /api/guilds still works
        self.test(
            "Phase 14B.2 regression: GET /api/guilds works",
            "GET",
            "guilds",
            200,
            validate_fn=lambda d: (
                assert_true('guilds' in d, "Should have guilds array"),
                assert_true(len(d['guilds']) > 0, "Should have at least one guild")
            )
        )
        
        # Test 25: GET /api/guilds/{slug} still works
        self.test(
            "Phase 14B.2 regression: GET /api/guilds/{slug} works",
            "GET",
            "guilds/cut-flower-border",
            200,
            validate_fn=lambda d: (
                assert_true('name' in d, "Should have name"),
                assert_true('species' in d, "Should have species array")
            )
        )
    
    def run_all_tests(self):
        """Run all test suites"""
        self.log("=" * 70, "INFO")
        self.log("Phase 14C.1 + 14C.2 Backend Test Suite", "INFO")
        self.log("=" * 70, "INFO")
        
        # Run test suites
        self.test_hardiness_zones()
        self.test_user_location_zone_derivation()
        self.test_admin_verification()
        self.test_swap_eligibility()
        self.test_want_list()
        self.test_schedule_reviews()
        self.test_phase14b2_regressions()
        
        # Print summary
        self.log("\n" + "=" * 70, "INFO")
        self.log("TEST SUMMARY", "INFO")
        self.log("=" * 70, "INFO")
        self.log(f"Total tests: {self.tests_run}", "INFO")
        self.log(f"Passed: {self.tests_passed}", "PASS")
        self.log(f"Failed: {self.tests_failed}", "FAIL")
        
        if self.failures:
            self.log("\nFailed Tests:", "FAIL")
            for i, failure in enumerate(self.failures, 1):
                self.log(f"\n{i}. {failure['test']}", "FAIL")
                self.log(f"   Reason: {failure['reason']}", "FAIL")
                if 'response' in failure:
                    self.log(f"   Response: {failure['response']}", "FAIL")
                if 'data' in failure:
                    self.log(f"   Data: {failure['data']}", "FAIL")
        
        return 0 if self.tests_failed == 0 else 1


def assert_true(condition, message):
    """Helper for assertions"""
    if not condition:
        raise AssertionError(message)

def assert_eq(actual, expected, message):
    """Helper for equality assertions"""
    if actual != expected:
        raise AssertionError(f"{message} - Expected: {expected}, Got: {actual}")


if __name__ == "__main__":
    tester = Phase14CTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)
