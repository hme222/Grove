import React, { useRef, useState } from 'react';
import { lightAPI } from '../../lib/api';
import { PAPER_CHOICE, PAPER_ERROR } from '../../nook/paperStyles';

const READINGS = [
  { value: 'crisp', label: 'Crisp, with sharp edges' },
  { value: 'soft', label: 'Soft, with blurry edges' },
  { value: 'faint', label: 'Faint, hard to see' },
];

const choiceClass = PAPER_CHOICE;

// Part 1, card 1: the hand-shadow test. A choice is saved once, then the lesson moves on.
// "Later" leaves a one-time reminder on Care Today and moves on.
export default function ShadowTestStep({ next, onSaved, onLater }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  const choose = async (reading) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await lightAPI.setReading(reading);
      if (onSaved) onSaved(reading);
      next();
    } catch (_e) {
      setError('Couldn’t save that. Try again.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const later = async () => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      await lightAPI.prompt('later');
      if (onLater) onLater();
    } catch (_e) {
      // The reminder is a nicety. The lesson carries on without it.
    } finally {
      busy.current = false;
      setSaving(false);
    }
    next();
  };

  return (
    <div className="space-y-2" data-testid="shadow-step">
      {READINGS.map((reading) => (
        <button
          key={reading.value}
          type="button"
          disabled={saving}
          onClick={() => choose(reading.value)}
          className={choiceClass}
          data-testid={`shadow-${reading.value}`}
        >
          {reading.label}
        </button>
      ))}
      <button type="button" disabled={saving} onClick={later} className={choiceClass} data-testid="shadow-later">
        I&apos;ll do this later
      </button>
      {error && (
        <p role="alert" className={PAPER_ERROR} data-testid="shadow-error">
          {error}
        </p>
      )}
    </div>
  );
}
