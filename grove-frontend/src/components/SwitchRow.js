import React, { useId } from 'react';

// A setting that is on or off. The whole row is the control (44px or taller), the track is only a
// picture of the state, and the state is also written out ("On" / "Off") so color is never alone.
export default function SwitchRow({ label, help, checked, onChange, disabled = false, testId, rowTestId, className = '' }) {
  const helpId = useId();
  return (
    <div data-testid={rowTestId} className={className}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={help ? helpId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        data-testid={testId}
        className="flex min-h-row w-full items-center gap-3 rounded-control py-2 text-left disabled:opacity-60"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-ui text-sm text-grove-cream">{label}</span>
          {help && <span id={helpId} className="mt-0.5 block font-ui text-xs leading-snug text-grove-sage">{help}</span>}
        </span>
        <span className="font-ui text-xs text-grove-cream" aria-hidden="true">{checked ? 'On' : 'Off'}</span>
        <span
          aria-hidden="true"
          className={`relative h-6 w-11 shrink-0 rounded-pill border-hairline motion-safe:transition-colors motion-safe:duration-200 ${
            checked ? 'border-grove-lime bg-grove-lime' : 'border-grove-inputOutline bg-grove-moss'
          }`}
        >
          <span
            className={`absolute left-0 top-px h-5 w-5 rounded-pill motion-safe:transition-transform motion-safe:duration-200 ${
              checked ? 'translate-x-5 bg-grove-root' : 'translate-x-px bg-grove-sage'
            }`}
          />
        </span>
      </button>
    </div>
  );
}
