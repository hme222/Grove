import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, Plus, Minus, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';

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
        className={`group inline-flex items-center gap-1.5 hover:bg-grove-moss rounded-tag px-1 -mx-1 transition-colors duration-150 ${className}`}
      >
        <span>{value || <span className="text-grove-lichen">{placeholder}</span>}</span>
        <Pencil className="h-3 w-3 text-grove-sage opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
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
        className={`bg-grove-canopy border-hairline border-grove-fernLine rounded-tag px-2 py-0.5 outline-none focus:ring-2 focus:ring-grove-lime ${inputClassName}`}
      />
    </div>
  );
}

export function InlineRoom({ value, options = [], onSave, testid = 'inline-room' }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const wrapRef = useRef(null);
  const createRef = useRef(null);
  useEffect(() => { if (creating) createRef.current?.focus(); }, [creating]);

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
    <span
      ref={wrapRef}
      role="presentation"
      className="relative inline-flex"
      onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); wrapRef.current?.querySelector('button')?.focus(); } }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        data-testid={`${testid}-trigger`}
        className="inline-flex items-center gap-1 rounded-round border-hairline border-grove-fernLine bg-grove-moss px-2.5 py-1 text-xs font-ui text-grove-cream hover:border-grove-fernLine transition-colors duration-150"
      >
        <span>{value || 'Add room'}</span>
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div
          data-testid={`${testid}-menu`}
          className="absolute top-full left-0 mt-1 z-popover min-w-44 rounded-chip border-hairline border-grove-moss bg-grove-canopy shadow-lift overflow-hidden"
        >
          <ul className="py-1 max-h-60 overflow-auto">
            {options.length === 0 && !creating && (
              <li className="px-3 py-2 text-xs font-ui text-grove-sage">No rooms yet.</li>
            )}
            {options.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  aria-current={r === value ? 'true' : undefined}
                  data-testid={`${testid}-option`}
                  className={`w-full text-left px-3 py-1.5 text-xs font-ui ${
                    r === value
                      ? 'bg-grove-moss text-grove-cream font-semibold'
                      : 'text-grove-cream hover:bg-grove-forest'
                  }`}
                >
                  {r === value && <Check className="mr-1.5 inline h-3 w-3" aria-hidden="true" />}{r}
                </button>
              </li>
            ))}
            <li className="border-t-hairline border-grove-moss mt-1 pt-1">
              {creating ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input aria-label="Room name"
                    ref={createRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitNew(); }
                      if (e.key === 'Escape') { e.preventDefault(); setCreating(false); setDraft(''); }
                    }}
                    placeholder="Room name"
                    data-testid={`${testid}-create-input`}
                    className="flex-1 min-w-0 bg-grove-forest border-hairline border-grove-moss rounded-tag px-2 py-1 text-xs font-ui text-grove-cream focus:outline-none focus:ring-2 focus:ring-grove-lime"
                  />
                  <button
                    type="button"
                    onClick={commitNew}
                    aria-label="Create room"
                    data-testid={`${testid}-create-confirm`}
                    className={cn(buttonVariants(), "w-6 flex items-center justify-center")}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  data-testid={`${testid}-create`}
                  className="w-full text-left px-3 py-1.5 text-xs font-ui text-grove-sprout hover:bg-grove-forest inline-flex items-center gap-1.5"
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
        className="w-7 h-7 rounded-full border-hairline border-grove-moss bg-grove-canopy text-grove-cream flex items-center justify-center hover:border-grove-fernLine disabled:opacity-40 transition-colors duration-150"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="font-ui text-sm text-grove-cream min-w-tab text-center" data-testid={`${testid}-value`}>
        Every {draft} {unit}
      </span>
      <button
        type="button"
        onClick={() => { const n = clamp(draft + step); setDraft(n); commit(n); }}
        disabled={busy || draft >= max}
        aria-label="Increase"
        data-testid={`${testid}-increment`}
        className="w-7 h-7 rounded-full border-hairline border-grove-moss bg-grove-canopy text-grove-cream flex items-center justify-center hover:border-grove-fernLine disabled:opacity-40 transition-colors duration-150"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
