import React, { useCallback, useRef, useState } from 'react';
import { lessonAPI } from '../lib/api';
import { PLAN_QUESTIONS } from '../constants/onboardingQuiz';
import { QuizIntroStep, QuestionStep } from './onboarding/QuizSteps';
import { BuildingStep } from './onboarding/PlanSteps';

// The same four questions as first-run, for someone who skipped them there. It sits over the app, has no step
// counter (it is not part of sign-up), and skipping never waits on the network.
export default function QuizFlow({ onDone }) {
  const [stage, setStage] = useState('intro'); // intro | question | building
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const left = useRef(false);

  const leave = useCallback((result) => {
    if (left.current) return;
    left.current = true;
    onDone(result);
  }, [onDone]);

  // The save is best effort; if it fails the quiz simply comes back next session.
  const skipAll = () => {
    lessonAPI.submitQuiz([]).catch(() => {});
    leave({ skipped: true });
  };

  const pick = (id) => setAnswers((prev) => ({ ...prev, [PLAN_QUESTIONS[index].id]: id }));
  const next = (clear) => {
    if (clear) setAnswers((prev) => { const rest = { ...prev }; delete rest[PLAN_QUESTIONS[index].id]; return rest; });
    if (index < PLAN_QUESTIONS.length - 1) setIndex(index + 1);
    else setStage('building');
  };
  const back = () => { if (index > 0) setIndex(index - 1); else setStage('intro'); };

  let body;
  if (stage === 'intro') {
    body = <QuizIntroStep step={null} onStart={() => { setIndex(0); setStage('question'); }} onSkip={skipAll} />;
  } else if (stage === 'question') {
    body = (
      <QuestionStep
        key={index}
        step={null}
        index={index}
        value={answers[PLAN_QUESTIONS[index].id]}
        onPick={pick}
        onNext={() => next(false)}
        onSkip={() => next(true)}
        onBack={back}
      />
    );
  } else {
    body = <BuildingStep answers={answers} onResult={leave} onSkip={skipAll} />;
  }

  return (
    <div className="fixed inset-0 z-celebration overflow-y-auto bg-grove-forest" role="dialog" aria-modal="true" aria-label="Your plant style" data-testid="quiz-flow">
      {body}
    </div>
  );
}
