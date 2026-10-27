import React, { useEffect, useMemo, useRef } from 'react';
import { drawSprite } from './drawRoom';
import { pipSprite, SPRITE_WIDTH, CENTER } from './sprites';

const BOB_MS = 700;
const PREVIEW_MS = 5000;

// Pip on a flat cream panel. Used where Pip hosts a lesson and in the nook offer.
// With `animate` he bobs for five seconds and then holds still. Nothing moves for
// people who prefer reduced motion.
export default function PipPanel({ form = 'seed', mood = 'calm', animate = false, label = 'Pip', scale = 4 }) {
  const canvasRef = useRef(null);
  const rows = useMemo(() => pipSprite(form, mood), [form, mood]);
  const height = rows.length + 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) return undefined;
    const paint = (bob) => {
      ctx.clearRect(0, 0, SPRITE_WIDTH, height);
      drawSprite(ctx, rows, CENTER, height - 1 - bob);
    };
    paint(0);
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduced) return undefined;
    let bob = 0;
    const timer = setInterval(() => {
      bob = bob ? 0 : 1;
      paint(bob);
    }, BOB_MS);
    const stop = setTimeout(() => {
      clearInterval(timer);
      paint(0);
    }, PREVIEW_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, [rows, height, animate]);

  return (
    <div className="inline-flex rounded-[10px] bg-[#F3EAD9] p-3" data-testid="pip-panel">
      <canvas
        ref={canvasRef}
        width={SPRITE_WIDTH}
        height={height}
        role="img"
        aria-label={label}
        style={{ width: SPRITE_WIDTH * scale, height: height * scale, imageRendering: 'pixelated', display: 'block' }}
      />
    </div>
  );
}
