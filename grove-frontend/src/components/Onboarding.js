import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GROVE_BRAND } from '@/constants/brand';
import { X } from 'lucide-react';
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
    body: 'Plants have a social history. They were given to you, traded at markets, found on roadsides. Grove helps you remember why each plant matters — not just how to keep it alive.',
    cta: 'Continue',
  },
  {
    id: 'care',
    title: 'Track care, not metrics',
    body: 'Grove does not gamify your plants. It helps you pay attention to what they actually need. Log water, see what is due, and build a simple daily rhythm.',
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
    cta: 'Start using Grove',
  },
];

export function Onboarding({ onComplete }) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const screen = SCREENS[currentScreen];

  const handleNext = async () => {
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

  // The first screen is the designed Grove welcome (Studio 12): dark, hand-drawn lines, built in order.
  if (screen.id === 'welcome') {
    return <WelcomeScreen onContinue={handleNext} onSkip={handleSkip} disabled={isCompleting} />;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${screen.dark ? 'bg-grove-lime' : 'bg-grove-forest'}`}
      data-testid="onboarding-flow"
    >
      <div className="w-full max-w-md px-4">
        {/* Skip button */}
        {currentScreen < SCREENS.length - 1 && (
          <button
            onClick={handleSkip}
            disabled={isCompleting}
            className={`absolute top-4 right-4 transition-colors ${screen.dark ? 'text-grove-sprout hover:text-grove-sprout' : 'text-grove-cream hover:text-grove-cream'}`}
            data-testid="onboarding-skip"
            aria-label="Skip onboarding"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Hero image (welcome or photos screen) */}
        {screen.image && (screen.id === 'welcome' || screen.id === 'photos') && (
          <div className={`rounded-[14px] overflow-hidden mb-6 border-[0.5px] ${screen.dark ? 'border-grove-fernLine' : 'border-grove-moss'}`}>
            <img
              src={screen.image}
              alt={screen.id === 'photos' ? 'A plant in soft light' : 'Welcome to Grove'}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-6 text-center">
          <div className="space-y-3">
            <h1 className={`font-plant text-4xl tracking-[-0.01em] ${screen.dark ? 'text-grove-sprout' : 'text-grove-cream'}`}>
              {screen.title}
            </h1>
            {screen.tagline && (
              <p className={`font-sans text-sm uppercase tracking-[0.12em] ${screen.dark ? 'text-grove-sprout' : 'text-grove-sprout'}`}>
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
            <div className={`inline-flex items-center gap-2 rounded-[20px] border-[0.5px] px-3 py-1.5 ${
              screen.dark
                ? 'border-grove-lime bg-grove-lime text-grove-sprout'
                : 'border-grove-moss bg-grove-moss text-grove-cream'
            }`}>
              <span className="font-plant uppercase tracking-[0.1em] text-[10px]">Quick tip</span>
              <span className="font-ui text-xs">{screen.tip}</span>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleNext}
            disabled={isCompleting}
            data-testid="onboarding-continue"
            className={`w-full rounded-[2px] font-[Georgia] uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] transition-colors duration-150 ${
              screen.dark
                ? 'bg-grove-lime text-grove-cream border-grove-lime hover:bg-grove-sprout hover:border-grove-moss'
                : 'bg-grove-lime text-grove-root border-grove-fernLine hover:bg-grove-sprout hover:border-grove-fernLine'
            }`}
          >
            {isCompleting ? 'Loading...' : screen.cta}
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
