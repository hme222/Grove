// Lesson cards for "Window Blueprint". The text is used exactly as written; colors are design tokens.
import { Sparkles, Sun, MapPin, Sunrise, Cloud } from "lucide-react";

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
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-lime/15 text-grove-sprout",
  },
  {
    n: 2,
    header: "Card 2 of 5 · South & West",
    eyebrow: "The Sun Zone",
    headline: "South / West windows.",
    body:
      "These catch intense, direct afternoon sun. This is the best spot for <strong>desert succulents and cacti</strong> such as aloe, jade and echeveria. Haworthia and Christmas cactus prefer bright light without hot direct sun.<br/><br/><em>Window directions assume the northern hemisphere outside the tropics; in the southern hemisphere swap north and south.</em>",
    cta: "Got it &mdash; South/West is bright",
    icon: Sun,
    dir: "SW",
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
  },
  {
    n: 3,
    header: "Card 3 of 5 · East",
    eyebrow: "The Sweet Spot",
    headline: "East windows.",
    body:
      "These get gentle, cool morning light &mdash; strong enough to feed, soft enough to forgive. It\u2019s the sweet spot for tropicals like <strong>Monsteras, Pothos, Philodendrons</strong>.<br/><br/>Monstera, Pothos and Philodendron are toxic to cats and dogs if chewed. Keep them out of reach, or check the plant&rsquo;s pet-safety label first.<br/><br/><em>Window directions assume the northern hemisphere outside the tropics; in the southern hemisphere swap north and south.</em>",
    cta: "Got it &mdash; East is tropical-friendly",
    icon: Sunrise,
    dir: "E",
    accent: "from-grove-sage/15 via-grove-sage/10 to-grove-lime/10",
    ring: "text-grove-sage",
    chip: "bg-grove-sage/15 text-grove-sage",
  },
  {
    n: 4,
    header: "Card 4 of 5 · North & The Golden Rule",
    eyebrow: "Low Light + Wisdom",
    headline: "North windows &amp; the Golden Rule.",
    body:
      "North windows give low light. <strong>Pothos and Snake plant</strong> tolerate it, but they will grow slowly and may need a brighter spot in winter. Pothos and Snake plant are toxic to cats and dogs if chewed. Keep them out of reach, or check the plant&rsquo;s pet-safety label first.<br/><br/><strong>The Golden Rule:</strong> bright, indirect light is a spot close to a bright window, within about 3 feet (1 meter), where daylight is strong but the sun does not land on the leaves. Being able to read there is not a reliable test.<br/><br/><em>Window directions assume the northern hemisphere outside the tropics; in the southern hemisphere swap north and south.</em>",
    cta: "Golden Rule locked in",
    icon: Cloud,
    dir: "N",
    accent: "from-grove-sage/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sage",
    chip: "bg-grove-sage/15 text-grove-sage",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    eyebrow: "60-Second Action",
    headline: "Pick your first lighting zone.",
    body:
      "Choose one empty surface where you want a plant. Look at the nearest window. Which direction does it face?<br/><br/><em>Window directions assume the northern hemisphere outside the tropics; in the southern hemisphere swap north and south.</em>",
    cta: "Set my first lighting zone",
    icon: MapPin,
    dir: "action",
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-lime/15 text-grove-sprout",
    interactive: true,
  },
];
