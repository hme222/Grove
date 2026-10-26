import React from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { PLAN_QUESTIONS } from '@/constants/onboardingQuiz';
import StepScreen from './StepScreen';
import HeroImage from './HeroImage';

const linkButton = cn(buttonVariants({ variant: 'ghost' }), 'w-full underline underline-offset-2');

// Step 3 of 3. Four questions, and the reason for asking them is on the first screen.
export function QuizIntroStep({ onBack, onStart, onSkip }) {
  return (
    <StepScreen
      step={3}
      stepLabel="Your plant style"
      onBack={onBack}
      heading="Four quick questions"
      intro="No right answers. We use them to choose your first lesson, and nothing else. Skip any question you like, and we start with the basics."
      testId="onboarding-quiz-intro"
      hero={<HeroImage name="windowsill" ratio="8 / 7" eager />}
    >
      <div className="mt-6 flex flex-1 flex-col">
        <div className="mt-auto space-y-2 pt-8">
          <button type="button" onClick={onStart} className={cn(buttonVariants(), 'w-full')} data-testid="quiz-intro-start">
            Let&apos;s go
          </button>
          <p className="text-center font-ui text-sm text-grove-sage">About 1 minute</p>
          <button type="button" onClick={onSkip} className={linkButton} data-testid="quiz-intro-skip">
            Skip these questions
          </button>
        </div>
      </div>
    </StepScreen>
  );
}

// One question: pick one, or skip it. The answer is not saved until the end.
export function QuestionStep({ index, value, onPick, onNext, onSkip, onBack }) {
  const question = PLAN_QUESTIONS[index];
  const last = index === PLAN_QUESTIONS.length - 1;
  const headingId = `quiz-q${index + 1}-heading`;
  return (
    <StepScreen
      step={3}
      stepLabel="Your plant style"
      onBack={onBack}
      heading={question.heading}
      headingId={headingId}
      testId={`onboarding-${question.id}`}
    >
      <p className="mt-1 font-ui text-sm text-grove-sage" data-testid="question-count">
        Question {index + 1} of {PLAN_QUESTIONS.length}
      </p>
      <div className="mt-4 flex flex-1 flex-col">
        <div role="radiogroup" aria-labelledby={headingId} className="space-y-2">
          {question.options.map((option) => {
            const on = value === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onPick(option.id)}
                data-testid={`option-${question.id}-${option.id}`}
                className={cn(
                  'flex min-h-touch w-full items-center gap-3 rounded-small border-hairline px-4 py-3 text-left font-ui text-sm text-grove-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime',
                  on ? 'border-grove-lime bg-grove-moss' : 'border-grove-fernLine bg-grove-canopy hover:border-grove-lime',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-strong', on ? 'border-grove-lime bg-grove-lime text-grove-root' : 'border-grove-fernLine')}
                >
                  {on ? '✓' : ''}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-ui text-sm text-grove-sage" data-testid="question-why">{question.why}</p>
        <div className="mt-auto space-y-2 pt-8">
          <button type="button" onClick={onNext} disabled={!value} className={cn(buttonVariants(), 'w-full')} data-testid="question-next">
            {last ? 'See my plan' : 'Next'}
          </button>
          <button type="button" onClick={onSkip} className={linkButton} data-testid="question-skip">
            Skip this question
          </button>
        </div>
      </div>
    </StepScreen>
  );
}
