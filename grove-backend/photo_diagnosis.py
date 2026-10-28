"""The photo check on Help my plant. The treatment arm of the help_diagnosis experiment.

A photo cannot show soil moisture or roots, which is where most houseplant problems start. So the
person answers a soil question first, the answer goes to the model with the photo, and the result is
worded as likely causes with plain-language confidence, never as a verdict.
"""
SOIL_ANSWERS = ("dry", "damp", "wet")
SOIL_TEXT = {
    "dry": "The soil is dry two knuckles down.",
    "damp": "The soil is slightly damp two knuckles down.",
    "wet": "The soil is wet or soggy two knuckles down.",
}
LIKELIHOOD_WORDS = {"high": "Likely", "medium": "Possible", "low": "Less likely"}
MAX_CAUSES = 3

DIAGNOSIS_SYSTEM = (
    "You are a horticulturist helping a new plant owner work out what is wrong with a houseplant from a "
    "photo. Photos cannot show roots or soil moisture, so rely on the soil answer you are given, and say so "
    "when the photo is not enough. Offer likely causes, not a diagnosis. Check light and watering before "
    "pests or disease. Never tell someone to water a plant whose soil is damp or wet. Answer in warm American "
    "English, never punitive. Return ONLY a single valid JSON object, no prose, no markdown, no code fences."
)


def build_prompt(soil_answer: str) -> str:
    return (
        f"The owner checked the soil: {SOIL_TEXT[soil_answer]}\n"
        "Look at the plant in the photo and name up to three likely causes of what looks wrong. "
        "Return ONLY a JSON object with EXACTLY these fields:\n"
        "{\n"
        '  "seesAProblem": boolean,\n'
        '  "causes": [\n'
        '    {"title": "string, a few words", "likelihood": "high|medium|low", '
        '"why": "string, one sentence tied to what is visible or to the soil answer", '
        '"check": "string, one thing to look at", "fix": "string, one thing to try"}\n'
        "  ],\n"
        '  "photoIsEnough": boolean\n'
        "}\n"
        "If the plant looks healthy or the photo is unclear, set seesAProblem or photoIsEnough to false."
    )


def _text(value, limit=300):
    return str(value or "").strip()[:limit]


def finish(parsed: dict) -> dict:
    """Clamp a model answer into the shape the page shows."""
    parsed = parsed if isinstance(parsed, dict) else {}
    causes = []
    for raw in parsed.get("causes") or []:
        if not isinstance(raw, dict) or not _text(raw.get("title")):
            continue
        likelihood = raw.get("likelihood") if raw.get("likelihood") in LIKELIHOOD_WORDS else "low"
        causes.append({
            "title": _text(raw.get("title"), 80),
            "likelihood": LIKELIHOOD_WORDS[likelihood],
            "why": _text(raw.get("why")),
            "check": _text(raw.get("check")),
            "fix": _text(raw.get("fix")),
        })
    causes = causes[:MAX_CAUSES]
    sees_problem = bool(parsed.get("seesAProblem", bool(causes)))
    photo_enough = bool(parsed.get("photoIsEnough", True))
    top = causes[0]["likelihood"] if causes else None
    if not causes or not sees_problem or not photo_enough or top == "Less likely":
        confidence = "Not sure, please check"
    elif top == "Likely":
        confidence = "Fairly sure"
    else:
        confidence = "Somewhat sure"
    return {
        "causes": causes,
        "confidence": confidence,
        "notSure": confidence == "Not sure, please check",
        "limits": "A photo can’t show your roots or how wet the soil is, so treat this as a place to start.",
    }
