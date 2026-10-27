import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Leaf, Pencil, Star, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { getFileUrl } from '../lib/api';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import ThumbStrip from './ThumbStrip';
import ConfirmDialog from './ConfirmDialog';

// A paged viewer for a plant's own photos. Photos are shown oldest to newest so the thumbnail strip
// reads as the plant growing; the one that was tapped is the one that opens. Swipe, the Previous
// and Next buttons, the arrow keys, Home and End all page; the strip jumps straight to a photo.
// A photo is `{ id, path, taken_at, caption, title }`. Pass `onEdit`, `onSetCover` and/or `onDelete` to show a
// footer row of photo actions for a photo (`canAct(photo)` can switch them off per photo).

const SWIPE_PX = 48;
const reducedMotion = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const time = (p) => {
  const t = p && p.taken_at ? new Date(p.taken_at).getTime() : NaN;
  return Number.isNaN(t) ? Infinity : t;
};

// Oldest first; photos with no date go last, and ties keep the order they came in.
export function sortPhotos(photos) {
  return (photos || [])
    .filter((p) => p && p.path)
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (time(a.p) === time(b.p) ? a.i - b.i : time(a.p) < time(b.p) ? -1 : 1))
    .map(({ p }) => p);
}

const dateLabel = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { dateStyle: 'medium' });
};

function Stage({ photo, failed, onFail, alt, dir }) {
  const motion = dir && !reducedMotion()
    ? cn('motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200', dir > 0 ? 'motion-safe:slide-in-from-right-8' : 'motion-safe:slide-in-from-left-8')
    : '';
  if (failed) {
    return (
      <div key={photo.id} className={cn('flex flex-col items-center gap-2 text-grove-sage', motion)} data-testid="photo-viewer-fallback">
        <span className="flex h-24 w-24 items-center justify-center rounded-card bg-grove-moss text-grove-sprout" aria-hidden="true"><Leaf className="h-8 w-8" /></span>
        <span className="font-ui text-sm">This photo couldn’t load.</span>
      </div>
    );
  }
  return (
    <img
      key={photo.id}
      src={getFileUrl(photo.path)}
      alt={alt}
      onError={onFail}
      draggable={false}
      data-testid="photo-viewer-image"
      className={cn('max-h-full max-w-full select-none object-contain', motion)}
    />
  );
}

