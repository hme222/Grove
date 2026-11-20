"""Pet safety and the plant-ID "why" facts come from Grove's species library, never the model."""
import asyncio
import os
import re

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:1")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("JWT_SECRET", "test-secret")

server = pytest.importorskip("server", reason="server dependencies are not installed")
from fastapi.testclient import TestClient  # noqa: E402

from fakes import Collection  # noqa: E402
import species_safety  # noqa: E402

MONSTERA = {
    "id": "sp-monstera",
    "common_name": "Monstera",
    "latin_name": "Monstera deliciosa",
    "family": "Araceae",
    "toxicity": "toxic",
    "citations": [
        {"label": "Royal Horticultural Society", "url": "https://example.org"},
        {"label": "ASPCA Toxic and Non-Toxic Plants", "url": "https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/x"},
    ],
}

# The same plant as an older record: a toxicity value but no ASPCA citation behind it.
UNSOURCED = {**MONSTERA, "id": "sp-old", "latin_name": "Old plant", "common_name": "Old", "toxicity": "mild",
             "citations": [{"label": "Royal Horticultural Society", "url": "https://example.org"}]}


class FakeSpecies:
    def __init__(self, docs):
        self.docs = docs

    async def find_one(self, flt, projection=None):
        for doc in self.docs:
            ok = True
            for key, cond in flt.items():
                if isinstance(cond, dict) and "$regex" in cond:
                    flags = re.I if "i" in cond.get("$options", "") else 0
                    ok = ok and bool(re.search(cond["$regex"], doc.get(key) or "", flags))
                else:
                    ok = ok and doc.get(key) == cond
            if ok:
                return doc
        return None


class FakeDb:
    def __init__(self, species):
        self.species = FakeSpecies(species)
        # identify now checks the account and records the call (entitlements.py), so it needs these two as well
        self.users = Collection()
        self.ai_usage = Collection()


def _run(coro):
    return asyncio.run(coro)


def test_library_lookup_by_id_then_latin_name(monkeypatch):
    monkeypatch.setattr(server, "db", FakeDb([MONSTERA]))
    assert _run(server.find_library_species("sp-monstera"))["id"] == "sp-monstera"
    assert _run(server.find_library_species(None, "  monstera DELICIOSA "))["id"] == "sp-monstera"


def test_library_lookup_is_exact_not_partial_and_escapes_regex(monkeypatch):
    monkeypatch.setattr(server, "db", FakeDb([MONSTERA]))
    assert _run(server.find_library_species(None, "Monstera")) is None
    assert _run(server.find_library_species(None, ".*")) is None
    assert _run(server.find_library_species(None, "")) is None


def test_match_summary_only_carries_library_facts():
    assert server.library_match_summary(None) is None
    summary = server.library_match_summary(MONSTERA)
    assert summary == {
        "speciesId": "sp-monstera",
        "commonName": "Monstera",
        "latinName": "Monstera deliciosa",
        "family": "Araceae",
        "source": "Royal Horticultural Society",
    }


@pytest.fixture
def identify_client(monkeypatch):
    def build(model_json, species):
        monkeypatch.setattr(server, "db", FakeDb(species))

        async def fake_b64(_payload):
            return "abc"

        async def fake_vision(*_args, **_kwargs):
            return model_json

        monkeypatch.setattr(server, "_resolve_image_b64", fake_b64)
        monkeypatch.setattr(server, "call_claude_vision", fake_vision)
        server.app.dependency_overrides[server.get_current_user] = lambda: {"user_id": "u1", "email": "a@b.c"}
        return TestClient(server.app)

    yield build
    server.app.dependency_overrides.pop(server.get_current_user, None)


def test_identify_attaches_library_toxicity_and_match(identify_client):
    client = identify_client('{"commonName": "Monstera", "latinName": "Monstera deliciosa", "confidence": 0.9, "isConfident": true}', [MONSTERA])
    body = client.post("/api/plants/identify", json={"path": "x.jpg"}).json()
    assert body["toxicity"] == "toxic"
    assert body["libraryMatch"]["family"] == "Araceae"


def test_identify_low_confidence_reports_unknown_even_with_a_library_match(identify_client):
    for model_json in (
        '{"commonName": "Monstera", "latinName": "Monstera deliciosa", "confidence": 0.5, "isConfident": true}',
        '{"commonName": "Monstera", "latinName": "Monstera deliciosa", "confidence": 0.9, "isConfident": false}',
    ):
        client = identify_client(model_json, [MONSTERA])
        body = client.post("/api/plants/identify", json={"path": "x.jpg"}).json()
        assert body["toxicity"] is None


def test_identify_with_no_library_match_reports_unknown_not_safe(identify_client):
    client = identify_client('{"commonName": "Mystery fern", "latinName": "Fernus mysterium", "confidence": 0.8, "isConfident": true}', [MONSTERA])
    body = client.post("/api/plants/identify", json={"path": "x.jpg"}).json()
    assert body["toxicity"] is None
    assert body["libraryMatch"] is None


def test_identify_never_returns_an_unsourced_toxicity(monkeypatch):
    monkeypatch.setattr(server, "db", FakeDb([UNSOURCED]))
    found = _run(server.find_library_species(None, "Old plant"))
    assert found["toxicity"] is None


# --- Held-back mode (PET_SAFETY_LABELS unset): a link to the ASPCA list, no rating, no repeated listing. ---

def test_labels_off_shows_no_rating_even_for_a_sourced_species(monkeypatch):
    monkeypatch.setattr(species_safety, "LABELS_ENABLED", False)
    assert species_safety.shown_toxicity(MONSTERA) is None
    assert species_safety.scrub_species(MONSTERA)["toxicity"] is None
    assert species_safety.sourced_toxicity(MONSTERA) == "toxic"  # the record keeps its sourced value


def test_labels_off_identify_sends_no_rating(identify_client, monkeypatch):
    monkeypatch.setattr(species_safety, "LABELS_ENABLED", False)
    client = identify_client('{"commonName": "Monstera", "latinName": "Monstera deliciosa", "confidence": 0.9, "isConfident": true}', [MONSTERA])
    assert client.post("/api/plants/identify", json={"path": "x.jpg"}).json()["toxicity"] is None


def test_labels_off_care_text_does_not_repeat_an_aspca_listing(monkeypatch):
    monkeypatch.setattr(species_safety, "LABELS_ENABLED", False)
    toxic = "Bright light. The ASPCA lists it as toxic to cats and dogs, so keep it out of reach."
    assert species_safety.shown_safety_text(toxic) == "Bright light. Keep it out of reach of pets and children."
    assert species_safety.shown_safety_text("Full sun. The ASPCA lists it as non-toxic to cats and dogs.") == "Full sun."
    notes = "swap in Cast Iron Plant, which the ASPCA lists as non-toxic to cats and dogs. Keep Pothos high."
    assert species_safety.shown_safety_text(notes) == "swap in Cast Iron Plant. Keep Pothos high."
    from curated_species import CURATED_SPECIES
    from curated_guilds import CURATED_GUILDS
    for text in [s["care_summary"] for s in CURATED_SPECIES] + [g.get("design_notes", "") for g in CURATED_GUILDS]:
        assert "ASPCA lists" not in species_safety.shown_safety_text(text)


def test_labels_on_leaves_care_text_alone():
    text = "Bright light. The ASPCA lists it as toxic to cats and dogs, so keep it out of reach."
    assert species_safety.shown_safety_text(text) == text
