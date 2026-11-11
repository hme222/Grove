import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { PLAN_QUESTIONS } from '@/constants/onboardingQuiz';
import StepScreen, { StepActions, blockedClass } from './StepScreen';
import PhotoBand from '../PhotoBand';
import {
  Sprout, HeartCrack, Gift, Leaf, Trees, Briefcase, CircleHelp, Frown, Droplets, Search, FlaskConical, Sparkles, Smile,
  LifeBuoy, CalendarCheck, SlidersHorizontal, FastForward, Target, Compass, BookOpen, Cog, Microscope,
} from 'lucide-react';

// One line icon per answer, in the same style as the rest of the app. They only decorate; the words carry the meaning.
const ANSWER_ICONS = {
  sprout: Sprout, 'heart-crack': HeartCrack, gift: Gift, leaf: Leaf, trees: Trees, briefcase: Briefcase, help: CircleHelp,
  frown: Frown, droplets: Droplets, search: Search, flask: FlaskConical, sparkles: Sparkles, smile: Smile, 'life-buoy': LifeBuoy,
  calendar: CalendarCheck, sliders: SlidersHorizontal, 'fast-forward': FastForward, target: Target, compass: Compass,
  book: BookOpen, cog: Cog, microscope: Microscope,
};
const AnswerIcon = ({ name }) => {
  const Icon = ANSWER_ICONS[name] || Leaf;
  return <Icon className="h-5 w-5" strokeWidth={1.75} />;
};


const linkButton = cn(buttonVariants({ variant: 'ghost' }), 'w-full underline underline-offset-2');

// Step 3 of 3. Four questions, and the reason for asking them is on the first screen.
export function QuizIntroStep({ onBack, onStart, onSkip, step = 3 }) {
  return (
    <StepScreen
      step={step}
      stepLabel="Your plant style"
      onBack={onBack}
      heading="Four quick questions"
      intro="No right answers. We use them to choose your first lesson, and nothing else. Skip any question you like, and we start with the basics. About 1 minute."
      testId="onboarding-quiz-intro"
      hero={<PhotoBand src="/photos/onboarding-windowsill.jpg" ratio="photo" position="bottom" eager testId="hero-image" />}
    >
      <div className="mt-6 flex flex-1 flex-col">
        <StepActions
          primary={(
            <button type="button" onClick={onStart} className={cn(buttonVariants(), 'w-full')} data-testid="quiz-intro-start">
              Let&apos;s go
            </button>
          )}
          secondary={(
            <button type="button" onClick={onSkip} className={linkButton} data-testid="quiz-intro-skip">
              Skip these questions
            </button>
          )}
        />
      </div>
    </StepScreen>
  );
}

// One question: pick one, or skip it. The answer is not saved until the end.
// The options are a radio group: one tab stop (the chosen option, or the first), arrow keys move and choose,
// Home and End jump, Space and Enter choose the focused one.
export function QuestionStep({ index, value, onPick, onNext, onSkip, onBack, step = 3 }) {
  const question = PLAN_QUESTIONS[index];
  const last = index === PLAN_QUESTIONS.length - 1;
  const headingId = `quiz-q${index + 1}-heading`;
  const refs = useRef([]);
  const options = question.options;
  const checkedAt = options.findIndex((o) => o.id === value);
  const tabStop = checkedAt >= 0 ? checkedAt : 0;
  const hintId = `question-hint-${index + 1}`;
  const blocked = !value;

  const move = (to) => {
    const n = options.length;
    const next = ((to % n) + n) % n;
    onPick(options[next].id);
    const el = refs.current[next];
    if (el) el.focus();
  };

  const onKeyDown = (event, i) => {
    switch (event.key) {
      case 'ArrowDown': case 'ArrowRight': event.preventDefault(); move(i + 1); break;
      case 'ArrowUp': case 'ArrowLeft': event.preventDefault(); move(i - 1); break;
      case 'Home': event.preventDefault(); move(0); break;
      case 'End': event.preventDefault(); move(options.length - 1); break;
      default: break;
    }
  };

  return (
    <StepScreen
      step={step}
      stepLabel={`Question ${index + 1} of ${PLAN_QUESTIONS.length}`}
      onBack={onBack}
      heading={question.heading}
      headingId={headingId}
      testId={`onboarding-${question.id}`}
    >
      {!step && (
        <p className="mt-1 font-ui text-base text-grove-sage" data-testid="question-count">
          Question {index + 1} of {PLAN_QUESTIONS.length}
        </p>
      )}
      <div className="mt-4 flex flex-1 flex-col">
        <div role="radiogroup" aria-labelledby={headingId} className="space-y-2">
          {options.map((option, i) => {
            const on = value === option.id;
            return (
              <button
                key={option.id}
                ref={(el) => { refs.current[i] = el; }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={i === tabStop ? 0 : -1}
                onClick={() => onPick(option.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                data-testid={`option-${question.id}-${option.id}`}
                className={cn(
                  'flex min-h-touch w-full items-center gap-3 rounded-small border-hairline px-4 py-3 text-left font-ui text-base text-grove-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime',
                  on ? 'border-grove-lime bg-grove-moss' : 'border-grove-fernLine bg-grove-canopy hover:border-grove-lime',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-pill', on ? 'bg-grove-lime text-grove-root' : 'bg-grove-moss text-grove-sprout')}
                  data-testid={`icon-${question.id}-${option.id}`}
                >
                  <AnswerIcon name={option.icon} />
                </span>
                <span className="flex-1">{option.label}</span>
                <span
                  aria-hidden="true"
                  className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border-strong', on ? 'border-grove-lime bg-grove-lime text-grove-root' : 'border-grove-fernLine')}
                >
                  {on ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-ui text-base text-grove-sage" data-testid="question-why">{question.why}</p>
        {/* The hint's row is always there, so picking an answer does not move the buttons under the thumb. */}
        <p
          id={blocked ? hintId : undefined}
          className={cn('mt-6 text-center font-ui text-sm text-grove-sage', !blocked && 'invisible')}
          aria-hidden={blocked ? undefined : true}
          data-testid="question-hint"
        >
          Choose an option to continue
        </p>
        <StepActions
          className="pt-2"
          primary={(
            <button
              type="button"
              onClick={blocked ? undefined : onNext}
              aria-disabled={blocked ? 'true' : undefined}
              aria-describedby={blocked ? hintId : undefined}
              className={cn(buttonVariants(), 'w-full', blocked && blockedClass)}
              data-testid="question-next"
            >
              {last ? 'See my plan' : 'Next'}
            </button>
          )}
          secondary={(
            <button type="button" onClick={onSkip} className={linkButton} data-testid="question-skip">
              Skip this question
            </button>
          )}
        />
      </div>
    </StepScreen>
  );
}
