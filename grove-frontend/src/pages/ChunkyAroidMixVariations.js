import React from "react";
import {
  Leaf,
  Sparkles,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Droplets,
  Wind,
  FlaskConical,
  Trees,
  Calculator,
  Layers,
  Beaker,
  Microscope,
  Scale,
  Sprout,
  Trophy,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * ChunkyAroidMixVariations
 * ------------------------------------------------------------
 * Standalone static React component. Five mobile (portrait)
 * carousel treatments of the same 5-card "Anatomy of a Chunky
 * Aroid Mix" master lesson for The Elite Botanist track.
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared lesson data (ordered logically 1→5)
   ================================================================ */
const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The Hook",
    eyebrow: "Root Physiology",
    headline: "Roots need to breathe.",
    body:
      "In nature, epiphytic plants (Monsteras, Philodendrons) grow on trees &mdash; not in dense mud. Standard potting soil compacts over time, suffocating their root systems.",
    cta: "Yes &mdash; oxygen matters",
    icon: Wind,
    accent: "from-emerald-100 via-lime-50 to-emerald-50",
    ring: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-800",
  },
  {
    n: 2,
    header: "Card 2 of 5 · Bark\u2019s Role",
    eyebrow: "Structural Airflow",
    headline: "Why orchid bark?",
    body:
      "The 3 parts of bark create <strong>large structural air pockets</strong>, allowing essential oxygen to reach root respiration points. Bark is the skeleton of the mix.",
    cta: "Bark = skeleton, got it",
    icon: Trees,
    accent: "from-amber-100 via-orange-50 to-emerald-50",
    ring: "text-amber-700",
    chip: "bg-amber-100 text-amber-900",
  },
  {
    n: 3,
    header: "Card 3 of 5 · The 3:2:1 Ratio",
    eyebrow: "The Perfect Mix",
    headline: "Three parts, two parts, one part.",
    body:
      "To optimise root health, mix a highly aerated, fast-draining substrate: <strong>3 parts Orchid Bark</strong>, <strong>2 parts Perlite / Pumice</strong>, <strong>1 part Coco Coir</strong>.",
    cta: "3:2:1 &mdash; memorised",
    icon: Beaker,
    accent: "from-sky-100 via-blue-50 to-emerald-50",
    ring: "text-sky-700",
    chip: "bg-sky-100 text-sky-900",
  },
  {
    n: 4,
    header: "Card 4 of 5 · Perlite & Coir",
    eyebrow: "Drainage + Hydration",
    headline: "Fast out. Just enough in.",
    body:
      "<strong>Perlite</strong> ensures rapid drainage so water never pools. <strong>Coir</strong> retains just enough moisture to keep roots hydrated without drowning them. A perfect duet.",
    cta: "Drainage duo &mdash; got it",
    icon: Droplets,
    accent: "from-slate-100 via-emerald-50 to-lime-50",
    ring: "text-slate-700",
    chip: "bg-slate-100 text-slate-800",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    eyebrow: "60-Second Diagnosis",
    headline: "Inspect your prized plant.",
    body:
      "Look closely at the surface of your most prized plant&rsquo;s soil. Is it a solid, dense block of black dirt, or can you see chunks of bark and white perlite?",
    cta: "Open Substrate Calculator",
    icon: Microscope,
    accent: "from-lime-100 via-emerald-50 to-emerald-100",
    ring: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-800",
    interactive: true,
  },
];

/* ================================================================
   Shared UI primitives
   ================================================================ */
