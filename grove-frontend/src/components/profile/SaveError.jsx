import React from 'react';

// Shown under a setting whose save failed. The control has already gone back to its old value.
// Callers: set aria-describedby={id} on the control while an error shows, so it is announced with the control.
// focusAfter: a ref to the control. After a successful retry this alert unmounts, so focus moves there instead of
// dropping to the page body.
// tone: 'dark' (default) for the dark sheets and moss cards, 'paper' for the light paper panels.
export default function SaveError({ error, onRetry, testId, id, focusAfter, tone = 'dark' }) {
  if (!error) return null;
  const retry = async () => {
    const ok = await onRetry();
    // Wait for React to commit: controls are disabled while saving, and focus() on a disabled control does nothing.
    if (ok && focusAfter) setTimeout(() => { if (focusAfter.current) focusAfter.current.focus(); }, 0);
  };
  const color = tone === 'paper' ? 'text-grove-paperError' : 'text-grove-blush';
  return (
    <p id={id} role="alert" className={`mt-2 font-ui text-sm ${color}`} data-testid={testId}>
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
