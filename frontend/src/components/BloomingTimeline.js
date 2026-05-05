import React, { useMemo, useRef, useEffect } from 'react';
import { getFileUrl } from '../lib/api';
import {
  Droplets, Leaf, Camera, Scissors, Sprout, Sparkles, Flame, Wind,
  Zap, FileText, Flower2, HandPlatter,
} from 'lucide-react';

// ---- Visual tokens per action type ----
const ACTION_META = {
  water:          { icon: Droplets,   color: '#5DCAA5', label: 'Watered',          node: 'teardrop' },
  mist:           { icon: Wind,       color: '#9FE1CB', label: 'Misted',           node: 'teardrop' },
  feed:           { icon: Zap,        color: '#3B6D11', label: 'Fed',              node: 'leaf' },
  repot:          { icon: HandPlatter,color: '#854F0B', label: 'Repotted',         node: 'root' },
  prune:          { icon: Scissors,   color: '#97C459', label: 'Pruned',           node: 'leaf' },
  propagate:      { icon: Sprout,     color: '#5DCAA5', label: 'Propagated',       node: 'leaf' },
  photo:          { icon: Camera,     color: '#9FE1CB', label: 'Photo logged',     node: 'camera' },
  note:           { icon: FileText,   color: '#C0DD97', label: 'Note added',       node: 'leaf' },
  top_up:         { icon: Droplets,   color: '#9FE1CB', label: 'Topped up',        node: 'teardrop' },
  change_water:   { icon: Droplets,   color: '#5DCAA5', label: 'Water changed',    node: 'teardrop' },
  flush:          { icon: Droplets,   color: '#5DCAA5', label: 'Flushed',          node: 'teardrop' },
  add_nutrients:  { icon: Zap,        color: '#3B6D11', label: 'Nutrients added',  node: 'leaf' },
  first_add:      { icon: Sprout,     color: '#C0DD97', label: 'Added to collection', node: 'milestone' },
  first_bloom:    { icon: Flower2,    color: '#D4537E', label: 'First bloom',      node: 'bloom' },
  streak_milestone:{icon: Flame,      color: '#EAF3DE', label: 'Streak milestone', node: 'milestone' },
  health_up:      { icon: Sparkles,   color: '#EF9F27', label: 'Health improved',  node: 'milestone' },
};

function meta(action) {
  return ACTION_META[action] || { icon: Leaf, color: '#C0DD97', label: action, node: 'leaf' };
}

// ---- Botanical SVG node primitives ----
// Each receives (cx, cy, color, key) and returns an SVG group.

function NodeTeardrop({ cx, cy, color, k }) {
  // small leaf-droplet shape
  return (
    <g key={k} transform={`translate(${cx} ${cy})`}>
      <path d="M 0 -6 C 4 -2, 4 2, 0 6 C -4 2, -4 -2, 0 -6 Z" fill={color} opacity="0.95" />
      <path d="M -1.6 -3 C -0.6 -2, -0.6 0, -1.6 1.5" stroke="#FDFAF6" strokeWidth="0.6" fill="none" opacity="0.7" />
    </g>
  );
}

function NodeLeaf({ cx, cy, color, k }) {
  return (
    <g key={k} transform={`translate(${cx} ${cy}) rotate(-22)`}>
      <path d="M 0 -7 C 6 -3, 6 4, 0 7 C -6 4, -6 -3, 0 -7 Z" fill={color} opacity="0.95" />
      <path d="M 0 -6 L 0 6" stroke="#1C2E10" strokeWidth="0.5" opacity="0.45" />
    </g>
  );
}

