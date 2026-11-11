import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';
import './LaunchIntro.css';

// The name is fully in by about 3s; then it glides up and shrinks into the welcome screen's own wordmark (GLIDE_MS)
// while the rest of the intro fades, and the welcome screen takes over exactly where the name lands.
const GLIDE_AT_MS = 3000;
const GLIDE_MS = 800;

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
export default function LaunchIntro({ onDone, onGlide }) {
  const skip = reducedMotion();
  const markRef = useRef(null);
  const nameRef = useRef(null);
  const [stem, setStem] = useState(null);
  const [fading, setFading] = useState(false);

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
    let finishTimer = null;
    let frame = null;
    const glide = () => {
      if (onGlide) onGlide(); // the welcome screen mounts underneath so its wordmark can be measured
      setFading(true);
      let tries = 0;
      const go = () => {
        const name = nameRef.current;
        const target = document.querySelector('[data-welcome-wordmark]');
        if (!name || !target) {
          tries += 1;
          if (tries < 30) { frame = requestAnimationFrame(go); return; }
          finishTimer = setTimeout(onDone, 0);
          return;
        }
        const from = name.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        if (from.width > 0 && to.width > 0 && typeof name.animate === 'function') {
          name.style.transformOrigin = '0 0';
          name.animate(
            [{ transform: 'none' }, { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})` }],
            { duration: GLIDE_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
          );
        }
        finishTimer = setTimeout(onDone, GLIDE_MS);
      };
      frame = requestAnimationFrame(go);
    };
    const timer = setTimeout(glide, GLIDE_AT_MS);
    const onKey = () => onDone();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer); clearTimeout(finishTimer);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
    };
  }, [skip, onDone, onGlide]);

  if (skip) return null;
  return (
    <div className={`li z-intro${fading ? ' li-fading' : ''}`} data-testid="launch-intro" onPointerDown={onDone}>
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
      <span ref={nameRef} className="li-name" style={{ display: 'inline-block' }}>
        <FloraGroveWordmark size={34} />
      </span>
    </div>
  );
}
