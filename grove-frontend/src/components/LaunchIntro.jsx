import React, { useEffect } from 'react';
import { FloraGroveMark } from '@/components/brand/FloraGroveMark';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';
import './LaunchIntro.css';

const DURATION_MS = 2800;

export const reducedMotion = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The first thing a new visitor sees: the mark drops in and bounces twice, then the name fades up, then the
// welcome screen takes over. A tap or any key skips it. With reduced motion it is not shown at all.
export default function LaunchIntro({ onDone }) {
  const skip = reducedMotion();
  useEffect(() => {
    if (skip) { onDone(); return undefined; }
    const timer = setTimeout(onDone, DURATION_MS);
    const onKey = () => onDone();
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [skip, onDone]);
  if (skip) return null;
  return (
    <div className="li z-intro" data-testid="launch-intro" onPointerDown={onDone}>
      <FloraGroveMark size={96} background="var(--grove-forest)" className="li-mark" />
      <FloraGroveWordmark size={34} className="li-name" />
    </div>
  );
}
