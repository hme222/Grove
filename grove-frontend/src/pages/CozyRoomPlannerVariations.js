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
  Sun,
  Sunrise,
  Sunset,
  Cloud,
  Home,
  Map,
  BookOpen,
  Compass,
  Wind,
  MapPin,
  Trees,
  Wand2,
  Info,
  AlertTriangle,
  Sprout,
  Coffee,
  Feather,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * CozyRoomPlannerVariations
 * ------------------------------------------------------------
 * Six mobile portrait mockups of FloraGrove's dual-path landing
 * screen using a "Lo-Fi Cozy" 8-bit aesthetic. Each screen
 * revolves around placing plants into North / South / East /
 * West lighting zones and getting a soft AI Spot-Check.
 * ------------------------------------------------------------
 */

/* ================================================================
   Cozy palette
   ================================================================ */
const C = {
  cream: "#F5F0E4",
  oatmeal: "#E8D5B7",
  paper: "#FBF6EA",
  sage: "#A3B18A",
  sageDark: "#6B7A56",
  forest: "#344E41",
  forestDeep: "#22331E",
  terracotta: "#C08552",
  terracottaDark: "#8B5A2B",
  rose: "#D8A48F",
  amber: "#E8B87A",
  ink: "#3B2F2A",
};

/* ================================================================
   Phone frame + label
   ================================================================ */
const PhoneFrame = ({ children, tone = "bg-[#F5F0E4]", testId }) => (
  <div className="relative mx-auto" style={{ width: 380 }} data-testid={testId}>
    <div className="rounded-[52px] p-3 shadow-2xl shadow-emerald-950/20" style={{ background: C.forestDeep }}>
      <div
        className={`relative overflow-hidden rounded-[42px] ${tone}`}
        style={{ height: 820 }}
      >
        <div className="flex items-center justify-between px-7 pt-4 pb-2 font-mono text-[11px] font-semibold" style={{ color: C.ink }}>
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ink }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ink }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: C.ink }} />
            <span className="ml-1 h-2 w-4 rounded-sm border" style={{ borderColor: C.ink }} />
          </span>
        </div>
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full" style={{ background: C.forestDeep }} />
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
      <span className="rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-emerald-50"
        style={{ background: C.forest }}>
        Variation {number}
      </span>
      <Badge variant="outline" className="rounded-full border-2 px-3 py-1 text-xs" style={{ borderColor: C.sage, background: C.paper, color: C.forest }}>
        Lo-Fi Cozy &middot; Dual Path
      </Badge>
      <span className="h-px flex-1 bg-emerald-200" />
    </div>
    <h2 className="mt-3 font-serif text-2xl leading-tight" style={{ color: C.forest }}>
      {title}
    </h2>
    {subtitle && (
      <p className="mt-1 max-w-2xl text-sm" style={{ color: C.forest + "AA" }}>{subtitle}</p>
    )}
  </div>
);

/* ================================================================
   Reusable — Cozy 8-bit Sprout (small)
   ================================================================ */
const PIX = 8;
const spriteRows = [
  "..............",
  "......ss......",
  ".....slLl.....",
  "...LLLLLLL....",
  "..LLLwLLwLL...",
  "..LLLeLLeLL...",
  "..LLLLmLLLL...",
  "..cLLLLLLLc...",
  "...LLLLLLL....",
  ".....ss.......",
  "....pppp......",
  "...pppppp.....",
  "...oooooo.....",
  "....oooo......",
];
const spriteMap = {
  s: C.sageDark,
  L: C.sage,
  l: C.sageDark,
  w: C.paper,
  e: C.forestDeep,
  m: C.forestDeep,
  c: C.rose,
  p: C.terracotta,
  o: C.terracottaDark,
};
const CozySprout = ({ scale = 1, wilted = false }) => {
  const width = spriteRows[0].length * PIX;
  const height = spriteRows.length * PIX;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {spriteRows.map((row, y) =>
        row.split("").map((ch, x) => {
          const color = spriteMap[ch];
          if (!color) return null;
          let fill = color;
          if (wilted && (ch === "L" || ch === "l")) fill = C.oatmeal;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * PIX}
              y={y * PIX}
              width={PIX}
              height={PIX}
              fill={fill}
            />
          );
        })
      )}
    </svg>
  );
};

/* Paper texture layer */
const PaperTexture = () => (
  <div
    className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
    style={{
      backgroundImage:
        "radial-gradient(circle at 30% 20%, #000 1px, transparent 1px), radial-gradient(circle at 70% 60%, #000 1px, transparent 1px)",
      backgroundSize: "18px 18px, 22px 22px",
    }}
  />
);

