import NotFoundPage from '../pages/NotFoundPage';
import React, { useEffect, useState } from 'react';
import { LESSON_SOURCES } from '../lessons/sources';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonAPI, lightAPI } from '../lib/api';
import { LESSON_CARDS } from '../lessons/registry';
import { LESSON_META } from '../lessons/lessonMeta';
import { LESSON_ACTIONS } from '../lessons/lessonQuizzes';
import LessonPlayer from '../lessons/LessonPlayer';
import SoilTestStep from '../lessons/SoilTestStep';
import LessonFinalStep from '../lessons/LessonFinalStep';
import FirstCareCelebration from '../components/FirstCareCelebration';
import LessonCompleteCelebration from '../components/LessonCompleteCelebration';
import { useAuth } from '../contexts/AuthContext';
import PipPanel from '../nook/PipPanel';
import { renderLightCard } from '../lessons/light/steps';
import { usePipForm } from '../nook/usePipForm';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const cards = LESSON_CARDS[lessonId];
  const { user, updateUser } = useAuth();
  const nookOn = !!user?.nook_enabled;
  const pipForm = usePipForm(nookOn);
  const [hasPlant, setHasPlant] = useState(false);
  const [resume, setResume] = useState({ ready: false, index: 0 });
  const [pickedWindow, setPickedWindow] = useState(null);
  const [celebrate, setCelebrate] = useState(false);
  // Set once the save has gone through: the lesson to thank them for and the next one to offer.
  const [finished, setFinished] = useState(null);
  const [error, setError] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    lessonAPI
      .queue()
      .then((res) => {
        if (!alive) return;
        setHasPlant(!!res.data?.has_plant);
        // A lesson that is already done starts again from the first card.
        const done = (res.data?.completed || []).includes(lessonId);
        setResume({ ready: true, index: done ? 0 : res.data?.progress?.[lessonId] || 0 });
      })
      .catch(() => {
        if (!alive) return;
        setHasPlant(false);
        setResume({ ready: true, index: 0 });
      });
    return () => {
      alive = false;
    };
  }, [lessonId]);

  const onAdvance = (index) => {
    // A failed save never blocks reading. It says so, and the next card tries again.
    Promise.resolve(lightAPI.progress(lessonId, index)).then(() => setSaveFailed(false), () => setSaveFailed(true));
    if (updateUser) updateUser({ lesson_progress: { ...(user?.lesson_progress || {}), [lessonId]: index } });
  };

  if (!cards || !LESSON_META[lessonId]) {
    return <NotFoundPage title="Lesson not found" heading="That lesson isn’t here" message="It may have been renamed or removed." to="/lessons" toLabel="Back to lessons" />;
  }

  // Saves the lesson, then marks the moment. `quiet` skips the card when another celebration has just played.
  const finish = async (to = '/lessons', { quiet = false } = {}) => {
    setError('');
    try {
      const res = await lessonAPI.complete(lessonId);
      // Keep the signed-in user in step, so the nook offer can follow the first lesson.
      const entry = `lesson:${lessonId}`;
      const seen = user?.tutorials_seen || [];
      if (updateUser && !seen.includes(entry)) updateUser({ tutorials_seen: [...seen, entry] });
      if (quiet) {
        navigate(to);
        return;
      }
      const nextId = res?.data?.queue?.find((id) => id !== lessonId) || res?.data?.up_next;
      const next = nextId && nextId !== lessonId && LESSON_META[nextId] ? { id: nextId, title: LESSON_META[nextId].title } : null;
      setFinished({ next, action: to !== '/lessons' ? { to, cta: LESSON_ACTIONS[lessonId]?.cta } : null });
    } catch (_e) {
      setError('Couldn\u2019t save your progress. Try again.');
    }
  };

  const onSoilLogged = (meta) => {
    if (meta?.first_care_pending) setCelebrate(true);
    else finish();
  };

  // The finish control, used by the last card of any lesson and by the light lesson's ending.
  const renderMarkDone = () => (
    <>
      <LessonFinalStep lessonId={lessonId} hasPlant={hasPlant} onDone={finish} onNotYet={() => navigate('/lessons')} />
      {error && (
        <p role="alert" className="mt-2 text-xs font-ui text-destructive" data-testid="lesson-error">
          {error}
        </p>
      )}
    </>
  );

  const renderFinalCard = () =>
    lessonId === 'soil-finger-test' ? (
      <>
        <SoilTestStep hasPlant={hasPlant} onLogged={onSoilLogged} />
        {error && (
          <p role="alert" className="mt-2 text-xs font-ui text-destructive" data-testid="lesson-error">
            {error}
          </p>
        )}
      </>
    ) : (
      renderMarkDone()
    );

  if (!resume.ready) return null;

  return (
    <>
      <LessonPlayer
        cards={cards}
        initialIndex={resume.index}
        onAdvance={onAdvance}
        renderCard={(card, helpers) => renderLightCard(card, helpers, { user, updateUser, nookOn, finish, window: pickedWindow, setWindow: setPickedWindow, renderMarkDone })}
        renderFinalCard={renderFinalCard}
        onExit={() => navigate('/lessons')}
        sources={LESSON_SOURCES[lessonId]}
        notice={saveFailed ? 'Progress isn\u2019t saving right now. You can keep reading.' : ''}
        host={nookOn ? <PipPanel form={pipForm} label="Pip" /> : null}
      />
      <FirstCareCelebration
        open={celebrate}
        onClose={() => {
          setCelebrate(false);
          // The celebration has played, so the nook offer may follow.
          if (updateUser) updateUser({ first_care_celebrated: true });
          finish('/lessons', { quiet: true });
        }}
      />
      <LessonCompleteCelebration
        open={!!finished}
        lesson={LESSON_META[lessonId]}
        next={finished?.next || null}
        action={finished?.action || null}
        onGo={(to) => navigate(to)}
      />
    </>
  );
}
