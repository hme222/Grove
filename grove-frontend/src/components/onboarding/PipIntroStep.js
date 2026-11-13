import React, { useState } from 'react';
import StepScreen, { StepActions } from './StepScreen';
import PipPanel from '../../nook/PipPanel';
import { usePipPrefs } from '../../lib/pipPrefs';
import { PIP_INTRO, introPatch } from '../../lib/pipIntroCopy';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

// Pip says hello, once, just before the plan. "Nice to meet you" carries on. "Turn me off" switches him off and carries on.
// A failed save says so and stays, so the choice is never lost silently.
export default function PipIntroStep({ onDone }) {
  const { save } = usePipPrefs();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const choose = async (turnOff) => {
    setBusy(true);
    setError('');
    try {
      await save(introPatch(turnOff));
      onDone();
    } catch {
      setError(PIP_INTRO.error);
      setBusy(false);
    }
  };

  return (
    <StepScreen heading={PIP_INTRO.title} testId="onboarding-pip">
      <div className="mt-6 flex flex-1 flex-col items-center">
        <div className="my-auto flex flex-col items-center text-center">
          <PipPanel form="seed" mood="curious" animate bare label={PIP_INTRO.spriteLabel} scale={12} />
          <p className="mt-8 font-ui text-base leading-relaxed text-grove-cream" data-testid="pip-step-body">{PIP_INTRO.body}</p>
          {error && <p role="alert" className="mt-3 font-ui text-sm text-destructive" data-testid="pip-step-error">{error}</p>}
        </div>
        <StepActions
          className="w-full"
          primary={(
            <button type="button" disabled={busy} onClick={() => choose(false)} className={cn(buttonVariants(), 'w-full')} data-testid="pip-step-agree">
              {PIP_INTRO.agree}
            </button>
          )}
          secondary={(
            <button type="button" disabled={busy} onClick={() => choose(true)} className="min-h-touch px-4 font-ui text-sm text-grove-sprout underline underline-offset-4" data-testid="pip-step-off">
              {PIP_INTRO.off}
            </button>
          )}
        />
      </div>
    </StepScreen>
  );
}
