import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sprout } from 'lucide-react';

function factorColor(score) {
  if (score >= 85) return { dot: 'bg-grove-lime', text: 'text-grove-sprout' };
  if (score >= 65) return { dot: 'bg-grove-sun', text: 'text-grove-sun' };
  if (score >= 40) return { dot: 'bg-grove-bloom', text: 'text-grove-blush' };
  return { dot: 'bg-grove-bloom', text: 'text-grove-blush' };
}

export default function HealthScorePanel({ breakdown, score, careLogCount = null }) {
  const [expanded, setExpanded] = useState(false);

  if (!breakdown) return null;

  const total = typeof score === 'number' ? score : breakdown.total_score;
  const factors = breakdown.factors || [];
  const tips = breakdown.tips || [];
  const isEarly = typeof careLogCount === 'number' && careLogCount < 7;
  const toImprove = factors
    .filter(f => f.score < 85)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return (
    <div
      data-testid="plant-health-panel"
      className="rounded-card border-hairline border-grove-moss bg-grove-moss overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        data-testid="plant-health-toggle"
        aria-expanded={expanded}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-grove-canopy transition-colors duration-150"
      >
        <div className="w-10 h-10 rounded-pill bg-grove-moss flex items-center justify-center border-hairline border-grove-moss">
          <Sprout className="h-5 w-5 text-grove-sprout" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-ui text-grove-cream text-sm font-medium">Plant health</p>
          <p className="font-latin text-xs text-grove-cream">
            6-factor breakdown · tap for details
          </p>
        </div>
        <div className="text-right">
          <p className="font-plant text-grove-cream text-2xl leading-none">{total}</p>
          <p className="font-latin text-xs text-grove-cream">/ 100</p>
          {isEarly && (
            <span
              data-testid="plant-health-early-reading"
              className="inline-block mt-1 rounded-pill px-1.5 py-px bg-grove-forest text-grove-lichen font-ui text-sm"
            >
              Early reading
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-grove-cream ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 text-grove-cream ml-2" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t-hairline border-grove-moss/80 pt-3">
          {/* Factor list */}
          <div className="space-y-2" data-testid="plant-health-factors">
            {factors.map((f) => {
              const col = factorColor(f.score);
              return (
                <div key={f.key} className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-pill ${col.dot}`} aria-hidden="true" />
                  <span className="flex-1 font-ui text-xs text-grove-cream">{f.label}</span>
                  <div className="w-24 h-1.5 rounded-pill bg-grove-forest overflow-hidden">
                    <div
                      className={`h-full ${col.dot}`}
                      style={{ width: `${Math.max(4, Math.min(100, f.score))}%` }}
                    />
                  </div>
                  <span className={`font-latin text-xs w-8 text-right ${col.text}`}>{f.score}</span>
                </div>
              );
            })}
          </div>

          {/* How to reach 100 */}
          {(toImprove.length > 0 || tips.length > 0) && (
            <div className="rounded-inset border-hairline border-grove-moss bg-grove-forest p-3" data-testid="plant-health-tips">
              <p className="font-ui text-xs font-medium text-grove-cream mb-1.5">
                How to reach 100
              </p>
              <ul className="space-y-1.5">
                {tips.length > 0 ? (
                  tips.map((t, i) => (
                    <li key={i} className="font-ui text-xs text-grove-cream leading-snug flex gap-1.5">
                      <span className="text-grove-sprout">·</span>
                      <span>{t}</span>
                    </li>
                  ))
                ) : (
                  toImprove.map((f) => (
                    <li key={f.key} className="font-ui text-xs text-grove-cream leading-snug flex gap-1.5">
                      <span className="text-grove-sprout">·</span>
                      <span>Lift <span className="lowercase">{f.label}</span> — currently {f.score}/100.</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
