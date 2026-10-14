import pytest

import tracks


@pytest.mark.parametrize(
    "answer,track",
    [
        ("unwell_or_guilt", "reset"),
        ("overwater", "rebirth"),
        ("gifted_no_instructions", "rescue"),
        ("forget", "steady_sprout"),
        ("design_or_no_plant", "seedling"),
    ],
)
def test_single_answer_maps_to_track(answer, track):
    assert tracks.resolve_primary_track([answer]) == track


def test_empty_answers_use_default_track():
    assert tracks.resolve_primary_track([]) == tracks.DEFAULT_TRACK
    assert tracks.DEFAULT_TRACK == "rebirth"


def test_none_answers_use_default_track():
    assert tracks.resolve_primary_track(None) == tracks.DEFAULT_TRACK


def test_unknown_answers_are_ignored():
    assert tracks.resolve_primary_track(["nonsense", "<script>"]) == tracks.DEFAULT_TRACK
    assert tracks.resolve_primary_track(["nonsense", "forget"]) == "steady_sprout"


def test_priority_when_several_answers_are_picked():
    # rescue beats reset beats rebirth beats steady_sprout beats seedling
    assert tracks.resolve_primary_track(["design_or_no_plant", "forget"]) == "steady_sprout"
    assert tracks.resolve_primary_track(["forget", "overwater"]) == "rebirth"
    assert tracks.resolve_primary_track(["overwater", "unwell_or_guilt"]) == "reset"
    assert tracks.resolve_primary_track(["unwell_or_guilt", "gifted_no_instructions"]) == "rescue"


def test_queue_puts_soil_lesson_second_for_every_other_track():
    assert tracks.build_lesson_queue("reset", []) == ["plant-parent-reset", "soil-finger-test"]
    assert tracks.build_lesson_queue("rescue", []) == ["plant-er", "soil-finger-test"]
    assert tracks.build_lesson_queue("steady_sprout", []) == ["habit-stacking", "soil-finger-test"]
    assert tracks.build_lesson_queue("seedling", []) == ["window-blueprint", "soil-finger-test"]


def test_queue_for_rebirth_starts_with_soil_lesson():
    assert tracks.build_lesson_queue("rebirth", []) == ["soil-finger-test", "plant-parent-reset"]


def test_queue_drops_completed_lessons_and_keeps_order():
    assert tracks.build_lesson_queue("rescue", ["plant-er"]) == ["soil-finger-test"]
    assert tracks.build_lesson_queue("rescue", ["soil-finger-test"]) == ["plant-er"]
    assert tracks.build_lesson_queue("rescue", ["plant-er", "soil-finger-test"]) == []


def test_queue_falls_back_for_unknown_track():
    assert tracks.build_lesson_queue("made-up", []) == tracks.build_lesson_queue("rebirth", [])
    assert tracks.build_lesson_queue(None, []) == tracks.build_lesson_queue("rebirth", [])


def test_lesson_tutorial_id_uses_prefix():
    assert tracks.lesson_tutorial_id("plant-er") == "lesson:plant-er"


def test_completed_lessons_reads_only_known_lesson_entries():
    seen = ["collection", "lesson:plant-er", "lesson:not-a-lesson", "lighting", "lesson:soil-finger-test", 7, None]
    assert tracks.completed_lessons(seen) == ["plant-er", "soil-finger-test"]


def test_completed_lessons_handles_missing_list():
    assert tracks.completed_lessons(None) == []
