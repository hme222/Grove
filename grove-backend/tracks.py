"""Lesson tracks and quiz resolution for Grove.

Pure functions only: no database access, so they can be unit tested.
Track names are internal labels. Users never see them.
"""
from typing import Iterable, List, Optional, Set

TRACKS = ("reset", "rebirth", "rescue", "steady_sprout", "seedling")

LESSON_IDS = (
    "soil-finger-test",
    "plant-parent-reset",
    "plant-er",
    "habit-stacking",
    "window-blueprint",
)

TRACK_LESSON = {
    "reset": "plant-parent-reset",
    "rebirth": "soil-finger-test",
    "rescue": "plant-er",
    "steady_sprout": "habit-stacking",
    "seedling": "window-blueprint",
}

QUIZ_OPTION_TRACK = {
    "unwell_or_guilt": "reset",
    "overwater": "rebirth",
    "gifted_no_instructions": "rescue",
    "forget": "steady_sprout",
    "design_or_no_plant": "seedling",
}

# When several answers are picked, the first track in this list wins.
TRACK_PRIORITY = ("rescue", "reset", "rebirth", "steady_sprout", "seedling")

DEFAULT_TRACK = "rebirth"
SOIL_LESSON = "soil-finger-test"
# Rebirth users already get the soil lesson first, so their second lesson is this one.
REBIRTH_SECOND_LESSON = "plant-parent-reset"
LESSON_PREFIX = "lesson:"


def resolve_primary_track(answers: Optional[Iterable[str]]) -> str:
    """Pick one track from the quiz answers. Unknown answers are ignored."""
    picked: Set[str] = set()
    for answer in answers or []:
        track = QUIZ_OPTION_TRACK.get(answer) if isinstance(answer, str) else None
        if track:
            picked.add(track)
    for track in TRACK_PRIORITY:
        if track in picked:
            return track
    return DEFAULT_TRACK


def build_lesson_queue(primary_track: Optional[str], completed: Optional[Iterable[str]]) -> List[str]:
    """Return the lessons still to do, in order.

    Lesson 1 is the primary track's lesson. Lesson 2 is the Soil Finger-Test,
    except for rebirth, whose lesson 1 already is the Soil Finger-Test.
    """
    track = primary_track if primary_track in TRACK_LESSON else DEFAULT_TRACK
    first = TRACK_LESSON[track]
    second = REBIRTH_SECOND_LESSON if first == SOIL_LESSON else SOIL_LESSON
    done = set(completed or [])
    return [lesson for lesson in (first, second) if lesson not in done]


def lesson_tutorial_id(lesson_id: str) -> str:
    """The entry stored in `tutorials_seen[]` when a lesson is completed."""
    return f"{LESSON_PREFIX}{lesson_id}"


def completed_lessons(tutorials_seen: Optional[Iterable[str]]) -> List[str]:
    """Read completed lesson ids out of `tutorials_seen[]`. Other entries are ignored."""
    out: List[str] = []
    for entry in tutorials_seen or []:
        if not isinstance(entry, str) or not entry.startswith(LESSON_PREFIX):
            continue
        lesson_id = entry[len(LESSON_PREFIX):]
        if lesson_id in LESSON_IDS and lesson_id not in out:
            out.append(lesson_id)
    return out


# ---------------------------------------------------------------------------
# First-run plan quiz: four short questions, every one skippable.
#
# Each option points at one of the existing tracks, or at None when it says
# nothing about where to start (someone who already knows the basics). The
# plan only ever uses lessons that already exist: no new tracks.
# ---------------------------------------------------------------------------
PLAN_QUESTIONS = {
    "q1": {
        "none_yet": "seedling",
        "loved_and_lost": "reset",
        "gift": "rescue",
        "few_fine": None,
        "collection": None,
        "my_job": None,
    },
    "q2": {
        "wonder_wrong": "reset",
        "feel_guilty": "reset",
        "water_or_sun": "rebirth",
        "check_roots": None,
        "nutrients": "rescue",
        "no_plant": "seedling",
    },
    "q3": {
        "inspiration": "seedling",
        "confidence": "reset",
        "save_gift": "rescue",
        "routine": "steady_sprout",
        "advanced": None,
        "skip_basics": None,
    },
    "q4": {
        "blank_slate": "seedling",
        "overwhelmed": "rebirth",
        "winging_it": "steady_sprout",
        "know_basics": None,
        "mechanics": None,
        "botanical": None,
    },
}


def resolve_plan(plan_answers: Optional[dict]) -> dict:
    """Turn the four plan answers into one track.

    `plan_answers` maps a question id ("q1".."q4") to an option id. Unknown
    questions and unknown options are ignored, and a question left out is a
    skipped question. Each answered option votes for its track; the track with
    the most votes wins and a tie goes to the first track in TRACK_PRIORITY. When
    nothing votes (everything skipped, or only "I know the basics" answers) the
    default track is used and `matched` is empty, so the plan can say so.

    Returns {"primary_track", "matched", "answers"}. `matched` lists the
    {"question", "answer"} pairs that voted for the winning track, in question
    order, so the plan text can quote exactly what the person said.
    """
    clean: dict = {}
    votes: dict = {}
    if isinstance(plan_answers, dict):
        for question in PLAN_QUESTIONS:
            answer = plan_answers.get(question)
            options = PLAN_QUESTIONS[question]
            if not isinstance(answer, str) or answer not in options:
                continue
            clean[question] = answer
            track = options[answer]
            if track:
                votes[track] = votes.get(track, 0) + 1
    if not votes:
        return {"primary_track": DEFAULT_TRACK, "matched": [], "answers": clean}
    best = max(votes.values())
    winner = next(t for t in TRACK_PRIORITY if votes.get(t) == best)
    matched = [
        {"question": q, "answer": a}
        for q, a in clean.items()
        if PLAN_QUESTIONS[q][a] == winner
    ]
    return {"primary_track": winner, "matched": matched, "answers": clean}
