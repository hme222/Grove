import React from "react";
import {
  Leaf,
  Sparkles,
  Sun,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Sunrise,
  Sunset,
  Cloud,
  BookOpen,
  X,
  Flower2,
  Home,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * WindowBlueprintVariations
 * ------------------------------------------------------------
 * Standalone static React component. Five mobile (portrait)
 * carousel treatments of the same 5-card "Right Window Blueprint"
 * master lesson for the Botanical Visionary (Seedling Track).
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared lesson data
   ================================================================ */
export const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The Hook",
    eyebrow: "Before You Plant",
    headline: "Light is plant food.",
    body:
      "Before picking a plant based on looks, map your natural light. Walk through your room and locate your windows &mdash; every direction tells a different story.",
    cta: "Got it, let\u2019s map the windows",
    icon: Sparkles,
    dir: "start",
    accent: "from-emerald-100 via-emerald-50 to-lime-50",
    ring: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-800",
  },
  {
    n: 2,
    header: "Card 2 of 5 · South & West",
    eyebrow: "The Sun Zone",
    headline: "South / West windows.",
    body:
      "These catch intense, direct afternoon sun. This is the absolute survival zone for <strong>succulents and cacti</strong> &mdash; anything that thrives on heat and drought.",
    cta: "Got it &mdash; South/West is bright",
    icon: Sun,
    dir: "SW",
    accent: "from-amber-100 via-orange-50 to-rose-50",
    ring: "text-amber-600",
    chip: "bg-amber-100 text-amber-900",
  },
  {
    n: 3,
    header: "Card 3 of 5 · East",
    eyebrow: "The Sweet Spot",
    headline: "East windows.",
    body:
      "These get gentle, cool morning light &mdash; strong enough to feed, soft enough to forgive. It\u2019s the sweet spot for tropicals like <strong>Monsteras, Pothos, Philodendrons</strong>.",
    cta: "Got it &mdash; East is tropical-friendly",
    icon: Sunrise,
    dir: "E",
    accent: "from-sky-100 via-blue-50 to-emerald-50",
    ring: "text-sky-700",
    chip: "bg-sky-100 text-sky-900",
  },
  {
    n: 4,
    header: "Card 4 of 5 · North & The Golden Rule",
    eyebrow: "Low Light + Wisdom",
    headline: "North windows &amp; the Golden Rule.",
    body:
      "North windows offer low, indirect light &mdash; ideal for low-maintenance <strong>Pothos or Snake plants</strong>.<br/><br/><strong>The Golden Rule:</strong> if you can\u2019t comfortably read a physical book here at 2:00 PM without a lamp, a plant can\u2019t grow here either.",
    cta: "Golden Rule locked in",
    icon: Cloud,
    dir: "N",
    accent: "from-slate-100 via-emerald-50 to-emerald-100",
    ring: "text-slate-700",
    chip: "bg-slate-100 text-slate-800",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    eyebrow: "60-Second Action",
    headline: "Pick your first lighting zone.",
    body:
      "Choose one empty surface where you want a plant. Look at the nearest window. Which direction does it face?",
    cta: "Set my first lighting zone",
    icon: MapPin,
    dir: "action",
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
        className="rounded-full border-lime-300 bg-lime-50 px-3 py-1 text-xs text-emerald-900"
      >
        Botanical Visionary &middot; Seedling Track
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

/* ================================================================
   VARIATION 1 — Compass Wheel Carousel
   Featured card: Card 2 (South/West)
   ================================================================ */
const CompassRose = ({ active }) => {
  const points = [
    { key: "N", x: 100, y: 26, tone: "slate" },
    { key: "E", x: 174, y: 100, tone: "sky" },
    { key: "S", x: 100, y: 174, tone: "amber" },
    { key: "W", x: 26, y: 100, tone: "amber" },
  ];
  const activeColor = {
    N: "#475569",
    E: "#0369A1",
    S: "#D97706",
    W: "#D97706",
    SW: "#D97706",
  }[active];
  return (
    <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="url(#compassGrad)"
          stroke="#065F46"
          strokeOpacity="0.15"
        />
        <circle cx="100" cy="100" r="60" fill="none" stroke="#065F46" strokeOpacity="0.1" />
        <circle cx="100" cy="100" r="30" fill="#FBFAF5" stroke="#065F46" strokeOpacity="0.15" />
        {/* Cross needles */}
        <path
          d="M100,20 L108,100 L100,180 L92,100 Z"
          fill={active === "N" || active === "S" ? activeColor : "#065F4620"}
          opacity="0.55"
        />
        <path
          d="M20,100 L100,108 L180,100 L100,92 Z"
          fill={active === "E" || active === "W" || active === "SW" ? activeColor : "#065F4620"}
          opacity="0.55"
        />
        <circle cx="100" cy="100" r="6" fill="#065F46" />
        <defs>
          <radialGradient id="compassGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#F7FEE7" />
            <stop offset="100%" stopColor="#D9F99D" stopOpacity="0.4" />
          </radialGradient>
        </defs>
      </svg>
      {/* Cardinal labels */}
      {points.map((p) => {
        const isActive =
          active === p.key || (active === "SW" && (p.key === "S" || p.key === "W"));
        return (
          <span
            key={p.key}
            className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[13px] font-bold transition ${
              isActive
                ? "bg-emerald-900 text-white shadow-lg"
                : "bg-white text-emerald-800 shadow-sm"
            }`}
            style={{ left: p.x, top: p.y }}
          >
            {p.key}
          </span>
        );
      })}
    </div>
  );
};

const VariationOne = () => {
  const card = CARDS[1]; // South/West
  return (
    <PhoneFrame tone="bg-[#FBFAF5]" testId="v1-compass-wheel">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <X className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              The Right Window Blueprint
            </span>
            <DotRow current={1} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">2/5</span>
        </div>

        {/* Compass */}
        <div className="mt-6">
          <CompassRose active="SW" />
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Sun className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-4 font-serif text-[24px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Plant chips */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {["Cacti", "Succulents", "Aloe", "Jade"].map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-amber-900"
                >
                  {p}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v1-cta-got-it"
          >
            {card.cta}
            <Check className="ml-2 h-4 w-4" />
          </Button>
          <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-800/60">
            <button className="flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              Card 1
            </button>
            <span>Swipe or tap</span>
            <button className="flex items-center gap-1 font-medium text-emerald-800">
              Card 3
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 2 — Sun-Path Arc Timeline
   Featured card: Card 3 (East)
   ================================================================ */
const SunArc = ({ position = 0.25 }) => {
  // position: 0 (sunrise/E) → 0.5 (noon/S) → 1 (sunset/W)
  const cx = 30 + 240 * position;
  const cy = 90 - Math.sin(Math.PI * position) * 60;
  return (
    <div className="relative mt-2">
      <svg viewBox="0 0 300 110" className="h-24 w-full">
        {/* Arc */}
        <path
          d="M30,90 Q150,-30 270,90"
          fill="none"
          stroke="#065F46"
          strokeOpacity="0.2"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />
        {/* Horizon */}
        <line
          x1="10"
          y1="90"
          x2="290"
          y2="90"
          stroke="#065F46"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
        {/* Direction markers */}
        <text x="30" y="105" textAnchor="middle" fontSize="9" fill="#0F766E" fontWeight="700">
          E
        </text>
        <text x="150" y="105" textAnchor="middle" fontSize="9" fill="#B45309" fontWeight="700">
          S
        </text>
        <text x="270" y="105" textAnchor="middle" fontSize="9" fill="#B45309" fontWeight="700">
          W
        </text>
        {/* Sun */}
        <circle cx={cx} cy={cy} r="14" fill="#FCD34D" opacity="0.35" />
        <circle cx={cx} cy={cy} r="8" fill="#F59E0B" />
        <circle cx={cx} cy={cy} r="8" fill="url(#sunG)" />
        <defs>
          <radialGradient id="sunG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>
      </svg>
      <p className="mt-1 text-center text-[10px] font-medium text-emerald-800/60">
        7 AM &middot; morning sweet spot
      </p>
    </div>
  );
};

const VariationTwo = () => {
  const card = CARDS[2]; // East
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-sky-50 via-white to-emerald-50"
      testId="v2-sun-path"
    >
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Sun-path Blueprint
            </span>
            <DotRow current={2} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">3/5</span>
        </div>

        {/* Sun arc */}
        <div className="mt-6 rounded-3xl border border-sky-100 bg-white/70 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-[10px] font-medium text-emerald-800/70">
            <span className="flex items-center gap-1">
              <Sunrise className="h-3 w-3" />
              Sunrise
            </span>
            <span>Noon</span>
            <span className="flex items-center gap-1">
              <Sunset className="h-3 w-3" />
              Sunset
            </span>
          </div>
          <SunArc position={0.15} />
        </div>

        {/* Lesson card */}
        <Card className="mt-5 rounded-3xl border-none bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
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

            {/* Match chips */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { name: "Monstera", em: "🌿" },
                { name: "Pothos", em: "🌱" },
                { name: "Philodendron", em: "🍃" },
              ].map((p) => (
                <div
                  key={p.name}
                  className="rounded-xl bg-white/80 p-2 text-center"
                >
                  <div className="text-lg">{p.em}</div>
                  <p className="mt-0.5 text-[10px] font-semibold text-emerald-950">
                    {p.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-5">
          <Button
            className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v2-cta-got-it"
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
   VARIATION 3 — Room Map / Floor Plan
   Featured card: Card 4 (North + Golden Rule)
   ================================================================ */
const RoomMap = () => (
  <div className="relative mx-auto mt-3 h-48 w-full overflow-hidden rounded-2xl border border-emerald-200 bg-white">
    {/* N label */}
    <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-emerald-900 px-2 py-0.5 text-[9px] font-bold text-white">
      N
    </span>
    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-emerald-800 shadow-sm">
      S
    </span>
    <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-emerald-800 shadow-sm">
      E
    </span>
    <span className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-emerald-800 shadow-sm">
      W
    </span>

    {/* Room shape */}
    <svg viewBox="0 0 300 200" className="h-full w-full">
      {/* Room outline */}
      <rect
        x="50"
        y="30"
        width="200"
        height="140"
        fill="#F7FEE7"
        stroke="#065F46"
        strokeWidth="2"
        rx="4"
      />
      {/* North window (active — dimmer light) */}
      <rect x="120" y="26" width="60" height="8" fill="#94A3B8" stroke="#065F46" strokeWidth="1.5" />
      {/* East window */}
      <rect x="248" y="80" width="8" height="40" fill="#7DD3FC" stroke="#065F46" strokeWidth="1.5" />
      {/* West window */}
      <rect x="44" y="80" width="8" height="40" fill="#FCD34D" stroke="#065F46" strokeWidth="1.5" />

      {/* North light beam (highlighted) */}
      <path
        d="M120,34 L100,90 L200,90 L180,34 Z"
        fill="url(#nBeam)"
        opacity="0.85"
      />
      <defs>
        <linearGradient id="nBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Furniture */}
      <rect x="70" y="140" width="60" height="20" fill="#065F46" opacity="0.2" rx="2" />
      <circle cx="200" cy="150" r="12" fill="#065F46" opacity="0.15" />

      {/* Plant target */}
      <g transform="translate(150,90)">
        <circle r="16" fill="#059669" opacity="0.15" />
        <circle r="8" fill="#059669" />
        <Leaf x="-5" y="-5" width="10" height="10" />
      </g>
      <text x="150" y="118" textAnchor="middle" fontSize="8" fill="#065F46" fontWeight="600">
        You are here
      </text>
    </svg>
  </div>
);

const VariationThree = () => {
  const card = CARDS[3]; // North + Golden Rule
  return (
    <PhoneFrame tone="bg-[#F5F3EC]" testId="v3-room-map">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Map your room
            </span>
            <DotRow current={3} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">4/5</span>
        </div>

        <RoomMap />

        {/* Lesson */}
        <Card className="mt-4 rounded-3xl border-none bg-white shadow-lg">
          <CardContent className="p-5">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
            >
              {card.header}
            </span>
            <h1 className="mt-3 font-serif text-[22px] leading-snug text-emerald-950">
              {card.headline.replace("&amp;", "&")}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Golden Rule callout */}
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-[11px] leading-relaxed text-emerald-950">
                <strong>Book-test tip:</strong> at 2:00 PM, try reading a real
                book here without a lamp. If you can&rsquo;t, no plant can grow
                here either.
              </p>
            </div>
          </CardContent>
        </Card>

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
   VARIATION 4 — Field Guide Book Spread
   Featured card: Card 1 (The Hook) — sets the tone for the whole course
   ================================================================ */
const VariationFour = () => {
  const card = CARDS[0];
  return (
    <PhoneFrame tone="bg-[#F5F0E4]" testId="v4-field-guide">
      {/* Paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, #000 1px, transparent 1px), radial-gradient(circle at 70% 60%, #000 1px, transparent 1px)",
          backgroundSize: "18px 18px, 22px 22px",
        }}
      />
      <div className="relative flex h-full flex-col px-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="text-emerald-900/70">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-800/70">
            Grove Field Guide &middot; Ch. 01
          </p>
          <BookOpen className="h-4 w-4 text-emerald-800/70" />
        </div>

        <div className="mt-6 flex items-start gap-3">
          <span className="font-serif text-6xl italic text-emerald-800/30">
            0{card.n}
          </span>
          <div className="pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
              {card.header}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-800/60">
              An entry from The Right Window Blueprint
            </p>
          </div>
        </div>

        <h1 className="mt-6 font-serif text-[32px] leading-[1.05] text-emerald-950">
          {card.headline}
        </h1>

        <div className="mt-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-emerald-800/30" />
          <Flower2 className="h-3.5 w-3.5 text-emerald-800/50" />
          <span className="h-px flex-1 bg-emerald-800/30" />
        </div>

        {/* Diagram frame */}
        <div className="mt-5 rounded-2xl bg-white/60 p-3 shadow-sm ring-1 ring-emerald-900/10 backdrop-blur">
          <div className="flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-lime-100 via-emerald-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-sm">
                <Sun className="h-6 w-6 text-amber-500" />
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-800/50" />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-sm">
                <Leaf className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-center font-serif text-[10px] italic text-emerald-800/60">
            Fig. 01 &mdash; energy transferred from sun to leaf
          </p>
        </div>

        <p
          className="mt-5 font-serif text-[14px] leading-relaxed text-emerald-950/85"
          style={{ fontFamily: "Georgia, serif" }}
          dangerouslySetInnerHTML={{ __html: card.body }}
        />

        {/* Dropped cap detail line */}
        <p className="mt-3 font-serif text-[11px] italic text-emerald-800/60">
          &ldquo;Every plant, at heart, is a light-catcher.&rdquo;
        </p>

        <div className="mt-auto pb-4">
          <div className="mb-3 flex items-center justify-center">
            <DotRow current={0} />
          </div>
          <Button
            className="h-12 w-full rounded-none border-2 border-emerald-900 bg-transparent text-sm font-semibold uppercase tracking-widest text-emerald-900 hover:bg-emerald-900 hover:text-white"
            data-testid="v4-cta-turn-page"
          >
            Turn the page &nbsp;&mdash;&nbsp; {card.cta}
          </Button>
          <p className="mt-3 text-center font-serif text-[10px] italic text-emerald-800/50">
            &mdash; page 1 of 5 &mdash;
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 5 — Interactive Action Card (Card 5)
   Featured card: Card 5 with direction selector
   ================================================================ */
const VariationFive = () => {
  const card = CARDS[4];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-lime-50 via-white to-emerald-100"
      testId="v5-interactive-action"
    >
      {/* Decorative blob */}
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
              Your Turn
            </span>
            <DotRow current={4} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">5/5</span>
        </div>

        {/* Header block */}
        <div className="mt-6">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
          >
            {card.header}
          </span>
          <h1 className="mt-3 font-serif text-[26px] leading-tight text-emerald-950">
            {card.headline}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-emerald-900/80">
            {card.body}
          </p>
        </div>

        {/* Interactive selector */}
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
            The window faces
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              {
                key: "N",
                label: "North",
                sub: "Low, indirect",
                icon: Cloud,
                tone: "border-slate-300 bg-slate-50",
                iconTone: "text-slate-600",
              },
              {
                key: "E",
                label: "East",
                sub: "Cool morning",
                icon: Sunrise,
                tone: "border-emerald-800 bg-emerald-900 text-white ring-2 ring-emerald-800",
                iconTone: "text-lime-200",
                active: true,
              },
              {
                key: "S",
                label: "South",
                sub: "Bright, hot",
                icon: Sun,
                tone: "border-amber-200 bg-amber-50",
                iconTone: "text-amber-600",
              },
              {
                key: "W",
                label: "West",
                sub: "Afternoon blast",
                icon: Sunset,
                tone: "border-orange-200 bg-orange-50",
                iconTone: "text-orange-600",
              },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  data-testid={`v5-dir-${opt.key}`}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${opt.tone}`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/70 ${opt.iconTone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p
                        className={`text-[13px] font-bold ${
                          opt.active ? "text-white" : "text-emerald-950"
                        }`}
                      >
                        {opt.label}
                      </p>
                      {opt.active && (
                        <Check className="h-3.5 w-3.5 text-lime-200" />
                      )}
                    </div>
                    <p
                      className={`text-[10px] ${
                        opt.active ? "text-emerald-100/80" : "text-emerald-800/60"
                      }`}
                    >
                      {opt.sub}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional room label input */}
          <label className="mt-4 block">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
              What do you call this spot?
            </span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3">
              <MapPin className="h-4 w-4 text-emerald-700" />
              <input
                type="text"
                placeholder="e.g. the reading nook"
                defaultValue="Reading nook shelf"
                className="w-full bg-transparent text-[13px] text-emerald-950 outline-none placeholder:text-emerald-800/40"
                data-testid="v5-input-label"
              />
            </div>
          </label>
        </div>

        <div className="mt-auto pt-5">
          <Button
            className="h-14 w-full rounded-full bg-emerald-900 text-base font-semibold hover:bg-emerald-800"
            data-testid="v5-cta-set-zone"
          >
            Set my first lighting zone
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-emerald-800/60">
            We&rsquo;ll match plants to this zone next.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   BONUS — Final CTA endpoint (dashboard unlock preview)
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
      After all 5 cards &mdash; the transition CTA
    </h2>
    <p className="mb-8 max-w-2xl text-sm text-emerald-800/70">
      Every variation lands here: a celebratory badge unlock and the primary
      &ldquo;Set My First Lighting Zone&rdquo; CTA into the main app.
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
                Blueprint complete
              </span>
              <DotRow current={5} />
            </div>
            <span className="text-[10px] font-semibold text-emerald-700">
              5/5 ✓
            </span>
          </div>

          <Card className="mt-6 flex-1 overflow-hidden rounded-3xl border-none shadow-lg">
            <CardContent className="flex h-full flex-col p-6">
              <div className="mt-4 flex justify-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-emerald-200">
                    <Trophy className="h-10 w-10 text-amber-700" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <h1 className="mt-6 text-center font-serif text-[24px] leading-tight text-emerald-950">
                You just mapped your first
                <br />
                <span className="italic text-emerald-700">lighting zone</span>.
              </h1>
              <p className="mt-3 text-center text-[13px] leading-relaxed text-emerald-900/70">
                The Botanical Visionary in you is off to a real start. We&rsquo;ll
                match plants to this zone from here on out.
              </p>

              <div className="mt-5 rounded-2xl bg-emerald-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                  Zone saved
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Home className="h-4 w-4 text-emerald-800" />
                  <span className="text-[13px] font-semibold text-emerald-950">
                    Reading nook shelf &middot; East light
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
                  data-testid="bonus-cta-finish"
                >
                  Set My First Lighting Zone
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button className="mt-3 w-full text-center text-[11px] font-medium text-emerald-800/70">
                  Or explore matched plants first
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
const WindowBlueprintVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="window-blueprint-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              Grove &middot; The Right Window Blueprint &mdash; 5 carousel treatments
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            Persona: Botanical Visionary
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Compass Wheel Carousel"
        subtitle="A living compass rose sits above every card &mdash; the active cardinal (here: S/W) lights up as you swipe through directions."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        title="Sun-Path Arc Timeline"
        subtitle="A gently animated sun arcs across E &rarr; S &rarr; W. Each card slides the sun to the direction being taught (here: East, at sunrise)."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="Room-Map / Floor Plan"
        subtitle="An isometric top-down room diagram lights the beam from the featured window (here: North, with the Golden Rule callout)."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        title="Field Guide Book Spread"
        subtitle="A hand-designed booklet chapter with paper grain, ornament rules and Fig. captions. Turns the blueprint into a keepsake (here: Card 1)."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        title="Interactive Action Card"
        subtitle="Card 5 in full &mdash; direction selector, room label input, and the primary &ldquo;Set My First Lighting Zone&rdquo; CTA."
      />
      <VariationFive />

      {/* Shared endpoint */}
      <FinalCTAPreview />

      <footer className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-emerald-800/60">
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default WindowBlueprintVariations;
