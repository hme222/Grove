import React, { useEffect, useRef } from 'react';
import BackButton from '../BackButton';
import { cn } from '@/lib/utils';

export const TOTAL_STEPS = 3;

// One screen of the first-run flow: Back, progress as words ("Step 1 of 3 · Your account"), a headline
// that takes focus when the screen opens, then whatever the step needs. The bar is decoration; the words
// carry the progress.
// A primary action that is not available yet stays focusable and says why (aria-disabled, with a visible
// hint line named by aria-describedby); clicking it does nothing. Border 3:1 on Forest, label 5.5:1 on Moss.
export const blockedClass = 'border-strong border-grove-fernLine bg-grove-moss text-grove-sage hover:bg-grove-moss cursor-not-allowed';

// The action zone at the foot of a step: the main action, then one 44px secondary slot (a link-style
// button, a counter, or empty). Every step has the same two rows, so the main button sits at the same
// height from the bottom edge on every screen.
export function StepActions({ primary, secondary, className }) {
  return (
    <div className={cn('mt-auto pt-8', className)} data-testid="step-actions">
      <div className="flex flex-col gap-2">
        {primary}
        <div className="flex min-h-touch items-center justify-center">{secondary}</div>
      </div>
    </div>
  );
}

// One word in a headline or line, underlined in lime. The line draws in once, then stays. With reduced motion it is
// simply there. `delay` (seconds) lets it wait for something else on the screen, such as a step filling.
export function Underlined({ children, delay }) {
  return <span className="os-underline" style={delay !== undefined ? { animationDelay: `${delay}s` } : undefined}>{children}</span>;
}

export default function StepScreen({ step, stepLabel, onBack, skip, heading, eyebrow, reserveEyebrow, intro, children, testId, headingId, hero, bleed }) {
  const headingRef = useRef(null);

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus({ preventScroll: true });
  }, []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col" data-testid={testId}>
      {bleed}
      <div className={`os-pad flex flex-1 flex-col px-4 pb-6 ${bleed ? 'pt-4' : 'pt-6'}`}>
      {(onBack || skip || !bleed) && (
        <div className="flex min-h-touch items-center justify-between gap-2">
          {onBack ? <BackButton onClick={onBack} testId="onboarding-back" /> : <span />}
          {skip && (
            <button
              type="button"
              onClick={skip.onClick}
              disabled={skip.disabled}
              aria-label={skip.ariaLabel}
              data-testid={skip.testId}
              className="flex min-h-touch items-center rounded-control px-2 font-ui text-sm text-grove-cream underline underline-offset-4 hover:text-grove-sprout focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime disabled:opacity-50"
            >
              {skip.label}
            </button>
          )}
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
      {eyebrow && <p className="mt-6 font-ui text-sm text-grove-sage" data-testid="onboarding-eyebrow">{eyebrow}</p>}
      {/* A screen with no eyebrow can still keep the row, so its headline and photo line up with its neighbors. */}
      {!eyebrow && reserveEyebrow && <p className="mt-6 font-ui text-sm invisible" aria-hidden="true">&nbsp;</p>}
      <h1
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className={cn(eyebrow || reserveEyebrow ? 'mt-1' : 'mt-6', 'font-plant text-3xl leading-tight text-grove-cream focus:outline-none')}
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
