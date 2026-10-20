import React, { useEffect, useRef, useState } from 'react';
import { nookAPI } from '../lib/api';
import PipPanel from './PipPanel';

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
      setError('Could not save that. Try again.');
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#F5F0E8]/95 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nook-offer-title"
      data-testid="nook-offer"
    >
      <div className="w-full max-w-sm rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-5 text-center">
        <div className="flex justify-center mb-3">
          <PipPanel form="seed" mood="curious" animate label="Pip, a small pixel plant in a pot" />
        </div>
        <h1 id="nook-offer-title" ref={headingRef} tabIndex={-1} className="font-plant text-[#1C2E10] text-2xl mb-2 focus:outline-none">
          Meet Pip
        </h1>
        <p className="text-sm text-[#1A1A17] mb-1">Optional: a small pixel nook that grows as you learn. It never scores your plants.</p>
        <p className="text-xs text-[#2B2B26] mb-4">You can change this any time in your profile.</p>

        {error && (
          <p role="alert" className="mb-3 text-xs font-ui text-red-700" data-testid="nook-offer-error">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] text-[#1C2E10]"
            data-testid="nook-offer-no"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            aria-busy={saving}
            className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
            data-testid="nook-offer-yes"
          >
            Try Pip&apos;s nook
          </button>
        </div>
      </div>
    </div>
  );
}
