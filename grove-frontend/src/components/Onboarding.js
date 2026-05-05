import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GROVE_BRAND } from '@/constants/brand';
import { X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${screen.dark ? 'bg-[#1C2E10]' : 'bg-[#F5F0E8]'}`}
      data-testid="onboarding-flow"
    >
      <div className="w-full max-w-md px-4">
        {/* Skip button */}
        {currentScreen < SCREENS.length - 1 && (
          <button
            onClick={handleSkip}
            disabled={isCompleting}
            className={`absolute top-4 right-4 transition-colors ${screen.dark ? 'text-[#9FE1CB] hover:text-[#EAF3DE]' : 'text-[#2B2B26] hover:text-[#1C2E10]'}`}
            data-testid="onboarding-skip"
            aria-label="Skip onboarding"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Hero image (welcome or photos screen) */}
        {screen.image && (screen.id === 'welcome' || screen.id === 'photos') && (
          <div className={`rounded-[14px] overflow-hidden mb-6 border-[0.5px] ${screen.dark ? 'border-[#2D5016]' : 'border-[#D3C9B8]'}`}>
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
            <h1 className={`font-plant text-4xl tracking-[-0.01em] ${screen.dark ? 'text-[#EAF3DE]' : 'text-[#1C2E10]'}`}>
              {screen.title}
            </h1>
            {screen.tagline && (
              <p className={`font-sans text-sm uppercase tracking-[0.12em] ${screen.dark ? 'text-[#9FE1CB]' : 'text-[#3B6D11]'}`}>
                {screen.tagline}
              </p>
            )}
            {screen.subtitle && (
              <p className={`text-base font-medium ${screen.dark ? 'text-[#9FE1CB]' : 'text-[#2B2B26]'}`}>{screen.subtitle}</p>
            )}
          </div>

          <p className={`text-sm leading-relaxed max-w-sm mx-auto italic ${screen.dark ? 'text-[#9FE1CB]' : 'text-[#2B2B26]'}`}>
            {screen.body}
          </p>

          {screen.tip && (
            <div className={`inline-flex items-center gap-2 rounded-[20px] border-[0.5px] px-3 py-1.5 ${
              screen.dark
                ? 'border-[#5DCAA5] bg-[#2D5016] text-[#9FE1CB]'
                : 'border-[#D3C9B8] bg-[#EDE5D8] text-[#1C2E10]'
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
                ? 'bg-[#5DCAA5] text-[#1C2E10] border-[#5DCAA5] hover:bg-[#4ab08d] hover:border-[#4ab08d]'
                : 'bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016] hover:border-[#2D5016]'
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
                    ? (screen.dark ? 'w-6 bg-[#9FE1CB]' : 'w-6 bg-[#3B6D11]')
                    : (screen.dark ? 'w-1.5 bg-[#2D5016]' : 'w-1.5 bg-[#D3C9B8]')
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