function NodeRoot({ cx, cy, color, k }) {
  // small earthy node with 3 root tendrils
  return (
    <g key={k} transform={`translate(${cx} ${cy})`}>
      <circle r="4.5" fill={color} opacity="0.95" />
      <path d="M -3 3 q -2 4, -4 5" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 0 4 q 0 4, 0 6" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 3 3 q 2 4, 4 5" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function NodeBloom({ cx, cy, color, k }) {
  // 5-petal flower
  const petals = [0, 72, 144, 216, 288];
  return (
    <g key={k} transform={`translate(${cx} ${cy})`}>
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="0" cy="-4"
          rx="2.3" ry="3.4"
          fill={color}
          opacity="0.92"
          transform={`rotate(${deg})`}
        />
      ))}
      <circle r="1.8" fill="#F2E6CE" />
    </g>
  );
}

function NodeCamera({ cx, cy, color, k }) {
  return (
    <g key={k} transform={`translate(${cx} ${cy})`}>
      <rect x="-5" y="-3.5" width="10" height="7" rx="1.4" fill={color} opacity="0.95" />
      <circle cx="0" cy="0.2" r="2.1" fill="#1C2E10" />
      <circle cx="0" cy="0.2" r="1.0" fill="#9FE1CB" />
      <rect x="2" y="-4.6" width="3" height="1.4" rx="0.4" fill={color} opacity="0.95" />
    </g>
  );
}

function NodeMilestone({ cx, cy, color, k }) {
  // ringed sun: outer ring + inner dot — used for first_add, streak, health_up
  return (
    <g key={k} transform={`translate(${cx} ${cy})`}>
      <circle r="7" fill="none" stroke={color} strokeWidth="1.4" opacity="0.65" />
      <circle r="3.4" fill={color} opacity="0.95" />
    </g>
  );
}

function ActionNode({ kind, cx, cy, color, k }) {
  switch (kind) {
    case 'teardrop':  return <NodeTeardrop  cx={cx} cy={cy} color={color} k={k} />;
    case 'leaf':      return <NodeLeaf      cx={cx} cy={cy} color={color} k={k} />;
    case 'root':      return <NodeRoot      cx={cx} cy={cy} color={color} k={k} />;
    case 'bloom':     return <NodeBloom     cx={cx} cy={cy} color={color} k={k} />;
    case 'camera':    return <NodeCamera    cx={cx} cy={cy} color={color} k={k} />;
    case 'milestone': return <NodeMilestone cx={cx} cy={cy} color={color} k={k} />;
    default:          return <NodeLeaf      cx={cx} cy={cy} color={color} k={k} />;
  }
}

// ---- Scroll-in animation via IntersectionObserver ----
function useReveal(ref) {
  useEffect(() => {
    if (!ref.current) return;
    const nodes = ref.current.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.setAttribute('data-revealed', 'true');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [ref]);
}

// Build an array of timeline entries: synthesize milestones + time-labels + stops.
function buildEntries(logs, plant) {
  const sorted = [...logs].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
  const entries = [];

  const addedIso = plant?.created_at || (sorted[0] && sorted[0].logged_at);
  if (addedIso) {
    entries.push({
      id: `added-${plant?.id}`,
      kind: 'milestone',
      milestone: 'first_add',
      action: 'first_add',
      logged_at: addedIso,
      title: 'Added to collection',
      subtitle: plant?.nickname || plant?.common_name || 'Your plant',
    });
  }

  let firstPhotoId = null;
  let firstRepotId = null;
  let firstBloomId = null;
  for (const l of sorted) {
    if (!firstPhotoId && l.action === 'photo') firstPhotoId = l.id;
    if (!firstRepotId && l.action === 'repot') firstRepotId = l.id;
    const note = (l.notes || '').toLowerCase();
    if (!firstBloomId && (note.includes('bloom') || note.includes('flower'))) firstBloomId = l.id;
  }

  for (const l of sorted) {
    if (l.id === firstPhotoId && l.photo_url) {
      entries.push({
        id: `ms-photo-${l.id}`,
        kind: 'milestone',
        milestone: 'first_photo',
        action: 'photo',
        logged_at: l.logged_at,
        title: 'First photo',
        subtitle: 'Day one of the record',
        photo_url: l.photo_url,
      });
    }
    if (l.id === firstRepotId) {
      entries.push({
        id: `ms-repot-${l.id}`,
        kind: 'milestone',
        milestone: 'repot',
        action: 'repot',
        logged_at: l.logged_at,
        title: 'New home',
        subtitle: 'Repotted',
      });
    }
    if (l.id === firstBloomId) {
      entries.push({
        id: `ms-bloom-${l.id}`,
        kind: 'milestone',
        milestone: 'first_bloom',
        action: 'first_bloom',
        logged_at: l.logged_at,
        title: 'First bloom',
        subtitle: 'A flower opened',
      });
    }
    entries.push({
      id: l.id,
      kind: 'entry',
      action: l.action,
      logged_at: l.logged_at,
      notes: l.notes,
      photo_url: l.photo_url,
    });
  }

  entries.sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));

  const result = [];
  let lastMonthKey = null;
  for (const e of entries) {
    const d = new Date(e.logged_at);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthKey !== lastMonthKey) {
      result.push({
        id: `month-${monthKey}`,
        kind: 'month',
        logged_at: e.logged_at,
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });
      lastMonthKey = monthKey;
    }
    result.push(e);
  }
  return result;
}

