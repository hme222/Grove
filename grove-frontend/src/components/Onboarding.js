import React, { useState } from 'react';
import useDialogA11y from '../lib/useDialogA11y';
import { Button } from '@/components/ui/button';
import { GROVE_BRAND } from '@/constants/brand';
import { X, Sprout, LifeBuoy, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { WelcomeScreen } from '@/components/WelcomeScreen';

const SCREENS = [
  {
    id: 'welcome',
    image: 'https://images.unsplash.com/photo-1649603598264-3695fd56ca01?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800',
    title: GROVE_BRAND.name,
    tagline: GROVE_BRAND.tagline,
    subtitle: GROVE_BRAND.subTagline,
    body: 'Plants have a social history. They were given to you, traded at markets, found on roadsides. FloraGrove helps you remember why each plant matters — not just how to keep it alive.',
    cta: 'Continue',
  },
  {
    id: 'care',
    title: 'Track care, not metrics',
    body: 'FloraGrove does not gamify your plants. It helps you pay attention to what they actually need. Log water, see what is due, and build a simple daily rhythm.',
    cta: 'Got it',
  },
  {
    id: 'photos',
    image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800',
    title: 'Make it real',
    body: "Capture your plants as they are today. Every photo becomes part of their story.",
    tip: 'Natural light + clean background = a photo you will love in a year.',
    cta: 'Got it — start with photos',
    dark: true,
  },
  {
    id: 'community',
    title: 'Learn from other growers',
    body: 'At day 7, the feed unlocks. See what your grove members are growing, get tips from their care logs, and swap cuttings when you are ready.',
    cta: 'Makes sense',
  },
  {
    id: 'promise',
    title: GROVE_BRAND.promise,
    body: GROVE_BRAND.grovePromiseFull,
    cta: 'Start using FloraGrove',
  },
];

// What someone came for. Each answer finishes the intro and goes straight there; the slides are
// still available from "Show me around".
const INTENTS = [
  { key: 'add', icon: Sprout, title: 'Set up a plant', desc: 'Add the plant you have and get its care schedule.', to: '/add-plant' },
  { key: 'sick', icon: LifeBuoy, title: 'My plant looks unwell', desc: 'Yellow leaves, drooping, bugs. Start with quick checks.', to: '/help-my-plant' },
  { key: 'learn', icon: BookOpen, title: 'Learn the basics', desc: 'Short lessons for new plant owners.', to: '/lessons' },
];

export function Onboarding({ onComplete }) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [stage, setStage] = useState('welcome'); // welcome -> intent -> slides
  const [isCompleting, setIsCompleting] = useState(false);
  const screen = SCREENS[currentScreen];

  const finish = async (to) => {
    setIsCompleting(true);
    try {
      await api.patch('/users/me', { onboarding_complete: true });
      onComplete(to ? { to } : undefined);
    } catch (error) {
      toast.error("Couldn't save your progress. Check your connection and try again.");
      setIsCompleting(false);
    }
  };

  const handleNext = async () => {
    if (stage === 'welcome') {
      setStage('intent');
      return;
    }
    if (currentScreen < SCREENS.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      setIsCompleting(true);
      try {
        await api.patch('/users/me', { onboarding_complete: true });
        onComplete();
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        toast.error('Failed to save progress. Please try again.');
        setIsCompleting(false);
      }
    }
  };

  const handleSkip = async () => {
    setIsCompleting(true);
    try {
      await api.patch('/users/me', { onboarding_complete: true });
      onComplete();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      toast.error('Failed to save progress. Please try again.');
      setIsCompleting(false);
    }
  };

  // The first screen is the designed FloraGrove welcome (Studio 12): dark, hand-drawn lines, built in order.
  const dialogRef = React.useRef(null);
  useDialogA11y(dialogRef, null, stage !== 'welcome');

  if (stage === 'welcome') {
    return <WelcomeScreen onContinue={handleNext} onSkip={handleSkip} disabled={isCompleting} />;
  }

  if (stage === 'intent') {
    return (
      <div
        className="fixed inset-0 z-intro flex items-center justify-center overflow-y-auto bg-grove-forest focus:outline-none"
        data-testid="onboarding-intent"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intent-heading"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="w-full max-w-md px-4 py-8">
          <h1 id="intent-heading" className="font-plant text-3xl text-grove-cream">What brings you here today?</h1>
          <p className="mt-2 font-ui text-sm text-grove-sage">Pick one. You can do the others any time.</p>
          <div className="mt-6 space-y-3">
            {INTENTS.map(({ key, icon: Icon, title, desc, to }) => (
              <button
                key={key}
                type="button"
                disabled={isCompleting}
                onClick={() => finish(to)}
                data-testid={`intent-${key}`}
                className="flex min-h-row w-full items-center gap-3 rounded-card border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3 text-left hover:border-grove-lime disabled:opacity-60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-chip bg-grove-moss text-grove-sprout" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-plant text-base font-semibold leading-tight text-grove-cream">{title}</span>
                  <span className="mt-0.5 block font-ui text-sm leading-snug text-grove-sage">{desc}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-2">
            <button
              type="button"
              disabled={isCompleting}
              onClick={() => { setStage('slides'); setCurrentScreen(1); }}
              data-testid="intent-tour"
              className="min-h-touch rounded-control px-4 font-ui text-sm text-grove-cream underline underline-offset-2"
            >
              Show me around first
            </button>
            <button
              type="button"
              disabled={isCompleting}
              onClick={() => finish()}
              data-testid="intent-skip"
              className="min-h-touch rounded-control px-4 font-ui text-sm text-grove-sage underline underline-offset-2"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-intro flex items-center justify-center focus:outline-none ${screen.dark ? 'bg-grove-root' : 'bg-grove-forest'}`}
      data-testid="onboarding-flow"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to FloraGrove"
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="w-full max-w-md px-4">
        {/* Skip button */}
        {currentScreen < SCREENS.length - 1 && (
          <button
            onClick={handleSkip}
            disabled={isCompleting}
            className={`absolute top-4 right-4 flex min-h-touch min-w-touch items-center justify-center transition-colors ${screen.dark ? 'text-grove-sprout hover:text-grove-sprout' : 'text-grove-cream hover:text-grove-cream'}`}
            data-testid="onboarding-skip"
            aria-label="Skip onboarding"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Hero image (welcome or photos screen) */}
        {screen.image && (screen.id === 'welcome' || screen.id === 'photos') && (
          <div className={`rounded-small overflow-hidden mb-6 border-hairline ${screen.dark ? 'border-grove-fernLine' : 'border-grove-moss'}`}>
            <img
              src={screen.image}
              alt={screen.id === 'photos' ? 'A plant in soft light' : 'Welcome to FloraGrove'}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-6 text-center">
          <div className="space-y-3">
            <h1 className={`font-plant text-4xl tracking-display ${screen.dark ? 'text-grove-sprout' : 'text-grove-cream'}`}>
              {screen.title}
            </h1>
            {screen.tagline && (
              <p className={`font-ui text-sm ${screen.dark ? 'text-grove-sprout' : 'text-grove-sprout'}`}>
                {screen.tagline}
              </p>
            )}
            {screen.subtitle && (
              <p className={`text-base font-medium ${screen.dark ? 'text-grove-sprout' : 'text-grove-cream'}`}>{screen.subtitle}</p>
            )}
          </div>

          <p className={`text-sm leading-relaxed max-w-sm mx-auto italic ${screen.dark ? 'text-grove-sprout' : 'text-grove-cream'}`}>
            {screen.body}
          </p>

          {screen.tip && (
            <div className={`inline-flex items-center gap-2 rounded-round border-hairline px-3 py-1.5 ${screen.dark ? 'border-grove-lime bg-grove-lime text-grove-root' : 'border-grove-moss bg-grove-moss text-grove-cream'}`}>
              <span className="font-ui text-xs font-medium">Quick tip</span>
              <span className="font-ui text-xs">{screen.tip}</span>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleNext}
            disabled={isCompleting}
            data-testid="onboarding-continue"
            className="w-full"
          >
            {isCompleting ? 'Loading…' : screen.cta}
          </Button>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pt-4">
            {SCREENS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === currentScreen
                    ? (screen.dark ? 'w-6 bg-grove-moss' : 'w-6 bg-grove-lime')
                    : (screen.dark ? 'w-1.5 bg-grove-lime' : 'w-1.5 bg-grove-moss')
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