/* Zone chip */
const ZoneChip = ({ dir, label, active, tone }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 font-mono text-[10px] font-bold ${
      active ? "text-white" : ""
    }`}
    style={{
      borderColor: C.forest,
      background: active ? C.forest : C.paper,
      color: active ? C.cream : C.forest,
    }}
  >
    <span style={{ color: active ? tone : tone }}>{dir}</span>
    <span>{label}</span>
  </span>
);

/* AI Feedback card */
const AIFeedback = ({ type = "good", plant, spot, msg }) => {
  const isGood = type === "good";
  const bg = isGood ? "#E7EFD9" : "#F8E9C2";
  const border = isGood ? C.sage : C.amber;
  const Icon = isGood ? Check : AlertTriangle;
  return (
    <div
      className="rounded-2xl border-2 p-3 shadow-[0_3px_0_0_#3B2F2A]"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-start gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
          style={{
            background: isGood ? C.sage : C.amber,
            borderColor: C.forest,
            color: C.paper,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p
            className="font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{ color: C.forest }}
          >
            AI Spot-Check
          </p>
          <p
            className="mt-0.5 font-serif text-[14px] leading-snug"
            style={{ color: C.ink }}
          >
            <em>{plant}</em> {isGood ? "loves" : "isn't sure about"} the{" "}
            <strong>{spot}</strong>.
          </p>
          <p
            className="mt-1 text-[11px] leading-relaxed"
            style={{ color: C.ink + "CC" }}
          >
            {msg}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   VARIATION 1 — Isometric Cozy Bedroom
   ================================================================ */
const IsoRoom = () => (
  <div className="relative mx-auto h-52 w-full overflow-hidden rounded-3xl border-2 shadow-[0_4px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: "linear-gradient(180deg, #F5EFDF 0%, #E8D5B7 100%)" }}>
    <svg viewBox="0 0 300 200" className="h-full w-full" aria-hidden="true">
      {/* Iso floor */}
      <polygon points="60,150 240,150 300,180 0,180" fill={C.oatmeal} />
      {/* Back wall left */}
      <polygon points="60,150 60,40 180,10 180,90" fill="#F0E4C6" />
      {/* Back wall right */}
      <polygon points="180,10 180,90 300,120 300,20" fill="#EAD9B0" />
      {/* East window (right wall) */}
      <rect x="205" y="35" width="35" height="45" fill="#DFF0F5" stroke={C.forest} strokeWidth="2" />
      <line x1="222" y1="35" x2="222" y2="80" stroke={C.forest} strokeWidth="1" />
      <line x1="205" y1="57" x2="240" y2="57" stroke={C.forest} strokeWidth="1" />
      {/* East light shaft */}
      <polygon points="205,80 240,80 165,180 130,180" fill="#FAE8B0" opacity="0.5" />
      <text x="215" y="30" fontSize="8" fill={C.forest} fontWeight="700" textAnchor="middle">EAST</text>

      {/* South window (left wall) */}
      <rect x="82" y="60" width="40" height="45" fill="#DFF0F5" stroke={C.forest} strokeWidth="2" />
      <line x1="102" y1="60" x2="102" y2="105" stroke={C.forest} strokeWidth="1" />
      <line x1="82" y1="82" x2="122" y2="82" stroke={C.forest} strokeWidth="1" />
      {/* South light shaft (brighter) */}
      <polygon points="82,105 122,105 155,180 110,180" fill="#F4C971" opacity="0.55" />
      <text x="102" y="55" fontSize="8" fill={C.forest} fontWeight="700" textAnchor="middle">SOUTH</text>

      {/* Bed */}
      <polygon points="20,155 90,155 70,175 0,175" fill={C.terracotta} />
      <rect x="10" y="140" width="30" height="18" fill={C.rose} />

      {/* Rug */}
      <ellipse cx="180" cy="170" rx="45" ry="8" fill={C.rose} opacity="0.7" />

      {/* Empty plant spot (active drop target near East light) */}
      <circle cx="200" cy="163" r="14" fill="none" stroke={C.forest} strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="200" y="167" fontSize="8" fill={C.forest} textAnchor="middle" fontWeight="700">tap</text>

      {/* Placed plant preview near South (bright) */}
      <g transform="translate(140,150)">
        <rect x="-6" y="0" width="12" height="14" fill={C.terracotta} />
        <path d="M-8,-6 Q0,-18 8,-6 Q4,2 -4,2 Z" fill={C.sage} />
      </g>
    </svg>
    {/* Labels */}
    <div className="absolute left-2 top-2 rounded-full border-2 px-2 py-0.5 font-mono text-[9px] font-bold" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
      Bedroom &middot; 4 light zones
    </div>
  </div>
);

const VariationOne = () => (
  <PhoneFrame tone="bg-[#F5F0E4]" testId="v1-iso-bedroom">
    <PaperTexture />
    <div className="relative flex h-full flex-col px-4 pb-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2" style={{ background: C.forest, borderColor: C.forestDeep, color: C.cream }}>
            <Leaf className="h-4 w-4" />
          </span>
          <div>
            <p className="font-serif text-[15px] font-bold" style={{ color: C.forest }}>FloraGrove</p>
            <p className="font-mono text-[9px]" style={{ color: C.forest + "99" }}>
              Cozy room planner
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1 rounded-full border-2 px-2.5 py-1 font-mono text-[10px] font-bold" style={{ borderColor: C.forest, background: C.paper, color: C.forest }}>
          <Compass className="h-3 w-3" /> N S E W
        </button>
      </div>

      <h1 className="mt-4 font-serif text-[22px] leading-tight" style={{ color: C.forest }}>
        Tap a plant &mdash; drop it in your sunny corner.
      </h1>

      <div className="mt-3">
        <IsoRoom />
      </div>

      {/* Zone legend */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <ZoneChip dir="N" label="Cool" active={false} tone={C.forest + "88"} />
        <ZoneChip dir="E" label="Gentle AM" active={true} tone={C.amber} />
        <ZoneChip dir="S" label="Bright" active={false} tone={C.terracotta} />
        <ZoneChip dir="W" label="Warm PM" active={false} tone={C.rose} />
      </div>

      {/* Plant tray */}
      <div className="mt-3 rounded-2xl border-2 p-2 shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.paper }}>
        <p className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>
          Your plant tray
        </p>
        <div className="flex items-end gap-2 overflow-x-auto">
          {[
            { name: "Monstera", real: true },
            { name: "Succulent", real: true },
            { name: "pixel-Pothos", real: false },
            { name: "Snake plant", real: true },
          ].map((p, i) => (
            <button key={p.name} data-testid={`v1-plant-${i}`}
              className="flex shrink-0 flex-col items-center rounded-xl border-2 p-1.5 transition"
              style={{
                borderColor: i === 0 ? C.forest : C.sage,
                background: i === 0 ? C.oatmeal : C.paper,
                boxShadow: i === 0 ? `0 3px 0 0 ${C.forest}` : "none",
              }}>
              {p.real ? (
                <svg viewBox="0 0 40 50" className="h-10 w-10">
                  <rect x="12" y="30" width="16" height="16" fill={C.terracotta} />
                  <path d="M8,28 Q20,10 32,28 Q26,32 14,32 Z" fill={C.sage} />
                  <path d="M20,28 Q20,10 22,4" stroke={C.sageDark} strokeWidth="1.5" fill="none" />
                </svg>
              ) : (
                <CozySprout scale={0.7} />
              )}
              <span className="mt-0.5 font-mono text-[8px] font-bold" style={{ color: C.forest }}>
                {p.name}
              </span>
              {!p.real && (
                <span className="mt-0.5 rounded-full px-1 font-mono text-[7px] font-bold uppercase" style={{ background: C.amber, color: C.forest }}>
                  8-bit
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* AI feedback slide-up */}
      <div className="mt-3">
        <AIFeedback
          type="good"
          plant="Monstera"
          spot="East window"
          msg="Perfect morning light! She'll unfurl a new leaf within 2 weeks."
        />
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 2 — Warm Botanical Shelf Grid
   ================================================================ */
const ShelfRow = ({ label, sub, tone, plants, status }) => (
  <div className="relative">
    <div className="mb-1 flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5">
        <span className="rounded-full border-2 px-1.5 py-0.5 font-mono text-[9px] font-bold" style={{ borderColor: C.forest, background: tone, color: C.forest }}>
          {sub}
        </span>
        <span className="font-serif text-[12px] font-semibold" style={{ color: C.forest }}>{label}</span>
      </div>
      {status && (
        <span className="font-mono text-[9px] font-bold" style={{ color: status.color }}>
          {status.text}
        </span>
      )}
    </div>
    <div className="relative flex h-16 items-end gap-2 border-2 px-2 pb-1" style={{ borderColor: C.forest, background: C.oatmeal }}>
      {/* Wood grain */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0 20px, ${C.terracottaDark}18 20px 21px)` }} />
      {plants.map((p, i) => (
        <div key={i} className="relative">
          {p === "empty" ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed" style={{ borderColor: C.forest + "66" }}>
              <span className="font-mono text-[9px] font-bold" style={{ color: C.forest + "88" }}>+</span>
            </div>
          ) : p === "pixel" ? (
            <CozySprout scale={0.6} />
          ) : (
            <svg viewBox="0 0 40 50" className="h-12 w-10">
              <rect x="12" y="30" width="16" height="16" fill={C.terracotta} />
              <path d="M8,28 Q20,10 32,28 Q26,32 14,32 Z" fill={p === "wilted" ? C.oatmeal : C.sage} />
              {p === "wilted" && <path d="M20,15 L20,25" stroke={C.sageDark} strokeWidth="1.5" />}
            </svg>
          )}
        </div>
      ))}
    </div>
    {/* Shelf shadow */}
    <div className="h-1" style={{ background: C.forest }} />
  </div>
);

