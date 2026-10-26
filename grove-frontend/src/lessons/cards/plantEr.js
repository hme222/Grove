// Lesson cards for "Plant ER". The text is used exactly as written; colours are design tokens.
import { Droplets, Thermometer, LifeBuoy, Scale, ClipboardCheck } from "lucide-react";

export const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The Hook",
    eyebrow: "Deep breath",
    headline: "Suddenly have a plant with zero instructions?",
    body:
      "Don&rsquo;t panic. You don&rsquo;t need to become an expert tonight &mdash; you just need to keep it stable. Three simple triage steps will stop the immediate risk while you learn the rest.",
    cta: "I\u2019m ready &mdash; three steps",
    icon: LifeBuoy,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
    step: null,
  },
  {
    n: 2,
    header: "Card 2 of 5 · Step 1",
    eyebrow: "Draft Defense",
    headline: "Move it away from drafts.",
    body:
      "Keep your plant away from direct AC vents, radiators, and doors that keep opening. Extreme temperature swings kill plants faster than almost anything else. A calm corner is a safe corner.",
    cta: "Draft-safe spot &mdash; got it",
    icon: Thermometer,
    accent: "from-grove-sage/15 via-grove-sage/10 to-grove-lime/10",
    ring: "text-grove-sage",
    chip: "bg-grove-sage/15 text-grove-sage",
    step: "1",
  },
  {
    n: 3,
    header: "Card 3 of 5 · Step 2",
    eyebrow: "Escape Route",
    headline: "Check for drainage.",
    body:
      "Lift the pot. Does it have drainage holes at the bottom? If it doesn&rsquo;t, <strong>don&rsquo;t pour water into it yet</strong> &mdash; water will pool and rot the roots within days.",
    cta: "Checked the bottom &mdash; got it",
    icon: Droplets,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-lime/15 text-grove-sprout",
    step: "2",
  },
  {
    n: 4,
    header: "Card 4 of 5 · Step 3",
    eyebrow: "Moisture Check",
    headline: "Assess the weight.",
    body:
      "Feel the soil and lift the pot. If it&rsquo;s soaking wet, <strong>do nothing</strong>. If the pot feels feather-light and the soil is pulling away from the edges, take it to the sink for a thorough soak.",
    cta: "Weight-check &mdash; got it",
    icon: Scale,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
    step: "3",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    eyebrow: "60-Second Action",
    headline: "Lift your mystery plant.",
    body:
      "Check the very bottom of the pot right now. Does it have drainage holes?",
    cta: "Start Triage Guide",
    icon: ClipboardCheck,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-lime/15 text-grove-sprout",
    interactive: true,
  },
];
