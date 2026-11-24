import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

// One page at a time, with dots, Previous and Next, and a sideways swipe. Used where a screen would otherwise scroll.
// Only the current page is in the document, so a screen reader reads one page; the position is read out as a status.
// `pages` is [{ key, label, node }]. The label names the page for the Previous / Next buttons and the status line.
export default function SwipePages({ pages, label = 'Pages', testId = 'swipe-pages' }) {
  const [i, setI] = useState(0);
  const start = useRef(null);
  if (!pages.length) return null;
  const go = (n) => setI(Math.min(pages.length - 1, Math.max(0, n)));
  const onTouchStart = (e) => { start.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (start.current == null) return;
    const dx = e.changedTouches[0].clientX - start.current;
    start.current = null;
    if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
  };
  const page = pages[i];
  return (
    <section aria-label={label} data-testid={testId} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div key={page.key} data-testid={`${testId}-page`}>{page.node}</div>
      {pages.length > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => go(i - 1)} disabled={i === 0} aria-label={`Previous: ${pages[Math.max(0, i - 1)].label}`} data-testid={`${testId}-prev`} className="disabled:opacity-40">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5" aria-hidden="true">
              {pages.map((p, n) => (
                <span key={p.key} className={n === i ? 'h-2 w-6 rounded-pill bg-grove-lime' : 'h-2 w-2 rounded-pill bg-grove-fernLine'} />
              ))}
            </div>
            <span role="status" className="font-ui text-sm text-grove-cream" data-testid={`${testId}-status`}>{page.label}, {i + 1} of {pages.length}</span>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => go(i + 1)} disabled={i === pages.length - 1} aria-label={`Next: ${pages[Math.min(pages.length - 1, i + 1)].label}`} data-testid={`${testId}-next`} className="disabled:opacity-40">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      )}
    </section>
  );
}
