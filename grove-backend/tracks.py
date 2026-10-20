"""Lesson tracks and quiz resolution for Grove.

Pure functions only: no database access, so they can be unit tested.
Track names are internal labels. Users never see them.
"""
from typing import Iterable, List, Optional, Set

TRACKS = ("reset", "rebirth", "rescue", "steady_sprout", "seedling")

# The lessons a person can start.
LIBRARY_LESSON_IDS = (
    "soil-finger-test",
    "plant-parent-reset",
    "plant-er",
    "habit-stacking",
    "light-basics",
    "window-map",
)
# Retired lessons. Their records are still read, so nook growth and badges already earned stay.
LEGACY_LESSON_IDS = ("window-blueprint",)
LESSON_IDS = LIBRARY_LESSON_IDS + LEGACY_LESSON_IDS

TRACK_LESSON = {
    "reset": "plant-parent-reset",
    "rebirth": "soil-finger-test",
    "rescue": "plant-er",
    "steady_sprout": "habit-stacking",
    "seedling": "light-basics",
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


def with_legacy_credit(done: Iterable[str]) -> List[str]:
    """Show Part 1 of the light lessons as done for anyone who finished the retired lesson.

    This is for display and queueing only. Nothing is written, so no growth is added.
    """
    credited = list(done or [])
    if "window-blueprint" in credited and "light-basics" not in credited:
        credited.append("light-basics")
    return credited


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
