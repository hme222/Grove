import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { WelcomeStage, STAGE_W, STAGE_H } from '@/components/WelcomeStage';
import './WelcomeScreen.css';

// The FloraGrove welcome screen, matched to the Studio 12 design (design/studio/Studio12-Rise.dc.html).
// The composition sits on a 430 x 932 stage (iPhone Pro Max points) and is scaled to fit,
// so the hand-drawn lines stay attached to the words they connect.
// Motion plays once, in order: the wordmark + "Welcome to FloraGrove", the stars (then they twinkle),
// the first line wiping down, the definition, the second line, then the photo with the rest.
// Tapping the screen while it builds skips to the finished screen.
// With reduced motion, everything is shown at once and nothing moves.

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

export function WelcomeScreen({ onContinue, onSkip, disabled, showSkip = true }) {
  const scale = useStageScale();
  const [done, setDone] = useState(false);

  return (
    <div
      className={`gw ${done ? 'gw-done' : ''}`}
      style={{ '--stage-scale': scale }}
      data-testid="onboarding-welcome"
      onPointerDown={() => setDone(true)}
    >
      {showSkip && (
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="gw-skip"
          data-testid="onboarding-skip"
          aria-label="Skip onboarding"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="gw-stage-wrap" style={{ width: STAGE_W * scale, height: STAGE_H * scale }}>
        <div className="gw-stage" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
          <WelcomeStage onContinue={onContinue} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
