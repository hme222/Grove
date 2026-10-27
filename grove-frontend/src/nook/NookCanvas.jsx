import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { drawRoom, ROOM_W, ROOM_H } from './drawRoom';
import { backingScale } from './scale';

const currentDpr = () => (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

// Draws the nook on a canvas that fills the width of its container, at any width. The canvas is
// drawn at a whole-number multiple of the 128 x 80 room (see backingScale) and fitted to the
// container with CSS (object-fit: cover, pixelated), so the pixels stay sharp and no strip is
// left blank beside it. Pip bobs every 700ms unless the user prefers reduced motion. Pass `view`
// from useMemo, so the drawing is not restarted on every render. The canvas is a picture for
// sighted users; the page shows the same state as text. `scale` fixes the width at that many CSS
// pixels per room pixel, for small pictures.
export default function NookCanvas({ view, animate = true, label, scale, className = '' }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tick = useRef(0);
  const [measured, setMeasured] = useState({ width: 0, dpr: currentDpr() });

  useLayoutEffect(() => {
    if (scale || !wrapRef.current) return undefined;
    const measure = () => {
      const next = { width: wrapRef.current.clientWidth, dpr: currentDpr() };
      setMeasured((prev) => (prev.width === next.width && prev.dpr === next.dpr ? prev : next));
    };
    measure();
    window.addEventListener('resize', measure);
    if (typeof ResizeObserver === 'undefined') return () => window.removeEventListener('resize', measure);
    const observer = new ResizeObserver(measure);
    observer.observe(wrapRef.current);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [scale]);

  const cssWidth = scale ? ROOM_W * scale : measured.width;
  const used = backingScale(cssWidth, scale ? currentDpr() : measured.dpr);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) return undefined;
    const paint = () => {
      if (ctx.setTransform) ctx.setTransform(used, 0, 0, used, 0, 0);
      drawRoom(ctx, view, tick.current);
    };
    paint();
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduced) return undefined;
    const timer = setInterval(() => {
      tick.current += 1;
      paint();
    }, 700);
    return () => clearInterval(timer);
  }, [view, animate, used]);

  return (
    <div ref={wrapRef} className={`w-full ${className}`} style={scale ? { width: ROOM_W * scale } : undefined}>
      <canvas
        ref={canvasRef}
        width={ROOM_W * used}
        height={ROOM_H * used}
        role="img"
        aria-label={label}
        data-testid="nook-canvas"
        data-scale={used}
        className="block h-auto w-full object-cover"
        style={{ imageRendering: 'pixelated', aspectRatio: `${ROOM_W} / ${ROOM_H}` }}
      />
    </div>
  );
}
