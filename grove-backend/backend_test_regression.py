#!/usr/bin/env python3
"""
Phase 14A.2 Regression Tests with Clean Slate User
Tests plant creation, multi-action care logs, and photo uploads
"""

import requests
import sys
import base64

BASE_URL = "https://botanical-social.preview.emergentagent.com/api"

class RegressionTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.plant_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
    
    def log(self, message, level="INFO"):
        prefix = "✅" if level == "PASS" else "❌" if level == "FAIL" else "🔍"
        print(f"{prefix} {message}")
    
    def login(self, email, password):
        """Login and get token"""
        self.log(f"Logging in as {email}...", "INFO")
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data['access_token']
                self.log("Login successful", "PASS")
                return True
            else:
                self.log(f"Login failed: {response.status_code}", "FAIL")
                return False
        except Exception as e:
            self.log(f"Login error: {str(e)}", "FAIL")
            return False
    
    def test_plant_creation_with_photo(self):
        """Test POST /api/plants with photo_url"""
        self.log("\n=== Test: Plant Creation with Photo ===", "INFO")
        self.tests_run += 1
        
        # Upload photo first
        minimal_png = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
        
        try:
            files = {'file': ('test.png', minimal_png, 'image/png')}
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.post(
                f"{self.base_url}/upload",
                files=files,
                headers=headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log(f"Photo upload failed: {response.status_code}", "FAIL")
                self.failed_tests.append({"test": "Photo upload", "status": response.status_code})
                return
            
            photo_url = response.json().get('path')
            self.log(f"Photo uploaded: {photo_url}", "PASS")
            
            # Create plant
            response = requests.post(
                f"{self.base_url}/plants",
                json={
                    "common_name": "Test Monstera",
                    "photo_url": photo_url,
                    "grow_medium": "soil"
                },
                headers={'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.plant_id = data.get('id')
                photos = data.get('photos', [])
                
                if len(photos) == 1 and photos[0].get('is_cover') == True:
                    self.log("✓ Plant created with photo - photos array has 1 entry with is_cover=true", "PASS")
                    self.tests_passed += 1
                else:
                    self.log(f"✗ Photos array incorrect: {photos}", "FAIL")
                    self.failed_tests.append({"test": "Plant photos array", "photos": photos})
            else:
                self.log(f"Plant creation failed: {response.status_code} - {response.text}", "FAIL")
                self.failed_tests.append({"test": "Plant creation", "status": response.status_code})
        
        except Exception as e:
            self.log(f"Error: {str(e)}", "FAIL")
            self.failed_tests.append({"test": "Plant creation", "error": str(e)})
    
    def test_multi_action_care_logs(self):
        """Test POST /api/plants/{id}/care-logs with actions array"""
        self.log("\n=== Test: Multi-action Care Logs (Batch 1 Regression) ===", "INFO")
        
        if not self.plant_id:
            self.log("No plant_id, skipping", "FAIL")
            return
        
        self.tests_run += 1
        
        try:
            response = requests.post(
                f"{self.base_url}/plants/{self.plant_id}/care-logs",
                json={
                    "actions": ["water", "mist"],
                    "notes": "Test multi-action"
                },
                headers={'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                meta = data.get('_meta', {})
                logs = meta.get('logs', [])
                group_id = meta.get('group_id')
                
                checks_passed = 0
                
                if len(logs) == 2:
                    self.log("✓ Created 2 logs for 2 actions", "PASS")
                    checks_passed += 1
                else:
                    self.log(f"✗ Expected 2 logs, got {len(logs)}", "FAIL")
                
                if group_id:
                    group_ids = [log.get('group_id') for log in logs]
                    if all(gid == group_id for gid in group_ids):
                        self.log("✓ Both logs share same group_id", "PASS")
                        checks_passed += 1
                    else:
                        self.log(f"✗ Group IDs don't match: {group_ids}", "FAIL")
                else:
                    self.log("✗ No group_id in response", "FAIL")
                
                if checks_passed == 2:
                    self.tests_passed += 1
                else:
                    self.failed_tests.append({"test": "Multi-action care logs", "checks_passed": checks_passed})
            else:
                self.log(f"Care log creation failed: {response.status_code}", "FAIL")
                self.failed_tests.append({"test": "Multi-action care logs", "status": response.status_code})
        
        except Exception as e:
            self.log(f"Error: {str(e)}", "FAIL")
            self.failed_tests.append({"test": "Multi-action care logs", "error": str(e)})
    
    def test_photo_upload_with_taken_at(self):
        """Test POST /api/plants/{id}/photos with taken_at field"""
        self.log("\n=== Test: Photo Upload with taken_at (Batch 1 Regression) ===", "INFO")
        
        if not self.plant_id:
            self.log("No plant_id, skipping", "FAIL")
            return
        
        self.tests_run += 1
        
        minimal_png = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
        
        try:
            files = {'file': ('test2.png', minimal_png, 'image/png')}
            data = {'taken_at': '2025-01-15T10:00:00Z', 'caption': 'Test photo'}
            headers = {'Authorization': f'Bearer {self.token}'}
            
            response = requests.post(
                f"{self.base_url}/plants/{self.plant_id}/photos",
                files=files,
                data=data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                photo = response.json().get('photo', {})
                taken_at = photo.get('taken_at')
                
                if taken_at and '2025-01-15' in taken_at:
                    self.log(f"✓ Photo uploaded with taken_at: {taken_at}", "PASS")
                    self.tests_passed += 1
                else:
                    self.log(f"✗ taken_at field incorrect: {taken_at}", "FAIL")
                    self.failed_tests.append({"test": "Photo taken_at", "taken_at": taken_at})
            else:
                self.log(f"Photo upload failed: {response.status_code}", "FAIL")
                self.failed_tests.append({"test": "Photo upload with taken_at", "status": response.status_code})
        
        except Exception as e:
            self.log(f"Error: {str(e)}", "FAIL")
            self.failed_tests.append({"test": "Photo upload with taken_at", "error": str(e)})
    
    def test_species_linking(self):
        """Test that plants can be linked to curated species"""
        self.log("\n=== Test: Plant Species Linking ===", "INFO")
        
        if not self.plant_id:
            self.log("No plant_id, skipping", "FAIL")
            return
        
        self.tests_run += 1
        
        try:
            # Get a species ID from the catalog
            response = requests.get(
                f"{self.base_url}/encyclopedia/species?limit=1",
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=10
            )
            
            if response.status_code == 200:
                species_list = response.json().get('species', [])
                if species_list:
                    species_id = species_list[0].get('id')
                    
                    # Update plant with species_id
                    response = requests.patch(
                        f"{self.base_url}/plants/{self.plant_id}",
                        json={"common_name": species_list[0].get('common_name')},
                        headers={'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'},
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        # Verify plant has species_id
                        response = requests.get(
                            f"{self.base_url}/plants/{self.plant_id}",
                            headers={'Authorization': f'Bearer {self.token}'},
                            timeout=10
                        )
                        
                        if response.status_code == 200:
                            plant = response.json()
                            if plant.get('species_id'):
                                self.log(f"✓ Plant linked to species: {plant.get('species_id')}", "PASS")
                                self.tests_passed += 1
                            else:
                                self.log("✗ Plant species_id not set", "FAIL")
                                self.failed_tests.append({"test": "Species linking", "issue": "species_id not set"})
                        else:
                            self.log(f"Failed to get plant: {response.status_code}", "FAIL")
                    else:
                        self.log(f"Failed to update plant: {response.status_code}", "FAIL")
        
        except Exception as e:
            self.log(f"Error: {str(e)}", "FAIL")
            self.failed_tests.append({"test": "Species linking", "error": str(e)})
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("REGRESSION TEST SUMMARY")
        print("="*60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        
        if self.tests_run > 0:
            print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n" + "="*60)
            print("FAILED TESTS:")
            print("="*60)
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"\n{i}. {failure}")
        
        return 0 if self.tests_run == self.tests_passed else 1

def main():
    tester = RegressionTester()
    
    # Login with clean slate user
    if not tester.login("groveling.testing@grove.app", "GroveTesting2025!"):
        print("❌ Login failed")
        return 1
    
    # Run regression tests
    tester.test_plant_creation_with_photo()
    tester.test_multi_action_care_logs()
    tester.test_photo_upload_with_taken_at()
    tester.test_species_linking()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