const MIN_HEIGHT = 700;
const PX_PER_DAY = 16;
const PAD_TOP = 120;
const PAD_BOTTOM = 80;

function computeLayout(items) {
  if (!items.length) return { height: MIN_HEIGHT, positions: {} };
  const firstTs = new Date(items[0].logged_at).getTime();
  const lastTs = new Date(items[items.length - 1].logged_at).getTime();
  const spanDays = Math.max(1, (lastTs - firstTs) / (1000 * 60 * 60 * 24));
  const contentHeight = Math.max(MIN_HEIGHT - PAD_TOP - PAD_BOTTOM, spanDays * PX_PER_DAY);
  const totalHeight = contentHeight + PAD_TOP + PAD_BOTTOM;

  const positions = {};
  for (const it of items) {
    const ts = new Date(it.logged_at).getTime();
    const progress = spanDays === 0 ? 0 : ((ts - firstTs) / (lastTs - firstTs));
    const y = PAD_TOP + (1 - progress) * contentHeight;
    positions[it.id] = y;
  }
  return { height: totalHeight, positions };
}

const STEM_AMPL = 18;

function buildStemPath(items, positions) {
  const nonMonth = items.filter((i) => i.kind !== 'month');
  if (nonMonth.length === 0) return { path: '', points: [] };
  const points = nonMonth
    .map((it, i) => ({
      id: it.id,
      x: i % 2 === 0 ? -STEM_AMPL : STEM_AMPL,
      y: positions[it.id],
      kind: it.kind,
      action: it.action,
    }))
    .sort((a, b) => a.y - b.y); // top to bottom
  if (!points.length) return { path: '', points: [] };

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }
  return { path: d, points };
}

