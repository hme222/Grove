import React from 'react';

export function BloomIllustration({ className = '' }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="12" fill="#D4537E" />
      <ellipse cx="60" cy="35" rx="10" ry="18" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5" />
      <ellipse cx="85" cy="60" rx="18" ry="10" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5" />
      <ellipse cx="60" cy="85" rx="10" ry="18" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5" />
      <ellipse cx="35" cy="60" rx="18" ry="10" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5" />
      <ellipse cx="75" cy="45" rx="12" ry="15" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5" transform="rotate(45 75 45)" />
      <ellipse cx="75" cy="75" rx="12" ry="15" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5" transform="rotate(-45 75 75)" />
      <ellipse cx="45" cy="75" rx="12" ry="15" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5" transform="rotate(45 45 75)" />
      <ellipse cx="45" cy="45" rx="12" ry="15" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5" transform="rotate(-45 45 45)" />
    </svg>
  );
}
