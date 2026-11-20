import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

import species_safety


@pytest.fixture(autouse=True)
def pet_safety_labels_on(monkeypatch):
    """Most tests cover how sourced pet-safety values are handled, so labels are on by default here.
    The held-back (link-only) mode that ships has its own tests, which switch this off."""
    monkeypatch.setattr(species_safety, "LABELS_ENABLED", True)
