import { CARE_ACTIONS, careLoggedMessage } from '../lib/careActions';
import { saveErrorMessage } from '../lib/errors';
import React, { useState, useRef, useMemo } from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { careAPI } from '../lib/api';
import { toast } from 'sonner';
import { impactLight, impactMedium, success, spawnRipple } from '../lib/haptics';

// Phase 14A.2 — multi-action care log. Users can select several actions in a
// single sweep (e.g. water + mist + rotate). All selected actions are sent as
// one request and grouped server-side via `group_id`.

// Heavier-feedback actions get medium impact; lighter ones get a light tap.
const HEAVY_ACTIONS = new Set(['fertilize', 'repot', 'propagate', 'prune']);

export default function CareLogModal({ open, onClose, plantId, plantName, onLogged }) {
  const [selected, setSelected] = useState(() => new Set());
  const [hint, setHint] = useState(null);
  const openerRef = React.useRef(null);
  const [notes, setNotes] = useState('');
  const [logging, setLogging] = useState(false);
  const [soilOutcome, setSoilOutcome] = useState('');
  const [soilDecision, setSoilDecision] = useState('');
  const [soilError, setSoilError] = useState('');
  const [logError, setLogError] = useState('');
  const submitBtnRef = useRef(null);

  const selectedArr = useMemo(() => Array.from(selected), [selected]);
  const count = selectedArr.length;

  const toggleAction = (e, value) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
        if (HEAVY_ACTIONS.has(value)) impactMedium(e.currentTarget);
        else impactLight(e.currentTarget);
        // Droplet flourish on water/mist
        if ((value === 'water' || value === 'mist') && e.currentTarget) {
          const target = e.currentTarget;
          try {
            const cs = getComputedStyle(target);
            if (cs.position === 'static') target.style.position = 'relative';
            const drop = document.createElement('span');
            drop.className = 'grove-droplet';
            drop.style.left = '50%';
            drop.style.top = '6px';
            drop.style.transform = 'translateX(-50%) translateY(-12px) scale(0.6)';
            target.appendChild(drop);
            setTimeout(() => drop.remove(), 760);
          } catch (_e) { /* no-op */ }
        }
      }
      return next;
    });
  };

  const handleReset = () => {
    setSelected(new Set());
    setNotes('');
    setSoilOutcome('');
    setSoilDecision('');
    setSoilError('');
    setLogError('');
  };

  const handleLog = async (e) => {
    if (count === 0) return;
    const hasSoilTest = selected.has('soil_check');
    if (hasSoilTest && !soilOutcome) {
      setSoilError('Choose what you felt: dry or damp.');
      return;
    }
    setSoilError('');
    setLogError('');
    setLogging(true);
    try {
      const res = await careAPI.createLog(plantId, {
        actions: selectedArr,
        notes,
        ...(hasSoilTest ? { soil_outcome: soilOutcome, soil_decision: soilDecision || null } : {}),
      });
      const meta = res.data?._meta;
      if (meta?.soil_coaching) toast.message(meta.soil_coaching);
      success(submitBtnRef.current || e.currentTarget);
      // The first-care celebration says the same thing, so it gets no toast on top of it.
      if (!meta?.first_care_pending) toast.success(careLoggedMessage(selectedArr, plantName));
      handleReset();
      onLogged?.(meta, { plantName, actions: selectedArr });
      onClose();
    } catch (err) {
      spawnRipple(submitBtnRef.current, { tone: 'warm' });
      setLogError(saveErrorMessage(err));
    } finally {
      setLogging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { handleReset(); onClose(); } }}>
      <DialogContent className="max-w-dialog" data-testid="care-log-modal"
        onOpenAutoFocus={(e) => { e.preventDefault(); openerRef.current = openerRef.current || document.activeElement; document.getElementById('care-log-title')?.focus(); }}
        onCloseAutoFocus={(e) => { e.preventDefault(); const el = openerRef.current; openerRef.current = null; if (el && el.focus && document.contains(el)) el.focus(); }}
      >
        <DialogHeader>
          <DialogTitle id="care-log-title" tabIndex={-1} className="font-plant text-grove-cream text-xl focus:outline-none">
            Log care for {plantName}
          </DialogTitle>
          <p className="mt-1 text-sm font-ui text-grove-sage">
            Tap every action you just did. They&apos;ll log together as one sweep.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 my-4" data-testid="care-action-grid">
          {CARE_ACTIONS.map(({ value, label, icon: Icon, color }) => {
            const isOn = selected.has(value);
            return (
              <button
                key={value}
                onClick={(e) => { setHint(value); toggleAction(e, value); }}
                onFocus={() => setHint(value)}
                data-testid={`care-action-${value}`}
                aria-pressed={isOn}
                className={`relative overflow-hidden flex min-h-touch flex-col items-center gap-1 p-3 rounded-control border-hairline transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-cream focus-visible:ring-offset-2 focus-visible:ring-offset-grove-moss ${
                  isOn
                    ? 'border-grove-lime bg-grove-canopy'
                    : 'border-grove-moss bg-grove-forest hover:border-grove-fernLine'
                }`}
              >
                <Icon className="h-5 w-5" style={{ color }} strokeWidth={isOn ? 2.2 : 1.75} />
                <span className={`text-xs font-ui text-grove-cream ${isOn ? 'font-semibold' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
        <p id="care-action-hint-text" aria-live="polite" data-testid="care-action-hint" className="font-ui text-sm text-grove-sage">
          {count === 0 ? 'Pick at least one action to log. Tap one to see what it means.' : ''}{count === 0 && hint ? ' ' : ''}{hint ? `${CARE_ACTIONS.find((a) => a.value === hint)?.label}: ${CARE_ACTIONS.find((a) => a.value === hint)?.hint}` : ''}
        </p>

        {selected.has('soil_check') && (
          <div className="mb-3 p-3 bg-grove-forest border-hairline border-grove-moss rounded-control" data-testid="care-soil-fields">
            <p className="text-xs font-ui text-grove-cream mb-2">Push a finger into the soil, to the second knuckle in a pot 6 in (15 cm) or bigger and the first in a small pot. What did you feel?</p>
            <div className="flex gap-2 mb-2">
              {[['dry', 'Dry and dusty'], ['damp', 'Damp and cool']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={soilOutcome === value}
                  onClick={() => setSoilOutcome(value)}
                  className={`flex-1 rounded-control border-hairline px-2 py-2 text-xs font-ui text-grove-cream ${
                    soilOutcome === value ? 'border-grove-fernLine bg-grove-moss' : 'border-grove-moss bg-grove-canopy'
                  }`}
                  data-testid={`care-soil-outcome-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs font-ui text-grove-cream mb-2">What will you do? (optional)</p>
            <div className="flex gap-2">
              {[['water', 'Water it'], ['wait', 'Wait']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={soilDecision === value}
                  onClick={() => setSoilDecision(soilDecision === value ? '' : value)}
                  className={`flex-1 rounded-control border-hairline px-2 py-2 text-xs font-ui text-grove-cream ${
                    soilDecision === value ? 'border-grove-fernLine bg-grove-moss' : 'border-grove-moss bg-grove-canopy'
                  }`}
                  data-testid={`care-soil-decision-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {soilError && (
              <p role="alert" className="mt-2 text-xs font-ui text-destructive" data-testid="care-soil-error">
                {soilError}
              </p>
            )}
          </div>
        )}

        {count > 0 && (
          <div
            className="flex items-center justify-between px-3 py-2 mb-2 bg-grove-moss border-hairline border-grove-fernLine/25 rounded-tag"
            data-testid="care-multi-summary"
          >
            <span className="text-xs font-ui text-grove-cream">
              {count} action{count === 1 ? '' : 's'} selected
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs font-ui text-grove-sprout underline underline-offset-2 hover:text-grove-cream"
              data-testid="care-multi-clear"
            >
              Clear
            </button>
          </div>
        )}

        <textarea aria-label="Care note (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note (optional)"
          className="w-full bg-grove-forest border-hairline border-grove-moss rounded-control p-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime resize-none h-20"
          data-testid="care-log-notes"
        />

        <div className="mt-2 flex flex-col gap-2">
          {logError && (
            <p role="alert" className="font-ui text-sm text-destructive" data-testid="care-log-error">
              {logError}
            </p>
          )}
          <button
            ref={submitBtnRef}
            onClick={handleLog}
            disabled={count === 0 || logging}
            data-testid="care-log-submit"
            aria-describedby="care-action-hint-text"
            className={cn(buttonVariants(), "relative overflow-hidden disabled:border-transparent disabled:bg-grove-moss disabled:text-grove-sage disabled:opacity-100 transition-colors duration-150")}
          >
            {logging ? 'Logging…' : (count > 1 ? `Log ${count} actions` : 'Log care')}
          </button>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className={cn(buttonVariants({ variant: 'outline' }))}
            data-testid="care-log-cancel"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
