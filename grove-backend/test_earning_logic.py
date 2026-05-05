"""Focused test for badge earning logic"""
import requests
import sys

BASE_URL = "https://botanical-social.preview.emergentagent.com/api"

def login(email, password):
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        return response.json().get("token") or response.json().get("access_token")
    return None

def get_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def test_earning_logic():
    print("=" * 80)
    print("Badge Earning Logic Test")
    print("=" * 80)
    
    # Login as James
    token = login("james.testing@grove.app", "GroveTesting2025!")
    if not token:
        print("❌ Failed to login")
        return 1
    
    print("✅ Logged in as James")
    
    # Get initial badge count
    badges_response = requests.get(f"{BASE_URL}/users/me/badges", headers=get_headers(token))
    if badges_response.status_code != 200:
        print(f"❌ Failed to get badges: {badges_response.status_code}")
        return 1
    
    initial_badges = badges_response.json()
    initial_slugs = [b["badge"]["slug"] for b in initial_badges if "badge" in b and "slug" in b["badge"]]
    print(f"\n📊 Initial badge count: {len(initial_badges)}")
    print(f"   Badges: {', '.join(initial_slugs[:10])}{'...' if len(initial_slugs) > 10 else ''}")
    
    # Check if James already has plant_first
    has_plant_first = "plant_first" in initial_slugs
    print(f"\n🌱 Has plant_first: {has_plant_first}")
    
    if not has_plant_first:
        # Add a plant
        print("\n➕ Adding a plant...")
        plant_response = requests.post(
            f"{BASE_URL}/plants",
            json={
                "nickname": "Test Plant for Earning Logic",
                "common_name": "Pothos",
                "location": "Living Room"
            },
            headers=get_headers(token)
        )
        
        if plant_response.status_code in [200, 201]:
            plant_id = plant_response.json().get("id")
            print(f"✅ Plant added: {plant_id}")
            
            # Trigger auto-award by reading badges
            badges_response = requests.get(f"{BASE_URL}/users/me/badges", headers=get_headers(token))
            if badges_response.status_code == 200:
                new_badges = badges_response.json()
                new_slugs = [b["badge"]["slug"] for b in new_badges if "badge" in b and "slug" in b["badge"]]
                
                if "plant_first" in new_slugs:
                    print("✅ plant_first badge awarded!")
                else:
                    print("❌ plant_first badge NOT awarded")
                    print(f"   Current badges: {', '.join(new_slugs)}")
        else:
            print(f"❌ Failed to add plant: {plant_response.status_code}")
            print(f"   Response: {plant_response.text}")
    
    # Check watering_first
    has_watering_first = "watering_first" in initial_slugs
    print(f"\n💧 Has watering_first: {has_watering_first}")
    
    if not has_watering_first:
        # Get a plant to water
        plants_response = requests.get(f"{BASE_URL}/plants", headers=get_headers(token))
        if plants_response.status_code == 200:
            plants = plants_response.json()
            if plants:
                plant_id = plants[0].get("id")
                
                print(f"\n💧 Logging watering for plant {plant_id}...")
                care_response = requests.post(
                    f"{BASE_URL}/care-logs",
                    json={
                        "plant_id": plant_id,
                        "action": "water",
                        "notes": "Test watering for badge"
                    },
                    headers=get_headers(token)
                )
                
                if care_response.status_code in [200, 201]:
                    print("✅ Watering logged")
                    
                    # Trigger auto-award
                    badges_response = requests.get(f"{BASE_URL}/users/me/badges", headers=get_headers(token))
                    if badges_response.status_code == 200:
                        new_badges = badges_response.json()
                        new_slugs = [b["badge"]["slug"] for b in new_badges if "badge" in b and "slug" in b["badge"]]
                        
                        if "watering_first" in new_slugs:
                            print("✅ watering_first badge awarded!")
                        else:
                            print("❌ watering_first badge NOT awarded")
                            print(f"   Current badges: {', '.join(new_slugs)}")
                else:
                    print(f"❌ Failed to log watering: {care_response.status_code}")
                    print(f"   Response: {care_response.text}")
    
    # Check time milestone badges
    print("\n⏰ Checking time milestone badges...")
    catalog_response = requests.get(f"{BASE_URL}/users/me/badges/catalog", headers=get_headers(token))
    if catalog_response.status_code == 200:
        catalog = catalog_response.json()
        time_badges = [item for item in catalog.get("items", []) 
                      if item["slug"] in ["grove_1_month", "grove_6_months", "grove_1_year"]]
        
        for badge in time_badges:
            status = "✅ EARNED" if badge["earned"] else "⏳ Not yet"
            print(f"   {badge['slug']}: {status}")
    
    # Final badge count
    final_response = requests.get(f"{BASE_URL}/users/me/badges", headers=get_headers(token))
    if final_response.status_code == 200:
        final_badges = final_response.json()
        print(f"\n📊 Final badge count: {len(final_badges)}")
        print(f"   Gained: {len(final_badges) - len(initial_badges)} badges")
    
    print("\n✅ Earning logic test completed")
    return 0

if __name__ == "__main__":
    sys.exit(test_earning_logic())