export default function PhotoViewer({ open, onOpenChange, photos, startId, plantName = 'your plant', onEdit, onDelete, onSetCover, canAct }) {
  const sorted = useMemo(() => sortPhotos(photos), [photos]);
  const [currentId, setCurrentId] = useState(startId);
  const [dir, setDir] = useState(0);
  const [failed, setFailed] = useState({});
  const [confirming, setConfirming] = useState(false);
  const contentRef = useRef(null);
  const swipe = useRef(null);
  const opener = useRef(null);

  // Each time it opens, start at the photo that was tapped.
  useEffect(() => { if (open) { setCurrentId(startId); setDir(0); setConfirming(false); } }, [open, startId]);

  const total = sorted.length;
  const found = sorted.findIndex((p) => p.id === currentId);
  const index = found >= 0 ? found : 0;
  const photo = sorted[index];

  const go = useCallback((i) => {
    if (total === 0) return;
    const next = Math.min(total - 1, Math.max(0, i));
    if (next === index) return;
    setDir(next > index ? 1 : -1);
    setCurrentId(sorted[next].id);
  }, [index, sorted, total]);

  // Warm the neighbors so paging does not wait on the network.
  useEffect(() => {
    if (!open || typeof Image === 'undefined') return;
    [index - 1, index + 1].forEach((i) => { if (sorted[i]) { const img = new Image(); img.src = getFileUrl(sorted[i].path); } });
  }, [open, index, sorted]);

  const onKeyDown = (e) => {
    if (confirming || e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(total - 1); }
  };

  const onPointerDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  if (total === 0 || !photo) return null;

  const when = dateLabel(photo.taken_at);
  const status = `Photo ${index + 1} of ${total}`;
  // The date and caption are printed under the photo, so the picture itself is decorative (an alt that
  // repeated the caption would be read twice). With nothing printed, the alt carries the plant name.
  const printed = !!(photo.title || when || photo.caption);
  const alt = printed ? '' : plantName;
  const items = sorted.map((p, i) => ({
    id: p.id,
    src: getFileUrl(p.path),
    label: `Show photo ${i + 1} of ${total}${dateLabel(p.taken_at) ? `, ${dateLabel(p.taken_at)}` : ''}`,
  }));
  const showActions = (onEdit || onDelete || onSetCover) && (!canAct || canAct(photo));
  const navBtn = 'absolute top-1/2 z-raised flex h-touch w-touch -translate-y-1/2 items-center justify-center rounded-round bg-grove-forest/80 text-grove-cream hover:bg-grove-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-cream aria-disabled:opacity-40';

  const confirmDelete = () => {
    const neighbor = sorted[index + 1] || sorted[index - 1];
    setConfirming(false);
    if (neighbor) setCurrentId(neighbor.id);
    onDelete(photo);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          ref={contentRef}
          data-testid="photo-viewer"
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          onOpenAutoFocus={(e) => {
            // The dialog has no Trigger, so Radix cannot return focus; remember who had it.
            opener.current = document.activeElement;
            e.preventDefault();
            if (contentRef.current) contentRef.current.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            const el = opener.current;
            if (el && el.isConnected && typeof el.focus === 'function') el.focus();
          }}
          className="left-1/2 top-0 flex h-dvh max-h-screen w-full -translate-y-0 max-w-column flex-col gap-0 overflow-hidden rounded-none border-0 bg-grove-root p-0 focus:outline-none motion-reduce:animate-none"
        >
          <DialogTitle className="sr-only">Photos of {plantName}</DialogTitle>
          <p aria-live="polite" data-testid="photo-viewer-status" className="flex min-h-touch shrink-0 items-center px-4 pr-16 pt-3 font-ui text-sm text-grove-cream">{status}</p>

          <div
            className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center bg-grove-forest"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => { swipe.current = null; }}
            data-testid="photo-viewer-stage"
          >
            <Stage photo={photo} alt={alt} dir={dir} failed={!!failed[photo.id]} onFail={() => setFailed((f) => ({ ...f, [photo.id]: true }))} />
            {total > 1 && (
              <>
                <button type="button" aria-label="Previous photo" aria-disabled={index === 0 ? 'true' : undefined} onClick={() => go(index - 1)} data-testid="photo-viewer-prev" className={cn(navBtn, 'left-2')}>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Next photo" aria-disabled={index === total - 1 ? 'true' : undefined} onClick={() => go(index + 1)} data-testid="photo-viewer-next" className={cn(navBtn, 'right-2')}>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          <div className="shrink-0 space-y-1 px-4 pt-3" data-testid="photo-viewer-info">
            {photo.title && <p className="font-plant text-lg leading-tight text-grove-cream">{photo.title}</p>}
            {when && <p className="font-ui text-sm text-grove-sage">{when}</p>}
            {photo.caption && <p className="font-plant text-base italic leading-snug text-grove-cream" data-testid="photo-viewer-caption">&ldquo;{photo.caption}&rdquo;</p>}
          </div>

          {showActions && (
            <div className="flex shrink-0 flex-wrap gap-2 px-4 pt-3" data-testid="photo-viewer-actions">
              {onEdit && (
                <button type="button" onClick={() => onEdit(photo)} data-testid="photo-viewer-edit" className={cn(buttonVariants({ variant: 'outline' }), 'flex gap-1.5')}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />Edit photo
                </button>
              )}
              {onSetCover && !photo.is_cover && (
                <button type="button" onClick={() => onSetCover(photo)} data-testid="photo-viewer-setcover" className={cn(buttonVariants({ variant: 'outline' }), 'flex gap-1.5')}>
                  <Star className="h-4 w-4" aria-hidden="true" />Set as cover
                </button>
              )}
              {onDelete && (
                <button type="button" onClick={() => setConfirming(true)} data-testid="photo-viewer-delete" className={cn(buttonVariants({ variant: 'outline' }), 'flex gap-1.5')}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />Delete photo
                </button>
              )}
            </div>
          )}

          {total > 1 && (
            <ThumbStrip
              items={items}
              activeIndex={index}
              onSelect={go}
              variant="dark"
              size="lg"
              label="Choose a photo"
              testId="photo-viewer-strip"
              announce={false}
              className="shrink-0 px-4 py-3 pb-4"
            />
          )}
        </DialogContent>
      </Dialog>
      {onDelete && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title="Delete this photo?"
          description="The photo is removed from this plant's journal. This can't be undone."
          confirmLabel="Delete photo"
          testId="photo-viewer-delete-confirm"
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
