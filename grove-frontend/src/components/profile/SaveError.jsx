import React from 'react';

// Shown under a setting whose save failed. The control has already gone back to its old value.
// Callers: set aria-describedby={id} on the control while an error shows, so it is announced with the control.
// focusAfter: a ref to the control. After a successful retry this alert unmounts, so focus moves there instead of
// dropping to the page body.
export default function SaveError({ error, onRetry, testId, id, focusAfter }) {
  if (!error) return null;
  const retry = async () => {
    const ok = await onRetry();
    if (ok && focusAfter && focusAfter.current) focusAfter.current.focus();
  };
  return (
    <p id={id} role="alert" className="mt-2 font-ui text-sm text-destructive" data-testid={testId}>
      {error}{' '}
      <button
        type="button"
        onClick={retry}
        className="inline-flex min-h-touch items-center rounded-control font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
      >
        Try again
      </button>
    </p>
  );
}
