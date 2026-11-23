import React from 'react';
import { Button } from './ui/button';

const disabledClass = 'disabled:border-grove-moss disabled:text-grove-lichen disabled:opacity-100';

// Previous / "1 to 5 of 100" / Next, for a list shown a few rows at a time so the page itself does not scroll.
// `page` is 1-based. Nothing is drawn when everything fits on one page. The count is read out as a status, so a
// screen reader hears where it is after pressing Next.
export default function Pager({ page, pageSize, total, onPage, label = 'Pages', testId = 'pager' }) {
  if (!total || total <= pageSize) return null;
  const pages = Math.ceil(total / pageSize);
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-2 pt-1" data-testid={testId}>
      <Button type="button" variant="outline" onClick={() => onPage(page - 1)} disabled={page <= 1} data-testid={`${testId}-prev`} className={disabledClass}>
        Previous
      </Button>
      <span role="status" className="min-w-0 text-center font-ui text-sm text-grove-cream" data-testid={`${testId}-count`}>
        {first} to {last} of {total}
      </span>
      <Button type="button" variant="outline" onClick={() => onPage(page + 1)} disabled={page >= pages} data-testid={`${testId}-next`} className={disabledClass}>
        Next
      </Button>
    </nav>
  );
}
