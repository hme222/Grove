import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { AppLink } from '@/components/AppLink';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, userAPI } from '@/lib/api';
import { lessonPath } from '@/lessons/lessonMeta';
import { PLAN_QUESTIONS } from '@/constants/onboardingQuiz';
import AccountStep from './onboarding/AccountStep';
import { CheckEmailStep, ConfirmedStep } from './onboarding/EmailSteps';
import { ZoneStep, HemisphereStep } from './onboarding/ZoneSteps';
import { QuizIntroStep, QuestionStep } from './onboarding/QuizSteps';
import { BuildingStep, PlanStep } from './onboarding/PlanSteps';
import StepScreen, { StepActions } from './onboarding/StepScreen';
import PhotoBand from './PhotoBand';

// The first-run flow, from the Figma file "Grove App" (Full Onboarding, with the Sill-style additions):
//   welcome, three intro slides, create account (1 of 3), [check email], where you grow (2 of 3),
//   four quick questions (3 of 3), building your plan, welcome with your plan.
// Someone who is already signed in (a replay, or a sign-up that was left half done) starts after the account step.
// Everything after the intro slides is optional and can be skipped.

const OFF = { email_verification: false, sso: {} };

const SLIDES = [
  {
    // The welcome screen has already said the name, the definition of a grove and the promise, so this
    // screen says something new: what the next few minutes are.
    kicker: null,
    title: 'Three short steps to set up',
    lead: 'Make your account, tell us where you grow, and answer four quick questions.',
    body: 'You can skip the last two and change any answer later.',
    photo: '/photos/onboarding-forest.jpg',
  },
  {
    kicker: 'Grow together',
    title: 'Track care, not metrics',
    lead: 'FloraGrove gives you simple, clear tools to help plants thrive.',
    body: 'FloraGrove does not gamify your plants. It helps you pay attention to plant care and build a rhythm.',
    photo: '/photos/onboarding-shelf.jpg',
  },
  {
    kicker: null,
    title: 'Each plant has a story',
    lead: 'Whether or not you’re a plant parent, we’re here to become a part of that story.',
    body: 'FloraGrove will always explain the “why” behind any plant care suggestion',
    photo: '/photos/onboarding-plants.jpg',
  },
];

const STAGE_LABELS = {
  welcome: 'Welcome to FloraGrove',
  account: 'Create your account',
  'check-email': 'Check your email',
  confirmed: 'Email confirmed',
  zone: 'Where you grow',
  hemisphere: 'Where you grow',
  'quiz-intro': 'A few quick questions',
  question: 'A few quick questions',
  building: 'Building your plan',
  plan: 'Your plan',
};

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled])';

