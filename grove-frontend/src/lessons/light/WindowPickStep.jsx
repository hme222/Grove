import React, { useRef, useState } from 'react';
import { lightAPI } from '../../lib/api';

const TIMINGS = [
  { value: 'morning', label: 'In the morning' },
  { value: 'midday', label: 'Around midday' },
  { value: 'afternoon', label: 'In the afternoon' },
  { value: 'none', label: 'No sun reaches it, just bright sky' },
  { value: 'nowindow', label: "There's no window here" },
];
const VIEWS = [
  { value: 'open', label: 'Open sky' },
  { value: 'tree', label: 'A tree' },
  { value: 'building', label: 'A building' },
];
const HEMISPHERES = [
  { value: 'north', label: 'Northern' },
  { value: 'south', label: 'Southern' },
];
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const button =
  'w-full min-h-[44px] rounded-[8px] border-[0.5px] px-3 py-3 text-sm font-ui text-[#1A1A17] text-left disabled:opacity-60';
const plain = `${button} border-[#D3C9B8] bg-[#F5F0E8] hover:border-[#2D5016]`;
const chosen = (on) => `${button} ${on ? 'border-[#1C2E10] bg-[#EAF3DE] ring-1 ring-[#1C2E10]/20' : 'border-[#D3C9B8] bg-[#F5F0E8]'}`;

// Part 2, card 1: which window, and when the sun reaches it. The compass is an optional shortcut.
// A pick is saved once, then the lesson moves on. Nothing is saved for "not sure" or "later".
// The hemisphere and view start from what the person saved before, so a retake never resets them.
export default function WindowPickStep({ next, onSaved, onLater, initialView, initialHemisphere }) {
  const [mode, setMode] = useState('timing'); // timing | compass | unsure
  const [view, setView] = useState(VIEWS.some((v) => v.value === initialView) ? initialView : 'open');
  const [hemisphere, setHemisphere] = useState(HEMISPHERES.some((h) => h.value === initialHemisphere) ? initialHemisphere : 'north');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  const save = async (choice) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const res = await lightAPI.setWindow({ ...choice, view, hemisphere });
      if (onSaved) onSaved(res.data);
      next();
    } catch (_e) {
      setError('Could not save that. Try again.');
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

  const laterButton = (
    <button type="button" disabled={saving} onClick={later} className={plain} data-testid="pick-later">
      I&apos;ll check at noon
    </button>
  );

  return (
    <div className="space-y-4" data-testid="window-pick-step">
      <fieldset>
        <legend className="text-xs font-ui uppercase tracking-[0.1em] text-[#2B2B26] mb-1">What can you see out of it?</legend>
        <div className="grid grid-cols-3 gap-2">
          {VIEWS.map((item) => (
            <button key={item.value} type="button" aria-pressed={view === item.value} onClick={() => setView(item.value)} className={chosen(view === item.value)} data-testid={`view-${item.value}`}>
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-ui uppercase tracking-[0.1em] text-[#2B2B26] mb-1">Which half of the world are you in?</legend>
        <div className="grid grid-cols-2 gap-2">
          {HEMISPHERES.map((item) => (
            <button key={item.value} type="button" aria-pressed={hemisphere === item.value} onClick={() => setHemisphere(item.value)} className={chosen(hemisphere === item.value)} data-testid={`hemi-${item.value}`}>
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === 'timing' && (
        <div className="space-y-2">
          <p className="text-sm font-ui text-[#1A1A17]">When does the sun reach that window?</p>
          {TIMINGS.map((item) => (
            <button key={item.value} type="button" disabled={saving} onClick={() => save({ sun: item.value })} className={plain} data-testid={`pick-${item.value}`}>
              {item.label}
            </button>
          ))}
          <button type="button" disabled={saving} onClick={() => setMode('unsure')} className={plain} data-testid="pick-unsure">
            I&apos;m not sure
          </button>
          <button type="button" disabled={saving} onClick={() => setMode('compass')} className={plain} data-testid="pick-compass">
            I know which direction it faces
          </button>
          {laterButton}
        </div>
      )}

      {mode === 'compass' && (
        <div className="space-y-2" data-testid="pick-compass-panel">
          <p className="text-sm font-ui text-[#1A1A17]">Which way does it face?</p>
          <div className="grid grid-cols-4 gap-2">
            {DIRECTIONS.map((direction) => (
              <button key={direction} type="button" disabled={saving} onClick={() => save({ direction })} className={`${plain} text-center`} data-testid={`dir-${direction}`}>
                {direction}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setMode('timing')} className={plain} data-testid="pick-back">
            Pick by sun timing instead
          </button>
        </div>
      )}

      {mode === 'unsure' && (
        <div className="space-y-2" data-testid="pick-shadow-help">
          <p className="text-sm font-ui text-[#1A1A17]">
            Hold your hand about a foot above the spot around midday. A crisp shadow means direct sun, a soft one means bright indirect light, and a faint one means low light.
          </p>
          <button type="button" onClick={() => setMode('timing')} className={plain} data-testid="pick-recheck">
            Check again
          </button>
          {laterButton}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs font-ui text-red-700" data-testid="pick-error">
          {error}
        </p>
      )}
    </div>
  );
}
