import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lessonAPI } from '../lib/api';
import { LESSON_META, lessonPath } from '../lessons/lessonMeta';

// Shows the next unfinished lesson on Care Today. Only for people who took
// (or skipped) the quiz, so long-time users see nothing new.
export default function NextLessonCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessonId, setLessonId] = useState(null);

  useEffect(() => {
    if (!user?.primary_track) return undefined;
    let alive = true;
    lessonAPI
      .queue()
      .then((res) => {
        if (alive) setLessonId(res.data?.queue?.[0] || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.primary_track]);

  if (!user?.primary_track || !lessonId || !LESSON_META[lessonId]) return null;
  const lesson = LESSON_META[lessonId];

  return (
    <section
      className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-4 flex items-center justify-between gap-3"
      data-testid="next-lesson-card"
    >
      <div>
        <p className="text-[11px] font-ui uppercase tracking-[0.1em] text-[#2B2B26]">Your next lesson</p>
        <p className="font-plant text-[#1C2E10] text-lg">{lesson.title}</p>
        <p className="text-xs font-ui text-[#2B2B26]">{lesson.blurb}</p>
      </div>
      <button
        type="button"
        onClick={() => navigate(lessonPath(lessonId))}
        className="shrink-0 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
        data-testid="next-lesson-start"
      >
        Start
      </button>
    </section>
  );
}
