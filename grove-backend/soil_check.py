"""Soil test fields and coaching copy.

Pure functions, no database access, so they can be unit tested. The soil
test is logged as a care action named `soil_check`. Every outcome and
decision is accepted. The coaching text explains, and never grades.
"""
from typing import Dict, Optional

SOIL_ACTION = "soil_check"
SOIL_OUTCOMES = ("dry", "damp")
SOIL_DECISIONS = ("water", "wait")


class SoilCheckError(ValueError):
    """Raised when a soil test has a missing or invalid value."""


def soil_fields(action: str, outcome: Optional[str], decision: Optional[str]) -> Dict[str, Optional[str]]:
    """Fields to store on a care log. Empty for any action but `soil_check`."""
    if action != SOIL_ACTION:
        return {}
    if outcome not in SOIL_OUTCOMES:
        raise SoilCheckError("A soil test needs an outcome: dry or damp.")
    if decision is not None and decision not in SOIL_DECISIONS:
        raise SoilCheckError("A soil test decision must be water or wait.")
    return {"soil_outcome": outcome, "soil_decision": decision}


_COACHING = {
    ("damp", "wait"): "Damp soil means your plant is still drinking, so waiting is a good call. Check again in a few days.",
    ("dry", "water"): "Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.",
    ("damp", "water"): "Damp already? This is a good spot to wait. Check again in a few days.",
    ("dry", "wait"): "Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.",
    ("damp", None): "Damp soil means your plant is still drinking. Check again in a few days.",
    ("dry", None): "Dry soil is ready for a drink. Water slowly until it runs from the drainage hole.",
}


def soil_coaching(outcome: Optional[str], decision: Optional[str]) -> str:
    """Short, plain coaching text for a soil test. Empty if the outcome is unknown."""
    return _COACHING.get((outcome, decision), "")
