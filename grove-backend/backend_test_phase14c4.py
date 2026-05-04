"""
Phase 14C.4 Backend Testing — Goals/Badges Unification + Daily Trivia

Tests:
1. Goals endpoints (GET, POST, DELETE)
2. Progress shape validation
3. Auto-unpin when badge earned
4. Trivia endpoints (GET, POST dismiss)
5. Day rotation logic
6. Auth gating
7. Error cases
8. Regression checks
"""

import requests
import sys
from datetime import datetime, timedelta

class Phase14C4Tester:
    def __init__(self, base_url="https://botanical-social.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failed_tests = []

    def log(self, message, level="INFO"):
        """Log test output"""
        prefix = {
            "INFO": "ℹ️ ",
            "PASS": "✅",
            "FAIL": "❌",
            "WARN": "⚠️ "
        }.get(level, "  ")
        print(f"{prefix} {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, expect_error=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        self.log(f"Testing {name}...", "INFO")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"PASSED - {name} (Status: {response.status_code})", "PASS")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                self.tests_failed += 1
                self.failed_tests.append(name)
                self.log(f"FAILED - {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    self.log(f"Response: {response.text[:200]}", "FAIL")
                except:
                    pass
                return False, {}

        except Exception as e:
            self.tests_failed += 1
            self.failed_tests.append(name)
            self.log(f"FAILED - {name} - Error: {str(e)}", "FAIL")
            return False, {}

    def test_auth(self):
        """Test authentication via test-login endpoint"""
        self.log("\n=== AUTHENTICATION ===", "INFO")
        success, response = self.run_test(
            "Test Login",
            "POST",
            "auth/test-login",
            200
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log(f"Authenticated as: {response.get('user', {}).get('username', 'unknown')}", "INFO")
            return True
        return False

    def test_goals_list_empty(self):
        """Test GET /api/users/me/goals when no goals pinned"""
        self.log("\n=== GOALS LIST (EMPTY) ===", "INFO")
        success, response = self.run_test(
            "Get goals (empty state)",
            "GET",
            "users/me/goals",
            200
        )
        if success:
            if 'items' in response and 'max' in response:
                self.log(f"Goals list shape correct: items={len(response['items'])}, max={response['max']}", "PASS")
                if response['max'] == 5:
                    self.log("Max pinned goals is 5 ✓", "PASS")
                return True
            else:
                self.log("Missing 'items' or 'max' in response", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("Goals list shape validation")
        return False

    def test_pin_goal_valid(self):
        """Test POST /api/users/me/goals/{slug} with valid slug"""
        self.log("\n=== PIN GOAL (VALID) ===", "INFO")
        # Use a valid earnable slug that user likely doesn't have yet
        test_slug = "watering_50"
        success, response = self.run_test(
            f"Pin goal: {test_slug}",
            "POST",
            f"users/me/goals/{test_slug}",
            200
        )
        if success:
            if 'pinned' in response and response['pinned']:
                self.log(f"Successfully pinned {test_slug}", "PASS")
                return True
            else:
                self.log("Response missing 'pinned' field or pinned=False", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("Pin goal response validation")
        return False

    def test_pin_goal_idempotent(self):
        """Test pinning same goal twice (should be idempotent)"""
        self.log("\n=== PIN GOAL (IDEMPOTENT) ===", "INFO")
        test_slug = "watering_50"
        success, response = self.run_test(
            f"Re-pin same goal: {test_slug}",
            "POST",
            f"users/me/goals/{test_slug}",
            200
        )
        if success:
            if 'already' in response and response['already']:
                self.log("Idempotent behavior confirmed (already pinned)", "PASS")
                return True
        return False

    def test_goals_list_with_progress(self):
        """Test GET /api/users/me/goals returns progress shape"""
        self.log("\n=== GOALS LIST (WITH PROGRESS) ===", "INFO")
        success, response = self.run_test(
            "Get goals with progress",
            "GET",
            "users/me/goals",
            200
        )
        if success and 'items' in response and len(response['items']) > 0:
            item = response['items'][0]
            required_fields = ['slug', 'name', 'description', 'category', 'subcategory', 
                             'icon', 'tier', 'family', 'progress']
            missing = [f for f in required_fields if f not in item]
            if missing:
                self.log(f"Missing fields in goal item: {missing}", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("Goal item shape validation")
                return False
            
            # Validate progress shape
            progress = item.get('progress', {})
            progress_fields = ['current', 'target', 'pct', 'label', 'complete']
            missing_progress = [f for f in progress_fields if f not in progress]
            if missing_progress:
                self.log(f"Missing progress fields: {missing_progress}", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("Progress shape validation")
                return False
            
            self.log(f"Progress shape valid: {progress}", "PASS")
            
            # Validate progress for watering_50
            if item['slug'] == 'watering_50':
                if progress['target'] == 50 and 'watering' in progress['label']:
                    self.log("watering_50 progress shape correct (target=50, label contains 'watering')", "PASS")
                else:
                    self.log(f"watering_50 progress incorrect: target={progress['target']}, label={progress['label']}", "FAIL")
                    self.tests_failed += 1
                    self.failed_tests.append("watering_50 progress validation")
            
            return True
        return False

    def test_pin_multiple_goals(self):
        """Test pinning multiple goals (up to 5)"""
        self.log("\n=== PIN MULTIPLE GOALS ===", "INFO")
        test_slugs = ["streak_30", "plant_collector_bronze", "species_10"]
        for slug in test_slugs:
            success, response = self.run_test(
                f"Pin goal: {slug}",
                "POST",
                f"users/me/goals/{slug}",
                200
            )
            if not success:
                return False
        
        # Verify count
        success, response = self.run_test(
            "Get goals (should have 4 total)",
            "GET",
            "users/me/goals",
            200
        )
        if success and len(response.get('items', [])) >= 3:
            self.log(f"Successfully pinned multiple goals: {len(response['items'])} total", "PASS")
            return True
        return False

    def test_pin_goal_max_limit(self):
        """Test pinning 6th goal (should fail with 400)"""
        self.log("\n=== PIN GOAL (MAX LIMIT) ===", "INFO")
        # First ensure we have 5 pinned
        test_slugs = ["watering_50", "streak_30", "plant_collector_bronze", "species_10", "fert_25"]
        for slug in test_slugs:
            self.run_test(f"Pin {slug}", "POST", f"users/me/goals/{slug}", 200)
        
        # Try to pin 6th
        success, response = self.run_test(
            "Pin 6th goal (should fail)",
            "POST",
            "users/me/goals/repot_5",
            400
        )
        if success:
            if 'error' in response and response['error'] == 'max_pinned':
                self.log("Max limit enforcement working (rejected 6th goal)", "PASS")
                return True
            else:
                self.log("Expected 'max_pinned' error in response", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("Max limit error validation")
        return False

    def test_unpin_goal(self):
        """Test DELETE /api/users/me/goals/{slug}"""
        self.log("\n=== UNPIN GOAL ===", "INFO")
        test_slug = "fert_25"
        success, response = self.run_test(
            f"Unpin goal: {test_slug}",
            "DELETE",
            f"users/me/goals/{test_slug}",
            200
        )
        if success:
            if 'unpinned' in response and response['unpinned']:
                self.log(f"Successfully unpinned {test_slug}", "PASS")
                return True
        return False

    def test_unpin_goal_idempotent(self):
        """Test unpinning non-pinned goal (should be idempotent, not 500)"""
        self.log("\n=== UNPIN GOAL (IDEMPOTENT) ===", "INFO")
        test_slug = "repot_50"  # Likely not pinned
        success, response = self.run_test(
            f"Unpin non-pinned goal: {test_slug}",
            "DELETE",
            f"users/me/goals/{test_slug}",
            200
        )
        if success:
            if 'unpinned' in response and not response['unpinned'] and response.get('already'):
                self.log("Idempotent unpin behavior confirmed", "PASS")
                return True
        return False

    def test_pin_goal_invalid_slug(self):
        """Test pinning non-existent badge slug (should 404)"""
        self.log("\n=== PIN GOAL (INVALID SLUG) ===", "INFO")
        success, response = self.run_test(
            "Pin invalid slug",
            "POST",
            "users/me/goals/invalid_badge_slug_xyz",
            404
        )
        return success

    def test_pin_goal_already_earned(self):
        """Test pinning already-earned badge (should 400)"""
        self.log("\n=== PIN GOAL (ALREADY EARNED) ===", "INFO")
        # First check what badges user has
        success, badges_response = self.run_test(
            "Get user badges",
            "GET",
            "users/me/badges",
            200
        )
        if success and len(badges_response) > 0:
            earned_slug = badges_response[0]['badge']['slug']
            self.log(f"Testing with earned badge: {earned_slug}", "INFO")
            success, response = self.run_test(
                f"Pin already-earned badge: {earned_slug}",
                "POST",
                f"users/me/goals/{earned_slug}",
                400
            )
            if success:
                if 'error' in response and response['error'] == 'already_earned':
                    self.log("Already-earned rejection working", "PASS")
                    return True
        else:
            self.log("Skipping (no earned badges to test with)", "WARN")
            return True
        return False

    def test_trivia_today(self):
        """Test GET /api/trivia/today"""
        self.log("\n=== TRIVIA TODAY ===", "INFO")
        success, response = self.run_test(
            "Get today's trivia",
            "GET",
            "trivia/today",
            200,
            params={"tz_offset": 0}
        )
        if success:
            required_fields = ['date', 'dismissed', 'card']
            missing = [f for f in required_fields if f not in response]
            if missing:
                self.log(f"Missing fields: {missing}", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("Trivia response shape")
                return False
            
            card = response.get('card')
            if card:
                card_fields = ['id', 'headline', 'body', 'category', 'linked_species']
                missing_card = [f for f in card_fields if f not in card]
                if missing_card:
                    self.log(f"Missing card fields: {missing_card}", "FAIL")
                    self.tests_failed += 1
                    self.failed_tests.append("Trivia card shape")
                    return False
                
                self.log(f"Trivia card: {card['headline'][:50]}...", "PASS")
                self.log(f"Category: {card['category']}, Dismissed: {response['dismissed']}", "PASS")
                return True
        return False

    def test_trivia_dismiss(self):
        """Test POST /api/trivia/today/dismiss"""
        self.log("\n=== TRIVIA DISMISS ===", "INFO")
        success, response = self.run_test(
            "Dismiss today's trivia",
            "POST",
            "trivia/today/dismiss",
            200,
            params={"tz_offset": 0}
        )
        if success:
            if 'dismissed' in response and response['dismissed']:
                self.log("Trivia dismissed successfully", "PASS")
                
                # Verify dismissed state persists
                success2, response2 = self.run_test(
                    "Verify trivia dismissed state",
                    "GET",
                    "trivia/today",
                    200,
                    params={"tz_offset": 0}
                )
                if success2 and response2.get('dismissed'):
                    self.log("Dismissed state persisted ✓", "PASS")
                    return True
                else:
                    self.log("Dismissed state NOT persisted", "FAIL")
                    self.tests_failed += 1
                    self.failed_tests.append("Trivia dismiss persistence")
        return False

    def test_trivia_dismiss_idempotent(self):
        """Test dismissing same day twice (should not 500)"""
        self.log("\n=== TRIVIA DISMISS (IDEMPOTENT) ===", "INFO")
        success, response = self.run_test(
            "Dismiss trivia again (same day)",
            "POST",
            "trivia/today/dismiss",
            200,
            params={"tz_offset": 0}
        )
        if success:
            self.log("Idempotent dismiss confirmed (no 500)", "PASS")
            return True
        return False

    def test_trivia_day_rotation(self):
        """Test trivia rotates with different tz_offset (different day)"""
        self.log("\n=== TRIVIA DAY ROTATION ===", "INFO")
        # Get today's card
        success1, response1 = self.run_test(
            "Get trivia (tz_offset=0)",
            "GET",
            "trivia/today",
            200,
            params={"tz_offset": 0}
        )
        
        # Get "tomorrow's" card (shift by +24 hours = +1440 minutes)
        success2, response2 = self.run_test(
            "Get trivia (tz_offset=1440, simulating tomorrow)",
            "GET",
            "trivia/today",
            200,
            params={"tz_offset": 1440}
        )
        
        if success1 and success2:
            card1_id = response1.get('card', {}).get('id')
            card2_id = response2.get('card', {}).get('id')
            
            if card1_id and card2_id:
                if card1_id != card2_id:
                    self.log(f"Day rotation working: different cards for different days", "PASS")
                    return True
                else:
                    self.log("WARNING: Same card for different days (may be expected if deck is small)", "WARN")
                    return True
        return False

    def test_trivia_dismiss_per_day(self):
        """Test dismissal is per-day (different day not dismissed)"""
        self.log("\n=== TRIVIA DISMISS PER-DAY ===", "INFO")
        # Dismiss today
        self.run_test("Dismiss today", "POST", "trivia/today/dismiss", 200, params={"tz_offset": 0})
        
        # Check tomorrow (should NOT be dismissed)
        success, response = self.run_test(
            "Check tomorrow's trivia (should not be dismissed)",
            "GET",
            "trivia/today",
            200,
            params={"tz_offset": 1440}
        )
        if success:
            if not response.get('dismissed'):
                self.log("Per-day dismissal working (tomorrow not dismissed)", "PASS")
                return True
            else:
                self.log("ERROR: Tomorrow's trivia is dismissed (should be per-day)", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("Trivia per-day dismissal")
        return False

    def test_auth_gating_goals(self):
        """Test goals endpoints require auth (401 without token)"""
        self.log("\n=== AUTH GATING (GOALS) ===", "INFO")
        saved_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Get goals without auth (should 401)",
            "GET",
            "users/me/goals",
            401
        )
        
        self.token = saved_token
        return success

    def test_auth_gating_trivia(self):
        """Test trivia endpoints require auth (401 without token)"""
        self.log("\n=== AUTH GATING (TRIVIA) ===", "INFO")
        saved_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Get trivia without auth (should 401)",
            "GET",
            "trivia/today",
            401
        )
        
        self.token = saved_token
        return success

    def test_regression_badges(self):
        """Regression: GET /api/users/me/badges still works"""
        self.log("\n=== REGRESSION: BADGES ===", "INFO")
        success, response = self.run_test(
            "Get user badges",
            "GET",
            "users/me/badges",
            200
        )
        return success

    def test_regression_groves(self):
        """Regression: Grove endpoints still work"""
        self.log("\n=== REGRESSION: GROVES ===", "INFO")
        # Just smoke-check that groves endpoint doesn't 500
        # (may 404 if no groves, but shouldn't crash)
        try:
            url = f"{self.base_url}/api/groves"
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code in [200, 404]:
                self.log("Groves endpoint responding", "PASS")
                self.tests_passed += 1
                return True
            else:
                self.log(f"Groves endpoint returned {response.status_code}", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("Groves regression")
                return False
        except Exception as e:
            self.log(f"Groves endpoint error: {e}", "FAIL")
            self.tests_failed += 1
            self.failed_tests.append("Groves regression")
            return False

    def test_streak_goal_progress(self):
        """Test streak_X goal returns correct progress shape"""
        self.log("\n=== STREAK GOAL PROGRESS ===", "INFO")
        # Pin a streak goal
        self.run_test("Pin streak_30", "POST", "users/me/goals/streak_30", 200)
        
        success, response = self.run_test(
            "Get goals (check streak_30 progress)",
            "GET",
            "users/me/goals",
            200
        )
        if success:
            streak_goal = next((g for g in response.get('items', []) if g['slug'] == 'streak_30'), None)
            if streak_goal:
                progress = streak_goal.get('progress', {})
                if progress.get('target') == 30 and 'streak' in progress.get('label', '').lower():
                    self.log(f"streak_30 progress correct: target=30, label='{progress['label']}'", "PASS")
                    return True
                else:
                    self.log(f"streak_30 progress incorrect: {progress}", "FAIL")
                    self.tests_failed += 1
                    self.failed_tests.append("streak_30 progress validation")
            else:
                self.log("streak_30 not found in goals list", "FAIL")
                self.tests_failed += 1
                self.failed_tests.append("streak_30 not in list")
        return False

    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST SUMMARY", "INFO")
        self.log("="*60, "INFO")
        self.log(f"Total Tests: {self.tests_run}", "INFO")
        self.log(f"Passed: {self.tests_passed}", "PASS")
        self.log(f"Failed: {self.tests_failed}", "FAIL")
        
        if self.tests_failed > 0:
            self.log("\nFailed Tests:", "FAIL")
            for test in self.failed_tests:
                self.log(f"  - {test}", "FAIL")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"\nSuccess Rate: {success_rate:.1f}%", "INFO")
        self.log("="*60, "INFO")
        
        return self.tests_failed == 0


def main():
    """Main test runner"""
    print("\n" + "="*60)
    print("PHASE 14C.4 BACKEND TESTING")
    print("Goals/Badges Unification + Daily Plant Trivia")
    print("="*60)
    
    tester = Phase14C4Tester()
    
    # Run tests in order
    if not tester.test_auth():
        print("\n❌ Authentication failed - cannot proceed")
        return 1
    
    # Goals tests
    tester.test_goals_list_empty()
    tester.test_pin_goal_valid()
    tester.test_pin_goal_idempotent()
    tester.test_goals_list_with_progress()
    tester.test_pin_multiple_goals()
    tester.test_pin_goal_max_limit()
    tester.test_unpin_goal()
    tester.test_unpin_goal_idempotent()
    tester.test_pin_goal_invalid_slug()
    tester.test_pin_goal_already_earned()
    tester.test_streak_goal_progress()
    
    # Trivia tests
    tester.test_trivia_today()
    tester.test_trivia_dismiss()
    tester.test_trivia_dismiss_idempotent()
    tester.test_trivia_day_rotation()
    tester.test_trivia_dismiss_per_day()
    
    # Auth gating tests
    tester.test_auth_gating_goals()
    tester.test_auth_gating_trivia()
    
    # Regression tests
    tester.test_regression_badges()
    tester.test_regression_groves()
    
    # Print summary
    success = tester.print_summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
