"""Experiment arms and the events that measure them.

One experiment so far, `help_diagnosis`, on the Help my plant page:
  control      the rule-based symptom triage only
  photo_check  the triage plus "Check with a photo" (see photo_diagnosis.py)

EXPERIMENT_HELP_DIAGNOSIS sets the mode: `off` (the default, everyone gets control), `split` (a stable
50/50 by user id) or `on` (everyone gets photo_check, for internal testing). Without an Anthropic key
nobody is put in photo_check, so a missing key can't make that arm look worse than it is.
"""
import hashlib
import os

HELP_DIAGNOSIS = "help_diagnosis"
ARMS = {HELP_DIAGNOSIS: ("control", "photo_check")}
MODES = ("off", "split", "on")

EVENTS = {
    HELP_DIAGNOSIS: {
        "exposure",              # the Help page was opened in this arm
        "triage_symptom_picked",
        "photo_check_started",   # the person began the photo check
        "photo_check_result",    # a result was shown (the server records this one)
        "photo_check_none_fit",  # the person said none of the causes fit
        "photo_check_failed",
    },
}


def mode_for(experiment: str) -> str:
    value = os.environ.get("EXPERIMENT_HELP_DIAGNOSIS", "off").strip().lower()
    return value if value in MODES else "off"


def ai_ready() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def assign(user_id: str, experiment: str = HELP_DIAGNOSIS, mode: str = None, ai: bool = None) -> str:
    control, treatment = ARMS[experiment]
    mode = mode if mode is not None else mode_for(experiment)
    ai = ai_ready() if ai is None else ai
    if mode == "off" or not ai:
        return control
    if mode == "on":
        return treatment
    digest = hashlib.sha256(f"{experiment}:{user_id}".encode()).digest()
    return treatment if digest[0] % 2 else control


def valid_event(experiment: str, event: str) -> bool:
    return event in EVENTS.get(experiment, ())
