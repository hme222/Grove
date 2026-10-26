import React, { useMemo } from 'react';
import { getFileUrl } from '../lib/api';

// A plant's journal: photos as keepsake prints, notes as handwritten lines, first-time moments
// as larger cards, and routine care folded into one sentence per month.
// Props match the old timeline: `logs` (care logs + gallery photos), `plant`, `onOpenEntry`.

const VERB = {
  water: 'watered', top_up: 'topped up', change_water: 'changed the water', flush: 'flushed',
  mist: 'misted', feed: 'fed', add_nutrients: 'fed', prune: 'pruned', propagate: 'propagated', repot: 'repotted',
};
const TILTS = [-1.2, 0.9, -0.6, 1.1];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function when(iso) {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return w === 1 ? 'A week ago' : `${w} weeks ago`;
  }
  const opts = { month: 'short', day: 'numeric' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const opts = { month: 'long' };
  if (y !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-US', opts);
}

const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

function sentence(counts) {
  const parts = Object.entries(counts).map(([verb, n]) => `${verb} ${times(n)}`);
  if (!parts.length) return '';
  const body = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `You ${body}.`;
}

export function buildJournal(logs, plant) {
  const valid = (logs || []).filter((l) => l && l.logged_at && !Number.isNaN(new Date(l.logged_at).getTime()));
  const asc = [...valid].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));

  const firstPhoto = asc.find((l) => l.photo_url);
  const firstRepot = asc.find((l) => l.action === 'repot');
  const firstBloom = asc.find((l) => /bloom|flower/i.test(l.notes || ''));

  const items = [];
  const addedAt = plant?.created_at || asc[0]?.logged_at;
  if (addedAt && !Number.isNaN(new Date(addedAt).getTime())) {
    items.push({
      id: `added-${plant?.id || 'plant'}`, type: 'milestone', kicker: 'The beginning', title: 'Welcome home',
      subtitle: `${plant?.nickname || plant?.common_name || 'Your plant'} joined your collection.`,
      logged_at: addedAt, action: 'first_add',
    });
  }

  const tended = {}; // month key -> { verb: count }
  for (const l of asc) {
    const d = new Date(l.logged_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (l.photo_url) {
      items.push({
        id: l.id, type: 'photo', logged_at: l.logged_at, photo_url: l.photo_url, notes: l.notes || '',
        first: l === firstPhoto, action: l.action || 'photo',
      });
    } else if (l === firstBloom) {
      items.push({ id: l.id, type: 'milestone', kicker: 'A first', title: 'First bloom', subtitle: l.notes || 'A flower opened.', logged_at: l.logged_at, action: 'first_bloom', notes: l.notes || '' });
    } else if (l === firstRepot) {
      items.push({ id: l.id, type: 'milestone', kicker: 'A fresh start', title: 'A new home', subtitle: l.notes || 'Repotted into fresh soil.', logged_at: l.logged_at, action: 'repot', notes: l.notes || '' });
    } else if (l.notes) {
      items.push({ id: l.id, type: 'note', logged_at: l.logged_at, notes: l.notes, action: l.action, verb: VERB[l.action] });
    } else if (VERB[l.action]) {
      tended[key] = tended[key] || {};
      tended[key][VERB[l.action]] = (tended[key][VERB[l.action]] || 0) + 1;
    }
  }

  const byMonth = {};
  for (const it of items) {
    const d = new Date(it.logged_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    (byMonth[key] = byMonth[key] || []).push(it);
  }
  for (const key of Object.keys(tended)) byMonth[key] = byMonth[key] || [];

  return Object.keys(byMonth).sort().reverse().map((key) => ({
    key,
    label: monthLabel(key),
    summary: sentence(tended[key] || {}),
    items: byMonth[key].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at)),
  }));
}

