import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { drawRoom, ROOM_W, ROOM_H } from './drawRoom';
import { integerScale } from './scale';

// Draws the nook on a canvas, scaled by whole numbers only. Pip bobs every
// 700ms unless the user prefers reduced motion. Pass `view` from useMemo, so the
// drawing is not restarted on every render. The canvas is a picture for sighted
// users; the page shows the same state as text.
export default function NookCanvas({ view, animate = true, label, scale }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tick = useRef(0);
  const [measured, setMeasured] = useState(2);

  useLayoutEffect(() => {
    if (scale || !wrapRef.current) return undefined;
    const measure = () => setMeasured(integerScale(wrapRef.current.clientWidth));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) return undefined;
    const paint = () => drawRoom(ctx, view, tick.current);
    paint();
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduced) return undefined;
    const timer = setInterval(() => {
      tick.current += 1;
      paint();
    }, 700);
    return () => clearInterval(timer);
  }, [view, animate]);

  const used = scale || measured;
  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={ROOM_W}
        height={ROOM_H}
        role="img"
        aria-label={label}
        data-testid="nook-canvas"
        data-scale={used}
        style={{ width: ROOM_W * used, height: ROOM_H * used, display: 'block', imageRendering: 'pixelated', borderRadius: 6 }}
      />
    </div>
  );
}
