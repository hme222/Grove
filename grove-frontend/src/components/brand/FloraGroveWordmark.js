import React from 'react';

// FloraGrove wordmark: light Alegreya Sans "Flora" + bold Cormorant Garamond "Grove",
// with the mark's two leaves as the "v". Size is the cap size of "Grove" in px.
// Screen readers hear "FloraGrove". For print or fixed artwork, use
// design/brand/floragrove-wordmark-*.svg (outlined, no fonts needed).
export function FloraGroveWordmark({ size = 24, color = 'var(--grove-cream)', leafColor = 'var(--grove-lime)', className, style }) {
  return (
    <span
      role="img"
      aria-label="FloraGrove"
      className={className}
      style={{ display: 'inline-block', whiteSpace: 'nowrap', lineHeight: 1, color, ...style }}
    >
      <span aria-hidden="true" style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: size * 0.9 }}>Flora</span>
      <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size }}>
        Gro
        <svg
          viewBox="0 0 32 30"
          aria-hidden="true"
          style={{ display: 'inline-block', width: '0.6em', height: '0.56em', verticalAlign: '-0.03em', margin: '0 -0.01em' }}
        >
          <path transform="translate(10.5 15) rotate(-24)" d="M0 -14.0 C6.5 -7.0 6.5 7.0 0 14.0 C-6.5 7.0 -6.5 -7.0 0 -14.0Z" fill="none" stroke={leafColor} strokeWidth="2.6" />
          <path transform="translate(21.5 15) rotate(24)" d="M0 -14.0 C6.5 -7.0 6.5 7.0 0 14.0 C-6.5 7.0 -6.5 -7.0 0 -14.0Z" fill={leafColor} />
        </svg>
        e
      </span>
    </span>
  );
}

export default FloraGroveWordmark;