function PhotoMemory({ item, plantName, index, onOpen }) {
  const tilt = TILTS[index % TILTS.length];
  const caption = item.notes || (item.first ? 'The first photo of the story.' : `A moment with ${plantName}`);
  return (
    <button type="button" onClick={() => onOpen(item)} className="group block w-full text-left" data-testid="journal-photo">
      <figure
        className="relative mx-auto max-w-print rounded-tag bg-grove-cream p-2.5 pb-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5 shadow-lift"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        {item.first && (
          <span className="absolute -top-2 left-3 z-raised rounded-full bg-grove-sun px-2.5 py-0.5 font-ui text-xs font-medium text-grove-root">
            First photo
          </span>
        )}
        <img
          src={getFileUrl(item.photo_url)}
          alt={item.notes ? item.notes : `${plantName}, ${when(item.logged_at).toLowerCase()}`}
          loading="lazy"
          className="aspect-[4/3] w-full rounded-hairline bg-grove-moss object-cover"
        />
        <figcaption className="px-1 pt-2.5">
          <p className="font-plant text-lead italic leading-snug text-grove-root">{caption}</p>
          <p className="mt-1 font-ui text-xs text-grove-root/80">{when(item.logged_at)}</p>
        </figcaption>
      </figure>
    </button>
  );
}

function Milestone({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="block w-full rounded-card border-hairline border-grove-sun/25 bg-gradient-to-br from-grove-canopy to-grove-moss p-5 text-left transition-colors duration-200 hover:border-grove-sun/80"
      data-testid="journal-milestone"
    >
      <p className="font-ui text-xs font-medium text-grove-sun">{item.kicker}</p>
      <p className="mt-0.5 font-plant text-base leading-tight text-grove-cream">{item.title}</p>
      <p className="mt-1 font-ui text-sm leading-snug text-grove-sage">{item.subtitle}</p>
      <p className="mt-2 font-ui text-xs text-grove-sage">{when(item.logged_at)}</p>
    </button>
  );
}

function NoteMemory({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="block w-full rounded-card border-l-accent border-grove-sun/80 bg-grove-canopy py-3 pl-4 pr-4 text-left"
      data-testid="journal-note"
    >
      <p className="font-plant text-base font-semibold italic leading-snug text-grove-cream">&ldquo;{item.notes}&rdquo;</p>
      <p className="mt-1.5 font-ui text-xs text-grove-sage">
        {item.verb ? `${item.verb[0].toUpperCase()}${item.verb.slice(1)} · ` : ''}{when(item.logged_at)}
      </p>
    </button>
  );
}

export default function MemoryJournal({ logs, plant, onOpenEntry }) {
  const months = useMemo(() => buildJournal(logs, plant), [logs, plant]);
  const plantName = plant?.nickname || plant?.common_name || 'your plant';
  const open = (item) => onOpenEntry && onOpenEntry({
    id: item.id, action: item.action, logged_at: item.logged_at, photo_url: item.photo_url,
    notes: item.notes, title: item.title, subtitle: item.subtitle,
  });

  if (!logs || logs.length === 0 || months.length === 0) {
    return (
      <div data-testid="timeline-empty" className="rounded-card border-hairline border-grove-moss bg-grove-canopy px-6 py-12 text-center">
        <p className="font-plant text-xl text-grove-cream">{plantName}&rsquo;s story starts here.</p>
        <p className="mx-auto mt-2 max-w-note font-ui text-sm leading-relaxed text-grove-sage">
          Add a photo or note, or log some care, and it will show up here like pages in a journal.
        </p>
      </div>
    );
  }

  let photoIndex = 0;
  return (
    <div data-testid="blooming-timeline" className="relative pl-6">
      <div aria-hidden="true" className="absolute bottom-2 left-2 top-3 w-px bg-gradient-to-b from-grove-fernLine via-grove-moss to-transparent" />
      {months.map((m) => (
        <section key={m.key} aria-labelledby={`journal-${m.key}`} className="relative pb-10">
          <span aria-hidden="true" className="absolute -left-6 top-2.5 h-2.5 w-2.5 rounded-full bg-grove-sun ring-4 ring-grove-forest" />
          <h2 id={`journal-${m.key}`} className="font-plant text-xl leading-none text-grove-cream">{m.label}</h2>
          {m.summary && <p className="mt-2 font-ui text-sm leading-relaxed text-grove-sage">{m.summary}</p>}
          <ul className={m.items.length ? 'mt-5 space-y-6' : 'hidden'}>
            {m.items.map((it) => (
              <li key={it.id}>
                {it.type === 'photo' && <PhotoMemory item={it} plantName={plantName} index={photoIndex++} onOpen={open} />}
                {it.type === 'milestone' && <Milestone item={it} onOpen={open} />}
                {it.type === 'note' && <NoteMemory item={it} onOpen={open} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
