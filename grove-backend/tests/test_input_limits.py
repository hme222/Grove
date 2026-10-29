"""Request bodies are bounded: sizes, ranges, known values, and the real type of an upload."""
import base64
import os

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
import ai_service  # noqa: E402
import input_limits as limits  # noqa: E402
from fastapi import HTTPException  # noqa: E402
from pydantic import ValidationError  # noqa: E402

PNG = b'\x89PNG\r\n\x1a\n' + b'\x00' * 16
JPEG = b'\xff\xd8\xff\xe0' + b'\x00' * 16


def bad(model, **fields):
    with pytest.raises(ValidationError):
        model(**fields)


def test_register_needs_a_real_email_and_a_usable_password():
    server.RegisterInput(email="a@b.co", password="secret1")
    bad(server.RegisterInput, email="nope", password="secret1")
    bad(server.RegisterInput, email="a@b.co", password="1")
    bad(server.RegisterInput, email="a@b.co", password="x" * 200)
    bad(server.RegisterInput, email="a@b.co", password="secret1", username="u" * 200)


def test_watering_interval_is_a_sane_number_of_days():
    server.PlantCreate(common_name="Fern", watering_frequency_days=7)
    for days in (0, -3, 999999999):
        bad(server.PlantCreate, common_name="Fern", watering_frequency_days=days)
        bad(server.PlantUpdate, watering_frequency_days=days)
    bad(server.PlantCreate, common_name="")
    bad(server.PlantCreate, common_name="x" * 500)


def test_care_logs_are_bounded():
    server.CareLogCreate(action="water", water_level_pct=40)
    bad(server.CareLogCreate, action="water", water_level_pct=500)
    bad(server.CareLogCreate, action="water", notes="n" * 200000)
    bad(server.BulkCareLogCreate, plant_ids=[str(i) for i in range(1000)], action="water")


def test_unknown_care_actions_are_refused_but_the_apps_own_actions_pass():
    assert server._normalize_actions(None, ["light_check", "note", "water"]) == ["light_check", "note", "water"]
    with pytest.raises(HTTPException) as err:
        server._normalize_actions("explode", None)
    assert err.value.status_code == 400


def test_posts_and_comments():
    server.PostCreate(caption="New leaf")
    bad(server.PostCreate)
    bad(server.PostCreate, caption="hi", post_type="bogus")
    bad(server.PostCreate, caption="c" * 200000)
    bad(server.CommentCreate, body="")
    bad(server.CommentCreate, body="c" * 200000)


def test_groves_and_goals():
    bad(server.GroveCreate, name="")
    bad(server.GroveCreate, name="g" * 500)
    server.GoalCreate(title="Water weekly", goal_type="custom", target_value=3)
    bad(server.GoalCreate, title="t", goal_type="nope", target_value=3)
    bad(server.GoalCreate, title="t", goal_type="custom", target_value=0)
    bad(server.GoalCreate, title="t" * 500, goal_type="custom", target_value=3)
    bad(server.GoalUpdate, current_value=-99)
    bad(server.GoalUpdate, status="bogus")


def test_profile_text_and_quiet_hours():
    bad(server.UserUpdate, bio="b" * 200000)
    server.NotificationPreferencesInput(quiet_hours_start="21:00")
    bad(server.NotificationPreferencesInput, quiet_hours_start="99:99")


def test_upload_type_comes_from_the_bytes():
    assert limits.sniff_image_type(PNG) == 'image/png'
    assert limits.sniff_image_type(JPEG) == 'image/jpeg'
    assert limits.sniff_image_type(b'<html><script>alert(1)</script>') is None
    assert limits.sniff_image_type(b'') is None


def test_vision_call_uses_the_real_image_type():
    assert ai_service._media_type(base64.b64encode(PNG).decode()) == 'image/png'
    assert ai_service._media_type(base64.b64encode(JPEG).decode()) == 'image/jpeg'
    assert ai_service._media_type('not base64 !!') == 'image/jpeg'
