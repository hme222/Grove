import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonAPI, lightAPI } from '../lib/api';
import { LESSON_CARDS } from '../lessons/registry';
import { LESSON_META } from '../lessons/lessonMeta';
import LessonPlayer from '../lessons/LessonPlayer';
import SoilTestStep from '../lessons/SoilTestStep';
import MarkDoneStep from '../lessons/MarkDoneStep';
import FirstCareCelebration from '../components/FirstCareCelebration';
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
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState('');

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
    lightAPI.progress(lessonId, index).catch(() => {});
    if (updateUser) updateUser({ lesson_progress: { ...(user?.lesson_progress || {}), [lessonId]: index } });
  };

  if (!cards || !LESSON_META[lessonId]) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-plant text-[#1C2E10] text-xl mb-2">That lesson isn&apos;t here</p>
          <button type="button" onClick={() => navigate('/lessons')} className="text-sm underline text-[#2D5016]">
            Back to lessons
          </button>
        </div>
      </div>
    );
  }

  const finish = async () => {
    setError('');
    try {
      await lessonAPI.complete(lessonId);
      // Keep the signed-in user in step, so the nook offer can follow the first lesson.
      const entry = `lesson:${lessonId}`;
      const seen = user?.tutorials_seen || [];
      if (updateUser && !seen.includes(entry)) updateUser({ tutorials_seen: [...seen, entry] });
      navigate('/lessons');
    } catch (_e) {
      setError('Could not save your progress. Try again.');
    }
  };

  const onSoilLogged = (meta) => {
    if (meta?.first_care_pending) setCelebrate(true);
    else finish();
  };

  const renderFinalCard = () => (
    <>
      {lessonId === 'soil-finger-test' ? (
        <SoilTestStep hasPlant={hasPlant} onLogged={onSoilLogged} />
      ) : (
        <MarkDoneStep onDone={finish} onNotYet={() => navigate('/lessons')} />
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs font-ui text-red-700" data-testid="lesson-error">
          {error}
        </p>
      )}
    </>
  );

  if (!resume.ready) return null;

  return (
    <>
      <LessonPlayer
        cards={cards}
        initialIndex={resume.index}
        onAdvance={onAdvance}
        renderCard={(card, helpers) => renderLightCard(card, helpers, { user, updateUser, nookOn, finish })}
        renderFinalCard={renderFinalCard}
        onExit={() => navigate('/lessons')}
        host={nookOn ? <PipPanel form={pipForm} label="Pip" /> : null}
      />
      <FirstCareCelebration
        open={celebrate}
        onClose={() => {
          setCelebrate(false);
          // The celebration has played, so the nook offer may follow.
          if (updateUser) updateUser({ first_care_celebrated: true });
          finish();
        }}
      />
    </>
  );
}
