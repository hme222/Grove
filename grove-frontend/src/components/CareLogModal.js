import React, { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { careAPI } from '../lib/api';
import { toast } from 'sonner';
import { Droplets, Wind, Utensils, Scissors, FlowerIcon, SproutIcon, Camera, FileText, RotateCw, ClipboardCheck, Hand } from 'lucide-react';
import { impactLight, impactMedium, success, spawnRipple } from '../lib/haptics';

// Phase 14A.2 — multi-action care log. Users can select several actions in a
// single sweep (e.g. water + mist + rotate). All selected actions are sent as
// one request and grouped server-side via `group_id`.
const CARE_ACTIONS = [
  { value: 'water', label: 'Water', icon: Droplets, color: '#3B6D11' },
  { value: 'mist', label: 'Mist', icon: Wind, color: '#92B44B' },
  { value: 'fertilize', label: 'Fertilize', icon: Utensils, color: '#639922' },
  { value: 'rotate', label: 'Rotate', icon: RotateCw, color: '#BA7517' },
  { value: 'prune', label: 'Prune', icon: Scissors, color: '#2D5016' },
  { value: 'check', label: 'Check', icon: ClipboardCheck, color: '#185FA5' },
  { value: 'soil_check', label: 'Soil test', icon: Hand, color: '#BA7517' },
  { value: 'repot', label: 'Repot', icon: FlowerIcon, color: '#BA7517' },
  { value: 'propagate', label: 'Propagate', icon: SproutIcon, color: '#185FA5' },
  { value: 'photo', label: 'Photo', icon: Camera, color: '#E57A9C' },
  { value: 'note', label: 'Note', icon: FileText, color: '#8A8778' },
];

// Heavier-feedback actions get medium impact; lighter ones get a light tap.
const HEAVY_ACTIONS = new Set(['fertilize', 'repot', 'propagate', 'prune']);

export default function CareLogModal({ open, onClose, plantId, plantName, onLogged }) {
  const [selected, setSelected] = useState(() => new Set());
  const [notes, setNotes] = useState('');
  const [logging, setLogging] = useState(false);
  const [soilOutcome, setSoilOutcome] = useState('');
  const [soilDecision, setSoilDecision] = useState('');
  const [soilError, setSoilError] = useState('');
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
  };

  const handleLog = async (e) => {
    if (count === 0) return;
    const hasSoilTest = selected.has('soil_check');
    if (hasSoilTest && !soilOutcome) {
      setSoilError('Choose what you felt: dry or damp.');
      return;
    }
    setSoilError('');
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
      const label = count === 1 ? selectedArr[0] : `${count} actions`;
      toast.success(`${label} logged for ${plantName}`);
      handleReset();
      onLogged?.(meta);
      onClose();
    } catch (_err) {
      spawnRipple(submitBtnRef.current, { tone: 'warm' });
      toast.error('Failed to log care action');
    } finally {
      setLogging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { handleReset(); onClose(); } }}>
      <DialogContent className="bg-grove-moss border-[0.5px] border-grove-moss rounded-[14px] max-w-md" data-testid="care-log-modal">
        <DialogHeader>
          <DialogTitle className="font-plant text-grove-cream text-lg">
            Log care for {plantName}
          </DialogTitle>
          <p className="text-[11px] font-ui text-grove-cream opacity-70 mt-1">
            Tap every action you just did — they&apos;ll log together as one sweep.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 my-4" data-testid="care-action-grid">
          {CARE_ACTIONS.map(({ value, label, icon: Icon, color }) => {
            const isOn = selected.has(value);
            return (
              <button
                key={value}
                onClick={(e) => toggleAction(e, value)}
                data-testid={`care-action-${value}`}
                aria-pressed={isOn}
                className={`relative overflow-hidden flex flex-col items-center gap-1 p-3 rounded-[8px] border-[0.5px] transition-colors duration-150 ${
                  isOn
                    ? 'border-grove-fernLine bg-grove-moss ring-1 ring-grove-lime/20'
                    : 'border-grove-moss bg-grove-forest hover:border-grove-fernLine'
                }`}
              >
                <Icon className="h-5 w-5" style={{ color }} strokeWidth={isOn ? 2.2 : 1.75} />
                <span className={`text-[10px] font-ui text-grove-cream ${isOn ? 'font-semibold' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>

        {selected.has('soil_check') && (
          <div className="mb-3 p-3 bg-grove-forest border-[0.5px] border-grove-moss rounded-[8px]" data-testid="care-soil-fields">
            <p className="text-[11px] font-ui text-grove-cream mb-2">Press a finger 2 inches into the soil. What did you feel?</p>
            <div className="flex gap-2 mb-2">
              {[['dry', 'Dry and dusty'], ['damp', 'Damp and cool']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={soilOutcome === value}
                  onClick={() => setSoilOutcome(value)}
                  className={`flex-1 rounded-[8px] border-[0.5px] px-2 py-2 text-[11px] font-ui text-grove-cream ${
                    soilOutcome === value ? 'border-grove-fernLine bg-grove-moss' : 'border-grove-moss bg-grove-canopy'
                  }`}
                  data-testid={`care-soil-outcome-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-ui text-grove-cream mb-2">What will you do? (optional)</p>
            <div className="flex gap-2">
              {[['water', 'Water it'], ['wait', 'Wait']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={soilDecision === value}
                  onClick={() => setSoilDecision(soilDecision === value ? '' : value)}
                  className={`flex-1 rounded-[8px] border-[0.5px] px-2 py-2 text-[11px] font-ui text-grove-cream ${
                    soilDecision === value ? 'border-grove-fernLine bg-grove-moss' : 'border-grove-moss bg-grove-canopy'
                  }`}
                  data-testid={`care-soil-decision-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {soilError && (
              <p role="alert" className="mt-2 text-[11px] font-ui text-red-700" data-testid="care-soil-error">
                {soilError}
              </p>
            )}
          </div>
        )}

        {count > 0 && (
          <div
            className="flex items-center justify-between px-3 py-2 mb-2 bg-grove-moss border-[0.5px] border-grove-fernLine/30 rounded-[6px]"
            data-testid="care-multi-summary"
          >
            <span className="text-[11px] font-ui text-grove-cream">
              {count} action{count === 1 ? '' : 's'} selected
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-[11px] font-ui text-grove-sprout underline underline-offset-2 hover:text-grove-cream"
              data-testid="care-multi-clear"
            >
              Clear
            </button>
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note (optional)"
          className="w-full bg-grove-forest border-[0.5px] border-grove-moss rounded-[8px] p-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime resize-none h-20"
          data-testid="care-log-notes"
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-grove-moss bg-transparent text-grove-cream hover:border-grove-fernLine transition-colors duration-150"
            data-testid="care-log-cancel"
          >
            Cancel
          </button>
          <button
            ref={submitBtnRef}
            onClick={handleLog}
            disabled={count === 0 || logging}
            data-testid="care-log-submit"
            className="relative overflow-hidden flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-grove-lime text-grove-root border-grove-fernLine hover:bg-grove-sprout disabled:opacity-50 transition-colors duration-150"
          >
            {logging ? 'Logging…' : (count > 1 ? `Log ${count} actions` : 'Log Care')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
