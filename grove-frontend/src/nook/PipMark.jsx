import React, { useEffect, useRef } from 'react';
import { pipSprite } from './sprites';
import { PALETTE } from './palette';

// A tiny picture of Pip for a tab or button. Decorative: the words beside it carry the meaning, and it never moves.
export default function PipMark({ scale = 2, form = 'sprout', mood = 'calm', className = '' }) {
  const ref = useRef(null);
  const rows = pipSprite(form, mood);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        const color = PALETTE[row[x]];
        if (color) { ctx.fillStyle = color; ctx.fillRect(x * scale, y * scale, scale, scale); }
      }
    });
  });
  return (
    <canvas
      ref={ref}
      width={15 * scale}
      height={rows.length * scale}
      aria-hidden="true"
      className={className}
      style={{ imageRendering: 'pixelated', width: 15 * scale, height: rows.length * scale }}
    />
  );
}
