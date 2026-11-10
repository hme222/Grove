import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { WelcomeStage, STAGE_W, STAGE_H, CTA_BOTTOM } from '@/components/WelcomeStage';
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
// When the window is shorter than the picture, the page scrolls.
// With reduced motion, everything is shown at once and nothing moves.

// Below this width the picture is not scaled down: the same words come as a normal-flow page (headline, photo band, text, Continue).
// At or above it the picture always shows. It is scaled to fit the window, but never below the size where its 17px body text is 14px:
// on a short window (a laptop browser) it is that size and the page scrolls, so the hand-drawn lines and stars stay.
const COMPACT_W = 360;
const MIN_BODY_PX = 14;
const STAGE_BODY_PX = 17;
const MIN_SCALE = MIN_BODY_PX / STAGE_BODY_PX;

// A phone narrower than 360, or a short phone (an iPhone SE is 667 tall: the picture would need text under 14px to fit),
// gets the normal-flow page. A short but wide window (a laptop) keeps the picture and scrolls.
const SHORT_PHONE_H = 720;
const PHONE_MAX_W = 500;
export function isCompact(width, height = Infinity) {
  return width < COMPACT_W || (height < SHORT_PHONE_H && width < PHONE_MAX_W);
}

// The sign-in bar under the screen is one touch target tall. If the stage's own Continue button would sit
// behind it or below the fold, Continue is pinned above the bar instead and the picture scrolls behind it.
const SIGN_IN_BAR_PX = 44;

export function shouldPinContinue(scale, height) {
  return scale * CTA_BOTTOM + SIGN_IN_BAR_PX > height;
}

// The window has to hold the picture and the sign-in bar under it, so the bar's height comes off the height the picture may use.
export function stageScaleFor(width, height) {
  return Math.max(Math.min(width / STAGE_W, (height - SIGN_IN_BAR_PX) / STAGE_H), MIN_SCALE);
}

function stageScale() {
  if (typeof window === 'undefined') return 1;
  return stageScaleFor(window.innerWidth, window.innerHeight);
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

function CompactWelcome({ onContinue, onSkip, disabled, showSkip, short }) {
  return (
    <div
      className="fixed inset-0 z-intro overflow-y-auto bg-grove-forest text-grove-cream"
      data-testid="onboarding-welcome"
      data-layout="flow"
    >
      <div className={cn('mx-auto flex min-h-full w-full max-w-md flex-col px-4', short ? 'pb-12 pt-2' : 'pb-16 pt-6')}>
        <div className="flex min-h-touch items-center justify-between gap-2">
          <FloraGroveWordmark size={30} />
          {showSkip && skipButton(onSkip, disabled, 'flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-control text-grove-lichen hover:text-grove-cream')}
        </div>
        <h1 className={cn('max-w-full break-words font-plant text-3xl leading-tight text-grove-cream', short ? 'mt-3' : 'mt-6')}>Welcome to FloraGrove</h1>
        <p className="mt-3 font-ui text-base leading-relaxed text-grove-cream">
          A <b className="font-plant text-lg font-bold">grove</b> is a small group of trees growing closely together
        </p>
        <PhotoBand src="/photos/welcome-forest-edited.jpg" ratio={short ? 'wide' : 'photo'} eager className={short ? 'mt-4' : 'mt-6'} />
        <p className={cn('font-ui text-base text-grove-cream', short ? 'mt-4' : 'mt-6')}>
          FloraGrove is a <b className="font-bold">safe space</b> to learn about plants.
        </p>
        <div className={cn('mt-auto', short ? 'pt-4' : 'pt-8')}>
          <button
            type="button"
            onClick={onContinue}
            disabled={disabled}
            className={cn(buttonVariants(), 'w-full')}
            data-testid="onboarding-continue"
          >
            {disabled ? 'Loading…' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WelcomeScreen({ onContinue, onSkip, disabled, showSkip = true }) {
  const scale = useStageScale();
  const [done, setDone] = useState(false);
  // A keyboard user cannot tap to skip the build, so any key press shows the finished screen. Sign up is on screen from the start.
  useEffect(() => {
    if (done) return undefined;
    const onKey = () => setDone(true);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done]);
  const width = typeof window === 'undefined' ? STAGE_W : window.innerWidth;
  const height = typeof window === 'undefined' ? STAGE_H : window.innerHeight;
  const pinned = shouldPinContinue(scale, height);

  if (isCompact(width, height)) {
    return <CompactWelcome onContinue={onContinue} onSkip={onSkip} disabled={disabled} showSkip={showSkip} short={width >= COMPACT_W} />;
  }

  return (
    <div
      className={`gw z-intro ${done ? 'gw-done' : ''} ${pinned ? 'gw-pinned' : ''}`}
      style={{ '--stage-scale': scale }}
      data-testid="onboarding-welcome"
      onPointerDown={() => setDone(true)}
    >
      {showSkip && skipButton(onSkip, disabled, 'gw-skip')}

      <div className="gw-stage-wrap" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div className="gw-stage" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
          <WelcomeStage pinContinue={pinned} onContinue={onContinue} disabled={disabled} />
        </div>
      </div>

      {pinned && (
        <div className="gw-pin">
          <button type="button" className="gw-cta gw-pin-cta" onClick={onContinue} disabled={disabled} data-testid="onboarding-continue">
            {disabled ? 'Loading…' : 'Sign up'}
          </button>
        </div>
      )}
    </div>
  );
}

export default WelcomeScreen;
