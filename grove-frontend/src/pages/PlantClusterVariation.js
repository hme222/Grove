import React from "react";
import {
  Leaf,
  Sparkles,
  Droplets,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Wind,
  Trees,
  Home,
  Sofa,
  BookOpen,
  Layers,
  Palette,
  Sprout,
  Trophy,
  CloudDrizzle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * PlantClusterVariations
 * ------------------------------------------------------------
 * Standalone static React component. Five mobile (portrait)
 * carousel treatments of the same 5-card "Power of the Plant
 * Cluster" master lesson for The Jungle Curator track.
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared lesson data
   ================================================================ */
const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The Hook",
    eyebrow: "Free Humidity",
    headline: "Stop buying expensive humidifiers.",
    body:
      "Tropical plants love humidity, but indoor heating and AC dry the air out fast. Good news: you can harness natural physics to fix this &mdash; no gadgets, no bills.",
    cta: "Show me the trick",
    icon: Sparkles,
    accent: "from-emerald-100 via-lime-50 to-emerald-50",
    ring: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-800",
  },
  {
    n: 2,
    header: "Card 2 of 5 · Transpiration",
    eyebrow: "How Plants Breathe",
    headline: "The botanical humidifier.",
    body:
      "Plants naturally release moisture through their leaves &mdash; a process called <strong>transpiration</strong>. Every leaf is a tiny humidifier, running for free.",
    cta: "Beautiful. Got it.",
    icon: Droplets,
    accent: "from-sky-100 via-blue-50 to-emerald-50",
    ring: "text-sky-700",
    chip: "bg-sky-100 text-sky-900",
  },
  {
    n: 3,
    header: "Card 3 of 5 · The Cluster Effect",
    eyebrow: "Microclimate Magic",
    headline: "Create a microclimate.",
    body:
      "When you group multiple plants close together, they trap that shared moisture, creating a <strong>pocket of humid air</strong>. It&rsquo;s a rainforest floor in miniature.",
    cta: "Group them up &mdash; got it",
    icon: CloudDrizzle,
    accent: "from-teal-100 via-emerald-50 to-lime-50",
    ring: "text-teal-700",
    chip: "bg-teal-100 text-teal-900",
  },
  {
    n: 4,
    header: "Card 4 of 5 · The Styling Benefit",
    eyebrow: "Curator\u2019s Rule",
    headline: "Looks better, grows better.",
    body:
      "Clustered plants don&rsquo;t just thrive &mdash; grouping in <strong>odd numbers</strong> (3, 5, 7) creates a lusher, more editorial interior aesthetic that magazines swear by.",
    cta: "Odd numbers &mdash; noted",
    icon: Palette,
    accent: "from-amber-100 via-rose-50 to-emerald-50",
    ring: "text-amber-700",
    chip: "bg-amber-100 text-amber-900",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    eyebrow: "60-Second Action",
    headline: "Cluster three plants right now.",
    body:
      "Move three of your leafy tropicals so their pots are touching, or clustered together on the same shelf. Then tap below to log your first cluster.",
    cta: "Design My First Cluster Group",
    icon: Trees,
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
        className="rounded-full border-emerald-400 bg-emerald-50 px-3 py-1 text-xs text-emerald-900"
      >
        Jungle Curator &middot; Curator Track
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

/* Reusable little potted plant SVG */
const PottedPlant = ({ scale = 1, hue = "#059669", leafStyle = 0 }) => {
  const paths = [
    // Monstera-ish
    <g key="0">
      <path d="M40,80 Q10,55 8,20 Q28,35 40,80 Z" fill={hue} />
      <path d="M40,80 Q70,55 72,20 Q52,35 40,80 Z" fill={hue} />
      <path d="M40,80 Q40,40 30,10 Q42,30 40,80 Z" fill="#10B981" />
    </g>,
    // Rounded / peperomia
    <g key="1">
      <circle cx="30" cy="35" r="14" fill={hue} />
      <circle cx="52" cy="30" r="12" fill={hue} />
      <circle cx="40" cy="20" r="10" fill="#10B981" />
    </g>,
    // Tall / snake plant
    <g key="2">
      <path d="M40,80 Q35,40 30,10 Q40,40 40,80 Z" fill={hue} />
      <path d="M40,80 Q45,40 50,10 Q40,40 40,80 Z" fill={hue} />
      <path d="M40,80 Q40,30 35,5 Q40,35 40,80 Z" fill="#10B981" />
    </g>,
  ];
  return (
    <svg
      viewBox="0 0 80 110"
      width={80 * scale}
      height={110 * scale}
      aria-hidden="true"
    >
      {/* Pot */}
      <path d="M15,80 L65,80 L60,105 L20,105 Z" fill="#B45309" />
      <ellipse cx="40" cy="80" rx="25" ry="3" fill="#7C2D12" opacity="0.4" />
      {paths[leafStyle]}
    </svg>
  );
};

/* ================================================================
   VARIATION 1 — Microclimate Diagram (Cluster Effect)
   Featured card: Card 3
   ================================================================ */
const MicroclimateDiagram = () => (
  <div className="relative mx-auto h-56 w-full overflow-hidden rounded-3xl bg-gradient-to-b from-teal-100 via-emerald-50 to-lime-50">
    {/* Humid cloud overlay */}
    <svg
      className="absolute inset-x-0 top-0 h-32 w-full"
      viewBox="0 0 300 130"
      aria-hidden="true"
    >
      <path
        d="M40,80 C60,20 240,20 260,80 Q220,110 150,105 Q80,110 40,80 Z"
        fill="#7DD3FC"
        opacity="0.35"
      />
      <path
        d="M60,90 C80,30 220,30 240,90 Q200,110 150,108 Q100,110 60,90 Z"
        fill="#5EEAD4"
        opacity="0.3"
      />
      {/* Moisture particles */}
      {[
        { x: 80, y: 40 },
        { x: 120, y: 30 },
        { x: 160, y: 45 },
        { x: 200, y: 32 },
        { x: 230, y: 55 },
        { x: 100, y: 60 },
        { x: 190, y: 65 },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#0891B2" opacity="0.6" />
      ))}
    </svg>

    {/* Label */}
    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm">
      <CloudDrizzle className="h-3 w-3 text-sky-700" />
      Trapped humidity
    </div>
    <div className="absolute right-3 top-3 rounded-full bg-emerald-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
      65% RH
    </div>

    {/* Plants cluster */}
    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1">
      <div className="translate-y-2">
        <PottedPlant scale={0.9} hue="#047857" leafStyle={1} />
      </div>
      <PottedPlant scale={1.15} hue="#059669" leafStyle={0} />
      <div className="translate-y-2">
        <PottedPlant scale={0.95} hue="#0F766E" leafStyle={2} />
      </div>
    </div>

    {/* Arrows from leaves upward */}
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-16 h-24 w-full"
      viewBox="0 0 300 100"
      aria-hidden="true"
    >
      {[80, 150, 220].map((x, i) => (
        <g key={i}>
          <path
            d={`M${x},80 Q${x - 5},60 ${x},40`}
            stroke="#0891B2"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          <polygon
            points={`${x - 3},42 ${x + 3},42 ${x},36`}
            fill="#0891B2"
            opacity="0.7"
          />
        </g>
      ))}
    </svg>
  </div>
);

