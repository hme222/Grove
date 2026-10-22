import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sprout } from 'lucide-react';

function factorColor(score) {
  if (score >= 85) return { dot: 'bg-grove-lime', text: 'text-grove-sprout' };
  if (score >= 65) return { dot: 'bg-[#C18A2A]', text: 'text-[#8A6A3D]' };
  if (score >= 40) return { dot: 'bg-grove-bloom', text: 'text-grove-bloom' };
  return { dot: 'bg-grove-bloom', text: 'text-grove-bloom' };
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
      className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        data-testid="plant-health-toggle"
        aria-expanded={expanded}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-grove-canopy transition-colors duration-150"
      >
        <div className="w-10 h-10 rounded-full bg-grove-moss flex items-center justify-center border-[0.5px] border-grove-moss">
          <Sprout className="h-5 w-5 text-grove-sprout" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-plant text-grove-cream text-sm">Plant Health</p>
          <p className="font-latin text-[10px] text-grove-cream">
            6-factor breakdown · tap for details
          </p>
        </div>
        <div className="text-right">
          <p className="font-plant text-grove-cream text-2xl leading-none">{total}</p>
          <p className="font-latin text-[9px] text-grove-cream">/ 100</p>
          {isEarly && (
            <span
              data-testid="plant-health-early-reading"
              className="inline-block mt-1 rounded-full px-1.5 py-[1px] bg-grove-forest text-grove-lichen font-mono text-[9px] tracking-[0.05em]"
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
        <div className="px-4 pb-4 space-y-3 border-t-[0.5px] border-grove-moss/60 pt-3">
          {/* Factor list */}
          <div className="space-y-2" data-testid="plant-health-factors">
            {factors.map((f) => {
              const col = factorColor(f.score);
              return (
                <div key={f.key} className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} aria-hidden="true" />
                  <span className="flex-1 font-ui text-xs text-grove-cream">{f.label}</span>
                  <div className="w-24 h-1.5 rounded-full bg-grove-forest overflow-hidden">
                    <div
                      className={`h-full ${col.dot}`}
                      style={{ width: `${Math.max(4, Math.min(100, f.score))}%` }}
                    />
                  </div>
                  <span className={`font-latin text-[10px] w-8 text-right ${col.text}`}>{f.score}</span>
                </div>
              );
            })}
          </div>

          {/* How to reach 100 */}
          {(toImprove.length > 0 || tips.length > 0) && (
            <div className="rounded-[8px] border-[0.5px] border-grove-moss bg-grove-forest p-3" data-testid="plant-health-tips">
              <p className="font-plant text-[10px] text-grove-cream mb-1.5">
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
