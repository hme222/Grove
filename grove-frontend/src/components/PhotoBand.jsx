import React, { useState } from 'react';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aspectRatios } from '@/styles/tokens.generated';

// A decorative photo with a fixed shape. The box reserves its aspect ratio before the picture loads
// (no layout shift), the picture fills it with object-cover, and if the file is missing or fails it
// becomes the same moss tile with a leaf that ThumbStrip uses. Photos here are decoration: the words
// beside them carry the meaning, so `alt` defaults to '' and the box is hidden from screen readers
// unless an alt is given. `src` is a path under /photos (self-hosted; see src/lib/photoCredits.js).
//
// aspect  'wide' 2:1 (bands and heroes), 'square' 1:1, 'thumb' 1:1 sized by its class (rows).
// overlay adds a dark gradient scrim at the bottom for text laid over the photo; the scrim is solid
//         Night at the bottom edge, so put the text there. Text under or beside a photo needs none.
// fit     'cover' (default, photographs) or 'contain' (species ILLUSTRATIONS and plates that must not be
//         cropped; the moss tile shows as the letterbox fill).
// ratio   optional NAME of an aspect-ratio token (design/tokens.json aspectRatio: wide 2:1, band 5:2,
//         short 3:1, photo 4:3, portrait 4:5, tall 5:4, square 1:1) to override `aspect`. A raw '5 / 2' string is
//         refused (it throws outside production) so every photo shape traces back to a token.
const RATIOS = { wide: aspectRatios.wide, square: aspectRatios.square, thumb: aspectRatios.square };
const RADIUS = { wide: 'rounded-card', square: 'rounded-chip', thumb: 'rounded-chip' };

export const photoSrc = (path) => (/^(?:https?:)?\/\/|^data:|^blob:/.test(path) ? path : `${process.env.PUBLIC_URL || ''}${path}`);

export default function PhotoBand({ src, alt = '', aspect = 'wide', overlay = false, ratio, position, fit = 'cover', eager = false, onFail, className, children, testId = 'photo-band' }) {
  const [failed, setFailed] = useState(false);
  if (ratio !== undefined && !Object.prototype.hasOwnProperty.call(aspectRatios, ratio) && process.env.NODE_ENV !== 'production') {
    throw new Error(`PhotoBand: unknown ratio "${ratio}". Use one of: ${Object.keys(aspectRatios).join(', ')}.`);
  }
  const decorative = !alt;
  return (
    <div
      aria-hidden={decorative ? 'true' : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : alt}
      style={{ aspectRatio: (ratio && aspectRatios[ratio]) || RATIOS[aspect] || RATIOS.wide }}
      className={cn('relative w-full shrink-0 overflow-hidden bg-grove-moss', RADIUS[aspect] || RADIUS.wide, className)}
      data-testid={testId}
      data-photo={src}
    >
      {failed || !src ? (
        <div className="flex h-full w-full items-center justify-center text-grove-sprout" data-testid="photo-fallback">
          <Leaf className={aspect === 'thumb' ? 'h-4 w-4' : 'h-8 w-8'} />
        </div>
      ) : (
        <img
          src={photoSrc(src)}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => { setFailed(true); if (onFail) onFail(); }}
          style={position ? { objectPosition: position } : undefined}
          className={fit === 'contain' ? 'h-full w-full object-contain' : 'h-full w-full object-cover'}
        />
      )}
      {overlay && !failed && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-grove-night via-grove-night/80 to-transparent px-4 pb-3 pt-10" data-testid="photo-overlay">
          {children}
        </div>
      )}
    </div>
  );
}
