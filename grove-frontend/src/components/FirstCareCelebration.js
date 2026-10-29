import React, { useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { userAPI } from '../lib/api';
import { success, impactLight } from '../lib/haptics';
import { tint } from '../lib/color';
import { shareInvite } from '../lib/share';
import { toast } from 'sonner';
import { holdFirstRun } from '../lib/firstRunGate';
import { actionLabel } from '../lib/careActions';

// One-time overlay shown the first time a user logs ANY care action.
// Triggered by parent when a care log response includes _meta.first_care_pending=true.
// On confirm/dismiss, we POST /users/me/celebrate-first-care to mark it permanently.
// "Water for Monty" when we know what was logged, so the moment is about this plant and not any plant.
function loggedSummary(logged) {
  if (!logged || !logged.plantName) return '';
  const actions = logged.actions || [];
  const label = actions.length === 1 ? actionLabel(actions[0]) : actions.length > 1 ? `${actions.length} actions` : '';
  return label ? `${label} for ${logged.plantName}` : logged.plantName;
}

export default function FirstCareCelebration({ open, onClose, logged }) {
  const hasFiredHaptic = useRef(false);

  // Coach tips and tutorials wait while this is on screen.
  useEffect(() => (open ? holdFirstRun() : undefined), [open]);

  useEffect(() => {
    if (!open || hasFiredHaptic.current) return;
    hasFiredHaptic.current = true;
    // success haptic on overlay open
    try { success(document.body); } catch (_e) { /* no-op */ }
    // call backend idempotently
    (async () => {
      try { await userAPI.celebrateFirstCare(); } catch (_e) { /* no-op */ }
    })();
  }, [open]);

  if (!open) return null;

  const handleClose = (e) => {
    impactLight(e?.currentTarget || document.body);
    onClose && onClose();
  };

  const handleShare = async () => {
    const result = await shareInvite();
    if (result === 'copied') toast.success('Link copied');
    else if (result === 'failed') toast.error('Couldn’t share. Try again.');
  };

  // Generate a few burst leaves at random angles for the celebration
  const bursts = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 70 + (i % 3) * 12;
    const dx = Math.round(Math.cos(angle) * radius);
    const dy = Math.round(Math.sin(angle) * radius);
    const rot = Math.round((i * 47) % 90 - 45);
    const color = i % 3 === 0 ? 'var(--grove-lime)' : i % 3 === 1 ? 'var(--grove-sprout)' : 'var(--grove-sprout)';
    return { dx, dy, rot, color, delay: (i % 6) * 35 };
  });

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-celebration grove-celebrate-fade"
        style={{ background: tint('var(--grove-root)', 78) }}
      />
      <div className="fixed inset-0 z-celebration flex items-center justify-center px-4 pointer-events-none">
      <DialogPrimitive.Content
        data-testid="first-care-celebration"
        className="pointer-events-auto"
        onOpenAutoFocus={(e) => {
          // Land on the main action rather than the close button.
          e.preventDefault();
          e.currentTarget?.querySelector('[data-testid="first-care-celebration-cta"]')?.focus();
        }}
      >
      <div className="relative max-w-dialog w-full rounded-card border-hairline border-grove-lime/40 bg-grove-canopy px-6 py-6 grove-celebrate-pop">
        {/* Burst leaves around the central icon */}
        <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
          <div className="relative h-px w-px" style={{ marginTop: 70 }}>
            {bursts.map((b, i) => (
              <span
                key={i}
                className="grove-leaf-burst"
                style={{
                  left: 0, top: 0,
                  background: b.color,
                  borderRadius: '50% 0 50% 0',
                  animationDelay: `${b.delay}ms`,
                  '--grove-burst-x': `${b.dx}px`,
                  '--grove-burst-y': `${b.dy}px`,
                  '--grove-burst-r': `${b.rot}deg`,
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          data-testid="first-care-celebration-close-x"
          className="group absolute top-1.5 right-1.5 flex h-touch w-touch items-center justify-center"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-pill border-hairline border-grove-moss text-grove-sage group-hover:bg-grove-moss">
            <X className="h-4 w-4" />
          </span>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-pill bg-grove-lime text-grove-root flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <p className="font-ui text-xs font-medium text-grove-sprout">
            First care logged
          </p>
          <DialogPrimitive.Title className="font-plant text-grove-cream text-2xl mt-1">
            Your grove remembers.
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="font-ui text-sm text-grove-cream mt-2 leading-relaxed">
            {loggedSummary(logged)
              ? `${loggedSummary(logged)} is the first entry in its timeline. Every drop, photo and note from now on joins it.`
              : 'That’s the loop. Every drop, every photo, every small note from now on becomes part of your plant’s living timeline.'}
          </DialogPrimitive.Description>
          <button
            type="button"
            onClick={handleClose}
            data-testid="first-care-celebration-cta"
            className={cn(buttonVariants(), "relative overflow-hidden mt-5 transition-colors duration-150")}
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={handleShare}
            data-testid="first-care-celebration-share"
            className="mt-2 min-h-touch px-4 font-ui text-sm text-grove-sprout underline underline-offset-4"
          >
            Tell a friend
          </button>
        </div>
      </div>
      </DialogPrimitive.Content>
      </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
