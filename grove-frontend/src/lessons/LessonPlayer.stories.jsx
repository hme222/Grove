import React from 'react';
import { Heart, Hand, Timer } from 'lucide-react';
import LessonPlayer from './LessonPlayer';

// Sample cards only. Real card text lives in the lesson pages.
const SAMPLE_CARDS = [
  {
    n: 1,
    header: 'Card 1 of 3 · The Hook',
    headline: 'Erase the plant guilt.',
    body: 'Most plants don’t die from a lack of love — they die from <strong>drowning</strong>.',
    cta: 'I’m ready',
    icon: Heart,
    accent: 'from-rose-100 via-amber-50 to-emerald-50',
    ring: 'text-rose-600',
  },
  {
    n: 2,
    header: 'Card 2 of 3 · The Probe',
    headline: 'Your natural moisture sensor.',
    body: 'Push your index finger <strong>2 inches deep</strong> into the soil.',
    cta: 'Got it &mdash; finger as probe',
    icon: Hand,
    accent: 'from-amber-100 via-orange-50 to-emerald-50',
    ring: 'text-amber-700',
  },
  {
    n: 3,
    header: 'Card 3 of 3 · Your Turn',
    headline: '60 seconds. One plant. Real answer.',
    body: 'Go to your nearest plant right now.',
    cta: 'Log my first soil test',
    icon: Timer,
    accent: 'from-lime-100 via-emerald-50 to-emerald-100',
    ring: 'text-emerald-700',
    interactive: true,
  },
];

export default {
  title: 'Grove/LessonPlayer',
  component: LessonPlayer,
  parameters: {
    docs: {
      description: {
        component:
          'Steps through a lesson one card at a time. The last card shows whatever the lesson needs for its "your turn" step.',
      },
    },
  },
};

export const Steps = {
  args: { cards: SAMPLE_CARDS, onExit: () => {} },
};

export const WithFinalCard = {
  args: {
    cards: SAMPLE_CARDS,
    onExit: () => {},
    renderFinalCard: () => (
      <button type="button" className="w-full rounded-[2px] bg-[#1C2E10] text-[#F5F0E8] px-4 py-3 text-xs">
        Your turn goes here
      </button>
    ),
  },
};
