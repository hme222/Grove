import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buttonVariants } from '@/components/ui/button';
import ThumbStrip from '@/components/ThumbStrip';
import { cn } from '@/lib/utils';
import {
  availableKinds, buildCardSvg, cardAlt, cardFileName, cardSize, loadFontCss, photoDataUrl, shareStats, svgToPngBlob,
} from '@/lib/shareCards';

// Share a plant: pick one of the cards, then copy it, save it, or send it with the phone's share sheet.
// The sticker is a transparent PNG cropped tight, so it pastes into an Instagram story as a sticker you can move and resize.
// Only the plant's name, species, days together, waterings, care this week and new leaf are drawn. No email, username or place.

const CHECKER = {
  backgroundImage: 'repeating-conic-gradient(var(--grove-moss) 0 25%, var(--grove-canopy) 0 50%)',
  backgroundSize: '24px 24px',
};

const svgUrl = (svg) => URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));

export default function ShareCardSheet({ open, onClose, plant, logs, photoSrc, initialKind = null, leafAt = null }) {
  const stats = useMemo(() => shareStats(plant, logs, new Date(), { leafAt }), [plant, logs, leafAt]);
  const kinds = useMemo(() => availableKinds(stats), [stats]);
  const [index, setIndex] = useState(0);
  const startedAt = useRef(null);
  const [assets, setAssets] = useState({ fontCss: '', photo: '', ready: false });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const titleRef = useRef(null);

  // Fonts and the plant photo are inlined so the picture looks the same wherever it is pasted. If either cannot be
  // loaded (offline), the card still draws, with a fallback font or a leaf.
  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    setAssets((a) => ({ ...a, ready: false }));
    Promise.all([loadFontCss(), photoDataUrl(photoSrc)]).then(([fontCss, photo]) => {
      if (live) setAssets({ fontCss, photo, ready: true });
    });
    return () => { live = false; };
  }, [open, photoSrc]);

  const svgs = useMemo(
    () => kinds.map((k) => buildCardSvg(k.id, stats, { fontCss: assets.fontCss, photo: assets.photo })),
    [kinds, stats, assets],
  );
  const urls = useMemo(() => svgs.map(svgUrl), [svgs]);
  const thumbUrls = useMemo(
    () => kinds.map((k) => (k.id === 'sticker' ? svgUrl(buildCardSvg(k.id, stats, { fontCss: assets.fontCss, thumb: true })) : null)),
    [kinds, stats, assets],
  );
  useEffect(() => () => { urls.forEach((u) => URL.revokeObjectURL(u)); thumbUrls.forEach((u) => u && URL.revokeObjectURL(u)); }, [urls, thumbUrls]);

  // Opened from a journal milestone: start on that card (the new-leaf card for a new leaf).
  useEffect(() => {
    if (!open) { startedAt.current = null; return; }
    if (startedAt.current === initialKind) return;
    startedAt.current = initialKind;
    const at = kinds.findIndex((k) => k.id === initialKind);
    setIndex(at >= 0 ? at : 0);
  }, [open, initialKind, kinds]);

  const safeIndex = Math.min(index, kinds.length - 1);
  const kind = kinds[safeIndex];
  const items = kinds.map((k, i) => ({ id: k.id, label: `${k.label} card`, src: thumbUrls[i] || urls[i], short: k.label }));

  const makePng = () => svgToPngBlob(svgs[safeIndex], cardSize(kind.id));
  const canCopy = typeof navigator !== 'undefined' && !!navigator.clipboard && typeof window !== 'undefined' && typeof window.ClipboardItem === 'function';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && typeof File === 'function';

  const run = async (label, fn) => {
    setBusy(true);
    setStatus('');
    try {
      const msg = await fn();
      if (msg) setStatus(msg);
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      const msg = `Could not ${label}. Try Save image instead.`;
      setStatus(msg);
    } finally {
      setBusy(false);
    }
  };

  const copy = () => run('copy the image', async () => {
    const blob = await makePng();
    await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
    return kind.transparent ? 'Copied. Paste it onto your story as a sticker.' : 'Copied. Paste it into a story or message.';
  });

  const save = () => run('save the image', async () => {
    const blob = await makePng();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = cardFileName(stats, kind.id);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'Saved to your downloads.';
  });

  const share = () => run('open sharing', async () => {
    const blob = await makePng();
    const file = new File([blob], cardFileName(stats, kind.id), { type: 'image/png' });
    if (!navigator.canShare({ files: [file] })) throw new Error('unsupported');
    await navigator.share({ files: [file], title: `${stats.name} on FloraGrove` });
    return '';
  });

  const actionClass = cn(buttonVariants({ variant: 'outline' }), 'flex min-h-touch flex-1 basis-32 gap-2');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="flex max-h-viewport max-w-dialog flex-col overflow-y-auto [&>*]:shrink-0" data-testid="share-sheet"
        onOpenAutoFocus={(e) => { e.preventDefault(); titleRef.current?.focus(); }}>
        <DialogHeader>
          <DialogTitle ref={titleRef} tabIndex={-1} className="font-plant text-xl text-grove-cream focus:outline-none">
            Share {stats.name}
          </DialogTitle>
          <DialogDescription className="font-ui text-sm text-grove-sage">
            Pick a card. It shows only {stats.name}&rsquo;s name and care, never your email or username.
          </DialogDescription>
        </DialogHeader>

        {!assets.ready ? (
          <p className="py-12 text-center font-ui text-sm text-grove-sage" role="status" data-testid="share-loading">Getting your cards ready…</p>
        ) : (
          <>
            <div
              className="mx-auto flex max-h-panel w-full items-center justify-center overflow-hidden rounded-card p-3"
              style={kind.transparent ? CHECKER : { background: 'var(--grove-canopy)' }}
              data-testid="share-preview"
            >
              <img src={urls[safeIndex]} alt={cardAlt(kind.id, stats)} className={cn('block max-h-panel w-auto max-w-full', kind.transparent ? '' : 'h-full')} />
            </div>
            {kind.transparent && (
              <p className="font-ui text-sm text-grove-sage" data-testid="share-transparent-note">
                Transparent background. Copy it, then paste it onto your own photo as a story sticker.
              </p>
            )}
            <ThumbStrip
              items={items}
              activeIndex={safeIndex}
              onSelect={setIndex}
              label="Choose a card"
              testId="share-cards"
              className="-mx-3"
            />
            <div className="flex flex-wrap gap-2">
              {canShare && (
                <button type="button" onClick={share} disabled={busy} className={cn(buttonVariants(), 'flex min-h-touch flex-1 basis-32 gap-2')} data-testid="share-native">
                  <Share2 className="h-4 w-4" aria-hidden="true" /> Share
                </button>
              )}
              {canCopy && (
                <button type="button" onClick={copy} disabled={busy} className={actionClass} data-testid="share-copy">
                  <Copy className="h-4 w-4" aria-hidden="true" /> Copy image
                </button>
              )}
              <button type="button" onClick={save} disabled={busy} className={actionClass} data-testid="share-save">
                <Download className="h-4 w-4" aria-hidden="true" /> Save image
              </button>
            </div>
            <p className="min-h-5 font-ui text-sm text-grove-sage" role="status" aria-live="polite" data-testid="share-status">{status}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
