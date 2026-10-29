import React, { useEffect, useRef, useState } from 'react';
import { nookAPI } from '../lib/api';
import PipPanel from './PipPanel';
import { PAPER_BUTTON, PAPER_BUTTON_QUIET, PAPER_ERROR } from './paperStyles';

// The one-time offer of Pip's nook. Either answer is recorded, so it is never shown again.
// It sits below the first-care celebration, so the celebration plays first.
export default function NookOfferCard({ onDone }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const headingRef = useRef(null);

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, []);

  const choose = async (enabled) => {
    // A double tap must not save twice.
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const res = await nookAPI.settings({ enabled });
      onDone(res.data);
    } catch (_e) {
      setError('Couldn’t save that. Try again.');
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-intro flex items-center justify-center bg-grove-root/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nook-offer-title"
      data-testid="nook-offer"
    >
      <div className="w-full max-w-dialog rounded-card border-hairline border-grove-paperBorder bg-grove-paperCard p-5 text-center">
        <div className="flex justify-center mb-3">
          <PipPanel form="seed" mood="curious" animate label="Pip, a small pixel plant in a pot" />
        </div>
        <h1 id="nook-offer-title" ref={headingRef} tabIndex={-1} className="mb-2 font-plant text-2xl text-grove-root focus:outline-none">
          Meet Pip
        </h1>
        <p className="mb-1 font-ui text-sm text-grove-ink">Optional: a small pixel nook that grows as you learn. It never scores your plants.</p>
        <p className="mb-4 font-ui text-sm text-grove-inkSoft">You can change this any time in your profile.</p>

        {error && (
          <p role="alert" className={`mb-3 ${PAPER_ERROR}`} data-testid="nook-offer-error">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className={`${PAPER_BUTTON_QUIET} flex-1`}
            data-testid="nook-offer-no"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            aria-busy={saving}
            className={`${PAPER_BUTTON} flex-1`}
            data-testid="nook-offer-yes"
          >
            Try Pip&apos;s nook
          </button>
        </div>
      </div>
    </div>
  );
}