const VariationOne = () => {
  const card = CARDS[2];
  return (
    <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-microclimate">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <X className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Plant Cluster
            </span>
            <DotRow current={2} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            3/5
          </span>
        </div>

        <div className="mt-5">
          <MicroclimateDiagram />
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-teal-100 via-emerald-50 to-lime-50 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <CloudDrizzle className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Humidity stats */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/70 p-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                  Solo plant
                </p>
                <p className="mt-0.5 font-serif text-lg text-emerald-950">
                  ~35% RH
                </p>
              </div>
              <div className="rounded-xl bg-emerald-800 p-2.5 text-center text-white">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-lime-200">
                  Clustered
                </p>
                <p className="mt-0.5 font-serif text-lg">~65% RH</p>
              </div>
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
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   VARIATION 2 — Before / After Split (The Hook)
   Featured card: Card 1
   ================================================================ */
const BeforeAfterVisual = () => (
  <div className="grid grid-cols-2 gap-2">
    {/* Before */}
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-50 to-rose-50 p-3">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-rose-800">
          Before
        </span>
        <span className="text-[9px] font-semibold text-rose-800">32% RH</span>
      </div>
      {/* Dry air waves */}
      <svg viewBox="0 0 100 80" className="mt-2 h-16 w-full" aria-hidden="true">
        <path
          d="M10,20 Q30,10 50,20 T90,20"
          stroke="#B45309"
          strokeWidth="1"
          fill="none"
          strokeDasharray="2 2"
          opacity="0.5"
        />
        <path
          d="M10,35 Q30,25 50,35 T90,35"
          stroke="#B45309"
          strokeWidth="1"
          fill="none"
          strokeDasharray="2 2"
          opacity="0.5"
        />
      </svg>
      <div className="flex justify-center">
        <PottedPlant scale={0.9} hue="#84A98C" leafStyle={0} />
      </div>
      <p className="mt-1 text-center text-[10px] font-medium text-rose-800">
        Lonely &middot; dry air
      </p>
    </div>

    {/* After */}
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-teal-50 to-emerald-100 p-3">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-lime-200">
          After
        </span>
        <span className="text-[9px] font-semibold text-emerald-800">65% RH</span>
      </div>
      {/* Humid cloud */}
      <svg viewBox="0 0 100 80" className="mt-2 h-16 w-full" aria-hidden="true">
        <ellipse cx="50" cy="30" rx="42" ry="18" fill="#7DD3FC" opacity="0.35" />
        {[20, 40, 60, 80].map((x, i) => (
          <circle key={i} cx={x} cy={30} r="1.5" fill="#0891B2" opacity="0.6" />
        ))}
      </svg>
      <div className="flex justify-center gap-0.5">
        <PottedPlant scale={0.6} hue="#047857" leafStyle={1} />
        <PottedPlant scale={0.75} hue="#059669" leafStyle={0} />
        <PottedPlant scale={0.6} hue="#0F766E" leafStyle={2} />
      </div>
      <p className="mt-1 text-center text-[10px] font-medium text-emerald-900">
        Cluster &middot; lush air
      </p>
    </div>
  </div>
);

const VariationTwo = () => {
  const card = CARDS[0];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-emerald-50 via-white to-lime-50"
      testId="v2-before-after"
    >
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <X className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Plant Cluster
            </span>
            <DotRow current={0} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            1/5
          </span>
        </div>

        <div className="mt-5">
          <BeforeAfterVisual />
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
                <Sparkles className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Cost callout */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-950 p-3 text-emerald-50">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800">
                <Sparkles className="h-4 w-4 text-lime-200" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-lime-200">
                  Save
                </p>
                <p className="text-[13px] font-semibold">
                  &pound;80&ndash;&pound;200 on a humidifier
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
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
   VARIATION 3 — Botanical Leaf Cross-Section (Transpiration)
   Featured card: Card 2
   ================================================================ */
const LeafDiagram = () => (
  <div className="relative mx-auto h-52 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-lime-50 to-sky-50">
    {/* Zoomed leaf */}
    <svg viewBox="0 0 300 200" className="h-full w-full" aria-hidden="true">
      {/* Leaf outline */}
      <path
        d="M50,100 Q60,30 150,20 Q240,30 250,100 Q240,170 150,180 Q60,170 50,100 Z"
        fill="#10B981"
      />
      {/* Leaf shading */}
      <path
        d="M50,100 Q60,30 150,20 Q240,30 250,100 Q240,170 150,180 Q60,170 50,100 Z"
        fill="url(#leafShade)"
      />
      {/* Central vein */}
      <path d="M50,100 L250,100" stroke="#065F46" strokeWidth="2" opacity="0.4" />
      {/* Side veins */}
      {[40, 65, 90, 115, 140].map((y, i) => (
        <g key={i}>
          <path
            d={`M${100 + i * 30},100 Q${100 + i * 30},${y} ${100 + i * 30 + 15},${y - 8}`}
            stroke="#065F46"
            strokeWidth="1"
            opacity="0.35"
            fill="none"
          />
          <path
            d={`M${100 + i * 30},100 Q${100 + i * 30},${200 - y} ${100 + i * 30 + 15},${200 - y + 8}`}
            stroke="#065F46"
            strokeWidth="1"
            opacity="0.35"
            fill="none"
          />
        </g>
      ))}

      {/* Stomata callouts (tiny pores) */}
      {[
        { x: 120, y: 55 },
        { x: 170, y: 45 },
        { x: 210, y: 60 },
        { x: 145, y: 145 },
        { x: 195, y: 150 },
      ].map((p, i) => (
        <g key={i}>
          <ellipse cx={p.x} cy={p.y} rx="3" ry="1.5" fill="#065F46" />
          {/* Water droplet rising */}
          <circle cx={p.x} cy={p.y - 15 - i * 4} r="2.5" fill="#0891B2" opacity="0.7" />
        </g>
      ))}

      {/* Callout arrow */}
      <line
        x1="220"
        y1="45"
        x2="270"
        y2="20"
        stroke="#065F46"
        strokeWidth="1"
        opacity="0.5"
      />
      <text x="240" y="18" fontSize="9" fill="#065F46" fontWeight="700">
        Stomata
      </text>
      <text x="240" y="30" fontSize="7" fill="#065F46">
        release H&#8322;O
      </text>

      <defs>
        <linearGradient id="leafShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
    </svg>

    {/* Chip */}
    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm">
      Anatomy of transpiration
    </div>
  </div>
);

const VariationThree = () => {
  const card = CARDS[1];
  return (
    <PhoneFrame tone="bg-[#F5F3EC]" testId="v3-leaf-diagram">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              How plants breathe
            </span>
            <DotRow current={1} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            2/5
          </span>
        </div>

        <div className="mt-5">
          <LeafDiagram />
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 shadow-lg">
          <CardContent className="p-5">
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
            <h1 className="mt-3 font-serif text-[24px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Curator note */}
            <div className="mt-4 flex items-start gap-2 rounded-xl border-l-4 border-sky-500 bg-white/70 p-3">
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-700" />
              <p
                className="text-[11px] italic leading-relaxed text-emerald-900"
                style={{ fontFamily: "Georgia, serif" }}
              >
                A mature Monstera can release over 200 ml of moisture per week
                &mdash; that&rsquo;s a full glass of water into your air.
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
   VARIATION 4 — Interior Design Mood Board (Styling Benefit)
   Featured card: Card 4
   ================================================================ */
const StyledShelfScene = () => (
  <div className="relative mx-auto h-52 w-full overflow-hidden rounded-3xl bg-gradient-to-b from-amber-50 via-rose-50 to-emerald-50">
    {/* Warm wall gradient background is already there */}
    {/* Wall art frame */}
    <svg className="absolute right-6 top-4 h-10 w-10 opacity-70" viewBox="0 0 40 40" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" fill="none" stroke="#7C2D12" strokeWidth="2" />
      <path d="M6,32 L14,20 L22,26 L30,14 L34,32 Z" fill="#059669" opacity="0.6" />
    </svg>

    {/* Sofa */}
    <svg
      className="absolute left-3 bottom-3 h-16 w-24 opacity-80"
      viewBox="0 0 120 60"
      aria-hidden="true"
    >
      <rect x="5" y="20" width="110" height="30" rx="8" fill="#B45309" />
      <rect x="5" y="15" width="30" height="20" rx="6" fill="#92400E" />
      <rect x="85" y="15" width="30" height="20" rx="6" fill="#92400E" />
      <rect x="40" y="10" width="40" height="15" rx="4" fill="#FBBF24" opacity="0.6" />
    </svg>

    {/* Shelf */}
    <div className="absolute inset-x-6 bottom-14 h-1 rounded-full bg-amber-900/70" />

    {/* Three clustered plants (odd number) on shelf */}
    <div className="absolute inset-x-0 bottom-16 flex items-end justify-center gap-1">
      <div className="translate-y-1">
        <PottedPlant scale={0.85} hue="#047857" leafStyle={1} />
      </div>
      <PottedPlant scale={1.1} hue="#059669" leafStyle={0} />
      <div className="translate-y-2">
        <PottedPlant scale={0.75} hue="#0F766E" leafStyle={2} />
      </div>
    </div>

    {/* Rule-of-3 annotation */}
    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm">
      Rule of 3 &middot; odd = editorial
    </div>
    <div className="absolute right-3 top-16 -rotate-6 rounded-md bg-amber-200 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-900 shadow-sm">
      As seen in AD
    </div>
  </div>
);

const VariationFour = () => {
  const card = CARDS[3];
  return (
    <PhoneFrame tone="bg-[#FDF9EE]" testId="v4-mood-board">
      <div className="flex h-full flex-col px-5 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white p-2 shadow-sm">
            <ChevronLeft className="h-4 w-4 text-emerald-800" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
              Curator&rsquo;s eye
            </span>
            <DotRow current={3} />
          </div>
          <span className="text-[10px] font-semibold text-emerald-700">
            4/5
          </span>
        </div>

        <div className="mt-5">
          <StyledShelfScene />
        </div>

        <Card className="mt-4 rounded-3xl border-none bg-white shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${card.chip}`}
              >
                {card.header}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                <Palette className={`h-4 w-4 ${card.ring}`} />
              </span>
            </div>
            <h1 className="mt-3 font-serif text-[22px] leading-tight text-emerald-950">
              {card.headline}
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-emerald-900/80"
              dangerouslySetInnerHTML={{ __html: card.body }}
            />

            {/* Number chips */}
            <div className="mt-4 flex items-center gap-2">
              {[
                { n: 2, ok: false },
                { n: 3, ok: true },
                { n: 4, ok: false },
                { n: 5, ok: true },
                { n: 7, ok: true },
              ].map((x) => (
                <span
                  key={x.n}
                  className={`flex h-9 flex-1 items-center justify-center rounded-full font-serif text-[15px] font-bold ${
                    x.ok
                      ? "bg-emerald-800 text-white"
                      : "bg-rose-50 text-rose-700 line-through"
                  }`}
                >
                  {x.n}
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-emerald-800/60">
              Even numbers feel staged &middot; odd numbers feel discovered
            </p>
          </CardContent>
        </Card>

        <div className="mt-auto pt-4">
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
   VARIATION 5 — Cluster Arrangement Picker (Card 5)
   Featured card: Card 5 with plant selector + shelf picker
   ================================================================ */
const VariationFive = () => {
  const card = CARDS[4];
  const plants = [
    { name: "Monstera", picked: true, hue: "#059669", leaf: 0 },
    { name: "Peperomia", picked: true, hue: "#047857", leaf: 1 },
    { name: "Snake plant", picked: true, hue: "#0F766E", leaf: 2 },
    { name: "Rubber plant", picked: false, hue: "#065F46", leaf: 1 },
    { name: "Pothos", picked: false, hue: "#10B981", leaf: 0 },
  ];
  return (
    <PhoneFrame
      tone="bg-gradient-to-b from-lime-50 via-white to-emerald-100"
      testId="v5-arrangement-picker"
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

        {/* Cluster preview */}
        <Card className="mt-5 overflow-hidden rounded-3xl border-none bg-gradient-to-br from-emerald-100 to-lime-100 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                Cluster preview
              </p>
              <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-[9px] font-bold text-white">
                3 selected &middot; odd ✓
              </span>
            </div>
            <div className="mt-3 flex items-end justify-center gap-1">
              <div className="translate-y-2">
                <PottedPlant scale={0.85} hue="#047857" leafStyle={1} />
              </div>
              <PottedPlant scale={1.05} hue="#059669" leafStyle={0} />
              <div className="translate-y-1">
                <PottedPlant scale={0.9} hue="#0F766E" leafStyle={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plant picker */}
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
          Choose 3 tropicals
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {plants.map((p, i) => (
            <button
              key={p.name}
              data-testid={`v5-plant-${p.name.replace(/ /g, "-").toLowerCase()}`}
              className={`flex w-24 shrink-0 flex-col items-center rounded-2xl border-2 p-2 transition ${
                p.picked
                  ? "border-emerald-800 bg-emerald-900 text-white"
                  : "border-emerald-200 bg-white text-emerald-950"
              }`}
            >
              <PottedPlant
                scale={0.55}
                hue={p.picked ? "#D9F99D" : p.hue}
                leafStyle={p.leaf}
              />
              <p className="text-[10px] font-bold">{p.name}</p>
              {p.picked && (
                <Check className="mt-0.5 h-3 w-3 text-lime-200" />
              )}
            </button>
          ))}
        </div>

        {/* Surface picker */}
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
            Cluster surface
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { label: "Console", icon: Sofa, active: true },
              { label: "Shelf", icon: Layers, active: false },
              { label: "Windowsill", icon: Home, active: false },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  className={`flex flex-col items-center rounded-xl border-2 py-2 text-[11px] font-bold ${
                    s.active
                      ? "border-emerald-800 bg-emerald-50 text-emerald-900"
                      : "border-emerald-100 bg-white text-emerald-900/60"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="mt-0.5">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button
            className="h-14 w-full rounded-full bg-emerald-900 text-base font-semibold hover:bg-emerald-800"
            data-testid="v5-cta-design-cluster"
          >
            {card.cta}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-emerald-800/60">
            We&rsquo;ll track humidity gains for this group.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};

/* ================================================================
   BONUS — Final "Design My First Cluster Group" endpoint
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
      After all 5 cards &mdash; the Curator win
    </h2>
    <p className="mb-8 max-w-2xl text-sm text-emerald-800/70">
      Every variation lands here: the first cluster is logged and its humidity
      gains start tracking.
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
                Cluster &middot; complete
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
                    <Trees className="h-10 w-10 text-emerald-700" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <h1 className="mt-5 text-center font-serif text-[22px] leading-tight text-emerald-950">
                Your first microclimate
                <br />
                <span className="italic text-emerald-700">is alive.</span>
              </h1>
              <p className="mt-2 text-center text-[12px] leading-relaxed text-emerald-900/70">
                Three tropicals clustered on your console. Humidity in that
                pocket will climb over the next 48 hours.
              </p>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-800">
                  Cluster #01
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Sofa className="h-4 w-4 text-emerald-800" />
                  <span className="text-[12px] font-semibold text-emerald-950">
                    Living console &middot; 3 plants
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-800/70">
                  <CloudDrizzle className="h-3 w-3" />
                  Est. +30% RH by day 2
                </div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  className="h-12 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
                  data-testid="bonus-cta-finish"
                >
                  Design My First Cluster Group
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button className="mt-3 w-full text-center text-[11px] font-medium text-emerald-800/70">
                  Or explore styling mood boards first
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
const PlantClusterVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="plant-cluster-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              Grove &middot; Plant Cluster &mdash; 5 carousel treatments
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            Persona: The Jungle Curator
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Microclimate Diagram"
        subtitle="A live SVG microclimate scene &mdash; three clustered plants under a shared humid cloud, dashed transpiration arrows, and a 35% vs 65% RH stat comparison (here: The Cluster Effect)."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        title="Before / After Split"
        subtitle="A two-panel comparison &mdash; lonely plant in dry air vs a lush trio under humidity. Dark savings callout drives the &lsquo;no humidifier&rsquo; hook (here: The Hook)."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="Botanical Leaf Cross-Section"
        subtitle="Zoomed SVG of a leaf with visible veins, stomata pores, and rising water droplets. A curator&rsquo;s italic side-note quantifies the science (here: Transpiration)."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        title="Interior Design Mood Board"
        subtitle="A styled shelf scene with sofa, wall art, and a 3-plant grouping (rule of 3). Number chips reject even, celebrate odd (here: Styling Benefit)."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        title="Cluster Arrangement Picker"
        subtitle="Card 5 in full &mdash; live cluster preview, 5-plant horizontal picker (3 selected), surface picker (Console/Shelf/Windowsill), and the primary &ldquo;Design My First Cluster Group&rdquo; CTA."
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

export default PlantClusterVariations;
