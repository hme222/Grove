import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { WelcomeStage, STAGE_W, STAGE_H } from '@/components/WelcomeStage';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';
import PhotoBand from '@/components/PhotoBand';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import './WelcomeScreen.css';

// The FloraGrove welcome screen, matched to the Studio 12 design (design/studio/Studio12-Rise.dc.html).
// The composition sits on a 430 x 932 stage (iPhone Pro Max points) and is scaled to fit,
// so the hand-drawn lines stay attached to the words they connect.
// Motion plays once, in order: the wordmark + "Welcome to FloraGrove", the stars (then they twinkle),
// the first line wiping down, the definition, the second line, then the photo with the rest.
// Tapping the screen while it builds skips to the finished screen.
// With reduced motion, everything is shown at once and nothing moves.

// Below this width, or when the scaled body text (17px on the stage) would be under 14px, the picture is
// not scaled down: the same words come as a normal-flow page (headline, photo band, text, Continue).
const COMPACT_W = 360;
const MIN_BODY_PX = 14;
const STAGE_BODY_PX = 17;

export function isCompact(width, scale) {
  return width < COMPACT_W || STAGE_BODY_PX * scale < MIN_BODY_PX;
}

function stageScale() {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
}

function useStageScale() {
  const [scale, setScale] = useState(stageScale);
  useEffect(() => {
    const onResize = () => setScale(stageScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

function skipButton(onSkip, disabled, className) {
  return (
    <button
      type="button"
      onClick={onSkip}
      disabled={disabled}
      className={className}
      data-testid="onboarding-skip"
      aria-label="Skip onboarding"
    >
      <X className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

function CompactWelcome({ onContinue, onSkip, disabled, showSkip }) {
  return (
    <div
      className="fixed inset-0 z-intro overflow-y-auto bg-grove-forest text-grove-cream"
      data-testid="onboarding-welcome"
      data-layout="flow"
    >
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pb-16 pt-6">
        <div className="flex min-h-touch items-center justify-between gap-2">
          <FloraGroveWordmark size={24} />
          {showSkip && skipButton(onSkip, disabled, 'flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-control text-grove-lichen hover:text-grove-cream')}
        </div>
        <h1 className="mt-6 max-w-full break-words font-plant text-3xl leading-tight text-grove-cream">Welcome to FloraGrove</h1>
        <p className="mt-3 font-ui text-base leading-relaxed text-grove-cream">
          A <b className="font-plant text-lg font-bold">grove</b> is a small group of trees growing closely together
        </p>
        <PhotoBand src="/photos/welcome-forest.jpg" ratio="photo" eager className="mt-6" />
        <p className="mt-6 font-ui text-base text-grove-cream">
          FloraGrove is a <b className="font-bold">safe space</b> to learn about plants.
        </p>
        <p className="mt-2 font-ui text-base font-light italic text-grove-cream">
          Providing tools to help you feel confident in caring for your plants
        </p>
        <div className="mt-auto pt-8">
          <button
            type="button"
            onClick={onContinue}
            disabled={disabled}
            className={cn(buttonVariants(), 'w-full')}
            data-testid="onboarding-continue"
          >
            {disabled ? 'Loading…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WelcomeScreen({ onContinue, onSkip, disabled, showSkip = true }) {
  const scale = useStageScale();
  const [done, setDone] = useState(false);
  const width = typeof window === 'undefined' ? STAGE_W : window.innerWidth;

  if (isCompact(width, scale)) {
    return <CompactWelcome onContinue={onContinue} onSkip={onSkip} disabled={disabled} showSkip={showSkip} />;
  }

  return (
    <div
      className={`gw z-intro ${done ? 'gw-done' : ''}`}
      style={{ '--stage-scale': scale }}
      data-testid="onboarding-welcome"
      onPointerDown={() => setDone(true)}
    >
      {showSkip && skipButton(onSkip, disabled, 'gw-skip')}

      <div className="gw-stage-wrap" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div className="gw-stage" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
          <WelcomeStage onContinue={onContinue} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
