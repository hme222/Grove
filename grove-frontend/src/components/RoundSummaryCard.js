import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonAPI } from '../lib/api';
import { lessonPath } from '../lessons/lessonMeta';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';

const DAY_MS = 24 * 60 * 60 * 1000;

// "Pothos", "Pothos and Fern", "Pothos, Fern and Monstera", and past five "Pothos, Fern, Ivy, Rose, Aloe and 3 more".
export function joinNames(names) {
  const shown = names.slice(0, 5);
  const extra = names.length - shown.length;
  const parts = extra > 0 ? [...shown, `${extra} more`] : shown;
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

// The plant due soonest after now, from the plants' own next_water_due dates. Returns null when no plant has one.
export function nextUp(plants, now = Date.now()) {
  const future = (plants || [])
    .map((p) => ({ p, t: p.next_water_due ? new Date(p.next_water_due).getTime() : NaN }))
    .filter(({ t }) => !Number.isNaN(t) && t > now)
    .sort((a, b) => a.t - b.t);
  if (future.length === 0) return null;
  const { p, t } = future[0];
  const when = new Date(t);
  const sameDay = when.toDateString() === new Date(now).toDateString();
  let day;
  if (sameDay) day = 'later today';
  else {
    day = when.toLocaleDateString(undefined, { weekday: 'long' });
    if (t - now > 6 * DAY_MS) day += ` ${when.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
  }
  return { name: p.nickname || p.common_name || 'Your next plant', day };
}

function closing(count) {
  if (count === 1) return 'A small round counts.';
  if (count < 5) return 'That is today’s round.';
  return 'A full round. Your plants are set.';
}

// Calm end-of-round card on Today: what was tended, what is next, one optional lesson, a Done.
// No points, no confetti. It is not the first-care celebration.
export default function RoundSummaryCard({ names, plants, onDone }) {
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const [lessonTo, setLessonTo] = useState('/lessons');
  const next = nextUp(plants);

  useEffect(() => {
    if (headingRef.current) headingRef.current.focus();
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => lessonAPI.queue())
      .then((res) => {
        const id = res?.data?.queue?.[0];
        if (alive && id) setLessonTo(lessonPath(id));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const count = names.length;
  return (
    <section
      aria-labelledby="round-summary-title"
      data-testid="round-summary"
      className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5"
    >
      <h2
        id="round-summary-title"
        ref={headingRef}
        tabIndex={-1}
        className="font-plant text-xl font-semibold text-grove-cream focus:outline-none"
        data-testid="round-summary-title"
      >
        {count} {count === 1 ? 'plant' : 'plants'} tended.
      </h2>
      <p className="mt-1 font-ui text-sm text-grove-cream" data-testid="round-summary-names">{joinNames(names)}.</p>
      <p className="mt-1 font-ui text-sm text-grove-sage">{closing(count)}</p>
      {next && (
        <p className="mt-3 font-ui text-sm text-grove-cream" data-testid="round-summary-next">
          Next up: {next.name}, {next.day}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onDone} className={cn(buttonVariants(), 'flex')} data-testid="round-summary-done">
          Done
        </button>
        <button
          type="button"
          onClick={() => navigate(lessonTo)}
          className="inline-flex min-h-touch items-center px-2 font-ui text-sm text-grove-cream underline underline-offset-4"
          data-testid="round-summary-lesson"
        >
          Do a one-minute lesson
        </button>
      </div>
    </section>
  );
}
