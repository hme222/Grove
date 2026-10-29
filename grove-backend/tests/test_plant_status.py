from datetime import datetime, timedelta, timezone

import server


def _plant(**over):
    now = datetime.now(timezone.utc)
    base = {"next_water_due": (now + timedelta(hours=20)).isoformat()}
    base.update(over)
    return base


def test_due_within_a_day_needs_water():
    assert server.calculate_plant_status(_plant()) == 'needs_water'


def test_a_plant_watered_this_morning_is_not_asking_again():
    now = datetime.now(timezone.utc)
    plant = _plant(last_watered_at=(now - timedelta(hours=2)).isoformat())
    assert server.calculate_plant_status(plant) == 'healthy'


def test_watered_long_ago_still_needs_water():
    now = datetime.now(timezone.utc)
    plant = _plant(last_watered_at=(now - timedelta(hours=30)).isoformat())
    assert server.calculate_plant_status(plant) == 'needs_water'


def test_a_long_overdue_plant_stays_urgent_even_with_a_stale_log_time():
    now = datetime.now(timezone.utc)
    plant = {"next_water_due": (now - timedelta(days=5)).isoformat(), "last_watered_at": (now - timedelta(hours=1)).isoformat()}
    assert server.calculate_plant_status(plant) == 'urgent'


def test_watered_recently_is_false_without_a_log_and_true_within_twelve_hours():
    now = datetime.now(timezone.utc)
    assert server.watered_recently({}, now) is False
    assert server.watered_recently({"last_watered_at": (now - timedelta(hours=3)).isoformat()}, now) is True
    assert server.watered_recently({"last_watered_at": (now - timedelta(hours=13)).isoformat()}, now) is False
    assert server.watered_recently({"last_watered_at": "garbage"}, now) is False
