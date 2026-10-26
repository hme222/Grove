import React from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

// The last card for lessons whose "your turn" step happens outside this
// screen. It records that the user tried the step.
export default function MarkDoneStep({ onDone, onNotYet }) {
  return (
    <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="mark-done-step">
      <p className="text-sm text-grove-cream mb-3">Try the step when you&apos;re ready. Mark the lesson done once you have.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNotYet}
          className={cn(buttonVariants({ variant: 'outline' }), "flex-1")}
          data-testid="mark-done-not-yet"
        >
          Not yet
        </button>
        <button
          type="button"
          onClick={onDone}
          className={cn(buttonVariants(), "flex-1")}
          data-testid="mark-done-done"
        >
          Mark lesson done
        </button>
      </div>
    </div>
  );
}
