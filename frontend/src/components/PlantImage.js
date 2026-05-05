import React from 'react';
import { Leaf } from 'lucide-react';
import { getFileUrl } from '../lib/api';

/**
 * PlantImage — letterbox photo display for plant/bouquet surfaces.
 * Never crops the photo. Shows the whole thing on a botanical-tinted background.
 *
 * Props:
 *   src         storage path or absolute URL (optional)
 *   alt         accessibility label
 *   tone        'plant' (default, leaf-tinted) | 'bouquet' (bloom-tinted) | 'paper' (neutral)
 *   className   extra classes for the OUTER container (sizing/aspect ratio)
 *   rounded     'sm' | 'md' (default) | 'lg' | 'none'
 *   testId      data-testid for the wrapper
 */
export default function PlantImage({
  src,
  alt = '',
  tone = 'plant',
  className = '',
  rounded = 'md',
  testId,
}) {
  const bg = tone === 'bouquet' ? 'bg-[#FDF5F8]' : tone === 'paper' ? 'bg-[#F5F0E8]' : 'bg-[#EAF3DE]';
  const radius =
    rounded === 'none' ? 'rounded-none' :
    rounded === 'sm'   ? 'rounded-[6px]' :
    rounded === 'lg'   ? 'rounded-[14px]' :
                          'rounded-[10px]';
  const url = src ? (src.startsWith('http') ? src : getFileUrl(src)) : null;
  return (
    <div
      data-testid={testId || 'plant-image'}
      className={`relative overflow-hidden flex items-center justify-center ${bg} ${radius} ${className}`}
    >
      {url ? (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className="max-w-full max-h-full w-auto h-auto object-contain"
        />
      ) : (
        <Leaf className="h-7 w-7 text-[#3B6D11] opacity-40" aria-hidden="true" />
      )}
    </div>
  );
}
