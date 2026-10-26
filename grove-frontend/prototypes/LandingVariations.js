import React from "react";
import {
  Leaf,
  Sparkles,
  Sun,
  Droplets,
  ArrowRight,
  Check,
  Camera,
  Calendar,
  TrendingUp,
  Heart,
  ChevronRight,
  Sprout,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

/**
 * LandingVariations
 * ------------------------------------------------------------
 * A single static page that showcases 5 distinct landing screen
 * concepts for FloraGrove. Each variation is a self-contained section
 * with no data fetching or backend dependencies.
 *
 * Variations:
 *   1. Minimal & Text-Focused
 *   2. Feature-Forward (split screen)
 *   3. Storytelling / Onboarding Bridge (cards)
 *   4. Benefit / Outcome-Driven (data viz placeholders)
 *   5. Creative / Organic (flowing shapes + soft gradients)
 * ------------------------------------------------------------
 */

const VariationLabel = ({ number, title, subtitle }) => (
  <div
    className="mx-auto max-w-6xl px-6 pt-24 pb-6"
    data-testid={`variation-label-${number}`}
  >
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-50">
        Variation {number}
      </span>
      <span className="h-px flex-1 bg-emerald-200" />
    </div>
    <h2 className="mt-3 font-serif text-2xl text-emerald-950 md:text-3xl">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-1 max-w-2xl text-sm text-emerald-800/70">{subtitle}</p>
    )}
  </div>
);

/* ================================================================
   VARIATION 1 — Minimal & Text-Focused
   ================================================================ */
const VariationOne = () => (
  <section
    className="relative bg-[#FBFAF5]"
    data-testid="variation-1-minimal"
  >
    <div className="mx-auto max-w-4xl px-6 py-32 text-left">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-800">
        <Leaf className="h-3.5 w-3.5" />
        FloraGrove — plant care, without the guesswork
      </div>

      <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-emerald-950 md:text-7xl">
        Every plant you own,
        <br />
        <span className="italic text-emerald-700">finally</span> in good hands.
      </h1>

      <p className="mt-8 max-w-xl text-lg leading-relaxed text-emerald-900/70 md:text-xl">
        Answer six calm questions about your space and your schedule. We&rsquo;ll
        build a care rhythm that actually fits your life — no overwhelm, no
        second-guessing, no wilted regret.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          className="h-12 rounded-full bg-emerald-900 px-8 text-base font-medium text-white hover:bg-emerald-800"
          data-testid="v1-cta-start-quiz"
        >
          Take the 60-second quiz
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <button
          className="text-sm font-medium text-emerald-900 underline underline-offset-4 hover:text-emerald-700"
          data-testid="v1-cta-see-preview"
        >
          Or peek inside the app first
        </button>
      </div>

      <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-emerald-900/60">
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-700" /> Free forever plan
        </span>
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-700" /> No credit card
        </span>
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-700" /> 42,000+ plant parents
        </span>
      </div>
    </div>
  </section>
);

/* ================================================================
   VARIATION 2 — Feature-Forward (split screen)
   ================================================================ */
