import React from 'react';

// Shown under a setting whose save failed. The control has already gone back to its old value.
export default function SaveError({ error, onRetry, testId }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-2 font-ui text-sm text-destructive" data-testid={testId}>
      {error}{' '}
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-touch items-center rounded-control font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
      >
        Try again
      </button>
    </p>
  );
}
