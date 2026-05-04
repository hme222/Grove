"""Phase 14C.3.b — 177-Badge Catalog Backend Test Suite

Tests the full badge catalog system including:
- 177-badge catalog endpoint
- Tier replacement logic
- Display badge selection (max 3, validation)
- Admin grant/revoke endpoints
- Auto-award logic for 60+ badges
- Idempotency checks
- Regression testing
"""
import requests
import sys
from datetime import datetime
from typing import Dict, List, Optional

BASE_URL = "https://botanical-social.preview.emergentagent.com/api"

# Test credentials from review_request
CLARE = {"email": "clare.testing@grove.app", "password": "GroveTesting2025!"}
MAYA = {"email": "maya.testing@grove.app", "password": "GroveTesting2025!"}
JAMES = {"email": "james.testing@grove.app", "password": "GroveTesting2025!"}
GROVELING = {"email": "groveling.testing@grove.app", "password": "GroveTesting2025!"}


class BadgeCatalogTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tokens: Dict[str, str] = {}
        self.test_results: List[str] = []

    def login(self, name: str, credentials: dict) -> Optional[str]:
        """Login and cache token"""
        if name in self.tokens:
            return self.tokens[name]
        
        print(f"\n🔐 Logging in as {name}...")
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json=credentials,
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 200:
                data = response.json()
                token = data.get("token") or data.get("access_token")
                if token:
                    self.tokens[name] = token
                    print(f"✅ Logged in as {name}")
                    return token
                else:
                    print(f"❌ Login failed for {name}: No token in response")
                    print(f"   Response: {data}")
                    return None
            else:
                print(f"❌ Login failed for {name}: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Login error for {name}: {str(e)}")
            return None

    def test(self, name: str, condition: bool, details: str = ""):
        """Record test result"""
        self.tests_run += 1
        if condition:
            self.tests_passed += 1
            result = f"✅ {name}"
            if details:
                result += f" - {details}"
            print(result)
            self.test_results.append(name)
        else:
            result = f"❌ {name}"
            if details:
                result += f" - {details}"
            print(result)

    def get_headers(self, token: str) -> dict:
        """Get auth headers"""
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    # ========== CATALOG TESTS ==========

    def test_catalog_returns_177_badges(self, token: str):
        """Test GET /api/users/me/badges/catalog returns 177 items"""
        print("\n📋 Testing catalog returns 177 badges...")
        try:
            response = requests.get(
                f"{BASE_URL}/users/me/badges/catalog",
                headers=self.get_headers(token)
            )
            self.test(
                "GET /api/users/me/badges/catalog returns 200",
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                total = data.get("total", 0)
                
                self.test(
                    "Catalog contains exactly 177 badges",
                    len(items) == 177 and total == 177,
                    f"Found {len(items)} items, total={total}"
                )
                
                # Check structure of first item
                if items:
                    first = items[0]
                    required_fields = [
                        "slug", "name", "description", "category", "subcategory",
                        "icon", "tier", "earnable", "family", "family_order",
                        "earned", "earned_at", "displayable", "displayed"
                    ]
                    has_all_fields = all(field in first for field in required_fields)
                    self.test(
                        "Catalog items have all required fields",
                        has_all_fields,
                        f"Fields: {list(first.keys())}"
                    )
                
                return data
        except Exception as e:
            self.test("GET /api/users/me/badges/catalog", False, f"Error: {str(e)}")
            return None

    def test_catalog_reflects_earned_badges(self, token: str, user_name: str):
        """Test catalog reflects user's earned badges correctly"""
        print(f"\n🏆 Testing catalog reflects earned badges for {user_name}...")
        try:
            # Get user's earned badges
            badges_response = requests.get(
                f"{BASE_URL}/users/me/badges",
                headers=self.get_headers(token)
            )
            
            # Get catalog
            catalog_response = requests.get(
                f"{BASE_URL}/users/me/badges/catalog",
                headers=self.get_headers(token)
            )
            
            if badges_response.status_code == 200 and catalog_response.status_code == 200:
                earned_badges = badges_response.json()
                catalog_data = catalog_response.json()
                
                earned_count_from_badges = len(earned_badges)
                earned_count_from_catalog = catalog_data.get("earned_count", 0)
                
                self.test(
                    f"Catalog earned_count matches user_badges count for {user_name}",
                    earned_count_from_badges == earned_count_from_catalog,
                    f"user_badges: {earned_count_from_badges}, catalog: {earned_count_from_catalog}"
                )
                
                # Check that earned badges in catalog match
                catalog_items = catalog_data.get("items", [])
                earned_in_catalog = [item["slug"] for item in catalog_items if item["earned"]]
                earned_slugs = [b["badge"]["slug"] for b in earned_badges if "badge" in b and "slug" in b["badge"]]
                
                self.test(
                    f"Earned badges in catalog match user_badges for {user_name}",
                    set(earned_in_catalog) == set(earned_slugs),
                    f"Catalog: {len(earned_in_catalog)}, Badges: {len(earned_slugs)}"
                )
                
                return catalog_data, earned_badges
        except Exception as e:
            self.test(f"Catalog reflects earned badges for {user_name}", False, f"Error: {str(e)}")
            return None, None

    def test_tier_replacement_logic(self, token: str):
        """Test tier replacement logic with Clare's streak badges"""
        print("\n🔥 Testing tier replacement logic (Clare's streak badges)...")
        try:
            catalog_response = requests.get(
                f"{BASE_URL}/users/me/badges/catalog",
                headers=self.get_headers(token)
            )
            
            if catalog_response.status_code == 200:
                catalog_data = catalog_response.json()
                items = catalog_data.get("items", [])
                
                # Find streak family badges
                streak_badges = [item for item in items if item.get("family") == "streak"]
                earned_streaks = [item for item in streak_badges if item["earned"]]
                
                print(f"   Found {len(earned_streaks)} earned streak badges")
                for badge in earned_streaks:
                    print(f"   - {badge['slug']}: earned={badge['earned']}, displayable={badge['displayable']}, family_order={badge['family_order']}")
                
                # Find highest tier earned
                if earned_streaks:
                    highest_order = max(b["family_order"] for b in earned_streaks)
                    highest_badge = [b for b in earned_streaks if b["family_order"] == highest_order][0]
                    
                    # Check that only highest tier is displayable
                    for badge in earned_streaks:
                        if badge["family_order"] == highest_order:
                            self.test(
                                f"Highest tier streak badge ({badge['slug']}) is displayable",
                                badge["displayable"] == True,
                                f"displayable={badge['displayable']}"
                            )
                        else:
                            self.test(
                                f"Lower tier streak badge ({badge['slug']}) is NOT displayable",
                                badge["displayable"] == False,
                                f"displayable={badge['displayable']}, family_order={badge['family_order']} < {highest_order}"
                            )
                
                return catalog_data
        except Exception as e:
            self.test("Tier replacement logic", False, f"Error: {str(e)}")
            return None

    def test_existing_badges_endpoint(self, token: str):
        """Test GET /api/users/me/badges still works"""
        print("\n📦 Testing existing badges endpoint...")
        try:
            response = requests.get(
                f"{BASE_URL}/users/me/badges",
                headers=self.get_headers(token)
            )
            
            self.test(
                "GET /api/users/me/badges returns 200",
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
            
            if response.status_code == 200:
                badges = response.json()
                self.test(
                    "GET /api/users/me/badges returns array",
                    isinstance(badges, list),
                    f"Type: {type(badges)}"
                )
                
                # Check structure
                if badges:
                    first = badges[0]
                    has_badge = "badge" in first
                    has_earned_at = "earned_at" in first
                    self.test(
                        "Badge entries have 'badge' and 'earned_at' fields",
                        has_badge and has_earned_at,
                        f"Fields: {list(first.keys())}"
                    )
                
                return badges
        except Exception as e:
            self.test("GET /api/users/me/badges", False, f"Error: {str(e)}")
            return None

    # ========== DISPLAY BADGE TESTS ==========

    def test_display_badges_validation(self, token: str):
        """Test PUT /api/users/me/badges/displayed validation"""
        print("\n🎨 Testing display badge validation...")
        
        # Test 1: Reject empty token (401)
        print("   Testing 401 without token...")
        try:
            response = requests.put(
                f"{BASE_URL}/users/me/badges/displayed",
                json={"badge_slugs": ["verified_user"]},
                headers={"Content-Type": "application/json"}
            )
            self.test(
                "PUT /api/users/me/badges/displayed rejects empty token (401)",
                response.status_code == 401,
                f"Status: {response.status_code}"
            )
        except Exception as e:
            self.test("Display badges 401 test", False, f"Error: {str(e)}")
        
        # Test 2: Reject max 3 (400)
        print("   Testing max 3 validation...")
        try:
            response = requests.put(
                f"{BASE_URL}/users/me/badges/displayed",
                json={"badge_slugs": ["badge1", "badge2", "badge3", "badge4"]},
                headers=self.get_headers(token)
            )
            self.test(
                "PUT /api/users/me/badges/displayed rejects >3 badges (400)",
                response.status_code == 400,
                f"Status: {response.status_code}"
            )
            
            if response.status_code == 400:
                data = response.json()
                detail = data.get("detail", "")
                self.test(
                    "Error message mentions 'at most 3 badges'",
                    "at most 3 badges" in str(detail).lower(),
                    f"Detail: {detail}"
                )
        except Exception as e:
            self.test("Display badges max 3 test", False, f"Error: {str(e)}")
        
        # Test 3: Reject unowned badge (400)
        print("   Testing unowned badge rejection...")
        try:
            response = requests.put(
                f"{BASE_URL}/users/me/badges/displayed",
                json={"badge_slugs": ["botanical-social"]},  # Unlikely to be owned
                headers=self.get_headers(token)
            )
            
            if response.status_code == 400:
                data = response.json()
                detail = data.get("detail", {})
                if isinstance(detail, dict):
                    error = detail.get("error")
                    missing = detail.get("missing", [])
                    self.test(
                        "Unowned badge returns error='not_owned'",
                        error == "not_owned",
                        f"error={error}"
                    )
                    self.test(
                        "Unowned badge returns missing list",
                        isinstance(missing, list) and len(missing) > 0,
                        f"missing={missing}"
                    )
                else:
                    self.test("Unowned badge returns 400", True, f"Status: {response.status_code}")
        except Exception as e:
            self.test("Display badges unowned test", False, f"Error: {str(e)}")
        
        # Test 4: Accept valid selection (1-3 owned badges)
        print("   Testing valid badge selection...")
        try:
            # First get user's earned badges
            badges_response = requests.get(
                f"{BASE_URL}/users/me/badges",
                headers=self.get_headers(token)
            )
            
            if badges_response.status_code == 200:
                earned = badges_response.json()
                if earned:
                    # Get catalog to find displayable badges
                    catalog_response = requests.get(
                        f"{BASE_URL}/users/me/badges/catalog",
                        headers=self.get_headers(token)
                    )
                    
                    if catalog_response.status_code == 200:
                        catalog_data = catalog_response.json()
                        displayable = [item["slug"] for item in catalog_data.get("items", []) 
                                     if item["earned"] and item["displayable"]]
                        
                        if displayable:
                            # Select up to 3 displayable badges
                            selection = displayable[:min(3, len(displayable))]
                            
                            response = requests.put(
                                f"{BASE_URL}/users/me/badges/displayed",
                                json={"badge_slugs": selection},
                                headers=self.get_headers(token)
                            )
                            
                            self.test(
                                f"PUT /api/users/me/badges/displayed accepts valid selection ({len(selection)} badges)",
                                response.status_code == 200,
                                f"Status: {response.status_code}, badges: {selection}"
                            )
                            
                            if response.status_code == 200:
                                data = response.json()
                                returned = data.get("displayed_badges", [])
                                self.test(
                                    "Response returns displayed_badges array",
                                    set(returned) == set(selection),
                                    f"Returned: {returned}"
                                )
        except Exception as e:
            self.test("Display badges valid selection test", False, f"Error: {str(e)}")

    def test_display_badges_deduplication(self, token: str):
        """Test PUT /api/users/me/badges/displayed deduplicates input"""
        print("\n🔄 Testing display badge deduplication...")
        try:
            # Get a displayable badge
            catalog_response = requests.get(
                f"{BASE_URL}/users/me/badges/catalog",
                headers=self.get_headers(token)
            )
            
            if catalog_response.status_code == 200:
                catalog_data = catalog_response.json()
                displayable = [item["slug"] for item in catalog_data.get("items", []) 
                             if item["earned"] and item["displayable"]]
                
                if displayable:
                    # Send duplicate slugs
                    duplicate_input = [displayable[0], displayable[0], displayable[0]]
                    
                    response = requests.put(
                        f"{BASE_URL}/users/me/badges/displayed",
                        json={"badge_slugs": duplicate_input},
                        headers=self.get_headers(token)
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        returned = data.get("displayed_badges", [])
                        self.test(
                            "Duplicate slugs are deduplicated (same slug repeated counts once)",
                            len(returned) == 1 and returned[0] == displayable[0],
                            f"Input: {duplicate_input}, Output: {returned}"
                        )
        except Exception as e:
            self.test("Display badge deduplication", False, f"Error: {str(e)}")

    def test_tier_superseded_validation(self, token: str):
        """Test that lower tier cannot be displayed when higher tier is earned"""
        print("\n⬆️ Testing tier superseded validation...")
        try:
            catalog_response = requests.get(
                f"{BASE_URL}/users/me/badges/catalog",
                headers=self.get_headers(token)
            )
            
            if catalog_response.status_code == 200:
                catalog_data = catalog_response.json()
                items = catalog_data.get("items", [])
                
                # Find a family where user has multiple tiers
                families = {}
                for item in items:
                    if item["earned"] and item.get("family"):
                        family = item["family"]
                        if family not in families:
                            families[family] = []
                        families[family].append(item)
                
                # Find a family with multiple earned tiers
                for family, badges in families.items():
                    if len(badges) > 1:
                        # Sort by family_order
                        badges.sort(key=lambda x: x["family_order"])
                        lower_tier = badges[0]
                        
                        # Try to display lower tier
                        response = requests.put(
                            f"{BASE_URL}/users/me/badges/displayed",
                            json={"badge_slugs": [lower_tier["slug"]]},
                            headers=self.get_headers(token)
                        )
                        
                        self.test(
                            f"Cannot display lower tier ({lower_tier['slug']}) when higher tier earned (400)",
                            response.status_code == 400,
                            f"Status: {response.status_code}"
                        )
                        
                        if response.status_code == 400:
                            data = response.json()
                            detail = data.get("detail", {})
                            if isinstance(detail, dict):
                                error = detail.get("error")
                                blocked = detail.get("blocked", [])
                                self.test(
                                    "Error returns error='tier_superseded'",
                                    error == "tier_superseded",
                                    f"error={error}"
                                )
                                self.test(
                                    "Error returns blocked list with lower tier slug",
                                    lower_tier["slug"] in blocked,
                                    f"blocked={blocked}"
                                )
                        break
        except Exception as e:
            self.test("Tier superseded validation", False, f"Error: {str(e)}")

    # ========== ADMIN TESTS ==========

    def test_admin_grant_badge(self, admin_token: str, target_user_token: str, target_user_name: str):
        """Test POST /api/admin/users/{user_id}/badges/{slug}/grant"""
        print(f"\n👑 Testing admin grant badge to {target_user_name}...")
        
        # Get target user ID
        try:
            me_response = requests.get(
                f"{BASE_URL}/users/me",
                headers=self.get_headers(target_user_token)
            )
            
            if me_response.status_code != 200:
                self.test("Get target user ID", False, f"Status: {me_response.status_code}")
                return
            
            target_user_id = me_response.json().get("id")
            
            # Test 1: Non-admin caller gets 403
            print("   Testing 403 for non-admin caller...")
            response = requests.post(
                f"{BASE_URL}/admin/users/{target_user_id}/badges/botanical-social/grant",
                headers=self.get_headers(target_user_token)
            )
            self.test(
                "POST /admin/users/{id}/badges/{slug}/grant returns 403 for non-admin",
                response.status_code == 403,
                f"Status: {response.status_code}"
            )
            
            # Test 2: Unknown user_id gets 404
            print("   Testing 404 for unknown user_id...")
            response = requests.post(
                f"{BASE_URL}/admin/users/unknown-user-id-12345/badges/botanical-social/grant",
                headers=self.get_headers(admin_token)
            )
            self.test(
                "Admin grant returns 404 for unknown user_id",
                response.status_code == 404,
                f"Status: {response.status_code}"
            )
            
            # Test 3: Unknown slug gets 404
            print("   Testing 404 for unknown slug...")
            response = requests.post(
                f"{BASE_URL}/admin/users/{target_user_id}/badges/unknown-badge-slug-xyz/grant",
                headers=self.get_headers(admin_token)
            )
            self.test(
                "Admin grant returns 404 for unknown slug",
                response.status_code == 404,
                f"Status: {response.status_code}"
            )
            
            # Test 4: Grant a schema-only badge (not earnable)
            print("   Testing successful grant of schema-only badge...")
            test_slug = "aroid_enthusiast"  # Schema-only badge
            
            response = requests.post(
                f"{BASE_URL}/admin/users/{target_user_id}/badges/{test_slug}/grant",
                headers=self.get_headers(admin_token)
            )
            
            if response.status_code == 200:
                data = response.json()
                granted = data.get("granted")
                already = data.get("already", False)
                
                if granted:
                    self.test(
                        f"Admin successfully grants badge '{test_slug}'",
                        True,
                        f"granted={granted}"
                    )
                elif already:
                    self.test(
                        f"Badge '{test_slug}' already granted (idempotent)",
                        True,
                        f"already={already}"
                    )
                
                # Test 5: Idempotency - grant again
                print("   Testing idempotency (re-grant)...")
                response2 = requests.post(
                    f"{BASE_URL}/admin/users/{target_user_id}/badges/{test_slug}/grant",
                    headers=self.get_headers(admin_token)
                )
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    self.test(
                        "Re-granting returns granted=false, already=true (idempotent)",
                        data2.get("granted") == False and data2.get("already") == True,
                        f"granted={data2.get('granted')}, already={data2.get('already')}"
                    )
                
                return test_slug, target_user_id
            else:
                self.test(f"Admin grant badge '{test_slug}'", False, f"Status: {response.status_code}")
                return None, None
                
        except Exception as e:
            self.test("Admin grant badge", False, f"Error: {str(e)}")
            return None, None

    def test_admin_revoke_badge(self, admin_token: str, target_user_id: str, slug: str):
        """Test DELETE /api/admin/users/{user_id}/badges/{slug}"""
        print(f"\n🗑️ Testing admin revoke badge '{slug}'...")
        
        try:
            # Test 1: Non-admin gets 403
            print("   Testing 403 for non-admin caller...")
            # Use Maya's token (non-admin)
            maya_token = self.login("Maya", MAYA)
            if maya_token:
                response = requests.delete(
                    f"{BASE_URL}/admin/users/{target_user_id}/badges/{slug}",
                    headers=self.get_headers(maya_token)
                )
                self.test(
                    "DELETE /admin/users/{id}/badges/{slug} returns 403 for non-admin",
                    response.status_code == 403,
                    f"Status: {response.status_code}"
                )
            
            # Test 2: Successful revoke
            print("   Testing successful revoke...")
            response = requests.delete(
                f"{BASE_URL}/admin/users/{target_user_id}/badges/{slug}",
                headers=self.get_headers(admin_token)
            )
            
            self.test(
                f"Admin successfully revokes badge '{slug}'",
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.test(
                    "Revoke response contains revoked=true",
                    data.get("revoked") == True,
                    f"revoked={data.get('revoked')}"
                )
            
            # Test 3: Revoke non-held badge (404)
            print("   Testing 404 for non-held badge...")
            response = requests.delete(
                f"{BASE_URL}/admin/users/{target_user_id}/badges/{slug}",
                headers=self.get_headers(admin_token)
            )
            self.test(
                "Revoking non-held badge returns 404",
                response.status_code == 404,
                f"Status: {response.status_code}"
            )
            
            # Test 4: Check that badge was removed from displayed_badges if it was selected
            # (This is implicit in the endpoint logic, but we can verify by checking catalog)
            
        except Exception as e:
            self.test("Admin revoke badge", False, f"Error: {str(e)}")

    # ========== EARNING LOGIC TESTS ==========

    def test_earning_logic_fresh_user(self, token: str, user_name: str):
        """Test earning logic for a fresh user with various activities"""
        print(f"\n🌱 Testing earning logic for {user_name}...")
        
        try:
            # Get initial badge count
            initial_response = requests.get(
                f"{BASE_URL}/users/me/badges",
                headers=self.get_headers(token)
            )
            initial_count = len(initial_response.json()) if initial_response.status_code == 200 else 0
            print(f"   Initial badge count: {initial_count}")
            
            # Test 1: Add a plant (should award plant_first)
            print("   Testing plant_first badge...")
            plant_response = requests.post(
                f"{BASE_URL}/plants",
                json={
                    "nickname": "Test Plant for Badge",
                    "common_name": "Pothos",
                    "location": "Living Room"
                },
                headers=self.get_headers(token)
            )
            
            if plant_response.status_code in [200, 201]:
                plant_id = plant_response.json().get("id")
                
                # Trigger auto-award by reading badges
                badges_response = requests.get(
                    f"{BASE_URL}/users/me/badges",
                    headers=self.get_headers(token)
                )
                
                if badges_response.status_code == 200:
                    badges = badges_response.json()
                    badge_slugs = [b["badge"]["slug"] for b in badges if "badge" in b and "slug" in b["badge"]]
                    
                    self.test(
                        "After adding 1 plant: plant_first badge awarded",
                        "plant_first" in badge_slugs,
                        f"Badges: {badge_slugs}"
                    )
                
                # Test 2: Log a watering (should award watering_first)
                print("   Testing watering_first badge...")
                care_response = requests.post(
                    f"{BASE_URL}/care-logs",
                    json={
                        "plant_id": plant_id,
                        "action": "water",
                        "notes": "Test watering for badge"
                    },
                    headers=self.get_headers(token)
                )
                
                if care_response.status_code in [200, 201]:
                    # Trigger auto-award
                    badges_response = requests.get(
                        f"{BASE_URL}/users/me/badges",
                        headers=self.get_headers(token)
                    )
                    
                    if badges_response.status_code == 200:
                        badges = badges_response.json()
                        badge_slugs = [b["badge"]["slug"] for b in badges if "badge" in b and "slug" in b["badge"]]
                        
                        self.test(
                            "After logging 1 watering: watering_first badge awarded",
                            "watering_first" in badge_slugs,
                            f"Badges: {badge_slugs}"
                        )
                
                # Test 3: Log a fertilization (should award fert_first)
                print("   Testing fert_first badge...")
                fert_response = requests.post(
                    f"{BASE_URL}/care-logs",
                    json={
                        "plant_id": plant_id,
                        "action": "fertilize",
                        "notes": "Test fertilization for badge"
                    },
                    headers=self.get_headers(token)
                )
                
                if fert_response.status_code in [200, 201]:
                    badges_response = requests.get(
                        f"{BASE_URL}/users/me/badges",
                        headers=self.get_headers(token)
                    )
                    
                    if badges_response.status_code == 200:
                        badges = badges_response.json()
                        badge_slugs = [b["badge"]["slug"] for b in badges if "badge" in b and "slug" in b["badge"]]
                        
                        self.test(
                            "After logging 1 fertilization: fert_first badge awarded",
                            "fert_first" in badge_slugs,
                            f"Badges: {badge_slugs}"
                        )
                
                # Test 4: Create a post (should award post_first)
                print("   Testing post_first badge...")
                post_response = requests.post(
                    f"{BASE_URL}/posts",
                    json={
                        "content": "Test post for badge testing",
                        "visibility": "public"
                    },
                    headers=self.get_headers(token)
                )
                
                if post_response.status_code in [200, 201]:
                    badges_response = requests.get(
                        f"{BASE_URL}/users/me/badges",
                        headers=self.get_headers(token)
                    )
                    
                    if badges_response.status_code == 200:
                        badges = badges_response.json()
                        badge_slugs = [b["badge"]["slug"] for b in badges if "badge" in b and "slug" in b["badge"]]
                        
                        self.test(
                            "After creating 1 post: post_first badge awarded",
                            "post_first" in badge_slugs,
                            f"Badges: {badge_slugs}"
                        )
            
        except Exception as e:
            self.test(f"Earning logic for {user_name}", False, f"Error: {str(e)}")

    def test_idempotency(self, token: str):
        """Test that calling check_and_award_badges multiple times doesn't duplicate badges"""
        print("\n🔁 Testing idempotency of badge awards...")
        
        try:
            # Get initial badge count
            response1 = requests.get(
                f"{BASE_URL}/users/me/badges",
                headers=self.get_headers(token)
            )
            
            if response1.status_code == 200:
                count1 = len(response1.json())
                
                # Call again (triggers check_and_award_badges)
                response2 = requests.get(
                    f"{BASE_URL}/users/me/badges",
                    headers=self.get_headers(token)
                )
                
                if response2.status_code == 200:
                    count2 = len(response2.json())
                    
                    self.test(
                        "Multiple calls to check_and_award_badges don't duplicate badges",
                        count1 == count2,
                        f"First call: {count1}, Second call: {count2}"
                    )
                    
                    # Call catalog endpoint (also triggers check_and_award_badges)
                    response3 = requests.get(
                        f"{BASE_URL}/users/me/badges/catalog",
                        headers=self.get_headers(token)
                    )
                    
                    if response3.status_code == 200:
                        count3 = response3.json().get("earned_count", 0)
                        
                        self.test(
                            "Catalog endpoint also maintains idempotency",
                            count1 == count3,
                            f"Badges endpoint: {count1}, Catalog endpoint: {count3}"
                        )
        except Exception as e:
            self.test("Idempotency test", False, f"Error: {str(e)}")

    # ========== REGRESSION TESTS ==========

    def test_regressions(self, token: str):
        """Test that existing endpoints still work"""
        print("\n🔄 Testing regressions...")
        
        try:
            # Test 1: Swap eligibility endpoint (14C.2)
            response = requests.get(
                f"{BASE_URL}/swaps/eligibility",
                headers=self.get_headers(token)
            )
            self.test(
                "Regression: GET /api/swaps/eligibility still accessible",
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
            
            # Test 2: Verification endpoint (14C.3.a)
            response = requests.get(
                f"{BASE_URL}/users/me/verification",
                headers=self.get_headers(token)
            )
            self.test(
                "Regression: GET /api/users/me/verification still accessible",
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
            
            # Test 3: verified_user badge is still earnable
            catalog_response = requests.get(
                f"{BASE_URL}/users/me/badges/catalog",
                headers=self.get_headers(token)
            )
            
            if catalog_response.status_code == 200:
                catalog_data = catalog_response.json()
                items = catalog_data.get("items", [])
                verified_badge = [item for item in items if item["slug"] == "verified_user"]
                
                if verified_badge:
                    self.test(
                        "Regression: verified_user badge is earnable=true in catalog",
                        verified_badge[0]["earnable"] == True,
                        f"earnable={verified_badge[0]['earnable']}"
                    )
            
        except Exception as e:
            self.test("Regression tests", False, f"Error: {str(e)}")

    # ========== MAIN TEST RUNNER ==========

    def run_all_tests(self):
        """Run all test suites"""
        print("=" * 80)
        print("Phase 14C.3.b — 177-Badge Catalog Backend Test Suite")
        print("=" * 80)
        
        # Login all users
        clare_token = self.login("Clare", CLARE)
        maya_token = self.login("Maya", MAYA)
        james_token = self.login("James", JAMES)
        groveling_token = self.login("Groveling", GROVELING)
        
        if not all([clare_token, maya_token, james_token, groveling_token]):
            print("\n❌ Failed to login all test users. Aborting tests.")
            return 1
        
        # ========== CATALOG TESTS ==========
        print("\n" + "=" * 80)
        print("SECTION 1: CATALOG ENDPOINT TESTS")
        print("=" * 80)
        
        self.test_catalog_returns_177_badges(clare_token)
        self.test_catalog_reflects_earned_badges(clare_token, "Clare")
        self.test_catalog_reflects_earned_badges(maya_token, "Maya")
        
        # ========== TIER REPLACEMENT TESTS ==========
        print("\n" + "=" * 80)
        print("SECTION 2: TIER REPLACEMENT LOGIC")
        print("=" * 80)
        
        self.test_tier_replacement_logic(clare_token)
        
        # ========== EXISTING ENDPOINT TESTS ==========
        print("\n" + "=" * 80)
        print("SECTION 3: EXISTING BADGES ENDPOINT")
        print("=" * 80)
        
        self.test_existing_badges_endpoint(clare_token)
        
        # ========== DISPLAY BADGE TESTS ==========
        print("\n" + "=" * 80)
        print("SECTION 4: DISPLAY BADGE SELECTION")
        print("=" * 80)
        
        self.test_display_badges_validation(clare_token)
        self.test_display_badges_deduplication(clare_token)
        self.test_tier_superseded_validation(clare_token)
        
        # ========== ADMIN TESTS ==========
        print("\n" + "=" * 80)
        print("SECTION 5: ADMIN GRANT/REVOKE ENDPOINTS")
        print("=" * 80)
        
        granted_slug, target_user_id = self.test_admin_grant_badge(groveling_token, maya_token, "Maya")
        if granted_slug and target_user_id:
            self.test_admin_revoke_badge(groveling_token, target_user_id, granted_slug)
        
        # ========== EARNING LOGIC TESTS ==========
        print("\n" + "=" * 80)
        print("SECTION 6: EARNING LOGIC")
        print("=" * 80)
        
        # Use James for earning logic tests (newer account)
        self.test_earning_logic_fresh_user(james_token, "James")
        
        # ========== IDEMPOTENCY TESTS ==========
        print("\n" + "=" * 80)
        print("SECTION 7: IDEMPOTENCY")
        print("=" * 80)
        
        self.test_idempotency(clare_token)
        
        # ========== REGRESSION TESTS ==========
        print("\n" + "=" * 80)
        print("SECTION 8: REGRESSION TESTS")
        print("=" * 80)
        
        self.test_regressions(clare_token)
        
        # ========== SUMMARY ==========
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n✅ ALL TESTS PASSED!")
            return 0
        else:
            print(f"\n⚠️ {self.tests_run - self.tests_passed} TEST(S) FAILED")
            return 1


def main():
    tester = BadgeCatalogTester()
    return tester.run_all_tests()


if __name__ == "__main__":
    sys.exit(main())
