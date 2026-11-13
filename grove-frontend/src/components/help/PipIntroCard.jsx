import React, { useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import PipPanel from '../../nook/PipPanel';
import { PIP_INTRO } from '../../lib/pipIntroCopy';
import { holdFirstRun } from '../../lib/firstRunGate';
import { tint } from '../../lib/color';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

// Pip's hello, as a card, for people who were already using the app. New people meet him in onboarding instead.
// `onChoose(turnOff)` saves the answer. Escape counts as "Nice to meet you". A failed save keeps the card up and says so.
export default function PipIntroCard({ onChoose, error = '', busy = false }) {
  useEffect(() => holdFirstRun(), []);
  return (
    <DialogPrimitive.Root open onOpenChange={(next) => { if (!next && !busy) onChoose(false); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-celebration grove-celebrate-fade" style={{ background: tint('var(--grove-root)', 78) }} />
        <div className="pointer-events-none fixed inset-0 z-celebration flex items-center justify-center px-4">
          <DialogPrimitive.Content
            data-testid="pip-intro"
            className="pointer-events-auto w-full max-w-dialog"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              e.currentTarget?.querySelector('[data-testid="pip-intro-agree"]')?.focus();
            }}
          >
            <div className="grove-celebrate-pop w-full rounded-card border-hairline border-grove-lime/40 bg-grove-canopy px-6 py-8 text-center">
              <div className="mb-4 flex justify-center">
                <PipPanel form="seed" mood="curious" animate bare label={PIP_INTRO.spriteLabel} scale={8} />
              </div>
              <DialogPrimitive.Title className="font-plant text-2xl text-grove-cream">{PIP_INTRO.title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 font-ui text-sm leading-relaxed text-grove-cream">{PIP_INTRO.body}</DialogPrimitive.Description>
              {error && <p role="alert" className="mt-3 font-ui text-sm text-destructive" data-testid="pip-intro-error">{error}</p>}
              <button type="button" disabled={busy} onClick={() => onChoose(false)} data-testid="pip-intro-agree" className={cn(buttonVariants(), 'mt-5 min-h-touch w-full')}>
                {PIP_INTRO.agree}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onChoose(true)}
                data-testid="pip-intro-off"
                className="mt-2 min-h-touch px-4 font-ui text-sm text-grove-sprout underline underline-offset-4"
              >
                {PIP_INTRO.off}
              </button>
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
