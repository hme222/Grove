import React from "react";
import {
  Leaf,
  Sparkles,
  Droplets,
  ArrowRight,
  Check,
  X,
  Camera,
  Search,
  Plus,
  Gamepad2,
  Trophy,
  Sun,
  Zap,
  ScanLine,
  ChevronRight,
  Home,
  Compass,
  User,
  Wind,
  Wand2,
  Sprout,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * DualPathLandingVariations
 * ------------------------------------------------------------
 * Standalone static React component. Three mobile (portrait)
 * landing screen concepts serving two audiences simultaneously:
 *  A) Active Growers  (Add real plant / scan soil)
 *  B) Aspiring Growers (Adopt 8-bit pixel sprout to practice)
 *
 * No routing, no backend, no tests.
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared shell — phone frame + section label
   ================================================================ */
const PhoneFrame = ({ children, tone = "bg-[#FBFAF5]", testId }) => (
  <div className="relative mx-auto" style={{ width: 380 }} data-testid={testId}>
    <div className="rounded-[52px] bg-emerald-950 p-3 shadow-2xl shadow-emerald-950/25">
      <div
        className={`relative overflow-hidden rounded-[42px] ${tone}`}
        style={{ height: 820 }}
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
        className="rounded-full border-emerald-300 bg-white px-3 py-1 text-xs text-emerald-800"
      >
        Dual Path &middot; Active + Aspiring
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

/* ================================================================
   Reusable — 8-Bit Pixel Sprout (custom SVG)
   Grid: 14 cols × 16 rows, each pixel = 10px
   ================================================================ */
const PIX = 10;
// P = palette
const P = {
  bg: "transparent",
  pot: "#B45309", // orange-brown
  potShadow: "#7C2D12",
  soil: "#3F2A17",
  soilLight: "#5C3A20",
  stem: "#059669",
  stemDark: "#065F46",
  leaf: "#22C55E",
  leafDark: "#16A34A",
  leafShine: "#86EFAC",
  eye: "#0F172A",
  eyeShine: "#FBFAF5",
  mouth: "#0F172A",
  cheek: "#F472B6",
};

/* Encoded sprite: 14 cols × 16 rows using palette keys */
const sprite = [
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
  ".....ss.......",
  ".....SS.......",
  "....pppp......",
  "...pppppp.....",
  "...oooooo.....",
  "....oooo......",
];
const spriteMap = {
  s: P.stem,
  S: P.stemDark,
  L: P.leaf,
  l: P.leafDark,
  w: P.eyeShine,
  e: P.eye,
  m: P.mouth,
  c: P.cheek,
  p: P.pot,
  o: P.soil,
};

const PixelSprout = ({ scale = 1, sway = false }) => {
  const width = sprite[0].length * PIX;
  const height = sprite.length * PIX;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      className={sway ? "origin-bottom animate-pulse" : ""}
      aria-label="8-bit pixel sprout"
    >
      {sprite.map((row, y) =>
        row.split("").map((ch, x) => {
          const color = spriteMap[ch];
          if (!color) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * PIX}
              y={y * PIX}
              width={PIX}
              height={PIX}
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
};

/* Pixel button — thick shadow retro style */
const PixelButton = ({ children, tone = "emerald", ...props }) => {
  const styles = {
    emerald: "bg-emerald-500 border-emerald-700 shadow-[0_4px_0_0_#065F46]",
    amber: "bg-amber-400 border-amber-600 shadow-[0_4px_0_0_#78350F]",
    sky: "bg-sky-400 border-sky-600 shadow-[0_4px_0_0_#075985]",
    rose: "bg-rose-400 border-rose-600 shadow-[0_4px_0_0_#9F1239]",
  }[tone];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-none border-2 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white transition active:translate-y-1 active:shadow-[0_0_0_0_#065F46] ${styles} ${props.className || ""}`}
    >
      {children}
    </button>
  );
};

/* Pixel progress bar */
const PixelBar = ({ value = 60, label = "H₂O", accent = "bg-sky-400" }) => (
  <div className="flex items-center gap-2">
    <span className="w-8 font-mono text-[9px] font-bold text-emerald-950">
      {label}
    </span>
    <div className="relative flex h-3 flex-1 border-2 border-emerald-950 bg-white">
      <div
        className={`h-full ${accent}`}
        style={{
          width: `${value}%`,
          backgroundImage:
            "linear-gradient(90deg, currentColor 0 5px, transparent 5px 8px)",
          backgroundSize: "8px 100%",
        }}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold text-emerald-950">
        {value}%
      </span>
    </div>
  </div>
);

/* Pixel stat pill */
const PixelStat = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center border-2 border-emerald-950 bg-white px-2 py-1.5">
    <Icon className={`h-3.5 w-3.5 ${color}`} />
    <span className="mt-0.5 font-mono text-[9px] font-bold uppercase text-emerald-950">
      {label}
    </span>
    <span className="font-mono text-[11px] font-bold text-emerald-950">
      {value}
    </span>
  </div>
);

/* ================================================================
   Real-plant "Path A" sub-widgets (reused across variations)
   ================================================================ */
const RealPlantOptions = ({ compact = false }) => (
  <div className={`space-y-3 ${compact ? "" : "mt-4"}`}>
    <button
      data-testid="add-first-plant"
      className="flex w-full items-center gap-4 rounded-2xl border-2 border-emerald-800 bg-emerald-900 p-4 text-left text-white shadow-md ring-2 ring-emerald-800"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-800">
        <Plus className="h-5 w-5 text-lime-200" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-lime-200">
          Recommended
        </p>
        <p className="mt-0.5 text-[14px] font-bold">Add My First Plant</p>
        <p className="text-[11px] text-emerald-100/80">
          Name it, snap it, place it &mdash; 30 seconds.
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-lime-200" />
    </button>
    <button
      data-testid="scan-soil"
      className="flex w-full items-center gap-4 rounded-2xl border-2 border-emerald-200 bg-white p-4 text-left"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
        <ScanLine className="h-5 w-5 text-emerald-800" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
          AI-powered
        </p>
        <p className="mt-0.5 text-[14px] font-bold text-emerald-950">
          Scan Soil with AI
        </p>
        <p className="text-[11px] text-emerald-800/70">
          We&rsquo;ll read moisture, mix &amp; light from a photo.
        </p>
      </div>
      <Camera className="h-4 w-4 text-emerald-800" />
    </button>
  </div>
);

/* Virtual pet mini widget (used in tab-switched view) */
const VirtualPetCard = () => (
  <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-950 bg-gradient-to-b from-sky-200 via-sky-100 to-lime-100 shadow-[0_6px_0_0_#052E16]">
    {/* Pixel grid background */}
    <div
      className="pointer-events-none absolute inset-0 opacity-25"
      style={{
        backgroundImage:
          "linear-gradient(#065F4640 1px, transparent 1px), linear-gradient(90deg, #065F4640 1px, transparent 1px)",
        backgroundSize: "10px 10px",
      }}
    />

    <div className="relative p-4">
      <div className="flex items-center justify-between">
        <span className="border-2 border-emerald-950 bg-amber-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-950">
          Lv 1
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-950">
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          <Star className="h-3 w-3 text-emerald-950/30" />
        </span>
      </div>

      {/* Sprout stage */}
      <div className="mt-2 flex justify-center">
        <PixelSprout scale={1.4} />
      </div>

      {/* Name */}
      <p className="mt-1 text-center font-mono text-[13px] font-bold uppercase tracking-widest text-emerald-950">
        pixel-Pothos
      </p>
      <p className="text-center font-mono text-[9px] text-emerald-900/70">
        Adopted 30 seconds ago
      </p>

      {/* Stat bars */}
      <div className="mt-4 space-y-1.5 rounded-none border-2 border-emerald-950 bg-white/80 p-2.5">
        <PixelBar value={45} label="H₂O" accent="bg-sky-400" />
        <PixelBar value={80} label="SUN" accent="bg-amber-400" />
        <PixelBar value={70} label="JOY" accent="bg-rose-400" />
      </div>

      {/* Action row */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <PixelButton tone="sky" data-testid="pet-water">
          <Droplets className="h-3 w-3" />
          Water
        </PixelButton>
        <PixelButton tone="amber" data-testid="pet-sun">
          <Sun className="h-3 w-3" />
          Sun
        </PixelButton>
        <PixelButton tone="rose" data-testid="pet-clean">
          <Wind className="h-3 w-3" />
          Dust
        </PixelButton>
      </div>

      <p className="mt-3 text-center font-mono text-[9px] text-emerald-900/70">
        Poke the soil &middot; test the 2&Prime; rule virtually
      </p>
    </div>
  </div>
);

/* ================================================================
   VARIATION 1 — Toggle Switch Layout
   ================================================================ */
const VariationOne = () => (
  <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-toggle-switch">
    <div className="flex h-full flex-col px-5 pb-6 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Leaf className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-bold text-emerald-950">FloraGrove</p>
            <p className="text-[10px] text-emerald-700">
              Welcome, Maya &middot; step 1 of 2
            </p>
          </div>
        </div>
        <button className="text-[11px] font-medium text-emerald-800/70">
          Skip
        </button>
      </div>

      {/* Big question */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          One quick question
        </p>
        <h1 className="mt-1 font-serif text-[26px] leading-tight text-emerald-950">
          Do you have any real plants yet?
        </h1>
        <p className="mt-1 text-[12px] text-emerald-800/70">
          Either way, we&rsquo;ve got a warm start for you.
        </p>
      </div>

      {/* Toggle */}
      <div
        className="mt-5 flex rounded-full bg-emerald-100 p-1"
        data-testid="v1-toggle"
      >
        <button className="flex-1 rounded-full px-3 py-2 text-[12px] font-semibold text-emerald-800">
          I have plants
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-900 px-3 py-2 text-[12px] font-bold text-white shadow-md">
          <Gamepad2 className="h-3.5 w-3.5" />
          No plants yet
        </button>
      </div>

      {/* Hero card — showing "No plants yet" state */}
      <div className="mt-5">
        <VirtualPetCard />
      </div>

      {/* Ghosted alternate for context */}
      <div className="mt-4 rounded-2xl border border-dashed border-emerald-300 bg-white/50 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
            <ScanLine className="h-4 w-4 text-emerald-800" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-emerald-950">
              Got a real plant later?
            </p>
            <p className="text-[10px] text-emerald-800/60">
              Flip the switch above any time.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-800/60" />
        </div>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 2 — Two-Road Split Card Layout
   ================================================================ */
const VariationTwo = () => (
  <PhoneFrame tone="bg-[#F5F3EC]" testId="v2-split-cards">
    <div className="flex h-full flex-col px-5 pb-6 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white">
            <Leaf className="h-4 w-4" />
          </span>
          <p className="text-[13px] font-bold text-emerald-950">FloraGrove</p>
        </div>
        <button className="text-[11px] font-medium text-emerald-800/70">
          Skip
        </button>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Choose your path
        </p>
        <h1 className="mt-1 font-serif text-[24px] leading-tight text-emerald-950">
          Grow real or grow pixel.
          <br />
          <span className="italic text-emerald-700">Either counts.</span>
        </h1>
      </div>

      {/* Top card — Real Jungle */}
      <Card className="relative mt-4 overflow-hidden rounded-3xl border-none shadow-lg">
        {/* Botanical background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-lime-50 to-emerald-200" />
        <svg
          viewBox="0 0 300 200"
          className="absolute inset-0 h-full w-full opacity-40"
          aria-hidden="true"
        >
          <path
            d="M0,180 Q80,120 160,150 T300,140 L300,200 L0,200 Z"
            fill="#059669"
          />
          <path
            d="M0,190 Q80,150 160,175 T300,170 L300,200 L0,200 Z"
            fill="#065F46"
            opacity="0.6"
          />
        </svg>
        <CardContent className="relative p-5">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-emerald-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
              Path A &middot; Real Plants
            </span>
            <Leaf className="h-5 w-5 text-emerald-700" />
          </div>
          <h2 className="mt-3 font-serif text-[22px] leading-tight text-emerald-950">
            Grow My Real Jungle
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-emerald-900/75">
            Catalog every leafy soul in your home. Get care schedules, light
            maps, and vet-checked pet safety.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <Camera className="mr-0.5 inline h-2.5 w-2.5" /> Photo ID
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <ScanLine className="mr-0.5 inline h-2.5 w-2.5" /> Soil scan
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <Sun className="mr-0.5 inline h-2.5 w-2.5" /> Light map
            </span>
          </div>
          <Button
            data-testid="v2-cta-real"
            className="mt-4 h-11 w-full rounded-full bg-emerald-900 text-sm hover:bg-emerald-800"
          >
            Catalog My Plants
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Divider "or" */}
      <div className="my-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-800/50">
        <span className="h-px flex-1 bg-emerald-200" />
        or
        <span className="h-px flex-1 bg-emerald-200" />
      </div>

      {/* Bottom card — Virtual Sprout (pixel) */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-950 bg-gradient-to-b from-sky-200 to-lime-100 shadow-[0_6px_0_0_#052E16]">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(#065F4640 1px, transparent 1px), linear-gradient(90deg, #065F4640 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }}
        />
        <div className="relative flex items-center gap-3 p-4">
          <div className="shrink-0">
            <PixelSprout scale={1.2} />
          </div>
          <div className="flex-1">
            <span className="border-2 border-emerald-950 bg-amber-400 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-950">
              Path B &middot; Pixel
            </span>
            <p className="mt-2 font-mono text-[14px] font-bold uppercase tracking-widest text-emerald-950">
              Adopt a
              <br />
              Virtual Sprout
            </p>
            <p className="mt-1 font-mono text-[10px] text-emerald-900/80">
              Practice the 2&Prime; soil rule risk-free.
            </p>
          </div>
        </div>
        <div className="relative flex items-center justify-between border-t-2 border-emerald-950 bg-white/60 px-4 py-2">
          <span className="font-mono text-[10px] font-bold text-emerald-950">
            🌱 pixel-Pothos awaits
          </span>
          <PixelButton tone="emerald" data-testid="v2-cta-pixel">
            Start 8-Bit Training
          </PixelButton>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 3 — Gamified Desk Dashboard (8-bit default)
   ================================================================ */
const VariationThree = () => (
  <PhoneFrame
    tone="bg-gradient-to-b from-sky-300 via-sky-200 to-lime-200"
    testId="v3-gamified-desk"
  >
    {/* Pixel grid background */}
    <div
      className="pointer-events-none absolute inset-0 opacity-20"
      style={{
        backgroundImage:
          "linear-gradient(#052E1660 1px, transparent 1px), linear-gradient(90deg, #052E1660 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }}
    />

    <div className="relative flex h-full flex-col px-4 pb-3 pt-3">
      {/* Retro HUD header */}
      <div className="flex items-center justify-between border-2 border-emerald-950 bg-emerald-900 px-3 py-2 text-white shadow-[0_4px_0_0_#052E16]">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center border-2 border-emerald-950 bg-lime-400">
            <Gamepad2 className="h-3 w-3 text-emerald-950" />
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
            grove.arcade
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-300" />
            120 XP
          </span>
          <span>·</span>
          <span className="text-lime-200">DAY 1</span>
        </div>
      </div>

      {/* Sub greeting */}
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-emerald-950">
        &raquo; welcome to your desk &laquo;
      </p>

      {/* Desk scene */}
      <div className="relative mt-2 overflow-hidden border-4 border-emerald-950 bg-gradient-to-b from-sky-100 via-white to-amber-100 shadow-[0_6px_0_0_#052E16]">
        {/* Window pane on wall */}
        <div className="absolute left-3 top-3 border-2 border-emerald-950 bg-sky-200 p-1">
          <div className="grid grid-cols-2 gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="block h-4 w-6 bg-sky-100" />
            ))}
          </div>
          <span className="mt-0.5 flex items-center justify-center font-mono text-[8px] font-bold text-emerald-950">
            <Sun className="mr-0.5 h-2 w-2 text-amber-500" /> east
          </span>
        </div>

        {/* Small dust particles */}
        {[
          { x: 60, y: 20 },
          { x: 200, y: 40 },
          { x: 250, y: 25 },
        ].map((d, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 bg-emerald-950/40"
            style={{ left: d.x, top: d.y }}
          />
        ))}

        {/* Desk surface */}
        <div className="absolute inset-x-0 bottom-0 h-16 border-t-4 border-emerald-950 bg-amber-700" />
        <div className="absolute inset-x-0 bottom-14 h-2 bg-amber-800" />

        {/* Pet centered */}
        <div className="relative flex justify-center pt-14 pb-6">
          <PixelSprout scale={2} />
        </div>

        {/* Speech bubble */}
        <div className="absolute right-3 top-6 border-2 border-emerald-950 bg-white px-2 py-1 shadow-[0_3px_0_0_#052E16]">
          <p className="font-mono text-[9px] font-bold text-emerald-950">
            &ldquo;I&rsquo;m thirsty!&rdquo;
          </p>
          <span className="absolute -bottom-2 left-3 h-2 w-2 rotate-45 border-b-2 border-r-2 border-emerald-950 bg-white" />
        </div>

        {/* Name plate */}
        <div className="absolute inset-x-0 bottom-2 flex justify-center">
          <span className="border-2 border-emerald-950 bg-lime-300 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-950">
            pixel-Pothos &middot; lv 1
          </span>
        </div>
      </div>

      {/* Stat pills row */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <PixelStat icon={Droplets} label="H₂O" value="45%" color="text-sky-600" />
        <PixelStat icon={Sun} label="Sun" value="80%" color="text-amber-500" />
        <PixelStat icon={Sparkles} label="Joy" value="70%" color="text-rose-500" />
      </div>

      {/* Action pad */}
      <div className="mt-3 border-2 border-emerald-950 bg-white p-2 shadow-[0_4px_0_0_#052E16]">
        <p className="mb-1.5 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-950">
          &raquo; care actions &laquo;
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          <PixelButton tone="sky" data-testid="v3-water" className="!px-1 !py-2">
            <Droplets className="h-3 w-3" />
          </PixelButton>
          <PixelButton tone="amber" data-testid="v3-sun" className="!px-1 !py-2">
            <Sun className="h-3 w-3" />
          </PixelButton>
          <PixelButton tone="rose" data-testid="v3-dust" className="!px-1 !py-2">
            <Wind className="h-3 w-3" />
          </PixelButton>
          <PixelButton
            tone="emerald"
            data-testid="v3-poke"
            className="!px-1 !py-2"
          >
            <Wand2 className="h-3 w-3" />
          </PixelButton>
        </div>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5 font-mono text-[8px] font-bold uppercase text-emerald-950">
          <span className="text-center">water</span>
          <span className="text-center">sun</span>
          <span className="text-center">dust</span>
          <span className="text-center">poke</span>
        </div>
      </div>

      {/* Quest / mission */}
      <div className="mt-2 flex items-center gap-2 border-2 border-emerald-950 bg-amber-100 px-2 py-1.5 shadow-[0_3px_0_0_#052E16]">
        <Trophy className="h-4 w-4 shrink-0 text-amber-700" />
        <div className="flex-1">
          <p className="font-mono text-[9px] font-bold uppercase text-emerald-950">
            Quest &middot; 2&Prime; soil test
          </p>
          <p className="font-mono text-[9px] text-emerald-900/80">
            Poke soil &middot; earn 30 XP
          </p>
        </div>
        <span className="border-2 border-emerald-950 bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-950">
          0/1
        </span>
      </div>

      {/* Skip banner */}
      <div className="mt-auto pt-2">
        <button
          data-testid="v3-cta-skip-to-real"
          className="flex w-full items-center gap-3 rounded-2xl border border-emerald-800 bg-white/90 p-3 text-left backdrop-blur"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
            <Sprout className="h-4 w-4 text-emerald-800" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-emerald-950">
              Already have real plants?
            </p>
            <p className="text-[10px] text-emerald-800/60">
              Skip to real plant tracking &rarr;
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-emerald-800" />
        </button>
      </div>
    </div>
  </PhoneFrame>
);

/* ================================================================
   BONUS — Ghosted "I have plants" toggle state for Variation 1
   (helps reviewers see both states of the toggle)
   ================================================================ */
const VariationOneAltState = () => (
  <div className="mx-auto max-w-3xl px-6 pt-10 pb-24">
    <div className="mb-6 flex items-center gap-3">
      <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
        Variation 1 &middot; alt state
      </span>
      <span className="h-px flex-1 bg-emerald-200" />
    </div>
    <h2 className="mb-4 font-serif text-2xl text-emerald-950">
      Toggle: &ldquo;I have plants&rdquo; active
    </h2>
    <p className="mb-8 max-w-2xl text-sm text-emerald-800/70">
      For completeness &mdash; the same screen with the other toggle side
      active, showing the real-plant flow.
    </p>
    <div className="flex justify-center">
      <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-alt-real">
        <div className="flex h-full flex-col px-5 pb-6 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-white">
                <Leaf className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-emerald-950">FloraGrove</p>
                <p className="text-[10px] text-emerald-700">
                  Welcome, Maya &middot; step 1 of 2
                </p>
              </div>
            </div>
            <button className="text-[11px] font-medium text-emerald-800/70">
              Skip
            </button>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              One quick question
            </p>
            <h1 className="mt-1 font-serif text-[26px] leading-tight text-emerald-950">
              Do you have any real plants yet?
            </h1>
          </div>

          <div className="mt-5 flex rounded-full bg-emerald-100 p-1">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-900 px-3 py-2 text-[12px] font-bold text-white shadow-md">
              <Sprout className="h-3.5 w-3.5" />
              I have plants
            </button>
            <button className="flex-1 rounded-full px-3 py-2 text-[12px] font-semibold text-emerald-800">
              No plants yet
            </button>
          </div>

          {/* Real hero card */}
          <Card className="mt-5 overflow-hidden rounded-3xl border-none bg-gradient-to-br from-emerald-100 via-lime-50 to-emerald-50 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                  Real plants
                </span>
                <Leaf className="h-5 w-5 text-emerald-700" />
              </div>
              <h2 className="mt-3 font-serif text-[22px] leading-tight text-emerald-950">
                Meet your first leafy soul.
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-emerald-900/75">
                Two quick ways to bring a plant into FloraGrove &mdash; pick whichever
                feels easier right now.
              </p>
              <RealPlantOptions />
            </CardContent>
          </Card>

          <div className="mt-4 rounded-2xl border border-dashed border-emerald-300 bg-white/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                <Gamepad2 className="h-4 w-4 text-emerald-800" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-emerald-950">
                  Curious about the pixel sprout?
                </p>
                <p className="text-[10px] text-emerald-800/60">
                  Flip the switch above to meet pixel-Pothos.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-800/60" />
            </div>
          </div>
        </div>
      </PhoneFrame>
    </div>
  </div>
);

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const DualPathLandingVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="dual-path-landing-variations-page"
    >
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              FloraGrove &middot; Dual-path landing &mdash; 3 mobile variations
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            Real plants + 8-bit pixel sprout
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Toggle Switch Layout"
        subtitle="A modern header + toggle pill on top; hero card below swaps between the pixel-sprout widget (shown active) and the real-plant scanner. Includes a ghosted &lsquo;flip later&rsquo; nudge."
      />
      <VariationOne />

      {/* Show the alternate toggle state to help reviewers */}
      <VariationOneAltState />

      <VariationLabel
        number={2}
        title="Two-Road Split Card Layout"
        subtitle="Beautiful botanical Path A card (Catalog My Plants) stacked over a retro border pixel Path B card (Start 8-Bit Training) &mdash; separated by a soft &lsquo;or&rsquo; divider."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="Gamified Desk Dashboard"
        subtitle="The 8-bit experience is the default hero. Retro HUD with XP + day count, a pixel desk scene with pixel-Pothos and a speech bubble, HP/Sun/Joy stat pills, a 4-button action pad, an active quest, and a clean skip-to-real banner."
      />
      <VariationThree />

      <footer className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-emerald-800/60">
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default DualPathLandingVariations;
