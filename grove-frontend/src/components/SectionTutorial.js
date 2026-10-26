import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../lib/api';
import { Leaf, Droplets, Users, BookOpen, Sun, X } from 'lucide-react';

/**
 * Phase 14A.2 — Section tutorials (one-card welcome overlays).
 *
 * Each section (Collection, Care, Grove, Greenhouse) shows a one-time, calm
 * editorial overlay the first time the user lands on that route. Dismissible,
 * never returns automatically, and replayable from Settings > Tutorials and
 * tips. Server-tracked via `user.tutorials_seen[]`.
 *
 * Lighting is a fifth tutorial that lives on the species detail surface — same
 * mechanism, different trigger.
 */

export const TUTORIAL_COPY = {
  collection: {
    title: 'Welcome to Plants',
    icon: Leaf,
    body: "Every plant you grow lives here. Tap a tile to open its full record — care, photos, growth. Long press a tile, or tap Select, to log care across many plants at once.",
    accent: 'var(--grove-lime)',
  },
  care: {
    title: 'Welcome to Today',
    icon: Droplets,
    body: "This is your daily rhythm. To do shows what's due now and the badges you're working toward. Progress tracks change over time. Each tap is a small act of attention.",
    accent: 'var(--grove-lime)',
  },
  grove: {
    title: 'Welcome to Community',
    icon: Users,
    body: "The community feed, your groves, and plant swaps live here. Share photos, ask questions, swap cuttings. The rest unlocks gradually as your collection deepens.",
    accent: 'var(--grove-bloom)',
  },
  greenhouse: {
    title: 'Welcome to Learn',
    icon: BookOpen,
    body: "Your library of plant knowledge. Hand-curated species with native ranges, citations, and care guides. Browse to learn — or tap a species in your Collection to jump straight to its entry.",
    accent: 'var(--grove-sun)',
  },
  lighting: {
    title: 'A note on light',
    icon: Sun,
    body: "Light is the single biggest variable in plant care. Bright indirect means near a window without direct sun. Medium is several feet back. Low is a hallway or a north-facing room. Match your plant to your reality, not the other way around.",
    accent: 'var(--grove-sun)',
  },
};

export default function SectionTutorial({ tutorialId, autoShow = true }) {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);

  const tutorialsSeen = user?.tutorials_seen;
  const seen = useMemo(() => tutorialsSeen || [], [tutorialsSeen]);
  const copy = TUTORIAL_COPY[tutorialId];

  useEffect(() => {
    if (!autoShow || !user || !copy) return;
    // Only show if not already seen
    if (!seen.includes(tutorialId)) {
      // Brief delay so the page renders before the overlay appears.
      const t = setTimeout(() => setOpen(true), 350);
      return () => clearTimeout(t);
    }
  }, [autoShow, user, copy, tutorialId, seen]);

  const dismiss = useCallback(async () => {
    setOpen(false);
    if (user) {
      try {
        await userAPI.markTutorialSeen(tutorialId);
        if (refreshUser) await refreshUser();
      } catch { /* non-blocking */ }
    }
  }, [tutorialId, user, refreshUser]);

  if (!open || !copy) return null;
  const Icon = copy.icon;

  return (
    <Dialog open onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent
        showClose={false}
        data-testid={`section-tutorial-${tutorialId}`}
        className="max-w-dialog gap-0 overflow-hidden rounded-small p-0"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close tutorial"
          data-testid={`section-tutorial-close-${tutorialId}`}
          className="absolute right-3 top-3 z-raised flex h-8 w-8 items-center justify-center rounded-round bg-grove-forest text-grove-cream hover:bg-grove-moss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6">
          <div
            className="w-12 h-12 rounded-control flex items-center justify-center mb-4"
            style={{ backgroundColor: `color-mix(in srgb, ${copy.accent} 20%, transparent)` }}
          >
            <Icon className="h-6 w-6" style={{ color: copy.accent }} />
          </div>
          <DialogTitle className="mb-3 text-xl leading-tight">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="font-ui text-sm leading-relaxed text-grove-cream">
            {copy.body}
          </DialogDescription>
          <button
            type="button"
            onClick={dismiss}
            data-testid={`section-tutorial-cta-${tutorialId}`}
            className={cn(buttonVariants(), "mt-5 w-full transition-colors duration-150")}
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Small helper for callers that want an "Open tutorial again" button.
export function ReplayTutorialButton({ tutorialId, label, className }) {
  const { refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await userAPI.replayTutorial(tutorialId);
      if (refreshUser) await refreshUser();
      // Force the consumer to remount SectionTutorial by setting a query flag.
      window.dispatchEvent(new CustomEvent('grove:replay-tutorial', { detail: { tutorialId } }));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      data-testid={`replay-tutorial-${tutorialId}`}
      className={className || 'rounded-control font-ui text-xs px-3 py-2 border-hairline border-grove-moss bg-transparent text-grove-cream hover:border-grove-fernLine disabled:opacity-50 transition-colors duration-150'}
    >
      {busy ? 'Resetting…' : (label || 'Replay')}
    </button>
  );
}
