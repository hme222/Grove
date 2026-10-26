import React from 'react';

const OPTIONS = [
  { value: 'simple', label: 'Simple', hint: 'Just the step' },
  { value: 'detailed', label: 'Detailed', hint: 'Step and why' },
];

// Care tips: Simple / Detailed. Native radios, so arrow keys, focus and
// screen-reader state come for free. The choice is saved to the user's profile.
export default function CareTextToggle({ value = 'simple', onChange, disabled = false }) {
  return (
    <fieldset data-testid="care-text-toggle" className="flex items-center gap-2" disabled={disabled}>
      <legend className="sr-only">Care tips</legend>
      <span aria-hidden="true" className="font-ui text-xs text-grove-sage">Care tips</span>
      <div className="inline-flex rounded-chip border-hairline border-grove-moss bg-grove-moss p-0.5">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <label key={opt.value} className="relative block" title={opt.hint}>
              <input
                type="radio"
                name="care_text_detail"
                value={opt.value}
                checked={active}
                onChange={() => onChange?.(opt.value)}
                data-testid={`care-text-${opt.value}`}
                className="peer sr-only"
              />
              <span
                className={`flex min-h-touch min-w-touch items-center justify-center rounded-inset px-4 font-ui text-sm cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-grove-lime peer-focus-visible:ring-offset-1 peer-disabled:opacity-50 ${active ? 'bg-grove-lime text-grove-root' : 'text-grove-cream hover:bg-grove-forest'}`}
              >
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
