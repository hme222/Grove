import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';
import './LaunchIntro.css';

const DURATION_MS = 3400;

export const reducedMotion = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The leaf shape and positions are the FloraGrove mark's (components/brand/FloraGroveMark.js), drawn here with CSS
// transforms so the two leaves can swing open from a closed bud.
const LEAF = 'M0 -20.0 C11.0 -10.0 11.0 10.0 0 20.0 C-11.0 10.0 -11.0 -10.0 0 -20.0Z';
const STAR = 'M10 0Q10 10 20 10Q10 10 10 20Q10 10 0 10Q10 10 10 0Z';
// Where the leaves meet, in the mark's 64-unit box: the stem grows up to here.
const BASE_Y = 52.3 / 64;

// The first thing a new visitor sees: a stem grows up from the bottom of the screen into a closed bud, the bud opens
// into the mark, the stem fades, three stars land and the name fades up, then the welcome screen takes over.
// A tap or any key skips it. With reduced motion it is not shown at all.
export default function LaunchIntro({ onDone }) {
  const skip = reducedMotion();
  const markRef = useRef(null);
  const [stem, setStem] = useState(null);

  useLayoutEffect(() => {
    if (skip) return undefined;
    const place = () => {
      const box = markRef.current && markRef.current.getBoundingClientRect();
      if (!box) return;
      const x = box.left + box.width / 2;
      const top = box.top + box.height * BASE_Y;
      const bottom = window.innerHeight + 6;
      const rise = bottom - top;
      setStem(`M${x} ${bottom} C${x - 16} ${top + rise * 0.7} ${x + 16} ${top + rise * 0.35} ${x} ${top}`);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [skip]);

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
      {stem && (
        <svg className="li-stem-svg" aria-hidden="true">
          <path className="li-stem" pathLength="1" d={stem} fill="none" stroke="var(--grove-lime)" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )}
      <div className="li-mark-box" ref={markRef}>
        <svg className="li-mark" width="120" height="120" viewBox="0 0 64 64" aria-hidden="true">
          <path className="li-leaf li-leaf-l" d={LEAF} fill="none" stroke="var(--grove-lime)" strokeWidth="2.8" />
          <path className="li-leaf li-leaf-r" d={LEAF} fill="var(--grove-lime)" stroke="var(--grove-forest)" strokeWidth="3" paintOrder="stroke" />
        </svg>
        {[1, 2, 3].map((n) => (
          <svg key={n} className={`li-star li-star-${n}`} viewBox="0 0 20 20" aria-hidden="true"><path d={STAR} /></svg>
        ))}
      </div>
      <FloraGroveWordmark size={34} className="li-name" />
    </div>
  );
}