const PhoneFrame = ({ children, tone = "bg-[#FBFAF5]", testId }) => (
  <div className="relative mx-auto" style={{ width: 380 }} data-testid={testId}>
    <div className="rounded-[52px] bg-emerald-950 p-3 shadow-2xl shadow-emerald-950/25">
      <div
        className={`relative overflow-hidden rounded-[42px] ${tone}`}
        style={{ height: 800 }}
      >
        <div className="flex items-center justify-between px-7 pt-4 pb-2 text-[11px] font-semibold text-emerald-950">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="ml-1 h-2 w-4 rounded-sm border border-emerald-950" />
          </span>
        </div>
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-emerald-950" />
        <div className="relative h-[calc(100%-30px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const VariationLabel = ({ number, title, subtitle }) => (
  <div className="mx-auto max-w-3xl px-6 pt-20 pb-8 text-left">
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
        Variation {number}
      </span>
      <Badge
        variant="outline"
        className="rounded-full border-emerald-700 bg-emerald-900 px-3 py-1 text-xs text-lime-100"
      >
        Elite Botanist &middot; Botanist Track
      </Badge>
      <span className="h-px flex-1 bg-emerald-200" />
    </div>
    <h2 className="mt-3 font-serif text-2xl leading-tight text-emerald-950 md:text-3xl">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-1 max-w-2xl text-sm text-emerald-800/70">{subtitle}</p>
    )}
  </div>
);

const DotRow = ({ current }) => (
  <div className="flex items-center gap-1.5">
    {CARDS.map((_, i) => (
      <span
        key={i}
        className={`h-1.5 rounded-full transition-all ${
          i === current
            ? "w-6 bg-emerald-800"
            : i < current
              ? "w-1.5 bg-emerald-500"
              : "w-1.5 bg-emerald-200"
        }`}
      />
    ))}
  </div>
);

