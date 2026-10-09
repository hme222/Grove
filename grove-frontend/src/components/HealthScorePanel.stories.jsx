import HealthScorePanel from "./HealthScorePanel";

// Factor keys, labels, weights and tips mirror grove-backend/server.py
// (the health-score breakdown), so the panel is shown with real shapes.
const factor = (key, label, weight, score) => ({ key, label, weight, score });

const thriving = {
  total_score: 92,
  factors: [
    factor("watering_recency", "Watering recency", 25, 95),
    factor("schedule_consistency", "Schedule consistency", 20, 90),
    factor("observations", "Observations & notes", 15, 92),
    factor("care_variety", "Care variety", 10, 88),
    factor("grow_medium", "Grow medium", 10, 100),
  ],
  tips: [],
};

const needsAttention = {
  total_score: 58,
  factors: [
    factor("watering_recency", "Watering recency", 25, 40),
    factor("schedule_consistency", "Schedule consistency", 20, 55),
    factor("observations", "Observations & notes", 15, 70),
    factor("care_variety", "Care variety", 10, 35),
    factor("grow_medium", "Grow medium", 10, 90),
  ],
  tips: [
    "Water when this plant comes due to lift the recency factor.",
    "Build a cadence — 2-3 logged waterings strengthens consistency.",
    "Mix in fertilizing, pruning, or misting logs for well-rounded care.",
  ],
};

export default {
  title: "Grove/HealthScorePanel",
  component: HealthScorePanel,
};

export const Thriving = { args: { breakdown: thriving, careLogCount: 24 } };
export const NeedsAttention = { args: { breakdown: needsAttention, careLogCount: 12 } };
export const EarlyDays = {
  args: { breakdown: needsAttention, careLogCount: 3 },
  parameters: {
    docs: { description: { story: "Fewer than 7 care logs: the panel treats the score as provisional." } },
  },
};
