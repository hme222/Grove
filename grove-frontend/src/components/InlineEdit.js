import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Plus, Minus, ChevronDown } from 'lucide-react';

/**
 * Phase 14A.2 — Inline editing primitives.
 *
 * - InlineText: tap-to-edit text (nickname, captions). Enter / blur saves.
 * - InlineRoom: tap-to-edit chip with dropdown of existing rooms + "Add new".
 * - InlineStepper: tap-to-edit numeric value with +/- controls (e.g. watering days).
 *
 * All three call onSave(newValue) and visually fall back to the read-only
 * presentation when not focused.
 */

export function InlineText({
  value,
  placeholder,
  onSave,
  className = '',
  inputClassName = '',
  testid = 'inline-text',
  multiline = false,
  maxLength = 80,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value || ''); }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.select(); } catch { /* empty */ }
    }
  }, [editing]);

  const commit = async () => {
    const next = (draft || '').trim();
    if (next !== (value || '').trim()) {
      try { await onSave(next); } catch { /* parent handles toast */ }
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value || '');
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        data-testid={`${testid}-display`}
        className={`group inline-flex items-center gap-1.5 hover:bg-[#EAF3DE] rounded-[6px] px-1 -mx-1 transition-colors duration-150 ${className}`}
      >
        <span>{value || <span className="text-[#888780]">{placeholder}</span>}</span>
        <Pencil className="h-3 w-3 text-[#5F5E5A] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      </button>
    );
  }

  const InputComp = multiline ? 'textarea' : 'input';
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <InputComp
        ref={inputRef}
        value={draft}
        maxLength={maxLength}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (!multiline && e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        }}
        data-testid={`${testid}-input`}
        className={`bg-[#FDFAF6] border-[0.5px] border-[#3B6D11] rounded-[6px] px-2 py-0.5 outline-none focus:ring-2 focus:ring-[#5DCAA5] ${inputClassName}`}
      />
    </div>
  );
}

export function InlineRoom({ value, options = [], onSave, testid = 'inline-room' }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onAway = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setCreating(false); } };
    document.addEventListener('pointerdown', onAway, true);
    return () => document.removeEventListener('pointerdown', onAway, true);
  }, [open]);

  const pick = async (room) => {
    setOpen(false);
    setCreating(false);
    if (room === value) return;
    try { await onSave(room); } catch { /* parent toast */ }
  };

  const commitNew = async () => {
    const next = draft.trim();
    if (!next) { setCreating(false); setDraft(''); return; }
    setOpen(false);
    setCreating(false);
    setDraft('');
    try { await onSave(next); } catch { /* parent toast */ }
  };

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid={`${testid}-trigger`}
        className="inline-flex items-center gap-1 rounded-[20px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] px-2.5 py-0.5 text-[10px] font-ui text-[#1C2E10] hover:border-[#3B6D11] transition-colors duration-150"
      >
        <span>{value || 'Add room'}</span>
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div
          data-testid={`${testid}-menu`}
          className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] shadow-lg overflow-hidden"
        >
          <ul className="py-1 max-h-60 overflow-auto">
            {options.length === 0 && !creating && (
              <li className="px-3 py-2 text-[11px] font-ui text-[#5F5E5A]">No rooms yet.</li>
            )}
            {options.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  data-testid={`${testid}-option`}
                  className={`w-full text-left px-3 py-1.5 text-xs font-ui ${
                    r === value
                      ? 'bg-[#EAF3DE] text-[#1C2E10] font-semibold'
                      : 'text-[#1A1A17] hover:bg-[#F5F0E8]'
                  }`}
                >
                  {r}
                </button>
              </li>
            ))}
            <li className="border-t-[0.5px] border-[#D3C9B8] mt-1 pt-1">
              {creating ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitNew(); }
                      if (e.key === 'Escape') { e.preventDefault(); setCreating(false); setDraft(''); }
                    }}
                    placeholder="Room name"
                    data-testid={`${testid}-create-input`}
                    className="flex-1 min-w-0 bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[6px] px-2 py-1 text-xs font-ui text-[#1A1A17] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                  />
                  <button
                    type="button"
                    onClick={commitNew}
                    aria-label="Create room"
                    data-testid={`${testid}-create-confirm`}
                    className="w-6 h-6 rounded-[4px] bg-[#1C2E10] text-[#F5F0E8] flex items-center justify-center hover:bg-[#2D5016]"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  data-testid={`${testid}-create`}
                  className="w-full text-left px-3 py-1.5 text-xs font-ui text-[#3B6D11] hover:bg-[#F5F0E8] inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3 w-3" /> Add new room…
                </button>
              )}
            </li>
          </ul>
        </div>
      )}
    </span>
  );
}

export function InlineStepper({
  value,
  onSave,
  min = 1,
  max = 60,
  step = 1,
  unit = 'days',
  testid = 'inline-stepper',
}) {
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(value); }, [value]);

  const clamp = (n) => Math.max(min, Math.min(max, n));

  const commit = async (next) => {
    if (next === value) return;
    setBusy(true);
    try { await onSave(next); } catch { setDraft(value); }
    finally { setBusy(false); }
  };

  return (
    <div className="inline-flex items-center gap-1.5" data-testid={testid}>
      <button
        type="button"
        onClick={() => { const n = clamp(draft - step); setDraft(n); commit(n); }}
        disabled={busy || draft <= min}
        aria-label="Decrease"
        data-testid={`${testid}-decrement`}
        className="w-7 h-7 rounded-full border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] text-[#1C2E10] flex items-center justify-center hover:border-[#3B6D11] disabled:opacity-40 transition-colors duration-150"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="font-ui text-sm text-[#1A1A17] min-w-[64px] text-center" data-testid={`${testid}-value`}>
        Every {draft} {unit}
      </span>
      <button
        type="button"
        onClick={() => { const n = clamp(draft + step); setDraft(n); commit(n); }}
        disabled={busy || draft >= max}
        aria-label="Increase"
        data-testid={`${testid}-increment`}
        className="w-7 h-7 rounded-full border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] text-[#1C2E10] flex items-center justify-center hover:border-[#3B6D11] disabled:opacity-40 transition-colors duration-150"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
