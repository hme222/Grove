"""Care-card reasons use gentle check-in wording, never deadline language."""
import os
from datetime import datetime, timedelta, timezone

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")


def _iso(days_ago):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()


def test_urgent_reason_with_a_last_watered_date_is_a_check_in():
    plant = {"next_water_due": _iso(3), "last_watered_at": _iso(10), "watering_frequency_days": 7}
    reason = server.compute_status_reason(plant, "urgent")
    assert reason == "It's on a 7-day schedule, so the soil may be dry by now."


def test_urgent_reason_without_a_last_watered_date_keeps_the_days():
    plant = {"next_water_due": _iso(4), "watering_frequency_days": 5}
    reason = server.compute_status_reason(plant, "urgent")
    assert reason.startswith("About 4 days past its 5-day schedule")


@pytest.mark.parametrize("status", ["urgent", "needs_water"])
def test_no_deadline_words(status):
    plant = {"next_water_due": _iso(3), "last_watered_at": _iso(10), "watering_frequency_days": 7}
    reason = server.compute_status_reason(plant, status).lower()
    assert "overdue" not in reason and "urgent" not in reason
