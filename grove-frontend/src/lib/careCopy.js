// Care-card wording. Gentle by default: say what happened (last watered, or due N days ago),
// not that someone is late (survey: strict-new owners chose gentle 9 of 12).
// The days-since number stays on the card so no information is lost.

const DAY_MS = 1000 * 60 * 60 * 24;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function daysSince(iso, now = new Date()) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / DAY_MS));
}

export function dueLabel(plant, now = new Date()) {
  if (!plant?.next_water_due) return 'Schedule needed';
  const diffDays = Math.ceil((new Date(plant.next_water_due).getTime() - now.getTime()) / DAY_MS);
  if (diffDays < 0) {
    const since = daysSince(plant.last_watered_at, now);
    return since != null
      ? `Last watered ${plural(since, 'day')} ago`
      : `Due ${plural(Math.abs(diffDays), 'day')} ago`;
  }
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
}

// An interval is a reminder to look, not an order to water: "Check about every 7 days", never "Water every 7 days".
export function checkInterval(days) {
  const n = Number(days);
  if (!Number.isFinite(n) || n <= 0) return 'Check the soil first';
  return `Check about every ${plural(n, 'day')}`;
}

// The one exact step, shown in both Simple and Detailed modes.
export function careStep(plant) {
  if (plant?.grow_medium === 'leca') return "Check the reservoir. Top it up if it's low.";
  return "Check the top inch of soil. Water if it's dry.";
}

export const CARE_TEXT_MODES = ['simple', 'detailed'];

export function careTextMode(user) {
  return user?.care_text_detail === 'detailed' ? 'detailed' : 'simple';
}
