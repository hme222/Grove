import NotFoundPage from '../pages/NotFoundPage';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonAPI } from '../lib/api';
import { LESSON_CARDS } from '../lessons/registry';
import { LESSON_META } from '../lessons/lessonMeta';
import LessonPlayer from '../lessons/LessonPlayer';
import SoilTestStep from '../lessons/SoilTestStep';
import MarkDoneStep from '../lessons/MarkDoneStep';
import FirstCareCelebration from '../components/FirstCareCelebration';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const cards = LESSON_CARDS[lessonId];
  const [hasPlant, setHasPlant] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    lessonAPI
      .queue()
      .then((res) => {
        if (alive) setHasPlant(!!res.data?.has_plant);
      })
      .catch(() => {
        if (alive) setHasPlant(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!cards || !LESSON_META[lessonId]) {
    return <NotFoundPage title="Lesson not found" heading="That lesson isn't here" message="It may have been renamed or removed." to="/lessons" toLabel="Back to lessons" />;
  }

  const finish = async () => {
    setError('');
    try {
      await lessonAPI.complete(lessonId);
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
        <p role="alert" className="mt-2 text-xs font-ui text-destructive" data-testid="lesson-error">
          {error}
        </p>
      )}
    </>
  );

  return (
    <>
      <LessonPlayer cards={cards} renderFinalCard={renderFinalCard} onExit={() => navigate('/lessons')} />
      <FirstCareCelebration
        open={celebrate}
        onClose={() => {
          setCelebrate(false);
          finish();
        }}
      />
    </>
  );
}