// Keeps Tab inside the flow. It does not move focus in: each screen puts focus on its own headline.
function trapTab(event, root) {
  if (event.key !== 'Tab' || !root) return;
  const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
  if (!items.length) { event.preventDefault(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  if (!root.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
  else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

export function firstName(value) {
  const word = (value || '').trim().split(/\s+/)[0] || '';
  return /^\p{L}{2,}$/u.test(word) ? word : '';
}

function IntroStep({ index, onBack, onNext, onSkip }) {
  const slide = SLIDES[index];
  return (
    <StepScreen heading={slide.title} eyebrow={slide.kicker} onBack={onBack} testId={`onboarding-intro-${index + 1}`}>
      <button
        type="button"
        onClick={onSkip}
        aria-label="Skip intro"
        data-testid="onboarding-skip"
        className="absolute right-4 top-6 flex min-h-touch min-w-touch items-center justify-center rounded-control text-grove-cream hover:text-grove-sprout"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="mt-4 flex flex-1 flex-col">
        <p className="font-ui text-base font-medium text-grove-cream">{slide.lead}</p>
        <p className="mt-2 font-ui text-sm leading-relaxed text-grove-cream">{slide.body}</p>
        <PhotoBand src={slide.photo} ratio="photo" eager={index === 0} className="mt-6" testId="hero-image" />
        <StepActions
          primary={(
            <button type="button" onClick={onNext} className={cn(buttonVariants(), 'w-full')} data-testid="onboarding-continue">
              Continue
            </button>
          )}
          secondary={<p className="font-ui text-sm text-grove-sage">{index + 1} of {SLIDES.length}</p>}
        />
      </div>
    </StepScreen>
  );
}

export function Onboarding({ onComplete, replay = false }) {
  const { user, updateUser } = useAuth();
  const [stage, setStage] = useState(() => (user && !replay ? 'zone' : 'welcome'));
  const [config, setConfig] = useState(null);
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [planResult, setPlanResult] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState('');
  const shell = useRef(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve(authAPI.config())
      .then((res) => { if (alive) setConfig(res.data || OFF); })
      .catch(() => { if (alive) setConfig(OFF); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onKey = (e) => trapTab(e, shell.current);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // While the flow is open the app behind it is inert (and hidden from screen readers), so Tab and the
  // virtual cursor cannot wander into Today's controls under the overlay. Restored when it closes.
  useEffect(() => {
    const host = shell.current && shell.current.parentElement;
    if (!host) return undefined;
    const marked = new Set();
    // The app behind may mount a moment after the overlay (routes render after the first-run redirect), so
    // mark siblings now and again whenever the root's children change.
    const mark = () => [...host.children].forEach((el) => {
      if (el === shell.current || marked.has(el) || el.hasAttribute('inert')) return;
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
      marked.add(el);
    });
    mark();
    const observer = typeof MutationObserver === 'function' ? new MutationObserver(mark) : null;
    if (observer) observer.observe(host, { childList: true });
    return () => {
      if (observer) observer.disconnect();
      marked.forEach((el) => {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      });
    };
  }, []);

  // The welcome screen has no StepScreen to take focus, so put it on its headline (or Continue).
  useEffect(() => {
    if (stage !== 'welcome' || !shell.current) return;
    const target = shell.current.querySelector('h1') || shell.current.querySelector('button[data-testid="welcome-continue"], button');
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.style.outline = 'none';
    target.focus({ preventScroll: true });
  }, [stage]);

  // A save error belongs to the screen it happened on.
  useEffect(() => { setFinishError(''); }, [stage]);

  const greetName = name || firstName(user && user.display_name);

  const finish = async ({ to, planned } = {}) => {
    setFinishing(true);
    setFinishError('');
    try {
      await userAPI.updateMe({ onboarding_complete: true });
      onComplete(to || planned ? { ...(to ? { to } : {}), planned: !!planned } : undefined);
    } catch {
      setFinishError('We couldn’t save that. Check your connection and try again.');
      setFinishing(false);
    }
  };

  const skipIntro = () => { if (user) finish(); else setStage('account'); };

  const afterAccount = ({ user: created, name: given, sso }) => {
    setName(firstName(given));
    if (sso && created && created.onboarding_complete) { onComplete(); return; }
    if (!sso && config && config.email_verification && created && created.email_confirmed === false) setStage('check-email');
    else setStage('zone');
  };

  const goConfirmed = useCallback(() => setStage('confirmed'), []);
  const goZone = useCallback(() => setStage('zone'), []);

  const afterZone = (saved) => {
    if (saved && updateUser) updateUser(saved);
    const known = (saved && saved.hemisphere) || (user && user.hemisphere);
    setStage(known ? 'quiz-intro' : 'hemisphere');
  };

  const answerNow = (id) => setAnswers((prev) => ({ ...prev, [PLAN_QUESTIONS[qIndex].id]: id }));
  const leaveQuestion = (clear) => {
    if (clear) setAnswers((prev) => { const next = { ...prev }; delete next[PLAN_QUESTIONS[qIndex].id]; return next; });
    if (qIndex < PLAN_QUESTIONS.length - 1) setQIndex(qIndex + 1);
    else setStage('building');
  };
  const backFromQuestion = () => { if (qIndex > 0) setQIndex(qIndex - 1); else setStage('quiz-intro'); };

  const planReady = useCallback((result) => {
    if (updateUser) updateUser({ primary_track: result.primary_track });
    setPlanResult(result);
    setStage('plan');
  }, [updateUser]);

  const welcome = stage === 'welcome';
  let body = null;
  if (welcome) {
    body = (
      <>
        <WelcomeScreen onContinue={() => setStage('intro-0')} onSkip={() => finish()} disabled={finishing} showSkip={!!user} />
        {!user && (
          <AppLink
            to="/login"
            data-testid="welcome-signin"
            className="fixed inset-x-0 bottom-0 z-intro flex min-h-touch items-center justify-center bg-grove-forest font-ui text-sm text-grove-cream underline underline-offset-2"
          >
            Already have an account? Sign in
          </AppLink>
        )}
      </>
    );
  } else if (stage.startsWith('intro-')) {
    const index = Number(stage.slice(6));
    body = (
      <IntroStep
        key={stage}
        index={index}
        onBack={() => setStage(index === 0 ? 'welcome' : `intro-${index - 1}`)}
        onNext={() => (index < SLIDES.length - 1 ? setStage(`intro-${index + 1}`) : user ? setStage('zone') : setStage('account'))}
        onSkip={skipIntro}
      />
    );
  } else if (stage === 'account') {
    body = <AccountStep config={config || OFF} onBack={() => setStage(`intro-${SLIDES.length - 1}`)} onDone={afterAccount} />;
  } else if (stage === 'check-email') {
    body = <CheckEmailStep onConfirmed={goConfirmed} onLater={goZone} />;
  } else if (stage === 'confirmed') {
    body = <ConfirmedStep name={greetName} onContinue={goZone} />;
  } else if (stage === 'zone') {
    body = (
      <ZoneStep
        onBack={replay ? () => setStage(`intro-${SLIDES.length - 1}`) : undefined}
        onSaved={afterZone}
        onSkip={() => afterZone(null)}
      />
    );
  } else if (stage === 'hemisphere') {
    body = <HemisphereStep onBack={() => setStage('zone')} onDone={(saved) => { if (saved && updateUser) updateUser(saved); setStage('quiz-intro'); }} />;
  } else if (stage === 'quiz-intro') {
    body = (
      <QuizIntroStep
        onBack={() => setStage('zone')}
        onStart={() => { setQIndex(0); setStage('question'); }}
        onSkip={() => { setAnswers({}); setStage('building'); }}
      />
    );
  } else if (stage === 'question') {
    body = (
      <QuestionStep
        key={qIndex}
        index={qIndex}
        value={answers[PLAN_QUESTIONS[qIndex].id]}
        onPick={answerNow}
        onNext={() => leaveQuestion(false)}
        onSkip={() => leaveQuestion(true)}
        onBack={backFromQuestion}
      />
    );
  } else if (stage === 'building') {
    body = <BuildingStep answers={answers} onResult={planReady} onSkip={() => finish({ planned: true })} />;
  } else if (stage === 'plan') {
    const first = planResult && planResult.queue && planResult.queue[0];
    body = (
      <PlanStep
        name={greetName}
        result={planResult}
        busy={finishing}
        onStart={() => finish({ to: lessonPath(first), planned: true })}
        onExplore={() => finish({ planned: true })}
      />
    );
  }

  const introIndex = stage.startsWith('intro-') ? Number(stage.slice(6)) : -1;
  const dialogLabel = introIndex >= 0 ? SLIDES[introIndex].title : STAGE_LABELS[stage] || 'Welcome to FloraGrove';

  return (
    <div
      ref={shell}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      className={welcome ? undefined : 'fixed inset-0 z-intro overflow-y-auto bg-grove-forest'}
      data-testid="onboarding-flow"
    >
      {body}
      {/* One slot for every stage: a failed save while leaving (the welcome X, Skip intro, Skip for now on
          the plan) says so here. The skip stays enabled, so pressing it again retries. */}
      <p
        role="alert"
        className={finishError ? 'fixed inset-x-4 top-4 z-celebration mx-auto max-w-md rounded-small border-hairline border-destructive bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-cream' : 'sr-only'}
        data-testid="onboarding-finish-error"
      >
        {finishError}
      </p>
    </div>
  );
}
