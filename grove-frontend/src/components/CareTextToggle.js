import React from 'react';
import { buttonVariants } from './ui/button';
import { cn } from '../lib/utils';

const OPTIONS = [
  { value: 'simple', label: 'Simple', hint: 'Just the step' },
  { value: 'detailed', label: 'Detailed', hint: 'Step plus the why' },
];

// Care tips: Simple / Detailed. Two chips (the one choice control), the pressed one lime and
// marked with a check. The hint for the current choice sits under the control as visible text,
// because a title tooltip never shows on touch. The choice is saved to the user's profile.
export default function CareTextToggle({ value = 'simple', onChange, disabled = false }) {
  const current = OPTIONS.find((o) => o.value === value) || OPTIONS[0];
  return (
    <div data-testid="care-text-toggle">
      <div role="group" aria-label="Care tips detail" className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className="font-ui text-sm text-grove-sage">Care tips</span>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            disabled={disabled}
            onClick={() => onChange?.(opt.value)}
            data-testid={`care-text-${opt.value}`}
            className={cn(buttonVariants({ variant: 'chip' }), 'min-w-touch')}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-1 font-ui text-sm text-grove-sage" data-testid="care-text-hint">{current.hint}</p>
    </div>
  );
}
