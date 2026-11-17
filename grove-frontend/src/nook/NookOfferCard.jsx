import React, { useMemo, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { nookAPI } from '../lib/api';
import NookCanvas from './NookCanvas';
import { PAPER_BUTTON, PAPER_BUTTON_QUIET, PAPER_ERROR } from './paperStyles';

// The one-time offer of Pip's nook. Either answer is recorded, so it is never shown again.
// It sits below the first-care celebration, so the celebration plays first.
// Built on the same Radix dialog as the other dialogs, which traps focus and gives it back on close.
// Escape counts as "Not now" (the offer says it can be changed any time in Profile); a tap outside the card does
// nothing, so a stray tap can't answer for the person.
export default function NookOfferCard({ onDone }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const headingRef = useRef(null);
  // The room itself, so "Pip has a room" is a picture to say yes to: Pip on the sill and a plant on the table, the
  // plant they just cared for standing in for theirs. Built here because there is no nook state before they answer.
  const room = useMemo(() => ({
    unlocked: [],
    pip: { form: 'seed', location: 'sill', mood: 'curious' },
    hero: { group: 'generic', condition: 'fine' },
    readiness: null,
    shelfPlants: [],
    window: null,
  }), []);

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
    <DialogPrimitive.Root open onOpenChange={(next) => { if (!next) choose(false); }}>
      <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-intro bg-grove-root/80" />
      <div className="pointer-events-none fixed inset-0 z-intro flex items-center justify-center px-4">
      <DialogPrimitive.Content
        aria-modal="true"
        data-testid="nook-offer"
        className="pointer-events-auto z-intro w-full max-w-dialog rounded-card border-hairline border-grove-paperBorder bg-grove-paperCard p-5 text-center focus:outline-none"
        onOpenAutoFocus={(e) => { e.preventDefault(); if (headingRef.current) headingRef.current.focus(); }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex justify-center mb-3">
          <NookCanvas view={room} scale={2} label="Pip’s room: Pip on the windowsill and a plant on the table" className="overflow-hidden rounded-inset" />
        </div>
        <DialogPrimitive.Title asChild>
          <h1 ref={headingRef} tabIndex={-1} className="mb-2 font-plant text-2xl text-grove-root focus:outline-none">
            Pip has a room
          </h1>
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="mb-1 font-ui text-sm text-grove-ink">Optional: a small pixel room that grows as you learn. It never scores your plants.</DialogPrimitive.Description>
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
            Try the room
          </button>
        </div>
      </DialogPrimitive.Content>
      </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