/* Reusable pot cross-section illustrating the chunky mix */
const SubstrateCrossSection = ({ compact = false }) => (
  <svg
    viewBox="0 0 300 220"
    className={compact ? "h-40 w-full" : "h-56 w-full"}
    aria-hidden="true"
  >
    {/* Pot outline (cutaway) */}
    <path
      d="M60,60 L240,60 L215,210 L85,210 Z"
      fill="#B45309"
      stroke="#7C2D12"
      strokeWidth="2"
    />
    <ellipse cx="150" cy="60" rx="90" ry="8" fill="#7C2D12" />
    {/* Inside soil region (clipped) */}
    <clipPath id="soilClip">
      <path d="M62,60 L238,60 L214,208 L86,208 Z" />
    </clipPath>
    <g clipPath="url(#soilClip)">
      <rect x="0" y="60" width="300" height="150" fill="#3F2A17" />
      {/* Bark chunks (amber) */}
      {[
        { x: 90, y: 80, w: 30, h: 12 },
        { x: 150, y: 100, w: 40, h: 14 },
        { x: 200, y: 75, w: 28, h: 10 },
        { x: 110, y: 130, w: 36, h: 12 },
        { x: 180, y: 145, w: 34, h: 14 },
        { x: 100, y: 170, w: 40, h: 16 },
        { x: 170, y: 185, w: 28, h: 10 },
      ].map((b, i) => (
        <rect
          key={`b${i}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="3"
          fill="#A16207"
          stroke="#78350F"
          strokeWidth="0.8"
        />
      ))}
      {/* Perlite (white spheres) */}
      {[
        { x: 130, y: 90 },
        { x: 175, y: 90 },
        { x: 220, y: 105 },
        { x: 95, y: 105 },
        { x: 155, y: 125 },
        { x: 200, y: 130 },
        { x: 130, y: 160 },
        { x: 175, y: 175 },
        { x: 205, y: 195 },
      ].map((p, i) => (
        <circle
          key={`p${i}`}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#F9FAFB"
          stroke="#D1D5DB"
          strokeWidth="0.6"
        />
      ))}
      {/* Coir fibers */}
      {[
        { x1: 80, y1: 90, x2: 92, y2: 92 },
        { x1: 200, y1: 82, x2: 218, y2: 88 },
        { x1: 100, y1: 152, x2: 118, y2: 148 },
        { x1: 155, y1: 200, x2: 175, y2: 202 },
      ].map((l, i) => (
        <line
          key={`c${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#8B5A2B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
    </g>

    {/* Root lines */}
    <g stroke="#065F46" strokeWidth="1.5" fill="none">
      <path d="M150,60 Q140,100 130,140 Q125,170 120,200" opacity="0.6" />
      <path d="M150,60 Q160,100 170,150 Q180,180 190,200" opacity="0.6" />
      <path d="M150,60 Q150,100 155,150 Q158,180 160,200" opacity="0.4" />
    </g>

    {/* Labels with lines */}
    {!compact && (
      <g fontSize="9" fill="#065F46" fontWeight="700">
        <line x1="230" y1="90" x2="270" y2="70" stroke="#065F46" strokeWidth="0.7" />
        <text x="245" y="66">Orchid bark</text>
        <line x1="130" y1="90" x2="30" y2="80" stroke="#065F46" strokeWidth="0.7" />
        <text x="6" y="76">Perlite</text>
        <line x1="92" y1="92" x2="30" y2="130" stroke="#065F46" strokeWidth="0.7" />
        <text x="6" y="140">Coir</text>
      </g>
    )}
  </svg>
);

/* ================================================================
   VARIATION 1 — Substrate Cross-Section Diagram
   Featured card: Card 1 (Hook)
   ================================================================ */
const VariationOne = () => {
  const card = CARDS[0];
  return (
    <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-cross-section">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <X className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Chunky Aroid Mix
            </span>
            <DotRow current={0} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            1/5
          </span>
        </div>

        <div className="mt-4 rounded-3xl border border-emerald-100 bg-white p-2 shadow-sm">
          <SubstrateCrossSection />
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-emerald-100 via-lime-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Wind className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Field note */}
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-white/70 p-3">
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <p
                className="text-[11px] italic leading-relaxed text-emerald-900"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Field note: aerial roots on a wild Monstera can survive on bark,
                moss and rain alone &mdash; there is no soil in a rainforest canopy.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v1-cta-got-it"
          >
            {card.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 2 — Component Deep-Dive (Bark's Role)
   Featured card: Card 2
   ================================================================ */
const BarkDetailVisual = () => (
  <div className="relative mx-auto h-52 w-full overflow-hidden rounded-3xl bg-gradient-to-b from-amber-50 via-orange-50 to-emerald-50">
    {/* Zoomed bark chunk */}
    <svg viewBox="0 0 300 200" className="h-full w-full" aria-hidden="true">
      {/* Chunk */}
      <path
        d="M60,80 Q40,60 60,40 Q100,20 160,30 Q220,25 250,60 Q270,110 240,160 Q180,180 120,175 Q60,170 45,140 Q30,110 60,80 Z"
        fill="#A16207"
        stroke="#78350F"
        strokeWidth="1.5"
      />
      {/* Bark texture — vertical grooves */}
      {[70, 100, 130, 160, 190, 220].map((x, i) => (
        <path
          key={i}
          d={`M${x},50 Q${x - 5},100 ${x + 5},160`}
          stroke="#78350F"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
      ))}
      {/* Air pockets (dashed circles) */}
      {[
        { x: 90, y: 90, r: 8 },
        { x: 175, y: 75, r: 6 },
        { x: 220, y: 130, r: 9 },
        { x: 130, y: 140, r: 7 },
      ].map((p, i) => (
        <g key={`pocket${i}`}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill="#F0FDF4"
            fillOpacity="0.35"
            stroke="#059669"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <text
            x={p.x}
            y={p.y + 3}
            fontSize="8"
            fill="#065F46"
            fontWeight="700"
            textAnchor="middle"
          >
            O&#8322;
          </text>
        </g>
      ))}

      {/* Callout arrow */}
      <line
        x1="245"
        y1="130"
        x2="280"
        y2="170"
        stroke="#065F46"
        strokeWidth="1"
      />
      <text x="260" y="185" fontSize="9" fill="#065F46" fontWeight="700">
        Air pocket
      </text>
    </svg>
    {/* Label */}
    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm">
      Zoom &middot; Orchid bark chunk
    </div>
    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
      <Microscope className="h-3 w-3" />
      10&times;
    </div>
  </div>
);

const VariationTwo = () => {
  const card = CARDS[1];
  return (
    <PhoneFrame tone="bg-[#F5F0E4]" testId="v2-bark-detail">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Component detail
            </span>
            <DotRow current={1} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            2/5
          </span>
        </div>

        <div className="mt-5">
          <BarkDetailVisual />
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Trees className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[22px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Spec grid */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Air", val: "~35%" },
                { label: "Drainage", val: "Fast" },
                { label: "Break-down", val: "6-9 mo" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-white/70 p-2 text-center"
                >
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-amber-800">
                    {s.label}
                  </p>
                  <p className="mt-0.5 font-serif text-[13px] font-bold text-emerald-950">
                    {s.val}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v2-cta-got-it"
          >
            {card.cta}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 3 — 3:2:1 Ratio Infographic
   Featured card: Card 3
   ================================================================ */
const RatioBars = () => (
  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-emerald-100">
    <div className="flex items-baseline justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
        Volume ratio
      </span>
      <span className="font-serif text-[20px] font-bold text-emerald-950">
        3 : 2 : 1
      </span>
    </div>

    {/* Stacked bar */}
    <div className="mt-4 flex h-10 w-full overflow-hidden rounded-xl">
      <div
        className="flex items-center justify-center bg-amber-700 text-[11px] font-bold text-white"
        style={{ width: "50%" }}
      >
        Bark 50%
      </div>
      <div
        className="flex items-center justify-center bg-slate-200 text-[11px] font-bold text-slate-800"
        style={{ width: "33.3%" }}
      >
        Perlite 33%
      </div>
      <div
        className="flex items-center justify-center bg-emerald-700 text-[11px] font-bold text-white"
        style={{ width: "16.7%" }}
      >
        Coir
      </div>
    </div>

    {/* Legend */}
    <div className="mt-4 space-y-2">
      {[
        {
          color: "bg-amber-700",
          label: "Orchid Bark",
          role: "Structural airflow",
          parts: "3 parts",
          icon: Trees,
        },
        {
          color: "bg-slate-300",
          label: "Perlite / Pumice",
          role: "Rapid drainage",
          parts: "2 parts",
          icon: Droplets,
        },
        {
          color: "bg-emerald-700",
          label: "Coco Coir",
          role: "Moisture retention",
          parts: "1 part",
          icon: Sprout,
        },
      ].map((r) => {
        const Icon = r.icon;
        return (
          <div key={r.label} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${r.color}`} />
            <Icon className="h-3.5 w-3.5 text-emerald-800/60" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-emerald-950">
                {r.label}
              </p>
              <p className="text-[10px] text-emerald-800/60">{r.role}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              {r.parts}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

const VariationThree = () => {
  const card = CARDS[2];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-emerald-50 via-white to-lime-50"
      testId="v3-ratio-infographic"
    >
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              The formula
            </span>
            <DotRow current={2} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            3/5
          </span>
        </div>

        <div className="mt-5">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
          >
            {card.header}
          </span>
          <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
            {card.headline}
          </h1>
          <p
            className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
            dangerouslySetInnerHTML={{ __html: card.body }}
          />
        </div>

        <div className="mt-5">
          <RatioBars />
        </div>

        {/* Pro tip */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-950 p-3 text-emerald-50">
          <FlaskConical className="h-5 w-5 shrink-0 text-lime-200" />
          <p className="text-[12px] leading-snug">
            Pro tip: measure by <strong className="text-lime-200">volume</strong>, not weight.
            A yogurt pot works fine as your unit.
          </p>
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v3-cta-got-it"
          >
            {card.cta}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 4 — Side-by-Side Sample Jars
   Featured card: Card 4 (Perlite & Coir) + comparison
   ================================================================ */
const SampleJar = ({ variant = "dense" }) => (
  <svg viewBox="0 0 120 160" className="h-full w-full" aria-hidden="true">
    {/* Lid */}
    <rect x="20" y="8" width="80" height="12" rx="3" fill="#7C2D12" />
    <rect x="20" y="8" width="80" height="4" rx="2" fill="#B45309" />
    {/* Jar body */}
    <rect
      x="18"
      y="20"
      width="84"
      height="130"
      rx="10"
      fill="#F9FAFB"
      stroke="#94A3B8"
      strokeWidth="1"
      opacity="0.6"
    />
    {/* Contents */}
    <clipPath id={`jarClip-${variant}`}>
      <rect x="20" y="22" width="80" height="126" rx="8" />
    </clipPath>
    <g clipPath={`url(#jarClip-${variant})`}>
      {variant === "dense" ? (
        <>
          {/* Dense black block */}
          <rect x="20" y="40" width="80" height="108" fill="#1F1712" />
          {/* Compaction lines */}
          {[60, 80, 100, 120].map((y) => (
            <line
              key={y}
              x1="24"
              y1={y}
              x2="96"
              y2={y}
              stroke="#3F2A17"
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
        </>
      ) : (
        <>
          {/* Chunky mix */}
          <rect x="20" y="40" width="80" height="108" fill="#3F2A17" />
          {[
            { x: 30, y: 55, w: 22, h: 10 },
            { x: 65, y: 65, w: 25, h: 12 },
            { x: 40, y: 85, w: 20, h: 10 },
            { x: 70, y: 100, w: 18, h: 10 },
            { x: 30, y: 115, w: 24, h: 12 },
            { x: 65, y: 130, w: 22, h: 10 },
          ].map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx="2"
              fill="#A16207"
            />
          ))}
          {[
            { x: 55, y: 55 },
            { x: 35, y: 75 },
            { x: 85, y: 85 },
            { x: 60, y: 105 },
            { x: 30, y: 130 },
            { x: 90, y: 125 },
          ].map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#F9FAFB" />
          ))}
        </>
      )}
    </g>
    {/* Label */}
    <rect
      x="20"
      y="90"
      width="80"
      height="26"
      fill={variant === "dense" ? "#FEE2E2" : "#DCFCE7"}
      opacity="0.9"
    />
    <text
      x="60"
      y="102"
      fontSize="9"
      textAnchor="middle"
      fontWeight="700"
      fill={variant === "dense" ? "#991B1B" : "#065F46"}
    >
      {variant === "dense" ? "STANDARD" : "AROID MIX"}
    </text>
    <text
      x="60"
      y="112"
      fontSize="7"
      textAnchor="middle"
      fill={variant === "dense" ? "#991B1B" : "#065F46"}
    >
      Dense &middot; wet
    </text>
    {variant !== "dense" && (
      <text x="60" y="112" fontSize="7" textAnchor="middle" fill="#065F46">
        Chunky &middot; airy
      </text>
    )}
  </svg>
);

const VariationFour = () => {
  const card = CARDS[3];
  return (
    <PhoneFrame tone="bg-[#F5F3EC]" testId="v4-sample-jars">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Lab comparison
            </span>
            <DotRow current={3} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            4/5
          </span>
        </div>

        {/* Two sample jars */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-2 shadow-sm">
            <div className="h-40">
              <SampleJar variant="dense" />
            </div>
            <p className="mt-1 text-center text-[10px] font-semibold text-rose-800">
              Water pools &middot; roots suffocate
            </p>
          </div>
          <div className="rounded-2xl bg-white p-2 shadow-sm ring-2 ring-emerald-800">
            <div className="h-40">
              <SampleJar variant="chunky" />
            </div>
            <p className="mt-1 text-center text-[10px] font-semibold text-emerald-800">
              Water drains &middot; roots breathe
            </p>
          </div>
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-slate-100 via-emerald-50 to-lime-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Droplets className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-2 font-serif text-[20px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[12px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />
          </CardContent>
        </Card>

        <div className="mt-auto pt-3">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v4-cta-got-it"
          >
            {card.cta}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 5 — Substrate Calculator Preview (Card 5)
   Featured card: Card 5 with Dense/Chunky decision + mini calc
   ================================================================ */
const VariationFive = () => {
  const card = CARDS[4];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-lime-50 via-white to-emerald-100"
      testId="v5-substrate-calc"
    >
      <svg
        className="pointer-events-none absolute -right-24 -top-8 h-72 w-72 opacity-40"
        viewBox="0 0 400 400"
        aria-hidden="true"
      >
        <path
          d="M280,80 C340,120 360,220 320,290 C280,360 180,380 120,330 C60,280 40,180 100,110 C160,40 220,40 280,80 Z"
          fill="url(#v5g)"
        />
        <defs>
          <linearGradient id="v5g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A7C4A0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#E7F0DA" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Diagnose &amp; calculate
            </span>
            <DotRow current={4} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            5/5
          </span>
        </div>

        <div className="mt-6">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
          >
            {card.header}
          </span>
          <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
            {card.headline}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-emerald-900/80">
            {card.body}
          </p>
        </div>

        {/* Dense vs Chunky decision */}
        <div className="mt-5 space-y-3">
          <button
            data-testid="v5-dense-block"
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-rose-200 bg-white p-4 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
              <AlertCircle className="h-6 w-6 text-rose-700" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-700">
                Dense Block
              </p>
              <p className="mt-0.5 text-[14px] font-bold text-emerald-950">
                Solid black dirt
              </p>
              <p className="mt-1 text-[11px] text-emerald-800/70">
                We&rsquo;ll queue a gentle re-pot plan.
              </p>
            </div>
          </button>
          <button
            data-testid="v5-chunky-mix"
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-emerald-800 bg-emerald-900 p-4 text-left text-white shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800">
              <Check className="h-6 w-6 text-lime-200" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-lime-200">
                Chunky Mix
              </p>
              <p className="mt-0.5 text-[14px] font-bold">
                Bark + white perlite visible
              </p>
              <p className="mt-1 text-[11px] text-emerald-100/80">
                Beautiful. Let&rsquo;s optimise it further.
              </p>
            </div>
          </button>
        </div>

        {/* Mini calc preview */}
        <Card className="mt-4 rounded-2xl border-none bg-white shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                Substrate calculator
              </p>
              <Calculator className="h-3.5 w-3.5 text-emerald-700" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800">
                6&Prime; pot
              </span>
              <ArrowRight className="h-3 w-3 text-emerald-800/50" />
              <span className="font-mono text-[11px] text-emerald-900">
                <span className="text-amber-700">3c</span>{" "}
                bark &middot;{" "}
                <span className="text-slate-600">2c</span>{" "}
                perlite &middot;{" "}
                <span className="text-emerald-700">1c</span>{" "}
                coir
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
          <Button
            className="h-14 w-full rounded-full bg-emerald-900 text-base font-semibold hover:bg-emerald-800"
            data-testid="v5-cta-calculator"
          >
            {card.cta}
            <Calculator className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-emerald-800/60">
            Tap your pot size &middot; we&rsquo;ll do the math.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   BONUS — Final "Open Substrate Calculator" endpoint
   ================================================================ */
const FinalCTAPreview = () => (
  <div className="mx-auto max-w-3xl px-6 pt-16 pb-24">
    <div className="mb-6 flex items-center gap-3">
      <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
        Shared endpoint
      </span>
      <span className="h-px flex-1 bg-emerald-200" />
    </div>
    <h2 className="mb-4 font-serif text-2xl text-emerald-950">
      After all 5 cards &mdash; the Botanist win
    </h2>
    <p className="mb-8 max-w-2xl text-sm text-emerald-800/70">
      Every variation lands here: your diagnosis is logged and the calculator is
      queued to build the exact substrate for your pot.
    </p>
    <div className="flex justify-center">
      <PhoneFrame tone="bg-[#F7F5EE]" testId="bonus-final-cta">
        <div className="flex h-full flex-col px-5 pb-6 pt-3">
          <div className="flex items-center justify-between">
            <button className="rounded-full bg-white p-2 shadow-sm">
              <ChevronLeft className="h-4 w-4 text-emerald-800" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                Substrate &middot; complete
              </span>
              <DotRow current={5} />
            </div>
            <span className="text-[10px] font-semibold text-emerald-700">
              5/5 ✓
            </span>
          </div>

          <Card className="mt-6 flex-1 overflow-hidden rounded-3xl border-none shadow-lg">
            <CardContent className="flex h-full flex-col p-6">
              <div className="mt-2 flex justify-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-lime-200">
                    <FlaskConical className="h-10 w-10 text-emerald-700" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <h1 className="mt-5 text-center font-serif text-[22px] leading-tight text-emerald-950">
                Diagnosis: <span className="italic text-emerald-700">chunky mix.</span>
              </h1>
              <p className="mt-2 text-center text-[12px] leading-relaxed text-emerald-900/70">
                Your Monstera&rsquo;s roots are already in the right substrate. Let&rsquo;s
                fine-tune the ratio for its pot size.
              </p>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                  Recipe for 6&Prime; pot
                </p>
                <p
                  className="mt-1 font-mono text-[13px] font-bold text-emerald-950"
                >
                  <span className="text-amber-700">3 cups bark</span> ·{" "}
                  <span className="text-slate-600">2 cups perlite</span> ·{" "}
                  <span className="text-emerald-700">1 cup coir</span>
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-800/70">
                  <Scale className="h-3 w-3" />
                  Total ~1.4 L of loose substrate
                </div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
                  data-testid="bonus-cta-finish"
                >
                  Open Substrate Calculator
                  <Calculator className="ml-2 h-4 w-4" />
                </Button>
                <button className="mt-3 w-full text-center text-[11px] font-medium text-emerald-800/70">
                  Or explore substrate suppliers
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PhoneFrame>
    </div>
  </div>
);

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const ChunkyAroidMixVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="chunky-aroid-mix-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              Grove &middot; Chunky Aroid Mix &mdash; 5 carousel treatments
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            Persona: The Elite Botanist
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Substrate Cross-Section Diagram"
        subtitle="A labelled SVG cutaway of a pot showing bark chunks, perlite spheres, coir fibres, and root paths &mdash; the hero visual for the whole course (here: The Hook)."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        title="Component Deep-Dive (Bark)"
        subtitle="A 10&times; zoomed illustration of a single bark chunk with dashed air-pocket O&#8322; overlays and a 3-stat spec grid (here: Bark&rsquo;s Role)."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="3 : 2 : 1 Ratio Infographic"
        subtitle="A single stacked volume bar (50/33/17%) with a colour-coded legend and a pro-tip callout for measuring by volume (here: The Ratio)."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        title="Side-by-Side Sample Jars"
        subtitle="Two lab jars &mdash; dense standard soil (rose warning) vs chunky aroid mix (emerald ring). Straight visual proof for the drainage/hydration lesson (here: Perlite &amp; Coir)."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        title="Substrate Calculator Preview"
        subtitle="Card 5 in full &mdash; Dense-Block vs Chunky-Mix decision, mini calculator preview, and the primary &ldquo;Open Substrate Calculator&rdquo; CTA."
      />
      <VariationFive />

      <FinalCTAPreview />

      <footer className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-emerald-800/60">
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default ChunkyAroidMixVariations;
