import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

// The bottom sheet every Profile tile opens. Same Radix base as HelpSheet (focus trap, Escape, page scroll lock), plus:
// a pinned header (handle, title, close) with only the middle scrolling, a fade when there's more below, a drag-down
// handle, and the phone's back gesture. Swiping is never the only way to close.

const SWIPE_CLOSE_PX = 80;
let sheetSeq = 0;

export default function SettingsSheet({ open, onClose, title, testId, opener, fallbackFocus, children }) {
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const innerRef = useRef(null);
  // Radix Portal mounts its children a commit after `open`, so the body element is tracked in state (via a callback
  // ref) and the measuring effect runs once it actually exists.
  const [bodyEl, setBodyEl] = useState(null);
  const setBodyRef = useCallback((node) => { bodyRef.current = node; setBodyEl(node); }, []);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const historyEntry = useRef(null);
  const drag = useRef(null);
  const [more, setMore] = useState(false);
  const [dragY, setDragY] = useState(0);

  // Back gesture. While open, a same-URL history entry sits on top, so the phone's back pops it (and closes the sheet)
  // instead of leaving the page. We keep react-router's own state fields so its listener sees no change of place.
  // Closing any other way pops our entry so no stray entry is left behind. The pop is deferred a tick so StrictMode's
  // effect replay reuses the same entry instead of popping and pushing again.
  useEffect(() => {
    if (!open || typeof window === 'undefined' || !window.history) return undefined;
    let entry = historyEntry.current;
    if (entry && entry.pendingBack) {
      clearTimeout(entry.pendingBack);
      entry.pendingBack = null;
    } else {
      sheetSeq += 1;
      entry = { id: `sheet-${sheetSeq}`, popped: false, pendingBack: null };
      historyEntry.current = entry;
      window.history.pushState({ ...(window.history.state || {}), groveSheet: entry.id }, '');
    }
    const onPop = () => {
      const state = window.history.state;
      if (state && state.groveSheet === entry.id) return; // still on our entry (for example a hash change above it)
      entry.popped = true;
      historyEntry.current = null;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (entry.popped) return;
      entry.pendingBack = setTimeout(() => {
        if (historyEntry.current === entry) historyEntry.current = null;
        const state = window.history.state;
        // Only pop if our entry is still on top; if something navigated from inside the sheet, leave history alone.
        if (state && state.groveSheet === entry.id) window.history.back();
      }, 0);
    };
  }, [open]);

  // The bottom fade shows only while the body can still scroll down.
  const measure = useCallback(() => {
    const b = bodyRef.current;
    if (!b) return;
    setMore(b.scrollHeight - b.scrollTop - b.clientHeight > 1);
  }, []);

  useEffect(() => { if (!open) setDragY(0); }, [open]);

  useEffect(() => {
    if (!open || !bodyEl) { setMore(false); return undefined; }
    measure();
    const b = bodyEl;
    let ro;
    if (b && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(b);
      if (innerRef.current) ro.observe(innerRef.current); // content growing or shrinking
    }
    window.addEventListener('resize', measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [open, bodyEl, measure]);

  // Drag down on the handle only, so it never fights scrolling the body.
  const onHandleDown = (e) => {
    drag.current = { startY: e.clientY, dy: 0 };
    if (e.currentTarget.setPointerCapture && e.pointerId != null) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* not capturable; drag still works */ }
    }
  };
  const onHandleMove = (e) => {
    if (!drag.current) return;
    const dy = Math.max(0, e.clientY - drag.current.startY);
    drag.current.dy = dy;
    setDragY(dy);
  };
  const onHandleEnd = () => {
    if (!drag.current) return;
    const { dy } = drag.current;
    drag.current = null;
    setDragY(0);
    if (dy > SWIPE_CLOSE_PX) onCloseRef.current();
  };

  if (!open) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => { if (!next) onCloseRef.current(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-testid={`${testId}-overlay`}
          className="fixed inset-0 z-sheet bg-scrim motion-safe:animate-in motion-safe:fade-in motion-reduce:animate-in motion-reduce:fade-in"
        />
        <DialogPrimitive.Content
          data-testid={testId}
          style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
          className="fixed inset-x-0 bottom-0 z-sheet mx-auto flex max-h-sheet w-full max-w-dialog flex-col rounded-t-card border-hairline border-grove-lime/40 bg-grove-canopy text-grove-cream motion-safe:animate-in motion-safe:slide-in-from-bottom motion-reduce:animate-in motion-reduce:fade-in"
          onOpenAutoFocus={(e) => { e.preventDefault(); if (titleRef.current) titleRef.current.focus(); }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const back = opener && opener.current;
            if (back && document.contains(back) && back.focus) { back.focus(); return; }
            const fallback = fallbackFocus && fallbackFocus.current;
            if (fallback && document.contains(fallback) && fallback.focus) fallback.focus();
          }}
        >
          <div className="shrink-0 px-4 pt-2">
            <div
              aria-hidden="true"
              data-testid={`${testId}-handle`}
              className="mx-auto flex h-6 w-24 cursor-grab touch-none items-center justify-center"
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleEnd}
              onPointerCancel={onHandleEnd}
            >
              <span className="block h-1 w-10 rounded-pill bg-grove-cream/40" />
            </div>
            <div className="flex items-start gap-3 pb-3">
              <DialogPrimitive.Title
                ref={titleRef}
                tabIndex={-1}
                data-testid={`${testId}-title`}
                className="min-w-0 flex-1 self-center font-plant text-2xl text-grove-cream focus:outline-none"
              >
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label={`Close ${title}`}
                data-testid={`${testId}-close`}
                className="flex h-touch w-touch shrink-0 items-center justify-center rounded-pill text-grove-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <DialogPrimitive.Description className="sr-only">{`${title} settings. Changes save by themselves.`}</DialogPrimitive.Description>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={setBodyRef}
              data-testid={`${testId}-body`}
              onScroll={measure}
              className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
            >
              <div ref={innerRef}>{children}</div>
            </div>
            {more && (
              <div
                aria-hidden="true"
                data-testid={`${testId}-fade`}
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-grove-canopy"
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