const VariationTwo = () => (
  <section
    className="relative bg-gradient-to-br from-emerald-50 via-white to-lime-50"
    data-testid="variation-2-feature-forward"
  >
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
      {/* Left: Hero copy */}
      <div>
        <Badge className="mb-5 rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 hover:bg-emerald-100">
          <Sparkles className="mr-1.5 h-3 w-3" />
          Personalised in under a minute
        </Badge>
        <h1 className="font-serif text-4xl leading-tight text-emerald-950 md:text-5xl lg:text-6xl">
          Care plans that read
          <br />
          <span className="text-emerald-700">your rooms</span>, not a manual.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-emerald-900/75">
          Tell us where the sun lands, how often you travel, and how you like to
          be reminded. FloraGrove turns that into a weekly rhythm you can actually
          keep — one tap at a time.
        </p>

        <ul className="mt-8 space-y-3 text-emerald-900">
          {[
            "Light-mapped watering (no more soggy pothos)",
            "Habit stacks tuned to your Sundays",
            "Vet-reviewed pet safety on every species",
          ].map((line) => (
            <li key={line} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-white">
                <Check className="h-3 w-3" />
              </span>
              <span className="text-base">{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button
            size="lg"
            className="h-12 rounded-xl bg-emerald-800 px-6 text-base hover:bg-emerald-700"
            data-testid="v2-cta-start-quiz"
          >
            Start my care plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-xl border-emerald-300 px-6 text-base text-emerald-900 hover:bg-emerald-50"
            data-testid="v2-cta-tour"
          >
            Watch 40-sec tour
          </Button>
        </div>
      </div>

      {/* Right: Mock quiz card */}
      <div className="relative">
        <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -bottom-8 -right-4 h-56 w-56 rounded-full bg-lime-200/50 blur-3xl" />

        <Card className="relative overflow-hidden rounded-3xl border-emerald-100 bg-white/90 shadow-2xl shadow-emerald-900/10 backdrop-blur">
          <CardContent className="p-8">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <Sprout className="h-4 w-4" />
                Question 3 of 6
              </div>
              <span className="text-xs text-emerald-800/60">50% complete</span>
            </div>
            <Progress value={50} className="h-1.5 bg-emerald-100" />

            <h3 className="mt-8 font-serif text-2xl leading-snug text-emerald-950">
              Which window gets the strongest afternoon sun?
            </h3>
            <p className="mt-2 text-sm text-emerald-900/60">
              Pick the room where light is brightest between 2&ndash;5pm.
            </p>

            <div className="mt-6 space-y-3">
              {[
                { label: "Living room — south facing", active: true },
                { label: "Bedroom — east facing", active: false },
                { label: "Kitchen — north facing", active: false },
                { label: "I&rsquo;m honestly not sure", active: false },
              ].map((opt, i) => (
                <button
                  key={i}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm transition ${
                    opt.active
                      ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                      : "border-emerald-100 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/40"
                  }`}
                >
                  <span dangerouslySetInnerHTML={{ __html: opt.label }} />
                  {opt.active ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-emerald-200" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button className="text-sm font-medium text-emerald-700 hover:underline">
                &larr; Back
              </button>
              <Button className="h-10 rounded-full bg-emerald-800 px-6 hover:bg-emerald-700">
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

/* ================================================================
   VARIATION 3 — Storytelling / Onboarding Bridge
   ================================================================ */
const OnboardingStep = ({ step, icon: Icon, title, body, tone }) => (
  <Card
    className={`relative overflow-hidden rounded-3xl border-none shadow-lg shadow-emerald-900/5 ${tone}`}
  >
    <CardContent className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-900">
          Step {step}
        </span>
        <Icon className="h-6 w-6 text-emerald-900/70" />
      </div>
      <h3 className="font-serif text-2xl text-emerald-950">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-emerald-900/75">{body}</p>
    </CardContent>
  </Card>
);

const VariationThree = () => (
  <section className="relative bg-[#F5F3EC]" data-testid="variation-3-story">
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          How FloraGrove works
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-emerald-950 md:text-5xl">
          From &ldquo;I keep killing them&rdquo; to
          <span className="italic text-emerald-700"> keeping them thriving</span>
          .
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-emerald-900/75">
          Four small steps. No jargon, no shame, no leaflets from the garden
          centre. Just a quiet plan that grows with you.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <OnboardingStep
          step="01"
          icon={Camera}
          title="Scan your space"
          body="Snap a corner of any room. FloraGrove maps the light, humidity, and drafts so recommendations match reality — not a stock guide."
          tone="bg-emerald-100/80"
        />
        <OnboardingStep
          step="02"
          icon={Sparkles}
          title="Take the calm quiz"
          body="Six gentle questions about your routine, pets, and travel. We shape care around your Sundays — not the other way around."
          tone="bg-lime-100/80"
        />
        <OnboardingStep
          step="03"
          icon={Calendar}
          title="Get a weekly rhythm"
          body="Water, rotate, mist — batched into tiny 5-minute habits. Skip a day and your plan gently rebalances itself."
          tone="bg-amber-100/70"
        />
        <OnboardingStep
          step="04"
          icon={Heart}
          title="Watch them thrive"
          body="Track new leaves, first flowers, and rescue wins. Share victories with your FloraGrove community when you&rsquo;re ready."
          tone="bg-rose-100/70"
        />
      </div>

      <div className="mt-14 flex flex-col items-start gap-4 rounded-2xl bg-emerald-950 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-xl">Ready to meet your plants properly?</p>
          <p className="mt-1 text-sm text-emerald-100/80">
            Free forever. Set up in under two minutes.
          </p>
        </div>
        <Button
          size="lg"
          className="h-12 rounded-full bg-white px-7 text-emerald-950 hover:bg-emerald-50"
          data-testid="v3-cta-begin"
        >
          Begin step 1
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </section>
);

/* ================================================================
   VARIATION 4 — Benefit / Outcome-Driven
   ================================================================ */
const StatCard = ({ label, value, sub, icon: Icon, accent }) => (
  <Card className="rounded-2xl border-emerald-100">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-emerald-800/60">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${accent}`}
        >
          <Icon className="h-4 w-4 text-white" />
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-serif text-4xl text-emerald-950">{value}</span>
        <span className="text-sm font-medium text-emerald-700">{sub}</span>
      </div>
    </CardContent>
  </Card>
);

const BarRow = ({ label, before, after }) => (
  <div>
    <div className="mb-2 flex justify-between text-xs font-medium text-emerald-900/70">
      <span>{label}</span>
      <span>
        <span className="text-emerald-900/50">{before}</span> &rarr;{" "}
        <span className="text-emerald-700">{after}</span>
      </span>
    </div>
    <div className="relative h-3 overflow-hidden rounded-full bg-emerald-50">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-emerald-200"
        style={{ width: `${before}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-emerald-700"
        style={{ width: `${after}%` }}
      />
    </div>
  </div>
);

const VariationFour = () => (
  <section className="relative bg-white" data-testid="variation-4-outcomes">
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:items-center">
        <div className="lg:col-span-2">
          <Badge className="mb-4 rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 hover:bg-emerald-100">
            Measured, not marketed
          </Badge>
          <h1 className="font-serif text-4xl leading-tight text-emerald-950 md:text-5xl">
            Real outcomes,
            <br />
            <span className="text-emerald-700">30 days in.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-emerald-900/75">
            Across 14,200 first-month FloraGrove users, small habits compound into
            noticeably healthier plants — without adding chores to your week.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-emerald-900">
              <Check className="h-4 w-4 text-emerald-700" />
              5 minutes / day average
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-900">
              <Check className="h-4 w-4 text-emerald-700" />
              82% users stick with it past week 4
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-900">
              <Check className="h-4 w-4 text-emerald-700" />
              No dashboards to check — just gentle nudges
            </div>
          </div>

          <Button
            size="lg"
            className="mt-8 h-12 rounded-full bg-emerald-900 px-7 hover:bg-emerald-800"
            data-testid="v4-cta-quiz"
          >
            See your 30-day forecast
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="New leaves"
              value="+3.4"
              sub="per plant / mo"
              icon={Sprout}
              accent="bg-emerald-700"
            />
            <StatCard
              label="Missed waterings"
              value="-71%"
              sub="vs. week 1"
              icon={Droplets}
              accent="bg-sky-700"
            />
            <StatCard
              label="Care streak"
              value="18d"
              sub="median"
              icon={TrendingUp}
              accent="bg-amber-700"
            />
            <StatCard
              label="Rescued plants"
              value="1 in 4"
              sub="brought back"
              icon={Heart}
              accent="bg-rose-700"
            />
          </div>

          <Card className="mt-6 rounded-2xl border-emerald-100">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-serif text-lg text-emerald-950">
                    Habit consistency, before vs. after FloraGrove
                  </p>
                  <p className="text-xs text-emerald-900/60">
                    Sample: 14,200 users, first 30 days
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-900/60">
                    <span className="h-2 w-2 rounded-full bg-emerald-200" />
                    Before
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    <span className="h-2 w-2 rounded-full bg-emerald-700" />
                    After
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <BarRow label="Watered on time" before={38} after={89} />
                <BarRow label="Rotated for even light" before={12} after={64} />
                <BarRow label="Checked pet safety first" before={22} after={94} />
                <BarRow label="Logged a new leaf" before={9} after={71} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </section>
);

/* ================================================================
   VARIATION 5 — Creative / Organic
   ================================================================ */
const VariationFive = () => (
  <section
    className="relative overflow-hidden bg-gradient-to-b from-[#F4F7F0] via-[#EDF3E6] to-[#E4EED8]"
    data-testid="variation-5-organic"
  >
    {/* Organic decorative blobs */}
    <svg
      className="pointer-events-none absolute -left-32 top-10 h-[520px] w-[520px] opacity-60"
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M420,120 C500,180 540,290 480,400 C420,510 280,540 190,470 C100,400 80,270 150,180 C220,90 340,60 420,120 Z"
        fill="url(#g1)"
      />
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A7C4A0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#E7F0DA" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
    <svg
      className="pointer-events-none absolute -right-40 bottom-0 h-[600px] w-[600px] opacity-70"
      viewBox="0 0 600 600"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M320,60 C450,80 560,200 540,340 C520,480 380,560 250,520 C120,480 40,340 90,220 C140,100 190,40 320,60 Z"
        fill="url(#g2)"
      />
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F3E8D3" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#C7DDB5" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>

    <div className="relative mx-auto max-w-5xl px-6 py-32">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-medium text-emerald-800 backdrop-blur">
        <Wind className="h-3.5 w-3.5" />
        A calmer way to grow
      </div>

      <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] text-emerald-950 md:text-7xl">
        Grow slowly.
        <br />
        <span className="italic text-emerald-700">Grow surely.</span>
      </h1>

      <p className="mt-8 max-w-xl text-lg leading-relaxed text-emerald-900/80">
        FloraGrove is a small, quiet companion for your plants — shaped around
        rhythms, not reminders. Six soft questions, one gentle plan, seasons of
        growing together.
      </p>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          className="h-14 rounded-full bg-emerald-800 px-8 text-base shadow-lg shadow-emerald-900/20 hover:bg-emerald-700"
          data-testid="v5-cta-begin"
        >
          Begin the quiet quiz
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 rounded-full bg-white/60 px-4 py-2 text-xs text-emerald-900 backdrop-blur">
          <div className="flex -space-x-2">
            {["#8FB295", "#C6D8A6", "#E7C79A"].map((c) => (
              <span
                key={c}
                className="h-6 w-6 rounded-full border-2 border-white"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          Loved by 42k plant parents
        </div>
      </div>

      <Separator className="my-14 bg-emerald-900/10" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            icon: Sun,
            title: "Reads your light",
            body: "Every recommendation starts with your actual windows, not a manual.",
          },
          {
            icon: Droplets,
            title: "Waters with rhythm",
            body: "Care batched into 5-minute Sunday routines — the ones you&rsquo;ll actually keep.",
          },
          {
            icon: Leaf,
            title: "Grows with you",
            body: "Miss a day? Your plan gently rebalances. No shame, no red banners.",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="rounded-3xl bg-white/70 p-6 backdrop-blur transition hover:bg-white/90"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-800/90 text-white">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-serif text-lg text-emerald-950">
              {f.title}
            </h3>
            <p
              className="mt-1.5 text-sm leading-relaxed text-emerald-900/70"
              dangerouslySetInnerHTML={{ __html: f.body }}
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ================================================================
   PAGE WRAPPER
   ================================================================ */
const LandingVariations = () => {
  return (
    <div
      className="min-h-screen bg-[#FBFAF5] font-sans"
      data-testid="landing-variations-page"
    >
      {/* Top intro strip */}
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-white">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-lg text-emerald-950">
              FloraGrove &middot; Landing concepts
            </span>
          </div>
          <span className="text-xs text-emerald-800/60">
            5 static variations &middot; internal review
          </span>
        </div>
      </header>

      <VariationLabel
        number={1}
        title="Minimal & Text-Focused"
        subtitle="Typography as the whole hero. One clear CTA into the quiz."
      />
      <VariationOne />

      <VariationLabel
        number={2}
        title="Feature-Forward — Split Screen"
        subtitle="Hero copy on the left, interactive quiz card mock on the right."
      />
      <VariationTwo />

      <VariationLabel
        number={3}
        title="Storytelling / Onboarding Bridge"
        subtitle="Card-based layout that mirrors the real onboarding steps."
      />
      <VariationThree />

      <VariationLabel
        number={4}
        title="Benefit / Outcome-Driven"
        subtitle="Before/after habit metrics with modern data viz placeholders."
      />
      <VariationFour />

      <VariationLabel
        number={5}
        title="Creative / Organic"
        subtitle="Flowing organic shapes and soft botanical gradients."
      />
      <VariationFive />

      <footer className="border-t border-emerald-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-emerald-800/60">
          Static concepts only &middot; no backend, no analytics wired.
        </div>
      </footer>
    </div>
  );
};

export default LandingVariations;
