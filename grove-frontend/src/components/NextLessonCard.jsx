import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lessonAPI } from '../lib/api';
import { LESSON_META, lessonPath } from '../lessons/lessonMeta';

// Care Today's way into the lessons. With a saved track it shows the next
// unfinished lesson. Everyone else, and anyone whose lesson cannot be shown,
// gets a quiet link to the lessons list, so the lessons are always reachable.
export default function NextLessonCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasTrack = !!user?.primary_track;
  const [state, setState] = useState({ loaded: false, lessonId: null });

  useEffect(() => {
    if (!hasTrack) return undefined;
    let alive = true;
    lessonAPI
      .queue()
      .then((res) => {
        if (alive) setState({ loaded: true, lessonId: res.data?.queue?.[0] || res.data?.up_next || null });
      })
      .catch(() => {
        if (alive) setState({ loaded: true, lessonId: null });
      });
    return () => {
      alive = false;
    };
  }, [hasTrack]);

  if (!user) return null;
  if (hasTrack && !state.loaded) return null;

  const lesson = state.lessonId ? LESSON_META[state.lessonId] : null;

  if (!lesson) {
    return (
      <div className="text-right">
        <button
          type="button"
          onClick={() => navigate('/lessons')}
          className="text-xs font-ui text-[#2D5016] underline underline-offset-2"
          data-testid="lessons-link"
        >
          Browse lessons
        </button>
      </div>
    );
  }

  return (
    <section
      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-4 flex items-center justify-between gap-3"
      data-testid="next-lesson-card"
    >
      <div>
        <p className="text-[11px] font-ui uppercase tracking-[0.1em] text-[#2B2B26]">Your next lesson</p>
        <p className="font-plant text-[#1C2E10] text-lg">{lesson.title}</p>
        <p className="text-xs font-ui text-[#2B2B26]">{lesson.blurb}</p>
        <button
          type="button"
          onClick={() => navigate('/lessons')}
          className="mt-1 text-xs font-ui text-[#2D5016] underline underline-offset-2"
          data-testid="next-lesson-all"
        >
          All lessons
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigate(lessonPath(state.lessonId))}
        className="shrink-0 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
        data-testid="next-lesson-start"
      >
        Start
      </button>
    </section>
  );
}
