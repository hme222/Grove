import React, { useState } from 'react';
import LessonQuiz from './LessonQuiz';
import MarkDoneStep from './MarkDoneStep';
import TryItStep from './TryItStep';
import { LESSON_QUIZZES, LESSON_ACTIONS } from './lessonQuizzes';

// What follows the last card of a reading lesson: the quick check, and once it is done either a
// "Try it on your plant" step (where the lesson has a natural action) or Mark lesson done.
export default function LessonFinalStep({ lessonId, hasPlant, onDone, onNotYet }) {
  const questions = LESSON_QUIZZES[lessonId];
  const action = LESSON_ACTIONS[lessonId];
  const [quizDone, setQuizDone] = useState(!questions);

  if (!quizDone) return <LessonQuiz questions={questions} onComplete={() => setQuizDone(true)} />;
  if (action) return <TryItStep action={action} hasPlant={hasPlant} onStart={onDone} onNotYet={onNotYet} />;
  return <MarkDoneStep onDone={() => onDone()} onNotYet={onNotYet} />;
}
