import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { speciesAPI } from '../lib/api';
import { READINESS_STEP_LABELS, READINESS_STATE_LABELS } from './nookCopy';

// For people with no plant yet. They pick a species and tick off three steps. The
// plant has only seed, sprouting, and ready states, and it never has a need.
export default function ReadinessPanel({ readiness, busy, onStart, onStep }) {
  const navigate = useNavigate();
  const [changing, setChanging] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const search = async (event) => {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError('Type at least two letters.');
      return;
    }
    setError('');
    setSearching(true);
    try {
      const res = await speciesAPI.search(query.trim());
      setResults(res.data || []);
    } catch (_e) {
      setError('Could not search plants. Try again.');
    } finally {
      setSearching(false);
    }
  };

  const pick = (species) => {
    setChanging(false);
    setResults(null);
    setQuery('');
    onStart(species.id);
  };

  if (!readiness || changing) {
    return (
      <section className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="readiness-search">
        <h2 className="font-plant text-[#1C2E10] text-lg mb-1">Getting ready for a plant?</h2>
        <p className="text-sm text-[#1A1A17] mb-3">Pick the plant you have in mind. You&apos;ll get ready for it in three small steps.</p>
        <form onSubmit={search} className="flex gap-2">
          <label className="flex-1 text-xs font-ui text-[#2B2B26]">
            Plant name
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Snake plant"
              className="mt-1 w-full rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#F5F0E8] px-3 py-2 text-sm"
              data-testid="readiness-query"
            />
          </label>
          <button
            type="submit"
            aria-busy={searching}
            className="self-end rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
            data-testid="readiness-search-button"
          >
            Search
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-2 text-xs font-ui text-red-700" data-testid="readiness-error">
            {error}
          </p>
        )}
        {results && results.length === 0 && <p className="mt-2 text-xs font-ui text-[#2B2B26]">No plants found. Try another name.</p>}
        {results && results.length > 0 && (
          <ul className="mt-3 space-y-2">
            {results.slice(0, 8).map((species) => (
              <li key={species.id}>
                <button
                  type="button"
                  onClick={() => pick(species)}
                  className="w-full text-left rounded-[8px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-3 py-2 text-sm hover:border-[#2D5016]"
                  data-testid={`readiness-result-${species.id}`}
                >
                  {species.common_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {readiness && (
          <button type="button" onClick={() => setChanging(false)} className="mt-3 text-xs font-ui underline text-[#2D5016]">
            Keep {readiness.species_name}
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-4" data-testid="readiness-panel">
      <h2 className="font-plant text-[#1C2E10] text-lg">Getting ready for a {readiness.species_name}</h2>
      <p className="text-sm text-[#1A1A17] mb-3" data-testid="readiness-state">
        {READINESS_STATE_LABELS[readiness.state]}. This is a practice plant, so it never needs anything.
      </p>
      <ul className="space-y-2">
        {readiness.steps.map((step) => (
          <li key={step.id} className="flex items-center justify-between gap-3 rounded-[8px] bg-[#FDFAF6] px-3 py-2">
            <span className="text-sm font-ui text-[#1A1A17]">{READINESS_STEP_LABELS[step.id]}</span>
            {step.done ? (
              <span className="text-xs font-ui text-[#3B6D11]" data-testid={`readiness-done-${step.id}`}>
                Done
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onStep(step.id)}
                aria-busy={busy}
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-2 border-[0.5px] border-[#1C2E10] text-[#1C2E10]"
                data-testid={`readiness-step-${step.id}`}
              >
                Mark done
              </button>
            )}
          </li>
        ))}
      </ul>

      {readiness.state === 'ready' && (
        <div className="mt-3" data-testid="readiness-ready">
          <p className="text-sm text-[#1A1A17]">
            A {readiness.species_name} usually likes water about every {readiness.watering_days} days.
          </p>
          <p className="font-plant text-[#1C2E10] text-base mb-2">Ready to meet a real one?</p>
          <button
            type="button"
            onClick={() => navigate('/add-plant')}
            className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10]"
            data-testid="readiness-add-plant"
          >
            Add a plant
          </button>
        </div>
      )}

      <button type="button" onClick={() => setChanging(true)} className="mt-3 text-xs font-ui underline text-[#2D5016]" data-testid="readiness-change">
        Pick a different plant
      </button>
    </section>
  );
}
