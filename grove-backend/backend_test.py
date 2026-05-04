#!/usr/bin/env python3
"""
Phase 14B.2 Backend Test Suite
Tests companion plants, themed guilds, species performance reports, and narratives.
"""

import requests
import sys
import time
from typing import Optional

BASE_URL = "https://botanical-social.preview.emergentagent.com/api"

class Phase14B2Tester:
    def __init__(self):
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
        
    def log(self, message: str, level: str = "INFO"):
        prefix = {
            "INFO": "ℹ️ ",
            "PASS": "✅",
            "FAIL": "❌",
            "WARN": "⚠️ "
        }.get(level, "")
        print(f"{prefix} {message}")
    
    def test(self, name: str, method: str, endpoint: str, expected_status: int, 
             data: Optional[dict] = None, validate_fn=None) -> tuple:
        """Run a single test"""
        self.tests_run += 1
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.log(f"Testing: {name}", "INFO")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Check status code
            if response.status_code != expected_status:
                self.tests_failed += 1
                msg = f"Expected status {expected_status}, got {response.status_code}"
                self.log(f"FAILED: {name} - {msg}", "FAIL")
                self.failures.append({"test": name, "reason": msg, "response": response.text[:200]})
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
                    self.failures.append({"test": name, "reason": msg})
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
        success, response = self.test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log(f"Login successful", "PASS")
            return True
        self.log(f"Login failed", "FAIL")
        return False
    
    def test_companions(self):
        """Test companion plant pairings"""
        self.log("\n=== Testing Companion Plants ===", "INFO")
        
        # First, get the species list to find IDs
        success, species_list = self.test(
            "Get species list",
            "GET",
            "encyclopedia/species?limit=50",
            200
        )
        
        if not success:
            self.log("Cannot proceed with companion tests - species list failed", "FAIL")
            return
        
        species_by_name = {s['common_name']: s for s in species_list.get('species', [])}
        
        # Test Monstera - should have companions
        if 'Monstera' in species_by_name:
            monstera_id = species_by_name['Monstera']['id']
            success, data = self.test(
                "Monstera has companions",
                "GET",
                f"encyclopedia/species/{monstera_id}",
                200,
                validate_fn=lambda d: (
                    assert_true(len(d.get('companions', [])) > 0, "Monstera should have companions"),
                    assert_true(all('id' in c and 'common_name' in c and 'reasoning' in c 
                                   for c in d.get('companions', [])), 
                               "Each companion should have id, common_name, reasoning")
                )
            )
        
        # Test Pothos - should have companions
        if 'Pothos' in species_by_name:
            pothos_id = species_by_name['Pothos']['id']
            success, data = self.test(
                "Pothos has companions",
                "GET",
                f"encyclopedia/species/{pothos_id}",
                200,
                validate_fn=lambda d: assert_true(len(d.get('companions', [])) > 0, 
                                                  "Pothos should have companions")
            )
        
        # Test Snake Plant - should have companions
        if 'Snake Plant' in species_by_name:
            snake_id = species_by_name['Snake Plant']['id']
            success, data = self.test(
                "Snake Plant has companions",
                "GET",
                f"encyclopedia/species/{snake_id}",
                200,
                validate_fn=lambda d: assert_true(len(d.get('companions', [])) > 0, 
                                                  "Snake Plant should have companions")
            )
        
        # Test Peace Lily - should have companions
        if 'Peace Lily' in species_by_name:
            peace_id = species_by_name['Peace Lily']['id']
            success, data = self.test(
                "Peace Lily has companions",
                "GET",
                f"encyclopedia/species/{peace_id}",
                200,
                validate_fn=lambda d: assert_true(len(d.get('companions', [])) > 0, 
                                                  "Peace Lily should have companions")
            )
        
        # Test English Ivy - should have EMPTY companions (invasive)
        if 'English Ivy' in species_by_name:
            ivy_id = species_by_name['English Ivy']['id']
            success, data = self.test(
                "English Ivy has empty companions (invasive)",
                "GET",
                f"encyclopedia/species/{ivy_id}",
                200,
                validate_fn=lambda d: assert_true(len(d.get('companions', [])) == 0, 
                                                  "English Ivy should have no companions (invasive)")
            )
    
    def test_guilds(self):
        """Test themed guilds"""
        self.log("\n=== Testing Themed Guilds ===", "INFO")
        
        # Test GET /api/guilds
        success, data = self.test(
            "Get guilds list",
            "GET",
            "guilds",
            200,
            validate_fn=lambda d: (
                assert_true(len(d.get('guilds', [])) == 4, "Should return exactly 4 guilds"),
                assert_true(all('slug' in g and 'species_count' in g and 'species' in g 
                               for g in d.get('guilds', [])), 
                           "Each guild should have slug, species_count, species")
            )
        )
        
        if success:
            guilds = data.get('guilds', [])
            slugs = [g['slug'] for g in guilds]
            expected_slugs = ['native-pollinator-bed', 'tropical-humidity-cluster', 
                            'cut-flower-border', 'low-light-hallway']
            
            for expected in expected_slugs:
                if expected not in slugs:
                    self.log(f"Missing expected guild slug: {expected}", "FAIL")
                    self.tests_failed += 1
                    self.failures.append({"test": "Guild slugs", "reason": f"Missing {expected}"})
                else:
                    self.log(f"Found guild: {expected}", "PASS")
        
        # Test individual guild details
        self.test(
            "Cut-flower border guild (5 species)",
            "GET",
            "guilds/cut-flower-border",
            200,
            validate_fn=lambda d: (
                assert_true(len(d.get('species', [])) == 5, 
                           f"Cut-flower border should have 5 species, got {len(d.get('species', []))}"),
                assert_true(d.get('name') == 'Cut-Flower Border', "Name should match"),
                assert_true('description' in d and 'design_notes' in d, "Should have description and design_notes")
            )
        )
        
        self.test(
            "Native pollinator bed guild (2 species)",
            "GET",
            "guilds/native-pollinator-bed",
            200,
            validate_fn=lambda d: assert_true(len(d.get('species', [])) == 2, 
                                             f"Native pollinator bed should have 2 species, got {len(d.get('species', []))}")
        )
        
        self.test(
            "Tropical humidity cluster guild (4 species)",
            "GET",
            "guilds/tropical-humidity-cluster",
            200,
            validate_fn=lambda d: assert_true(len(d.get('species', [])) == 4, 
                                             f"Tropical humidity cluster should have 4 species, got {len(d.get('species', []))}")
        )
        
        self.test(
            "Low-light hallway guild (4 species)",
            "GET",
            "guilds/low-light-hallway",
            200,
            validate_fn=lambda d: assert_true(len(d.get('species', [])) == 4, 
                                             f"Low-light hallway should have 4 species, got {len(d.get('species', []))}")
        )
        
        # Test 404 for non-existent guild
        self.test(
            "Non-existent guild returns 404",
            "GET",
            "guilds/non-existent-slug",
            404
        )
    
    def test_performance_reports(self):
        """Test species performance reports"""
        self.log("\n=== Testing Species Performance Reports ===", "INFO")
        
        # Get species list first
        success, species_list = self.test(
            "Get species for performance testing",
            "GET",
            "encyclopedia/species?limit=50",
            200
        )
        
        if not success:
            self.log("Cannot proceed with performance tests", "FAIL")
            return
        
        species = species_list.get('species', [])
        if not species:
            self.log("No species found for performance testing", "WARN")
            return
        
        # Test performance endpoint for first species
        test_species = species[0]
        success, data = self.test(
            f"Performance report for {test_species['common_name']}",
            "GET",
            f"encyclopedia/species/{test_species['id']}/performance",
            200,
            validate_fn=lambda d: (
                assert_true('sample' in d, "Should have sample data"),
                assert_true('total_plants' in d['sample'], "Sample should have total_plants"),
                assert_true('confidence' in d['sample'], "Sample should have confidence"),
                assert_true(d['sample']['confidence'] in ['low', 'emerging', 'established'], 
                           f"Confidence should be low/emerging/established, got {d['sample'].get('confidence')}"),
                assert_true('success_rate_1y_pct' in d, "Should have success_rate_1y_pct"),
                assert_true('common_problems' in d, "Should have common_problems"),
                assert_true('median_watering_days_healthy' in d, "Should have median_watering_days_healthy")
            )
        )
        
        # Verify confidence labels
        if success:
            total = data['sample']['total_plants']
            confidence = data['sample']['confidence']
            
            if total < 5 and confidence != 'low':
                self.log(f"Confidence label wrong: <5 plants should be 'low', got '{confidence}'", "FAIL")
                self.tests_failed += 1
                self.failures.append({"test": "Confidence labels", "reason": f"<5 plants should be low, got {confidence}"})
            elif 5 <= total < 25 and confidence != 'emerging':
                self.log(f"Confidence label wrong: 5-24 plants should be 'emerging', got '{confidence}'", "FAIL")
                self.tests_failed += 1
                self.failures.append({"test": "Confidence labels", "reason": f"5-24 plants should be emerging, got {confidence}"})
            elif total >= 25 and confidence != 'established':
                self.log(f"Confidence label wrong: ≥25 plants should be 'established', got '{confidence}'", "FAIL")
                self.tests_failed += 1
                self.failures.append({"test": "Confidence labels", "reason": f"≥25 plants should be established, got {confidence}"})
            else:
                self.log(f"Confidence label correct: {total} plants = '{confidence}'", "PASS")
    
    def test_narratives(self):
        """Test species narrative generation and caching"""
        self.log("\n=== Testing Species Narratives ===", "INFO")
        
        # Get species list
        success, species_list = self.test(
            "Get species for narrative testing",
            "GET",
            "encyclopedia/species?limit=50",
            200
        )
        
        if not success:
            self.log("Cannot proceed with narrative tests", "FAIL")
            return
        
        species = species_list.get('species', [])
        if not species:
            self.log("No species found for narrative testing", "WARN")
            return
        
        # Test first species narrative
        test_species = species[0]
        
        # First call - should be from_cache=false
        success, data1 = self.test(
            f"First narrative call for {test_species['common_name']} (not cached)",
            "GET",
            f"encyclopedia/species/{test_species['id']}/narrative",
            200,
            validate_fn=lambda d: (
                assert_true('narrative' in d, "Should have narrative"),
                assert_true('generated_at' in d, "Should have generated_at"),
                assert_true('from_cache' in d, "Should have from_cache"),
                assert_true(isinstance(d['narrative'], str) and len(d['narrative']) > 0, 
                           "Narrative should be non-empty string")
            )
        )
        
        if success:
            # Wait a moment then call again - should be from_cache=true
            time.sleep(1)
            success2, data2 = self.test(
                f"Second narrative call for {test_species['common_name']} (should be cached)",
                "GET",
                f"encyclopedia/species/{test_species['id']}/narrative",
                200,
                validate_fn=lambda d: assert_true(d.get('from_cache') == True, 
                                                  f"Second call should be cached, got from_cache={d.get('from_cache')}")
            )
        
        # Test empty-cohort species narrative (find one with 0 plants)
        # For now, just test that any species returns a valid narrative
        if len(species) > 5:
            test_species2 = species[5]
            success, data = self.test(
                f"Narrative for {test_species2['common_name']} (may be empty cohort)",
                "GET",
                f"encyclopedia/species/{test_species2['id']}/narrative",
                200,
                validate_fn=lambda d: (
                    assert_true('narrative' in d and len(d['narrative']) > 0, 
                               "Should have non-empty narrative even for empty cohort"),
                    assert_true('from_cache' in d, "Should have from_cache field")
                )
            )
    
    def test_regressions(self):
        """Test Phase 14B.1 and 14A.2 regressions"""
        self.log("\n=== Testing Regressions ===", "INFO")
        
        # Phase 14B.1: Should return 25 species
        success, data = self.test(
            "Encyclopedia returns 25 species (Phase 14B.1 regression)",
            "GET",
            "encyclopedia/species?limit=50",
            200,
            validate_fn=lambda d: assert_true(d.get('total') == 25, 
                                             f"Should have 25 species, got {d.get('total')}")
        )
        
        # Phase 14A.2: Tooltip endpoints
        if self.token:
            self.test(
                "Tooltip dismiss endpoint works (Phase 14A.2 regression)",
                "POST",
                "users/me/tooltips/dismiss",
                200,
                data={"tooltip_id": "test_tooltip"}
            )
            
            self.test(
                "Tutorial seen endpoint works (Phase 14A.2 regression)",
                "POST",
                "users/me/tutorials/seen",
                200,
                data={"tutorial_id": "collection"}
            )
    
    def run_all_tests(self):
        """Run all test suites"""
        self.log("=" * 60, "INFO")
        self.log("Phase 14B.2 Backend Test Suite", "INFO")
        self.log("=" * 60, "INFO")
        
        # Login
        if not self.login("maya.testing@grove.app", "GroveTesting2025!"):
            self.log("Login failed - cannot proceed with authenticated tests", "FAIL")
            return 1
        
        # Run test suites
        self.test_companions()
        self.test_guilds()
        self.test_performance_reports()
        self.test_narratives()
        self.test_regressions()
        
        # Print summary
        self.log("\n" + "=" * 60, "INFO")
        self.log("TEST SUMMARY", "INFO")
        self.log("=" * 60, "INFO")
        self.log(f"Total tests: {self.tests_run}", "INFO")
        self.log(f"Passed: {self.tests_passed}", "PASS")
        self.log(f"Failed: {self.tests_failed}", "FAIL")
        
        if self.failures:
            self.log("\nFailed Tests:", "FAIL")
            for i, failure in enumerate(self.failures, 1):
                self.log(f"{i}. {failure['test']}: {failure['reason']}", "FAIL")
        
        return 0 if self.tests_failed == 0 else 1


def assert_true(condition, message):
    """Helper for assertions"""
    if not condition:
        raise AssertionError(message)


if __name__ == "__main__":
    tester = Phase14B2Tester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)
