import React from "react";
import {
  Leaf,
  Sparkles,
  Sun,
  Droplets,
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Sprout,
  Wind,
  Home,
  Search,
  User,
  Bell,
  Flame,
  BookOpen,
  ChevronRight,
  Star,
  ShieldCheck,
  Camera,
  Compass,
  PlayCircle,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

/**
 * PostOnboardingVariations
 * ------------------------------------------------------------
 * Standalone static React component. Shows FIVE distinct mobile
 * (portrait) post-onboarding welcome screen mockups for Grove.
 *
 * Each variation is rendered inside a phone-frame wrapper, stacked
 * vertically with labeled section headers. No routing, no data
 * fetching — purely static UI for internal review.
 * ------------------------------------------------------------
 */

/* ================================================================
   Shared shell — phone frame + section label
   ================================================================ */
const PhoneFrame = ({ children, tone = "bg-[#FBFAF5]", testId }) => (
  <div className="relative mx-auto" style={{ width: 380 }} data-testid={testId}>
    {/* Outer bezel */}
    <div className="rounded-[52px] bg-emerald-950 p-3 shadow-2xl shadow-emerald-950/25">
      {/* Inner screen */}
      <div
        className={`relative overflow-hidden rounded-[42px] ${tone}`}
        style={{ height: 780 }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-7 pt-4 pb-2 text-[11px] font-semibold text-emerald-950">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-950" />
            <span className="ml-1 h-2 w-4 rounded-sm border border-emerald-950" />
          </span>
        </div>
        {/* Notch */}
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-emerald-950" />
        {/* Screen content */}
        <div className="relative h-[calc(100%-30px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  </div>
);

const VariationLabel = ({ number, title, subtitle, persona }) => (
  <div className="mx-auto max-w-3xl px-6 pt-20 pb-8 text-left">
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
        Variation {number}
      </span>
      {persona && (
        <Badge
          variant="outline"
          className="rounded-full border-emerald-300 bg-white px-3 py-1 text-xs text-emerald-800"
        >
          {persona}
        </Badge>
      )}
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
   Shared — bottom tab bar mock
   ================================================================ */
const BottomTabBar = ({ active = "home", tone = "bg-white/95" }) => {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "explore", icon: Compass, label: "Explore" },
    { id: "care", icon: Droplets, label: "Care" },
    { id: "you", icon: User, label: "You" },
  ];
  return (
    <div
      className={`absolute inset-x-3 bottom-3 flex items-center justify-around rounded-3xl border border-emerald-100 ${tone} px-2 py-3 shadow-lg shadow-emerald-900/5 backdrop-blur`}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <div
            key={t.id}
            className="flex flex-col items-center gap-1"
            data-testid={`tab-${t.id}`}
          >
            <Icon
              className={`h-5 w-5 ${
                isActive ? "text-emerald-800" : "text-emerald-900/40"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                isActive ? "text-emerald-900" : "text-emerald-900/40"
              }`}
            >
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ================================================================
   VARIATION 1 — Dashboard Home (Heartbroken Optimist)
   ================================================================ */
const VariationOne = () => (
  <PhoneFrame tone="bg-[#F7F5EE]" testId="v1-heartbroken-optimist">
    <div className="px-5 pb-28 pt-3">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
            Welcome, Maya
          </p>
          <h1 className="mt-1 font-serif text-[26px] leading-tight text-emerald-950">
            You&rsquo;re a
            <br />
            <span className="italic text-emerald-700">Heartbroken Optimist</span>
            .
          </h1>
        </div>
        <button className="rounded-full bg-white p-2 shadow-sm">
          <Bell className="h-4 w-4 text-emerald-800" />
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-emerald-900/70">
        The plants you&rsquo;ve lost weren&rsquo;t wasted &mdash; they taught you
        what to try next. We&rsquo;ll go slowly, together.
      </p>

      {/* Persona badge card */}
      <Card className="mt-5 overflow-hidden rounded-2xl border-none bg-gradient-to-br from-rose-100 via-amber-50 to-emerald-100">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70">
            <Heart className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
              Your care style
            </p>
            <p className="mt-0.5 text-sm font-medium text-emerald-950">
              Gentle, low-stakes, forgiveness-first
            </p>
          </div>
        </CardContent>
      </Card>

      {/* First tiny step */}
      <div className="mt-6 flex items-end justify-between">
        <h2 className="font-serif text-lg text-emerald-950">
          Your first tiny step
        </h2>
        <span className="text-[11px] font-medium text-emerald-700">
          ~ 2 min
        </span>
      </div>

      <Card className="mt-3 rounded-2xl border-emerald-100 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
              <Sprout className="h-4 w-4 text-emerald-800" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-emerald-950">
                Pick one nearly-unkillable plant
              </p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-900/70">
                We hand-picked 3 species that forgive missed waterings and thrive
                on neglect. No pressure &mdash; just a soft first win.
              </p>
            </div>
          </div>

          {/* Plant chips */}
          <div className="mt-4 flex gap-2 overflow-hidden">
            {[
              { name: "ZZ Plant", tag: "Forgiving" },
              { name: "Snake Plant", tag: "Bulletproof" },
              { name: "Pothos", tag: "Easy" },
            ].map((p) => (
              <div
                key={p.name}
                className="flex-1 rounded-xl bg-emerald-50 px-3 py-2.5 text-center"
              >
                <p className="text-xs font-semibold text-emerald-950">
                  {p.name}
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-700">{p.tag}</p>
              </div>
            ))}
          </div>

          <Button
            className="mt-4 h-11 w-full rounded-xl bg-emerald-900 text-sm hover:bg-emerald-800"
            data-testid="v1-cta-pick-plant"
          >
            Choose my starter plant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Reassuring daily tip */}
      <Card className="mt-4 rounded-2xl border-none bg-emerald-950 text-emerald-50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Today&rsquo;s tiny reassurance
          </div>
          <p className="mt-3 font-serif text-base leading-snug">
            &ldquo;Most &lsquo;dead&rsquo; plants are just thirsty roots
            underground. Let&rsquo;s check before we grieve.&rdquo;
          </p>
          <button className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-100">
            Learn the 3-finger test
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </CardContent>
      </Card>

      {/* Confidence check-in */}
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/70 p-4">
        <div>
          <p className="text-xs font-medium text-emerald-700">
            Confidence check-in
          </p>
          <p className="mt-0.5 text-sm font-medium text-emerald-950">
            How are you feeling today?
          </p>
        </div>
        <div className="flex gap-1.5">
          {["😔", "😐", "🙂", "🌱"].map((e) => (
            <button
              key={e}
              className="h-9 w-9 rounded-full bg-emerald-50 text-base hover:bg-emerald-100"
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>

    <BottomTabBar active="home" />
  </PhoneFrame>
);

/* ================================================================
   VARIATION 2 — Story-Driven Welcome (Green Dreamer)
   ================================================================ */
const VariationTwo = () => (
  <PhoneFrame
    tone="bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950"
    testId="v2-green-dreamer"
  >
    {/* Decorative organic blob */}
    <svg
      className="pointer-events-none absolute -right-20 -top-10 h-80 w-80 opacity-40"
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M280,80 C340,120 360,220 320,290 C280,360 180,380 120,330 C60,280 40,180 100,110 C160,40 220,40 280,80 Z"
        fill="url(#glow)"
      />
      <defs>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#D9F99D" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#065F46" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>

    <div className="relative px-5 pb-28 pt-4 text-emerald-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50/10 backdrop-blur">
            <Leaf className="h-4 w-4 text-lime-200" />
          </span>
          <span className="text-xs font-medium tracking-widest text-emerald-100/70">
            GROVE
          </span>
        </div>
        <button className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-emerald-50 backdrop-blur">
          Skip tour
        </button>
      </div>

      <p className="mt-8 text-xs font-medium uppercase tracking-widest text-lime-200">
        Welcome, James
      </p>
      <h1 className="mt-2 font-serif text-[32px] leading-[1.05] text-white">
        You&rsquo;re a
        <br />
        <span className="italic text-lime-200">Green Dreamer</span>.
      </h1>
      <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-emerald-50/80">
        You see a lush, canopy-filled living room by next spring. We see the six
        plants that&rsquo;ll get you there &mdash; hardy, beautiful, and made for
        big visions.
      </p>

      {/* Dream jungle carousel */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            Your dream jungle, starter kit
          </p>
          <span className="text-[11px] text-emerald-100/60">6 plants</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[
            {
              name: "Monstera Deliciosa",
              tag: "Statement",
              color: "from-emerald-400 to-emerald-700",
            },
            {
              name: "Fiddle Leaf Fig",
              tag: "Vertical drama",
              color: "from-lime-400 to-emerald-600",
            },
            {
              name: "Bird of Paradise",
              tag: "Skyline",
              color: "from-teal-400 to-emerald-700",
            },
          ].map((p) => (
            <div
              key={p.name}
              className="w-40 shrink-0 overflow-hidden rounded-2xl bg-white/10 backdrop-blur"
            >
              <div
                className={`h-24 bg-gradient-to-br ${p.color} flex items-end justify-end p-2`}
              >
                <Leaf className="h-5 w-5 text-white/70" />
              </div>
              <div className="p-3">
                <p className="text-[13px] font-semibold text-white">{p.name}</p>
                <p className="mt-0.5 text-[10px] text-emerald-100/70">{p.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aesthetic goal card */}
      <Card className="mt-6 rounded-2xl border-none bg-white/10 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-lime-200">
              Your vision
            </p>
            <Star className="h-4 w-4 text-lime-200" />
          </div>
          <p className="mt-2 font-serif text-lg text-white">
            &ldquo;A canopy over my reading chair&rdquo;
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-100/70">
            <span>Style: Tropical maximalist</span>
            <span>&middot;</span>
            <span>Timeline: 6 mo</span>
          </div>
        </CardContent>
      </Card>

      <Button
        className="mt-6 h-12 w-full rounded-full bg-lime-200 text-sm font-semibold text-emerald-950 hover:bg-lime-100"
        data-testid="v2-cta-build-jungle"
      >
        Start building my jungle
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      <button className="mt-3 flex w-full items-center justify-center gap-2 text-[12px] font-medium text-emerald-100/70">
        <PlayCircle className="h-4 w-4" />
        Watch the 40-sec tour
      </button>
    </div>

    <div className="absolute inset-x-3 bottom-3 flex items-center justify-around rounded-3xl border border-white/10 bg-emerald-950/70 px-2 py-3 backdrop-blur">
      {[
        { id: "home", icon: Home, label: "Home", active: true },
        { id: "explore", icon: Compass, label: "Explore" },
        { id: "care", icon: Droplets, label: "Care" },
        { id: "you", icon: User, label: "You" },
      ].map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.id} className="flex flex-col items-center gap-1">
            <Icon
              className={`h-5 w-5 ${
                t.active ? "text-lime-200" : "text-emerald-100/40"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                t.active ? "text-white" : "text-emerald-100/40"
              }`}
            >
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  </PhoneFrame>
);

/* ================================================================
   VARIATION 3 — Outcome-Oriented (Confidence Tracker)
   ================================================================ */
const VariationThree = () => (
  <PhoneFrame tone="bg-[#FBFAF5]" testId="v3-outcome">
    <div className="px-5 pb-28 pt-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">Good morning</p>
          <h1 className="font-serif text-2xl text-emerald-950">
            Let&rsquo;s build your streak, Clare.
          </h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-900 text-white">
          <span className="text-sm font-semibold">C</span>
        </div>
      </div>

      {/* Streak hero */}
      <Card className="mt-5 overflow-hidden rounded-3xl border-none bg-gradient-to-br from-emerald-800 to-emerald-950 text-emerald-50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-100/80">
              <Flame className="h-4 w-4 text-amber-300" />
              Daily care streak
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium">
              Day 1 of 30
            </span>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-serif text-6xl leading-none text-white">1</span>
            <span className="mb-2 text-sm text-emerald-100/80">day strong</span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-emerald-100/80">
            Every gentle check-in counts. Even &ldquo;I looked at my plant&rdquo;
            counts on day one.
          </p>
          {/* 7 day dots */}
          <div className="mt-5 flex items-center justify-between">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    i === 0
                      ? "bg-amber-300 text-emerald-950"
                      : "bg-white/10 text-emerald-100/50"
                  }`}
                >
                  {i === 0 ? <Check className="h-4 w-4" /> : d}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confidence tracker */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg text-emerald-950">
            Confidence tracker
          </h2>
          <span className="text-[11px] font-medium text-emerald-700">
            +14 this week
          </span>
        </div>

        <Card className="rounded-2xl border-emerald-100 bg-white">
          <CardContent className="p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-3xl text-emerald-950">62</span>
              <span className="text-xs text-emerald-800/60">/ 100</span>
            </div>
            <Progress value={62} className="mt-2 h-2 bg-emerald-50" />
            {/* Fake sparkline */}
            <svg
              viewBox="0 0 300 60"
              className="mt-5 h-16 w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,50 L40,42 L80,45 L120,30 L160,35 L200,20 L240,25 L300,10"
                fill="none"
                stroke="#047857"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,50 L40,42 L80,45 L120,30 L160,35 L200,20 L240,25 L300,10 L300,60 L0,60 Z"
                fill="url(#spark)"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="mt-1 flex justify-between text-[10px] text-emerald-800/60">
              <span>Week 1</span>
              <span>Week 4</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit checklist */}
      <div className="mt-6">
        <h2 className="mb-3 font-serif text-lg text-emerald-950">
          Today&rsquo;s tiny wins
        </h2>
        <div className="space-y-2">
          {[
            { label: "Check soil moisture on Fern", done: true },
            { label: "Rotate Monstera a quarter turn", done: true },
            { label: "Log how your Pothos looks", done: false },
          ].map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  h.done
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-emerald-200 bg-white"
                }`}
              >
                {h.done && <Check className="h-3 w-3" />}
              </span>
              <span
                className={`flex-1 text-sm ${
                  h.done
                    ? "text-emerald-900/50 line-through"
                    : "text-emerald-950"
                }`}
              >
                {h.label}
              </span>
              <span className="text-[10px] font-medium text-emerald-700">
                +2 pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <BottomTabBar active="care" />
  </PhoneFrame>
);

/* ================================================================
   VARIATION 4 — Quick Action / Focus
   ================================================================ */
const VariationFour = () => (
  <PhoneFrame tone="bg-[#F4F1E8]" testId="v4-quick-action">
    <div className="flex h-full flex-col px-6 pt-6">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900 text-white">
          <Leaf className="h-4 w-4" />
        </span>
        <button className="text-xs font-medium text-emerald-800/70">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-14">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-emerald-700">
          Hello, Maya
        </p>
        <h1 className="mt-3 font-serif text-[36px] leading-[1.05] text-emerald-950">
          Your care plan
          <br />
          is <span className="italic text-emerald-700">ready</span>.
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-emerald-900/70">
          Six gentle waterings, two soft check-ins, and one weekend rotation.
          That&rsquo;s the whole week &mdash; nothing more.
        </p>

        {/* Persona chip */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-100/70 px-3 py-1.5">
          <Heart className="h-3.5 w-3.5 text-rose-700" />
          <span className="text-xs font-semibold text-emerald-950">
            Built for a Heartbroken Optimist
          </span>
        </div>
      </div>

      {/* Big single CTA */}
      <div className="mt-auto mb-28">
        <Button
          className="h-16 w-full rounded-2xl bg-emerald-900 text-base font-semibold hover:bg-emerald-800"
          data-testid="v4-cta-see-schedule"
        >
          See your curated care schedule
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Droplets, label: "6 waters" },
            { icon: Sun, label: "3 rotations" },
            { icon: Sparkles, label: "1 check-in" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="rounded-xl bg-white/80 py-3">
                <Icon className="mx-auto h-4 w-4 text-emerald-800" />
                <p className="mt-1 text-[11px] font-medium text-emerald-900">
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-[11px] text-emerald-800/60">
          Adjustable any time. We only nudge, never nag.
        </p>
      </div>
    </div>
    <BottomTabBar active="home" />
  </PhoneFrame>
);

/* ================================================================
   VARIATION 5 — Curated Greenhouse / Explore
   ================================================================ */
const VariationFive = () => (
  <PhoneFrame tone="bg-white" testId="v5-curated-greenhouse">
    <div className="px-5 pb-28 pt-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">
            Curated for you
          </p>
          <h1 className="font-serif text-2xl text-emerald-950">
            Your greenhouse.
          </h1>
        </div>
        <button className="rounded-full bg-emerald-50 p-2.5">
          <Search className="h-4 w-4 text-emerald-800" />
        </button>
      </div>

      {/* Persona pill */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <Sparkles className="h-4 w-4 text-emerald-800" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
            Based on your quiz
          </p>
          <p className="text-xs font-medium text-emerald-950">
            Low light &middot; Cat-safe &middot; Forgiving of missed waterings
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="mt-4 flex gap-2 overflow-hidden">
        {["All", "Beginner", "Pet-safe", "Low light", "Trailing"].map(
          (c, i) => (
            <span
              key={c}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium ${
                i === 0
                  ? "bg-emerald-900 text-white"
                  : "bg-emerald-50 text-emerald-900"
              }`}
            >
              {c}
            </span>
          )
        )}
      </div>

      {/* Plant grid */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          {
            name: "ZZ Plant",
            tag: "Forgiving",
            match: 98,
            grad: "from-emerald-200 to-emerald-500",
            pet: true,
          },
          {
            name: "Cast Iron",
            tag: "Bulletproof",
            match: 96,
            grad: "from-lime-200 to-emerald-500",
            pet: true,
          },
          {
            name: "Peperomia",
            tag: "Compact",
            match: 91,
            grad: "from-teal-200 to-emerald-500",
            pet: true,
          },
          {
            name: "Spider Plant",
            tag: "Cheerful",
            match: 88,
            grad: "from-lime-100 to-emerald-400",
            pet: true,
          },
        ].map((p) => (
          <Card
            key={p.name}
            className="overflow-hidden rounded-2xl border-emerald-100"
          >
            <div
              className={`relative h-24 bg-gradient-to-br ${p.grad} flex items-end justify-between p-2`}
            >
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                {p.match}% match
              </span>
              {p.pet && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90">
                  <ShieldCheck className="h-3 w-3 text-emerald-700" />
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-[13px] font-semibold text-emerald-950">
                {p.name}
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-800/70">{p.tag}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Custom survival guide */}
      <div className="mt-6 mb-2 flex items-center justify-between">
        <h2 className="font-serif text-lg text-emerald-950">
          Your survival guides
        </h2>
        <span className="text-[11px] font-medium text-emerald-700">
          View all
        </span>
      </div>
      <div className="space-y-3">
        {[
          {
            icon: BookOpen,
            title: "The 3-finger soil test",
            sub: "Never overwater again",
            time: "2 min read",
          },
          {
            icon: Camera,
            title: "Reading your window light",
            sub: "Custom to your east-facing room",
            time: "3 min read",
          },
        ].map((g, i) => {
          const Icon = g.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <Icon className="h-5 w-5 text-emerald-800" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-emerald-950">
                  {g.title}
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-800/70">
                  {g.sub} &middot; {g.time}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-800/60" />
            </div>
          );
        })}
      </div>
    </div>
    <BottomTabBar active="explore" />
  </PhoneFrame>
);

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const PostOnboardingVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#EEF1E7] font-sans"
      data-testid="post-onboarding-variations-page"
    >
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              Grove &middot; Post-onboarding concepts (mobile)
            </span>
          </div>
          <span className="hidden text-xs text-emerald-800/60 sm:block">
            5 static variations &middot; portrait mockups
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        persona="Heartbroken Optimist"
        title="Dashboard Home &mdash; Gentle first step"
        subtitle="Empathetic greeting, low-stakes first habit, and a reassuring daily tip to lower care anxiety."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        persona="Green Dreamer"
        title="Story-driven Welcome &mdash; Dream jungle carousel"
        subtitle="Inspiring layout with visual carousel of hardy, high-impact starter plants."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        persona="Any persona"
        title="Outcome-Oriented &mdash; Confidence Tracker & Streak"
        subtitle="Celebrates small, consistent care wins with a habit streak and confidence sparkline."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        persona="Heartbroken Optimist"
        title="Quick Action / Focus &mdash; One dominant prompt"
        subtitle="Super streamlined layout with one large CTA and supportive persona-aware copy."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        persona="Any persona"
        title="Curated Greenhouse / Explore &mdash; Personalised grid"
        subtitle="Preview grid of quiz-matched plant recommendations and custom survival guides."
      />
      <VariationFive />

      <footer className="mt-24 border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-emerald-800/60">
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default PostOnboardingVariations;
