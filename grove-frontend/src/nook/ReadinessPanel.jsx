import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { speciesAPI } from '../lib/api';
import { READINESS_STEP_LABELS, READINESS_STATE_LABELS } from './nookCopy';
import { PAPER_BUTTON, PAPER_BUTTON_QUIET, PAPER_ERROR, PAPER_FIELD, PAPER_LABEL, PAPER_LINK, PAPER_PANEL } from './paperStyles';

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
      <section className={PAPER_PANEL} data-testid="readiness-search">
        <h2 className="mb-1 font-plant text-lg text-grove-root">Getting ready for a plant?</h2>
        <p className="mb-3 font-ui text-sm text-grove-ink">Pick the plant you have in mind. You&apos;ll get ready for it in three small steps.</p>
        <form onSubmit={search} className="flex gap-2">
          <label className={`flex-1 ${PAPER_LABEL}`}>
            Plant name
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Snake plant"
              className={`${PAPER_FIELD} normal-case tracking-normal`}
              data-testid="readiness-query"
            />
          </label>
          <button
            type="submit"
            aria-busy={searching}
            className={`${PAPER_BUTTON} self-end`}
            data-testid="readiness-search-button"
          >
            Search
          </button>
        </form>
        {error && (
          <p role="alert" className={`mt-2 ${PAPER_ERROR}`} data-testid="readiness-error">
            {error}
          </p>
        )}
        {results && results.length === 0 && <p className="mt-2 font-ui text-sm text-grove-inkSoft">No plants found. Try another name.</p>}
        {results && results.length > 0 && (
          <ul className="mt-3 space-y-2">
            {results.slice(0, 8).map((species) => (
              <li key={species.id}>
                <button
                  type="button"
                  onClick={() => pick(species)}
                  className="min-h-touch w-full rounded-small border-hairline border-grove-paperBorder bg-grove-paperCard px-4 py-3 text-left font-ui text-sm text-grove-ink hover:border-grove-paperGreen"
                  data-testid={`readiness-result-${species.id}`}
                >
                  {species.common_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {readiness && (
          <button type="button" onClick={() => setChanging(false)} className={`mt-3 ${PAPER_LINK}`}>
            Keep {readiness.species_name}
          </button>
        )}
      </section>
    );
  }

  return (
    <section className={PAPER_PANEL} data-testid="readiness-panel">
      <h2 className="font-plant text-lg text-grove-root">Getting ready for a {readiness.species_name}</h2>
      <p className="mb-3 font-ui text-sm text-grove-ink" data-testid="readiness-state">
        {READINESS_STATE_LABELS[readiness.state]}. This is a practice plant, so it never needs anything.
      </p>
      <ul className="space-y-2">
        {readiness.steps.map((step) => (
          <li key={step.id} className="flex items-center justify-between gap-3 rounded-small bg-grove-paperCard px-4 py-3">
            <span className="font-ui text-sm text-grove-ink">{READINESS_STEP_LABELS[step.id]}</span>
            {step.done ? (
              <span className="inline-flex items-center gap-1 font-ui text-sm text-grove-paperAccent" data-testid={`readiness-done-${step.id}`}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Done
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onStep(step.id)}
                aria-busy={busy}
                className={PAPER_BUTTON_QUIET}
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
          <p className="font-ui text-sm text-grove-ink">
            A {readiness.species_name} usually likes water about every {readiness.watering_days} days.
          </p>
          <p className="mb-2 font-plant text-base text-grove-root">Ready to meet a real one?</p>
          <button
            type="button"
            onClick={() => navigate('/add-plant')}
            className={PAPER_BUTTON}
            data-testid="readiness-add-plant"
          >
            Add a plant
          </button>
        </div>
      )}

      <button type="button" onClick={() => setChanging(true)} className={`mt-3 ${PAPER_LINK}`} data-testid="readiness-change">
        Pick a different plant
      </button>
    </section>
  );
}