// ---- Entry card ----
function EntryCard({ item, side, onClick }) {
  const m = meta(item.action);
  const Icon = m.icon;
  const hasPhoto = !!item.photo_url;
  const widthClass = hasPhoto ? 'w-[200px]' : 'w-[160px]';
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="timeline-entry-card"
      data-action={item.action}
      data-reveal
      className={`absolute ${widthClass} text-left rounded-[12px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] p-2.5 transition-all duration-300 ease-out opacity-0 translate-y-2 data-[revealed=true]:opacity-100 data-[revealed=true]:translate-y-0 hover:border-[#3B6D11]`}
      style={{
        top: item._y - 14,
        [side]: `calc(50% + 28px)`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full"
          style={{ background: `${m.color}33` }}
        >
          <Icon className="h-3 w-3" style={{ color: m.color }} />
        </span>
        <span className="font-plant text-[12px] text-[#1C2E10] truncate">{m.label}</span>
      </div>
      <p className="font-latin text-[10px] text-[#888780]">
        {new Date(item.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        <span className="px-1 text-[#D3C9B8]">·</span>
        {new Date(item.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </p>
      {item.notes && (
        <p className="italic font-ui text-[11px] text-[#5F5E5A] mt-1 line-clamp-3">"{item.notes}"</p>
      )}
      {hasPhoto && (
        <div className="mt-1.5 rounded-[8px] overflow-hidden">
          <img
            src={getFileUrl(item.photo_url)}
            alt=""
            className="w-[120px] h-[80px] bg-[#EAF3DE] object-contain"
          />
        </div>
      )}
    </button>
  );
}

// ---- Milestone (full-width) ----
function MilestoneCard({ item, onClick }) {
  const isPhoto = item.milestone === 'first_photo';
  const isBloom = item.milestone === 'first_bloom';
  const isRepot = item.milestone === 'repot';
  const isAdd = item.milestone === 'first_add';
  const bg = isBloom
    ? 'bg-[#1C2E10] text-[#EAF3DE] border-[#2D5016]'
    : isRepot
    ? 'bg-[#F2E6CE] text-[#1C2E10] border-[#D3B683]'
    : isAdd
    ? 'bg-[#EAF3DE] text-[#1C2E10] border-[#C0DD97]'
    : 'bg-[#FDFAF6] text-[#1C2E10] border-[#D3C9B8]';
  const M = meta(item.action);
  const Icon = M.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="timeline-milestone"
      data-milestone={item.milestone}
      data-reveal
      className={`absolute left-[8%] right-[8%] rounded-[14px] border-[0.5px] px-4 py-3 flex items-center gap-3 transition-all duration-300 ease-out opacity-0 translate-y-2 data-[revealed=true]:opacity-100 data-[revealed=true]:translate-y-0 ${bg}`}
      style={{ top: item._y - 24 }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: M.color + '33' }}
      >
        <Icon className="h-4 w-4" style={{ color: M.color }} />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="font-plant text-sm truncate">{item.title}</p>
        <p className="font-latin text-[10px] opacity-70">
          {new Date(item.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          <span className="px-1.5">·</span>
          {item.subtitle}
        </p>
      </div>
      {isPhoto && item.photo_url && (
        <img src={getFileUrl(item.photo_url)} alt="" className="w-14 h-14 rounded-[8px] bg-[#EAF3DE] object-contain flex-shrink-0" />
      )}
    </button>
  );
}

// ---- Main Blooming Timeline ----
export default function BloomingTimeline({ logs, plant, onOpenEntry }) {
  const containerRef = useRef(null);
  useReveal(containerRef);

  const items = useMemo(() => buildEntries(logs || [], plant || {}), [logs, plant]);
  const { height, positions } = useMemo(() => computeLayout(items), [items]);

  const prepared = useMemo(() => {
    let entryIdx = 0;
    return items.map((it) => {
      const out = { ...it, _y: positions[it.id] || 0 };
      if (it.kind === 'entry') {
        out._side = entryIdx % 2 === 0 ? 'left' : 'right';
        entryIdx++;
      }
      return out;
    });
  }, [items, positions]);

  const { path: stemPath, points: stemPoints } = useMemo(
    () => buildStemPath(items, positions),
    [items, positions]
  );

  // Empty state
  if (!logs || logs.length === 0) {
    return (
      <div
        data-testid="timeline-empty"
        className="relative min-h-[500px] rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] overflow-hidden"
      >
        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2">
          <svg width="80" height="180" viewBox="0 0 80 180" aria-hidden="true">
            <defs>
              <linearGradient id="stemGradientEmpty" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%"  stopColor="#1C2E10" />
                <stop offset="55%" stopColor="#3B6D11" />
                <stop offset="100%" stopColor="#97C459" />
              </linearGradient>
            </defs>
            <path
              d="M40 180 L40 120"
              stroke="url(#stemGradientEmpty)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M40 120 C 28 105, 18 105, 16 95 C 30 92, 38 104, 40 115 Z"
                  fill="#97C459" opacity="0.92" />
            <path d="M40 120 C 52 105, 62 105, 64 95 C 50 92, 42 104, 40 115 Z"
                  fill="#5DCAA5" opacity="0.92" />
            <circle cx="40" cy="88" r="4" fill="#C0DD97" className="grove-tip-breathe" />
          </svg>
          <p className="font-plant text-[#1C2E10] text-base">Your plant's story starts here.</p>
          <p className="font-ui text-xs text-[#5F5E5A] max-w-[280px] text-center leading-snug">
            Log a first watering to begin. Every care action adds a new leaf, bud or bloom to your plant's living timeline.
          </p>
        </div>
      </div>
    );
  }

  // Find topmost (newest) point for the breathing tip
  const newest = stemPoints.length ? stemPoints[0] : null;

  return (
    <div
      ref={containerRef}
      data-testid="blooming-timeline"
      className="relative rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] overflow-hidden"
      style={{ height }}
    >
      {/* SVG stem, centered */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`-50 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ willChange: 'transform' }}
      >
        <defs>
          {/* Multi-stop stem gradient: deeper at the base, lighter toward the tip (top) */}
          <linearGradient id="stemGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#1C2E10" />
            <stop offset="35%"  stopColor="#2D5016" />
            <stop offset="65%"  stopColor="#3B6D11" />
            <stop offset="92%"  stopColor="#639922" />
            <stop offset="100%" stopColor="#97C459" />
          </linearGradient>
          {/* Soft glow filter for the under-stem */}
          <filter id="stemGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          {/* Highlight overlay (thin stroke) */}
          <linearGradient id="stemHighlight" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.34" />
          </linearGradient>
        </defs>

        {stemPath && (
          <>
            {/* Soft glow under-stem */}
            <path
              d={stemPath}
              stroke="#5DCAA5"
              strokeOpacity="0.32"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#stemGlow)"
              vectorEffect="non-scaling-stroke"
            />
            {/* Main stem */}
            <path
              d={stemPath}
              stroke="url(#stemGradient)"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            {/* Highlight */}
            <path
              d={stemPath}
              stroke="url(#stemHighlight)"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {/* Action nodes drawn on the stem */}
        {stemPoints.map((p) => {
          const m = meta(p.action);
          return (
            <ActionNode
              key={`node-${p.id}`}
              kind={m.node}
              cx={p.x}
              cy={p.y}
              color={m.color}
              k={p.id}
            />
          );
        })}

        {/* Breathing growing tip */}
        {newest && (
          <g className="grove-tip-breathe" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <circle cx={newest.x} cy={newest.y - 14} r="6" fill="#C0DD97" opacity="0.35" />
            <circle cx={newest.x} cy={newest.y - 14} r="3" fill="#EAF3DE" />
          </g>
        )}
      </svg>

      {/* Render in DOM order top→bottom (newest first) for a11y. */}
      {prepared
        .slice()
        .sort((a, b) => a._y - b._y)
        .map((it) => {
          if (it.kind === 'month') {
            return (
              <div
                key={it.id}
                data-testid="timeline-month-label"
                className="absolute left-0 right-0 flex items-center gap-2 px-6"
                style={{ top: it._y - 8 }}
              >
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D3C9B8] to-transparent" />
                <span className="font-latin text-[10px] uppercase tracking-[0.15em] text-[#888780] whitespace-nowrap">
                  {it.label}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D3C9B8] to-transparent" />
              </div>
            );
          }
          if (it.kind === 'milestone') {
            return <MilestoneCard key={it.id} item={it} onClick={() => onOpenEntry && onOpenEntry(it)} />;
          }
          return (
            <EntryCard
              key={it.id}
              item={it}
              side={it._side}
              onClick={() => onOpenEntry && onOpenEntry(it)}
            />
          );
        })}
    </div>
  );
}