const VariationTwo = () => (
  <PhoneFrame tone="bg-[#F5F0E4]" testId="v2-shelf-grid">
    <PaperTexture />
    <div className="relative flex h-full flex-col px-4 pb-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2" style={{ background: C.forest, borderColor: C.forestDeep, color: C.cream }}>
            <Leaf className="h-4 w-4" />
          </span>
          <p className="font-serif text-[15px] font-bold" style={{ color: C.forest }}>FloraGrove</p>
        </div>
        <span className="font-mono text-[9px]" style={{ color: C.forest + "99" }}>
          plant stand · 4 shelves
        </span>
      </div>

      <h1 className="mt-3 font-serif text-[22px] leading-tight" style={{ color: C.forest }}>
        Your hand-drawn plant stand.
      </h1>
      <p className="mt-1 text-[11px]" style={{ color: C.forest + "AA" }}>
        Tap a slot to assign a real plant or your pixel sprout.
      </p>

      {/* Shelves */}
      <div className="mt-4 space-y-1">
        <ShelfRow
          label="Top shelf"
          sub="S · Sun-drenched"
          tone={C.amber}
          plants={["real", "real", "empty", "empty"]}
          status={{ text: "Happy · +2 leaves", color: C.sageDark }}
        />
        <ShelfRow
          label="Middle shelf"
          sub="E · Bright indirect"
          tone={C.rose}
          plants={["real", "pixel", "empty"]}
          status={{ text: "Just right ✓", color: C.sageDark }}
        />
        <ShelfRow
          label="Lower shelf"
          sub="W · Warm afternoon"
          tone={C.terracotta}
          plants={["empty", "real", "empty"]}
        />
        <ShelfRow
          label="Bottom shelf"
          sub="N · Low north light"
          tone={C.sage}
          plants={["wilted", "empty"]}
          status={{ text: "Seeking more light", color: "#B45309" }}
        />
      </div>

      {/* AI feedback */}
      <div className="mt-3">
        <AIFeedback
          type="warn"
          plant="Succulent"
          spot="Bottom shelf"
          msg="A bit too dark here — try the South windowsill on the top shelf!"
        />
      </div>

      <div className="mt-auto pt-3 flex gap-2">
        <button data-testid="v2-cta-real" className="flex-1 rounded-full border-2 py-3 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_3px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: C.forest, color: C.cream }}>
          Add real plant
        </button>
        <button data-testid="v2-cta-pixel" className="flex-1 rounded-full border-2 py-3 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_3px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: C.amber, color: C.forest }}>
          Adopt sprout
        </button>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 3 — Lo-Fi Virtual Desk / Diary
   ================================================================ */
const VariationThree = () => (
  <PhoneFrame tone="bg-[#EDE4CD]" testId="v3-desk-diary">
    <PaperTexture />
    <div className="relative flex h-full flex-col px-4 pb-4 pt-3">
      {/* Journal spine */}
      <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: C.forest + "22" }} />

      <div className="flex items-center justify-between">
        <button style={{ color: C.forest }}><ChevronLeft className="h-4 w-4" /></button>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: C.forest }}>FloraGrove Journal · Day 1</p>
        <BookOpen className="h-4 w-4" style={{ color: C.forest }} />
      </div>

      {/* Windowed desk scene */}
      <div className="mt-3 rounded-2xl border-2 p-3 shadow-[0_4px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: "linear-gradient(180deg, #DFF0F5 0%, #FBF6EA 60%, #E8D5B7 100%)" }}>
        {/* Window with blinds */}
        <div className="mx-auto w-32 rounded-t-xl border-2 p-1" style={{ borderColor: C.forest, background: C.paper }}>
          <div className="rounded border-2" style={{ borderColor: C.forest, background: "linear-gradient(180deg, #DFF0F5 0%, #F4C971 100%)", height: 60 }}>
            {/* Blind slats */}
            {[0, 1, 2].map(i => (
              <div key={i} className="h-3 border-b" style={{ background: "#F4C971AA", borderColor: C.forest + "55" }} />
            ))}
          </div>
          <p className="mt-1 text-center font-mono text-[8px] font-bold" style={{ color: C.forest }}>
            East window · half open
          </p>
        </div>
        {/* Light shaft */}
        <div className="relative mx-auto -mt-1 h-8 w-40" style={{ background: "linear-gradient(180deg, #F4C97166 0%, transparent 100%)", clipPath: "polygon(20% 0, 80% 0, 100% 100%, 0 100%)" }} />

        {/* Desk with pixel plant */}
        <div className="mt-2 flex justify-center">
          <CozySprout scale={1.5} />
        </div>
        {/* Desk surface */}
        <div className="mx-auto mt-1 h-2 w-56 rounded-full border-2" style={{ borderColor: C.forest, background: C.terracotta }} />
      </div>

      {/* Blind slider */}
      <div className="mt-3 rounded-2xl border-2 p-3 shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.paper }}>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>
            Blinds · Light control
          </p>
          <span className="font-mono text-[10px]" style={{ color: C.forest }}>50%</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Sunrise className="h-3.5 w-3.5" style={{ color: C.amber }} />
          <div className="relative h-2 flex-1 rounded-full" style={{ background: C.oatmeal }}>
            <div className="h-full rounded-full" style={{ width: "50%", background: C.forest }} />
            <span className="absolute -top-1 h-4 w-4 rounded-full border-2" style={{ left: "48%", background: C.amber, borderColor: C.forest }} />
          </div>
          <Sunset className="h-3.5 w-3.5" style={{ color: C.rose }} />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button data-testid="v3-water" className="flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_3px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: "#DFF0F5", color: C.forest }}>
          <Droplets className="h-3.5 w-3.5" /> Water
        </button>
        <button data-testid="v3-poke" className="flex items-center justify-center gap-2 rounded-xl border-2 py-3 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_3px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: C.amber, color: C.forest }}>
          <Wand2 className="h-3.5 w-3.5" /> Poke soil
        </button>
      </div>

      {/* Journal entry */}
      <div className="mt-3 rounded-2xl border-2 p-3 shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.paper }}>
        <p className="font-serif text-[13px] italic leading-relaxed" style={{ color: C.ink, fontFamily: "Georgia, serif" }}>
          &ldquo;Today pixel-Pothos got 4 hours of gentle morning light. Soil felt damp.
          Walked away. Small win.&rdquo;
        </p>
        <p className="mt-2 font-mono text-[9px]" style={{ color: C.forest + "AA" }}>
          &mdash; entry auto-drafted by FloraGrove
        </p>
      </div>

      <div className="mt-auto pt-3">
        <AIFeedback type="good" plant="pixel-Pothos" spot="East light + half blinds" msg="Balanced! Your practice will translate perfectly to a real Pothos." />
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 4 — Town Map & Community Greenhouse
   ================================================================ */
const TownMap = () => (
  <div className="relative h-56 w-full overflow-hidden rounded-3xl border-2 shadow-[0_4px_0_0_#3B2F2A]"
    style={{ borderColor: C.forest, background: "linear-gradient(180deg, #DFF0F5 0%, #E7EFD9 60%, #E8D5B7 100%)" }}>
    <svg viewBox="0 0 300 200" className="h-full w-full" aria-hidden="true">
      {/* Paths */}
      <path d="M0,140 Q80,120 150,130 T300,110" stroke={C.terracotta} strokeWidth="4" fill="none" strokeDasharray="4 4" />
      {/* Trees dotted */}
      {[[30, 60], [260, 50], [200, 170], [50, 170]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <circle r="10" fill={C.sage} />
          <rect x="-2" y="8" width="4" height="10" fill={C.terracottaDark} />
        </g>
      ))}

      {/* Home Cottage (left) */}
      <g transform="translate(60,80)">
        <polygon points="-25,15 -25,-5 0,-25 25,-5 25,15" fill={C.rose} stroke={C.forest} strokeWidth="2" />
        <polygon points="-25,-5 0,-25 25,-5" fill={C.terracotta} stroke={C.forest} strokeWidth="2" />
        <rect x="-6" y="0" width="12" height="15" fill={C.forest} />
        <rect x="-20" y="-2" width="8" height="8" fill={C.oatmeal} stroke={C.forest} strokeWidth="1" />
        <rect x="12" y="-2" width="8" height="8" fill={C.oatmeal} stroke={C.forest} strokeWidth="1" />
      </g>
      <text x="60" y="115" fontSize="9" fontWeight="700" fill={C.forest} textAnchor="middle">Home Cottage</text>
      <text x="60" y="125" fontSize="7" fill={C.forest + "AA"} textAnchor="middle">Low – moderate light</text>

      {/* Community Glasshouse (right) */}
      <g transform="translate(230,80)">
        <polygon points="-35,15 -35,-5 0,-30 35,-5 35,15" fill="#DFF0F5" stroke={C.forest} strokeWidth="2" />
        <line x1="-20" y1="-15" x2="-20" y2="15" stroke={C.forest} strokeWidth="1" />
        <line x1="0" y1="-30" x2="0" y2="15" stroke={C.forest} strokeWidth="1" />
        <line x1="20" y1="-15" x2="20" y2="15" stroke={C.forest} strokeWidth="1" />
        <line x1="-35" y1="0" x2="35" y2="0" stroke={C.forest} strokeWidth="1" />
        {/* Plants inside */}
        <circle cx="-15" cy="8" r="4" fill={C.sage} />
        <circle cx="15" cy="8" r="4" fill={C.sage} />
        <circle cx="0" cy="-5" r="5" fill={C.sageDark} />
        {/* Sun on top */}
        <circle cx="0" cy="-40" r="8" fill={C.amber} />
        <g stroke={C.amber} strokeWidth="1.5">
          <line x1="0" y1="-52" x2="0" y2="-48" />
          <line x1="-10" y1="-40" x2="-14" y2="-40" />
          <line x1="10" y1="-40" x2="14" y2="-40" />
        </g>
      </g>
      <text x="230" y="115" fontSize="9" fontWeight="700" fill={C.forest} textAnchor="middle">Community Glasshouse</text>
      <text x="230" y="125" fontSize="7" fill={C.forest + "AA"} textAnchor="middle">Full South sun</text>

      {/* Compass */}
      <g transform="translate(275,25)">
        <circle r="12" fill={C.paper} stroke={C.forest} strokeWidth="1.5" />
        <text y="-4" fontSize="6" fontWeight="700" fill={C.forest} textAnchor="middle">N</text>
        <text y="10" fontSize="6" fontWeight="700" fill={C.forest} textAnchor="middle">S</text>
        <text x="7" y="3" fontSize="6" fontWeight="700" fill={C.forest} textAnchor="middle">E</text>
        <text x="-7" y="3" fontSize="6" fontWeight="700" fill={C.forest} textAnchor="middle">W</text>
      </g>
    </svg>

    {/* Pin on Glasshouse */}
    <div className="absolute" style={{ left: "70%", top: 30 }}>
      <MapPin className="h-6 w-6 drop-shadow" style={{ color: C.terracotta, fill: C.amber }} />
    </div>
  </div>
);

