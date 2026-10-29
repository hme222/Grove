import React, { useState } from 'react';
import { cn } from '../lib/utils';

const inputClass = 'w-full rounded-inset border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-cream placeholder:text-grove-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime aria-[invalid=true]:border-destructive';

// The one password field: label above, input, then a 44px "Show" / "Hide" word button. Sign up, sign in
// and reset all use it, so the control looks and reads the same wherever someone types a password.
export default function PasswordField({
  id, label, value, onChange, autoComplete, placeholder, testId, toggleTestId, invalid, describedBy, required, className,
}) {
  const [show, setShow] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-ui text-sm text-grove-cream">{label}</label>
      <div className="flex gap-2">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          aria-invalid={invalid ? 'true' : 'false'}
          aria-describedby={describedBy}
          placeholder={placeholder}
          data-testid={testId}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          data-testid={toggleTestId}
          className={cn('min-h-touch min-w-touch rounded-control px-2 font-ui text-sm text-grove-cream underline underline-offset-2')}
        >
          {show ? 'Hide' : 'Show'}
          <span className="sr-only"> password</span>
        </button>
      </div>
    </div>
  );
}
