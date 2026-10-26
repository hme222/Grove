// Lesson cards for "Habit Stacking". The text is used exactly as written; colours are design tokens.
import { Coffee, Link as LinkIcon, Cat, Bell, Repeat } from "lucide-react";

export const CARDS = [
  {
    n: 1,
    header: "Card 1 of 5 · The Hook",
    eyebrow: "Zero-effort Consistency",
    headline: "Don\u2019t rely on memory.",
    body:
      "To build a consistent care routine, don&rsquo;t try to remember. Instead, <strong>stack</strong> your plant check onto an unbreakable habit you already do every single day.",
    cta: "I\u2019m ready to stack",
    icon: Repeat,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-lime/15 text-grove-sprout",
  },
  {
    n: 2,
    header: "Card 2 of 5 · The Formula",
    eyebrow: "The Routine Recipe",
    headline: "The habit-stack formula.",
    body:
      "Use this one line as your template &mdash; then repeat it out loud until it feels like yours: <strong>&ldquo;After I do [Existing Habit], I will [Check My Plant].&rdquo;</strong>",
    cta: "Got the recipe",
    icon: LinkIcon,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
  },
  {
    n: 3,
    header: "Card 3 of 5 · Example A",
    eyebrow: "The Morning Grind",
    headline: "Coffee grinder \u2192 Monstera.",
    body:
      "&ldquo;Right after I grind my morning coffee, I will look at my Monstera&rsquo;s leaves.&rdquo; It takes 8 seconds and the smell of coffee becomes your daily cue.",
    cta: "Love this one",
    icon: Coffee,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
  },
  {
    n: 4,
    header: "Card 4 of 5 · Example B",
    eyebrow: "The Furry Friend",
    headline: "Cat bowl \u2192 desk plant.",
    body:
      "&ldquo;Right after I feed my cat (like Luna, who keeps things grounded), I will touch the soil of my desk plant.&rdquo; Two little rituals, one shared moment.",
    cta: "This one too",
    icon: Cat,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-sprout/15 text-grove-sprout",
  },
  {
    n: 5,
    header: "Card 5 of 5 · Your Turn",
    eyebrow: "60-Second Action",
    headline: "Pick your anchor habit.",
    body:
      "Identify one daily habit you never skip &mdash; brushing teeth, making coffee, feeding the cat. Pair your plant check with it right now.",
    cta: "Create My Habit Reminder",
    icon: Bell,
    accent: "from-grove-lime/15 via-grove-lime/10 to-grove-lime/10",
    ring: "text-grove-sprout",
    chip: "bg-grove-lime/15 text-grove-sprout",
    interactive: true,
  },
];
