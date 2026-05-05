import React, { useEffect, useState, useCallback } from 'react';
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
    title: 'Welcome to Collection',
    icon: Leaf,
    body: "Every plant you grow lives here. Tap a tile to open its full record — care, photos, growth. Long press a tile, or tap Select, to log care across many plants at once.",
    accent: '#3B6D11',
  },
  care: {
    title: 'Welcome to Care',
    icon: Droplets,
    body: "This is your daily rhythm. Today shows what's due now and the badges you're working toward. Growth tracks change over time. Each tap is a small act of attention.",
    accent: '#5DCAA5',
  },
  grove: {
    title: 'Welcome to Grove',
    icon: Users,
    body: "The community feed, your Groves, and plant swaps live here. Share photos, ask questions, swap cuttings. Grove unlocks gradually as your collection deepens.",
    accent: '#D4537E',
  },
  greenhouse: {
    title: 'Welcome to Greenhouse',
    icon: BookOpen,
    body: "Your library of plant knowledge. Hand-curated species with native ranges, citations, and care guides. Browse to learn — or tap a species in your Collection to jump straight to its entry.",
    accent: '#BA7517',
  },
  lighting: {
    title: 'A note on light',
    icon: Sun,
    body: "Light is the single biggest variable in plant care. Bright indirect means near a window without direct sun. Medium is several feet back. Low is a hallway or a north-facing room. Match your plant to your reality, not the other way around.",
    accent: '#E8A857',
  },
};

export default function SectionTutorial({ tutorialId, autoShow = true }) {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);

  const seen = user?.tutorials_seen || [];
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
    <div
      className="fixed inset-0 z-[300] bg-[#1C2E10]/85 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
      data-testid={`section-tutorial-${tutorialId}`}
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] shadow-2xl overflow-hidden"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close tutorial"
          data-testid={`section-tutorial-close-${tutorialId}`}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F5F0E8] text-[#1C2E10] flex items-center justify-center hover:bg-[#EAF3DE] z-10"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-4"
            style={{ backgroundColor: `${copy.accent}20` }}
          >
            <Icon className="h-6 w-6" style={{ color: copy.accent }} />
          </div>
          <h2 className="font-plant text-[#1C2E10] text-xl mb-3 leading-tight">
            {copy.title}
          </h2>
          <p className="font-ui text-sm leading-relaxed text-[#2B2B26]">
            {copy.body}
          </p>
          <button
            type="button"
            onClick={dismiss}
            data-testid={`section-tutorial-cta-${tutorialId}`}
            className="mt-5 w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 bg-[#1C2E10] text-[#F5F0E8] border-[0.5px] border-[#1C2E10] hover:bg-[#2D5016] transition-colors duration-150"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
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
      className={className || 'rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#D3C9B8] bg-transparent text-[#1C2E10] hover:border-[#2D5016] disabled:opacity-50 transition-colors duration-150'}
    >
      {busy ? 'Resetting…' : (label || 'Replay')}
    </button>
  );
}
