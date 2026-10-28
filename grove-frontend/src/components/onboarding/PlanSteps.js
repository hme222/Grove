import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { lessonAPI } from '@/lib/api';
import { LESSON_META } from '@/lessons/lessonMeta';
import { answerLabel } from '@/constants/onboardingQuiz';
import StepScreen, { StepActions } from './StepScreen';
import PhotoBand from '../PhotoBand';

const HOLD_MS = 600;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function Item({ done, children }) {
  return (
    <li className="flex items-center gap-3 font-ui text-sm text-grove-cream">
      <span aria-hidden="true" className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-pill', done ? 'bg-grove-lime text-grove-root' : 'border-strong border-grove-fernLine')}>
        {done ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3 opacity-0" />}
      </span>
      <span>{children}<span className="sr-only">{done ? ', done' : ', in progress'}</span></span>
    </li>
  );
}

// Sends the answers (or an empty set, when everything was skipped) and shows the real progress of that
// one request. The ticks mean the server has the answers and has chosen the lesson; nothing else.
export function BuildingStep({ answers, onResult, onSkip }) {
  const [status, setStatus] = useState('working'); // working | done | failed
  const alive = useRef(true);
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setStatus('working');
    try {
      const res = await lessonAPI.submitPlan(answers);
      if (!alive.current) return;
      setStatus('done');
      await wait(HOLD_MS);
      if (alive.current) onResult(res.data);
    } catch {
      if (alive.current) setStatus('failed');
    } finally {
      running.current = false;
    }
  }, [answers, onResult]);

  useEffect(() => {
    alive.current = true;
    run();
    return () => { alive.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = status === 'done';
  return (
    <StepScreen heading={status === 'failed' ? 'We couldn’t build your plan' : 'Building your plan…'} testId="onboarding-building">
      <div className="mt-6 flex flex-1 flex-col">
        {status === 'failed' ? (
          <p role="alert" className="font-ui text-sm text-destructive" data-testid="building-error">
            We couldn&apos;t save your answers. Check your connection, then try again. Nothing is lost.
          </p>
        ) : (
          <>
            <ul role="status" className="space-y-3" data-testid="building-list">
              <Item done={done}>Reading your answers</Item>
              <Item done={done}>Picking your first lesson</Item>
            </ul>
            <p className="mt-4 font-ui text-sm text-grove-sage">This takes a few seconds.</p>
          </>
        )}
        {status === 'failed' && (
          <StepActions
            primary={<button type="button" onClick={run} className={cn(buttonVariants(), 'w-full')} data-testid="building-retry">Try again</button>}
            secondary={<button type="button" onClick={onSkip} className={cn(buttonVariants({ variant: 'ghost' }), 'w-full underline underline-offset-2')} data-testid="building-skip">Skip for now</button>}
          />
        )}
      </div>
    </StepScreen>
  );
}

// "Welcome, Maya. Your plan." Everything on it comes from the answers the person gave.
export function PlanStep({ name, result, busy, error, onStart, onExplore }) {
  const queue = (result && result.queue) || [];
  const first = queue[0] ? LESSON_META[queue[0]] : null;
  const second = queue[1] ? LESSON_META[queue[1]] : null;
  const matched = (result && result.matched) || [];
  const answered = Object.keys((result && result.plan_answers) || {}).length;

  let because;
  if (matched.length) {
    because = (
      <>
        <p className="font-ui text-sm text-grove-sage">Because you said:</p>
        <ul className="mt-1 space-y-1" data-testid="plan-because">
          {matched.map((m) => (
            <li key={m.question} className="font-ui text-sm text-grove-cream">“{answerLabel(m.question, m.answer)}”</li>
          ))}
        </ul>
      </>
    );
  } else if (answered === 0) {
    because = <p className="font-ui text-sm text-grove-cream" data-testid="plan-because">You skipped the questions, so we start with the basics.</p>;
  } else {
    because = <p className="font-ui text-sm text-grove-cream" data-testid="plan-because">Nothing you picked pointed to one lesson, so we start with the basics.</p>;
  }

  return (
    <StepScreen
      heading={name ? `Welcome, ${name}` : 'Welcome to FloraGrove'}
      testId="onboarding-plan"
      bleed={<PhotoBand src={queue[0] === 'soil-finger-test' ? '/photos/onboarding-soil.jpg' : '/photos/onboarding-sprouts.jpg'} ratio="band" eager className="rounded-none" testId="hero-image" />}
    >
      <div className="mt-6 flex flex-1 flex-col">
        {first && (
          <section aria-labelledby="plan-first" className="rounded-card border-hairline border-grove-fernLine bg-grove-canopy p-5" data-testid="plan-card">
            <p id="plan-first" className="font-ui text-sm text-grove-sage">Your first lesson</p>
            <h2 className="mt-1 font-plant text-2xl leading-tight text-grove-cream" data-testid="plan-lesson-title">{first.title}</h2>
            <p className="mt-1 font-ui text-sm text-grove-cream">{first.blurb}</p>
            <div className="mt-4">{because}</div>
            {second && (
              <p className="mt-4 font-ui text-sm text-grove-sage" data-testid="plan-then">
                Then: <span className="text-grove-cream">{second.title}</span>
              </p>
            )}
          </section>
        )}
        {error && <p role="alert" className="mt-3 font-ui text-sm text-destructive" data-testid="plan-error">{error}</p>}
        <StepActions
          primary={first ? (
            <button type="button" onClick={onStart} disabled={busy} aria-busy={busy} className={cn(buttonVariants(), 'w-full')} data-testid="plan-start">
              {busy ? 'Saving…' : 'Start lesson'}
            </button>
          ) : (
            <button type="button" onClick={onExplore} disabled={busy} className={cn(buttonVariants(), 'w-full')} data-testid="plan-explore">
              Explore the app first
            </button>
          )}
          secondary={first ? (
            <button type="button" onClick={onExplore} disabled={busy} className={cn(buttonVariants({ variant: 'ghost' }), 'w-full underline underline-offset-2')} data-testid="plan-explore">
              Explore the app first
            </button>
          ) : null}
        />
      </div>
    </StepScreen>
  );
}
