import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { success, impactLight } from '../lib/haptics';
import { tint } from '../lib/color';
import { holdFirstRun } from '../lib/firstRunGate';
import { lessonPath } from '../lessons/lessonMeta';

// The moment after someone finishes a lesson. The lesson page opens it once the save has gone through, so it
// never claims a lesson is done that was not saved. It is the same kind of card as the first-plant milestone:
// a card over a dim backdrop, leaves that burst once (and sit still for reduced motion), one clear next step.
//
//   lesson   the lesson that was just finished: { title }
//   next     the next lesson to offer, or null: { id, title }
//   action   where the lesson's own "try it" step goes, or null: { to, cta }
//   onGo     called with the path to open
//
// With an action the main button goes there. Otherwise it offers the next lesson, and with none it returns to
// the list. Closing the card by any other route (Escape, the backdrop) goes where the main button would go.

const LIST = '/lessons';

const BURSTS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const radius = 70 + (i % 3) * 12;
  return {
    dx: Math.round(Math.cos(angle) * radius), dy: Math.round(Math.sin(angle) * radius),
    rot: Math.round(((i * 47) % 90) - 45), color: i % 3 === 0 ? 'var(--grove-lime)' : 'var(--grove-sprout)', delay: (i % 6) * 35,
  };
});

export default function LessonCompleteCelebration({ open, lesson, next, action, onGo }) {
  const fired = useRef(false);

  useEffect(() => (open ? holdFirstRun() : undefined), [open]);
  useEffect(() => {
    if (!open || fired.current) return;
    fired.current = true;
    try { success(document.body); } catch { /* no-op */ }
  }, [open]);

  if (!open) return null;

  const primary = action
    ? { label: action.cta || 'Continue', to: action.to }
    : next
      ? { label: `Next: ${next.title}`, to: lessonPath(next.id) }
      : { label: 'Back to lessons', to: LIST };
  const hasSecondary = primary.to !== LIST;

  const go = (to) => (e) => {
    impactLight((e && e.currentTarget) || document.body);
    onGo(to);
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(nextOpen) => { if (!nextOpen) onGo(primary.to); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-celebration grove-celebrate-fade" style={{ background: tint('var(--grove-root)', 78) }} />
        <div className="pointer-events-none fixed inset-0 z-celebration flex items-center justify-center px-4">
          <DialogPrimitive.Content
            data-testid="lesson-complete"
            className="pointer-events-auto w-full max-w-dialog"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              e.currentTarget?.querySelector('[data-testid="lesson-complete-cta"]')?.focus();
            }}
          >
            <div className="grove-celebrate-pop relative w-full rounded-card border-hairline border-grove-lime/40 bg-grove-canopy px-6 py-8">
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center" aria-hidden="true">
                <div className="relative mt-24 h-px w-px">
                  {BURSTS.map((b, i) => (
                    <span
                      key={i}
                      className="grove-leaf-burst"
                      style={{
                        left: 0, top: 0, background: b.color, borderRadius: '50% 0 50% 0', animationDelay: `${b.delay}ms`,
                        '--grove-burst-x': `${b.dx}px`, '--grove-burst-y': `${b.dy}px`, '--grove-burst-r': `${b.rot}deg`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-pill bg-grove-lime text-grove-root">
                  <Check className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="font-ui text-sm font-medium text-grove-sprout">Lesson done</p>
                <DialogPrimitive.Title className="mt-1 font-plant text-2xl text-grove-cream">
                  You finished {lesson.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-2 font-ui text-sm leading-relaxed text-grove-cream" data-testid="lesson-complete-text">
                  {action
                    ? 'It is saved. Now try it for real.'
                    : next
                      ? 'It is saved and off your list. Your next lesson is ready when you are.'
                      : 'It is saved and off your list.'}
                </DialogPrimitive.Description>
                <button type="button" onClick={go(primary.to)} data-testid="lesson-complete-cta" className={cn(buttonVariants(), 'mt-5 min-h-touch w-full')}>
                  {primary.label}
                </button>
                {hasSecondary && (
                  <button
                    type="button"
                    onClick={go(LIST)}
                    data-testid="lesson-complete-list"
                    className="mt-2 min-h-touch px-4 font-ui text-sm text-grove-sprout underline underline-offset-4"
                  >
                    Back to lessons
                  </button>
                )}
              </div>
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