const VariationFour = () => (
  <PhoneFrame tone="bg-[#F5F0E4]" testId="v4-town-map">
    <PaperTexture />
    <div className="relative flex h-full flex-col px-4 pb-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2" style={{ background: C.forest, borderColor: C.forestDeep, color: C.cream }}>
            <Map className="h-4 w-4" />
          </span>
          <p className="font-serif text-[15px] font-bold" style={{ color: C.forest }}>FloraGrove Village</p>
        </div>
        <span className="font-mono text-[9px]" style={{ color: C.forest + "99" }}>choose a home</span>
      </div>

      <h1 className="mt-3 font-serif text-[22px] leading-tight" style={{ color: C.forest }}>
        Where should your plant live?
      </h1>
      <p className="mt-1 text-[11px]" style={{ color: C.forest + "AA" }}>
        Two little worlds, both softly lit. Pick one to start.
      </p>

      <div className="mt-3">
        <TownMap />
      </div>

      {/* Toggle between locations */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button data-testid="v4-cottage" className="rounded-2xl border-2 p-3 text-left shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.paper }}>
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4" style={{ color: C.rose }} />
            <span className="font-mono text-[10px] font-bold uppercase" style={{ color: C.forest }}>Cottage</span>
          </div>
          <p className="mt-1 font-serif text-[13px] font-bold" style={{ color: C.forest }}>Grow at home</p>
          <p className="mt-0.5 text-[10px]" style={{ color: C.forest + "AA" }}>North & East light</p>
        </button>
        <button data-testid="v4-greenhouse" className="rounded-2xl border-2 p-3 text-left shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.forest, color: C.cream }}>
          <div className="flex items-center gap-2">
            <Trees className="h-4 w-4" style={{ color: C.amber }} />
            <span className="font-mono text-[10px] font-bold uppercase" style={{ color: C.amber }}>Glasshouse</span>
          </div>
          <p className="mt-1 font-serif text-[13px] font-bold">Shared solarium</p>
          <p className="mt-0.5 text-[10px]" style={{ color: C.cream + "AA" }}>Full South sun ☀</p>
        </button>
      </div>

      {/* Community strip */}
      <div className="mt-3 rounded-2xl border-2 p-2 shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.oatmeal }}>
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>
          Neighbours in the Glasshouse
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-1">
            {[C.sage, C.rose, C.amber, C.terracotta].map((c, i) => (
              <span key={i} className="h-6 w-6 rounded-full border-2" style={{ background: c, borderColor: C.forest }} />
            ))}
          </div>
          <p className="flex-1 text-[10px]" style={{ color: C.forest }}>
            <strong>Maya</strong>, <strong>James</strong> &amp; 12 others are watering right now
          </p>
        </div>
      </div>

      <div className="mt-3">
        <AIFeedback type="good" plant="Your Monstera" spot="Community Glasshouse" msg="Bright South sun — she'll thrive here. Auto-misted every 12 hours." />
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 5 — Retro Care Card Deck
   ================================================================ */
const VariationFive = () => (
  <PhoneFrame tone="bg-[#EDE4CD]" testId="v5-card-deck">
    <PaperTexture />
    <div className="relative flex h-full flex-col px-4 pb-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2" style={{ background: C.forest, borderColor: C.forestDeep, color: C.cream }}>
            <Feather className="h-4 w-4" />
          </span>
          <p className="font-serif text-[15px] font-bold" style={{ color: C.forest }}>Care Deck</p>
        </div>
        <span className="font-mono text-[9px]" style={{ color: C.forest + "99" }}>swipe to sort</span>
      </div>

      <h1 className="mt-3 font-serif text-[20px] leading-tight" style={{ color: C.forest }}>
        Swipe each card into its light.
      </h1>

      {/* Card stack */}
      <div className="relative mt-3 flex h-56 items-center justify-center">
        {/* Back card */}
        <div className="absolute h-52 w-52 rotate-6 rounded-2xl border-2 shadow-[0_3px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: C.paper }} />
        {/* Middle card */}
        <div className="absolute h-52 w-52 -rotate-3 rounded-2xl border-2 shadow-[0_3px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: C.oatmeal }} />
        {/* Front card */}
        <div className="relative h-52 w-52 rounded-2xl border-2 p-3 shadow-[0_5px_0_0_#3B2F2A]"
          style={{ borderColor: C.forest, background: C.paper }}>
          <div className="flex items-center justify-between">
            <span className="rounded-full border-2 px-1.5 py-0.5 font-mono text-[8px] font-bold" style={{ borderColor: C.forest, background: C.sage, color: C.forest }}>
              Tropical
            </span>
            <span className="font-mono text-[8px]" style={{ color: C.forest + "99" }}>1 of 5</span>
          </div>
          <div className="mt-2 flex justify-center">
            <CozySprout scale={1.3} />
          </div>
          <p className="mt-1 text-center font-serif text-[14px] font-bold" style={{ color: C.forest }}>Monstera Deliciosa</p>
          <p className="mt-0.5 text-center font-mono text-[9px]" style={{ color: C.forest + "AA" }}>
            Loves bright, gentle light
          </p>

          {/* Swipe arrows */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 rounded-full border-2 p-1" style={{ borderColor: C.forest, background: C.paper }}>
            <ChevronLeft className="h-4 w-4" style={{ color: C.forest }} />
          </div>
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 rounded-full border-2 p-1 shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.sage }}>
            <ChevronRight className="h-4 w-4" style={{ color: C.forest }} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>
        ⇢ drop into a zone below ⇠
      </p>

      {/* 4 zone slots */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { dir: "N", label: "North · Cool", tone: C.sage + "44", filled: false },
          { dir: "E", label: "East · Morning", tone: C.amber + "44", filled: true, plant: "pixel" },
          { dir: "S", label: "South · Bright", tone: C.terracotta + "44", filled: true, plant: "real" },
          { dir: "W", label: "West · Warm PM", tone: C.rose + "44", filled: false },
        ].map((z) => (
          <div key={z.dir} className="rounded-xl border-2 border-dashed p-2" style={{ borderColor: C.forest, background: z.tone }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold" style={{ color: C.forest }}>{z.dir}</span>
              <span className="font-mono text-[8px]" style={{ color: C.forest + "AA" }}>{z.label.split("·")[1]}</span>
            </div>
            <div className="mt-1 flex h-8 items-center justify-center">
              {z.filled ? (
                z.plant === "pixel" ? <CozySprout scale={0.55} /> : (
                  <svg viewBox="0 0 40 50" className="h-8"><rect x="12" y="30" width="16" height="16" fill={C.terracotta} /><path d="M8,28 Q20,10 32,28 Z" fill={C.sage} /></svg>
                )
              ) : (
                <span className="font-mono text-[9px] font-bold" style={{ color: C.forest + "88" }}>drop here</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Haptic-styled feedback */}
      <div className="mt-3 rounded-2xl border-2 p-2 text-center shadow-[0_3px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.sage + "40" }}>
        <p className="font-mono text-[11px] font-bold" style={{ color: C.forest }}>
          ✧ &nbsp; PERFECT MORNING LIGHT &nbsp; ✧
        </p>
        <p className="mt-0.5 font-mono text-[9px]" style={{ color: C.forest + "AA" }}>
          Monstera → East · +5 confidence
        </p>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 6 — Cozy Greenhouse Solarium
   ================================================================ */
const VariationSix = () => (
  <PhoneFrame tone="bg-[#F5F0E4]" testId="v6-solarium">
    <PaperTexture />
    <div className="relative flex h-full flex-col px-4 pb-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2" style={{ background: C.forest, borderColor: C.forestDeep, color: C.cream }}>
            <Trees className="h-4 w-4" />
          </span>
          <p className="font-serif text-[15px] font-bold" style={{ color: C.forest }}>The Solarium</p>
        </div>
        <span className="font-mono text-[9px]" style={{ color: C.forest + "99" }}>4 glass wings</span>
      </div>

      <h1 className="mt-3 font-serif text-[22px] leading-tight" style={{ color: C.forest }}>
        Place your plant. Meet its wing.
      </h1>

      {/* 4-quadrant solarium */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-3xl border-2 p-2 shadow-[0_4px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.oatmeal }}>
        {/* N */}
        <div className="relative overflow-hidden rounded-2xl border-2 p-2" style={{ borderColor: C.forest, background: "linear-gradient(180deg, #E7EFD9 0%, #F5F0E4 100%)", minHeight: 100 }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold" style={{ color: C.forest }}>N</span>
            <Cloud className="h-3 w-3" style={{ color: C.sage }} />
          </div>
          <p className="mt-0.5 font-mono text-[8px]" style={{ color: C.forest + "AA" }}>Cool · Indirect</p>
          <div className="mt-1 flex h-12 items-end justify-center">
            <svg viewBox="0 0 40 50" className="h-10"><rect x="12" y="30" width="16" height="16" fill={C.terracotta} /><path d="M8,28 Q20,15 32,28 Z" fill={C.sage} /></svg>
          </div>
        </div>
        {/* E */}
        <div className="relative overflow-hidden rounded-2xl border-2 p-2 ring-2" style={{ borderColor: C.forest, background: "linear-gradient(180deg, #FAE8B0 0%, #FBF6EA 100%)", minHeight: 100 }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold" style={{ color: C.forest }}>E</span>
            <Sunrise className="h-3 w-3" style={{ color: C.amber }} />
          </div>
          <p className="mt-0.5 font-mono text-[8px]" style={{ color: C.forest + "AA" }}>Morning · Gentle</p>
          <div className="mt-1 flex h-12 items-end justify-center">
            <CozySprout scale={0.9} />
          </div>
          {/* Active marker */}
          <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: C.forest, background: C.sage, color: C.paper }}>
            <Check className="h-3 w-3" />
          </span>
        </div>
        {/* S */}
        <div className="relative overflow-hidden rounded-2xl border-2 p-2" style={{ borderColor: C.forest, background: "linear-gradient(180deg, #F4C971 0%, #FBF6EA 100%)", minHeight: 100 }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold" style={{ color: C.forest }}>S</span>
            <Sun className="h-3 w-3" style={{ color: C.terracotta }} />
          </div>
          <p className="mt-0.5 font-mono text-[8px]" style={{ color: C.forest + "AA" }}>Bright · Hot</p>
          <div className="mt-1 flex h-12 items-end justify-center">
            <svg viewBox="0 0 40 50" className="h-10"><rect x="14" y="30" width="12" height="16" fill={C.terracotta} /><ellipse cx="20" cy="26" rx="8" ry="10" fill={C.sage} /></svg>
          </div>
        </div>
        {/* W */}
        <div className="relative overflow-hidden rounded-2xl border-2 p-2" style={{ borderColor: C.forest, background: "linear-gradient(180deg, #E8B87A 0%, #FBF6EA 100%)", minHeight: 100 }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold" style={{ color: C.forest }}>W</span>
            <Sunset className="h-3 w-3" style={{ color: C.rose }} />
          </div>
          <p className="mt-0.5 font-mono text-[8px]" style={{ color: C.forest + "AA" }}>Warm PM · Dry</p>
          <div className="mt-1 flex h-12 items-end justify-center">
            <span className="font-mono text-[10px] font-bold" style={{ color: C.forest + "88" }}>empty</span>
          </div>
        </div>
      </div>

      {/* Botanist's Journal overlay */}
      <div className="mt-3 rounded-2xl border-2 p-3 shadow-[0_4px_0_0_#3B2F2A]" style={{ borderColor: C.forest, background: C.paper }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: C.forest }} />
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: C.forest }}>Botanist's Journal</p>
          </div>
          <span className="rounded-full border-2 px-2 py-0.5 font-mono text-[8px] font-bold" style={{ borderColor: C.forest, background: C.sage, color: C.forest }}>
            Live assessment
          </span>
        </div>
        <p className="mt-2 font-serif text-[13px] leading-snug italic" style={{ color: C.ink, fontFamily: "Georgia, serif" }}>
          &ldquo;pixel-Pothos placed in the East wing. Soil moist, drainage
          strong, morning light generous.&rdquo;
        </p>

        {/* 3 metrics */}
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[
            { label: "Soil", val: "Damp", color: C.sage },
            { label: "Drain", val: "Good", color: C.sage },
            { label: "Light", val: "5h AM", color: C.amber },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border-2 p-1 text-center" style={{ borderColor: C.forest, background: C.paper }}>
              <p className="font-mono text-[8px] font-bold uppercase" style={{ color: C.forest }}>{m.label}</p>
              <p className="mt-0.5 font-serif text-[11px] font-bold" style={{ color: m.color }}>{m.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-3">
        <AIFeedback type="good" plant="pixel-Pothos" spot="East wing" msg="A wise first placement. Next: try a real Pothos in the same wing." />
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const CozyRoomPlannerVariations = () => {
  return (
    <div className="min-h-screen font-sans" style={{ background: "#EAE2CE" }} data-testid="cozy-room-planner-variations-page">
      <header className="border-b" style={{ borderColor: C.sage, background: C.paper }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: C.forest, color: C.cream }}>
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg" style={{ color: C.forest }}>
              FloraGrove &middot; Lo-Fi Cozy Room Planner &mdash; 6 mobile variations
            </span>
          </div>
          <span className="hidden font-mono text-xs sm:block" style={{ color: C.forest + "AA" }}>
            4 light zones · AI Spot-Check · dual-path
          </span>
        </div>
      </header>

      <VariationLabel number={1} title="Cozy Bedroom · Isometric View" subtitle="An isometric bedroom with East + South sun shafts. Tap a plant from the tray to place it. A paper-styled AI feedback card slides up." />
      <VariationOne />

      <VariationLabel number={2} title="Warm Botanical Shelf · Grid View" subtitle="A hand-drawn wooden plant stand with 4 shelves labelled by light. Colour-coded happiness badges + gentle AI warning." />
      <VariationTwo />

      <VariationLabel number={3} title="Lo-Fi Virtual Desk · Diary" subtitle="A paper journal spread with a window (adjustable blinds), a pixel plant on a desk, water &amp; poke buttons, and an auto-drafted diary entry." />
      <VariationThree />

      <VariationLabel number={4} title="Town Map · Community Greenhouse" subtitle="A cozy village map. Choose the Home Cottage (low-mod light) or the shared Glasshouse (bright South sun) with neighbour presence." />
      <VariationFour />

      <VariationLabel number={5} title="Retro Care Card Deck" subtitle="A stacked deck of pixelated plant cards. Swipe to sort into 4 zone slots below; retro haptic-style feedback banner celebrates the match." />
      <VariationFive />

      <VariationLabel number={6} title="Cozy Greenhouse Solarium" subtitle="Four glass wings (N/S/E/W) each tinted by their light quality. A hovering Botanist's Journal gives live soil/drainage/light metrics." />
      <VariationSix />

      <footer className="border-t" style={{ borderColor: C.sage, background: C.paper }}>
        <div className="mx-auto max-w-5xl px-6 py-8 font-mono text-xs" style={{ color: C.forest + "AA" }}>
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default CozyRoomPlannerVariations;
