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

MONSTERA = {
    "id": "sp-monstera",
    "common_name": "Monstera",
    "latin_name": "Monstera deliciosa",
    "family": "Araceae",
    "toxicity": "mild",
    "citations": [{"label": "Royal Horticultural Society", "url": "https://example.org"}],
}


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
    assert body["toxicity"] == "mild"
    assert body["libraryMatch"]["family"] == "Araceae"


def test_identify_with_no_library_match_reports_unknown_not_safe(identify_client):
    client = identify_client('{"commonName": "Mystery fern", "latinName": "Fernus mysterium", "confidence": 0.8, "isConfident": true}', [MONSTERA])
    body = client.post("/api/plants/identify", json={"path": "x.jpg"}).json()
    assert body["toxicity"] is None
    assert body["libraryMatch"] is None
