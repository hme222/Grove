import React from 'react';

// FloraGrove mark: an outlined leaf (light "Flora") and a solid leaf (bold "Grove").
// It is also the "v" in the wordmark. `background` is the colour behind the mark;
// it draws the thin gap where the solid leaf overlaps the outline.
export function FloraGroveMark({ size = 24, color = 'var(--grove-lime)', background = 'var(--grove-night)', strokeWidth = 2.8, title, className, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      <path transform="translate(25 34) rotate(-24)" d="M0 -20.0 C11.0 -10.0 11.0 10.0 0 20.0 C-11.0 10.0 -11.0 -10.0 0 -20.0Z" fill="none" stroke={color} strokeWidth={strokeWidth} />
      <path transform="translate(39 34) rotate(24)" d="M0 -20.0 C11.0 -10.0 11.0 10.0 0 20.0 C-11.0 10.0 -11.0 -10.0 0 -20.0Z" fill={color} stroke={background} strokeWidth="3" paintOrder="stroke" />
    </svg>
  );
}

export default FloraGroveMark;
