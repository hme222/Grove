import React, { useState } from 'react';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

// Photos for the first-run steps (exported from the Figma file into public/onboarding).
// Decorative: the words on the screen carry the meaning, so the alt text is empty and the box is hidden
// from screen readers. The box keeps its shape while the picture loads and if it never does, so
// nothing jumps; the fallback is a plain moss tile with a sprout.
export const onboardingPhoto = (name) => `${process.env.PUBLIC_URL || ''}/onboarding/${name}.jpg`;

export default function HeroImage({ name, ratio = '3 / 2', className, eager = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      aria-hidden="true"
      style={{ aspectRatio: ratio }}
      className={cn('relative w-full overflow-hidden rounded-card bg-grove-moss', className)}
      data-testid="hero-image"
      data-photo={name}
    >
      {failed ? (
        <div className="flex h-full w-full items-center justify-center text-grove-sprout" data-testid="hero-fallback">
          <Sprout className="h-10 w-10" />
        </div>
      ) : (
        <img
          src={onboardingPhoto(name)}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
