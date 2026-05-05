import React from 'react';

export function LeafIllustration({ className = '' }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M60 10C60 10 30 25 20 50C10 75 25 100 60 110C95 100 110 75 100 50C90 25 60 10 60 10Z"
        fill="#EAF3DE"
        stroke="#3B6D11"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 10C60 10 60 45 60 70C60 95 60 110 60 110"
        stroke="#639922"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M60 35C60 35 70 40 75 47"
        stroke="#639922"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M60 50C60 50 50 55 45 62"
        stroke="#639922"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M60 65C60 65 70 70 72 77"
        stroke="#639922"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
