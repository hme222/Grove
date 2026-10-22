import React, { useEffect, useRef, useState } from 'react';
import { Undo2, X } from 'lucide-react';

// A short-lived "Undo" bar. Announced politely, focusable, and the timer
// pauses while it has hover or focus, so keyboard and screen-reader users
// are never timed out mid-decision (WCAG 2.2.1). Escape dismisses it.
// The slide-in only runs when the user allows motion.
export default function UndoSnackbar({ message, onUndo, onDismiss, duration = 8000, autoFocus = false, busy = false }) {
  const undoRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (autoFocus) undoRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (paused || busy) return undefined;
    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss?.(), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [paused, busy, onDismiss]);

  const pause = () => setPaused(true);
  const resume = (e) => {
    // Stay paused while focus moves between the bar's own buttons.
    if (e?.type === 'blur' && e.currentTarget.contains(e.relatedTarget)) return;
    setPaused(false);
  };

  return (
    <div
      data-testid="undo-snackbar"
      role="status"
      aria-live="polite"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onKeyDown={(e) => { if (e.key === 'Escape') onDismiss?.(); }}
      className="rounded-[14px] border-[0.5px] border-grove-lime/40 bg-grove-lime text-grove-root px-4 py-3 flex items-center gap-3 motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:fade-in"
    >
      <p className="flex-1 min-w-0 font-ui text-sm">{message}</p>
      <button
        ref={undoRef}
        type="button"
        onClick={onUndo}
        disabled={busy}
        data-testid="undo-snackbar-undo"
        className="rounded-[12px] font-ui text-[10px] px-3 py-2 border-[0.5px] border-grove-fernLine text-grove-sprout hover:bg-grove-sprout disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime focus-visible:ring-offset-2 focus-visible:ring-offset-grove-forest flex items-center gap-1.5"
      >
        <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
        {busy ? 'Undoing…' : 'Undo'}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        data-testid="undo-snackbar-dismiss"
        className="w-8 h-8 rounded-full text-grove-sprout hover:bg-grove-sprout focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime flex items-center justify-center"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
