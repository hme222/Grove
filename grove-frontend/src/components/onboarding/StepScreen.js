import React, { useEffect, useRef } from 'react';
import BackButton from '../BackButton';

export const TOTAL_STEPS = 3;

// One screen of the first-run flow: Back, progress as words ("Step 1 of 3 · Your account"), a headline
// that takes focus when the screen opens, then whatever the step needs. The bar is decoration; the words
// carry the progress.
export default function StepScreen({ step, stepLabel, onBack, heading, intro, children, testId, headingId, hero, bleed }) {
  const headingRef = useRef(null);

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus({ preventScroll: true });
  }, []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col" data-testid={testId}>
      {bleed}
      <div className={`flex flex-1 flex-col px-4 pb-6 ${bleed ? 'pt-4' : 'pt-6'}`}>
      {(onBack || !bleed) && (
        <div className="flex min-h-touch items-center">
          {onBack && <BackButton onClick={onBack} testId="onboarding-back" />}
        </div>
      )}
      {step && (
        <>
          <div className="mt-2 flex gap-2" aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-pill ${i < step ? 'bg-grove-lime' : 'bg-grove-moss'}`} />
            ))}
          </div>
          <p className="mt-2 font-ui text-sm text-grove-sage" data-testid="onboarding-progress">
            Step {step} of {TOTAL_STEPS} · {stepLabel}
          </p>
        </>
      )}
      {hero && <div className="mt-4">{hero}</div>}
      <h1
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 font-plant text-3xl leading-tight text-grove-cream focus:outline-none"
        data-testid="onboarding-heading"
      >
        {heading}
      </h1>
      {intro && <p className="mt-2 font-ui text-sm leading-relaxed text-grove-cream">{intro}</p>}
      {children}
      </div>
    </div>
  );
}
