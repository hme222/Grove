import React, { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { careAPI } from '../lib/api';
import { toast } from 'sonner';
import { Droplets, Wind, Utensils, Scissors, FlowerIcon, SproutIcon, Camera, FileText, RotateCw, ClipboardCheck } from 'lucide-react';
import { impactLight, impactMedium, success, spawnRipple } from '../lib/haptics';

// Phase 14A.2 — multi-action care log. Users can select several actions in a
// single sweep (e.g. water + mist + rotate). All selected actions are sent as
// one request and grouped server-side via `group_id`.
const CARE_ACTIONS = [
  { value: 'water', label: 'Water', icon: Droplets, color: '#3B6D11' },
  { value: 'mist', label: 'Mist', icon: Wind, color: '#5DCAA5' },
  { value: 'fertilize', label: 'Fertilize', icon: Utensils, color: '#639922' },
  { value: 'rotate', label: 'Rotate', icon: RotateCw, color: '#BA7517' },
  { value: 'prune', label: 'Prune', icon: Scissors, color: '#2D5016' },
  { value: 'check', label: 'Check', icon: ClipboardCheck, color: '#185FA5' },
  { value: 'repot', label: 'Repot', icon: FlowerIcon, color: '#BA7517' },
  { value: 'propagate', label: 'Propagate', icon: SproutIcon, color: '#185FA5' },
  { value: 'photo', label: 'Photo', icon: Camera, color: '#D4537E' },
  { value: 'note', label: 'Note', icon: FileText, color: '#8A8778' },
];

// Heavier-feedback actions get medium impact; lighter ones get a light tap.
const HEAVY_ACTIONS = new Set(['fertilize', 'repot', 'propagate', 'prune']);

export default function CareLogModal({ open, onClose, plantId, plantName, onLogged }) {
  const [selected, setSelected] = useState(() => new Set());
  const [notes, setNotes] = useState('');
  const [logging, setLogging] = useState(false);
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
  };

  const handleLog = async (e) => {
    if (count === 0) return;
    setLogging(true);
    try {
      const res = await careAPI.createLog(plantId, { actions: selectedArr, notes });
      const meta = res.data?._meta;
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
      <DialogContent className="bg-[#EDE5D8] border-[0.5px] border-[#D3C9B8] rounded-[14px] max-w-md" data-testid="care-log-modal">
        <DialogHeader>
          <DialogTitle className="font-plant text-[#1C2E10] text-lg">
            Log care for {plantName}
          </DialogTitle>
          <p className="text-[11px] font-ui text-[#2B2B26] opacity-70 mt-1">
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
                    ? 'border-[#1C2E10] bg-[#EAF3DE] ring-1 ring-[#1C2E10]/20'
                    : 'border-[#D3C9B8] bg-[#F5F0E8] hover:border-[#2D5016]'
                }`}
              >
                <Icon className="h-5 w-5" style={{ color }} strokeWidth={isOn ? 2.2 : 1.75} />
                <span className={`text-[10px] font-ui text-[#1A1A17] ${isOn ? 'font-semibold' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>

        {count > 0 && (
          <div
            className="flex items-center justify-between px-3 py-2 mb-2 bg-[#EAF3DE] border-[0.5px] border-[#3B6D11]/30 rounded-[6px]"
            data-testid="care-multi-summary"
          >
            <span className="text-[11px] font-ui text-[#1C2E10]">
              {count} action{count === 1 ? '' : 's'} selected
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="text-[11px] font-ui text-[#2D5016] underline underline-offset-2 hover:text-[#1C2E10]"
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
          className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] p-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5] resize-none h-20"
          data-testid="care-log-notes"
        />

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] transition-colors duration-150"
            data-testid="care-log-cancel"
          >
            Cancel
          </button>
          <button
            ref={submitBtnRef}
            onClick={handleLog}
            disabled={count === 0 || logging}
            data-testid="care-log-submit"
            className="relative overflow-hidden flex-1 rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016] disabled:opacity-50 transition-colors duration-150"
          >
            {logging ? 'Logging…' : (count > 1 ? `Log ${count} actions` : 'Log Care')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
