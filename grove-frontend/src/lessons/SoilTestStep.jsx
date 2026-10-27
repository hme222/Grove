import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { plantAPI, careAPI } from '../lib/api';
import { NOTE_CHIPS } from './lessonMeta';

const OUTCOMES = [
  { value: 'dry', label: 'Dry and dusty' },
  { value: 'damp', label: 'Damp and cool' },
];
const DECISIONS = [
  { value: 'water', label: 'Water it' },
  { value: 'wait', label: 'Wait' },
];

const plantLabel = (p) => p.nickname || p.common_name || 'Unnamed plant';

const choiceClass = (on) =>
  `flex-1 rounded-inset border-hairline px-3 py-3 text-sm font-ui text-grove-cream ${
    on ? 'border-grove-fernLine bg-grove-moss ring-1 ring-grove-lime/25' : 'border-grove-moss bg-grove-forest hover:border-grove-fernLine'
  }`;

// The Soil finger-test's last card. With a plant it logs a real soil test.
// Without one it says to save the lesson for the first plant, logs nothing,
// and does not mark the lesson complete.
export default function SoilTestStep({ hasPlant, onLogged }) {
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [plantId, setPlantId] = useState('');
  const [outcome, setOutcome] = useState('');
  const [decision, setDecision] = useState('');
  const [chips, setChips] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (!hasPlant) return undefined;
    let alive = true;
    plantAPI
      .getAll()
      .then((res) => {
        if (!alive) return;
        const list = res.data?.plants || [];
        setPlants(list);
        if (list.length > 0) setPlantId(list[0].id);
      })
      .catch(() => {
        if (alive) setError('Could not load your plants. Try again.');
      });
    return () => {
      alive = false;
    };
  }, [hasPlant]);

  if (!hasPlant) {
    return (
      <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="soil-step-no-plant">
        <p className="font-plant text-grove-cream text-lg mb-1">Save this for your first plant</p>
        <p className="text-sm text-grove-cream mb-3">
          When you add a plant, this lesson will be waiting. You&apos;ll press a finger into its soil and log what you find.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/lessons')}
            className={cn(buttonVariants({ variant: 'outline' }), "flex-1")}
          >
            Back to lessons
          </button>
          <button
            type="button"
            onClick={() => navigate('/add-plant')}
            className={cn(buttonVariants(), "flex-1")}
            data-testid="soil-step-add-plant"
          >
            Add a plant
          </button>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5" data-testid="soil-step-saved">
        <p className="font-plant text-grove-cream text-lg mb-1">Soil test logged</p>
        {saved.soil_coaching && <p className="text-sm text-grove-cream mb-3">{saved.soil_coaching}</p>}
        <button
          type="button"
          onClick={() => onLogged(saved)}
          className={cn(buttonVariants(), "w-full")}
          data-testid="soil-step-continue"
        >
          Finish lesson
        </button>
      </div>
    );
  }

  const toggleChip = (chip) =>
    setChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));

  const submit = async () => {
    // A double tap must not log two soil tests.
    if (submitting.current) return;
    if (!plantId) {
      setError('Pick the plant you tested.');
      return;
    }
    if (!outcome) {
      setError('Choose what you felt: dry or damp.');
      return;
    }
    setError('');
    submitting.current = true;
    setSaving(true);
    try {
      const res = await careAPI.createLog(plantId, {
        actions: ['soil_check'],
        soil_outcome: outcome,
        soil_decision: decision || null,
        notes: chips.join(', '),
      });
      setSaved(res.data?._meta || {});
    } catch (_e) {
      setError('Could not save your soil test. Try again.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 space-y-3" data-testid="soil-step">
      {plants.length > 1 && (
        <label className="block text-xs font-ui text-grove-cream">
          Which plant?
          <select
            value={plantId}
            onChange={(e) => setPlantId(e.target.value)}
            className="mt-1 w-full rounded-inset border-hairline border-grove-moss bg-grove-forest px-3 py-2 text-sm"
            data-testid="soil-step-plant"
          >
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {plantLabel(p)}
              </option>
            ))}
          </select>
        </label>
      )}

      <fieldset>
        <legend className="text-xs font-ui text-grove-cream mb-2">What did you feel in the soil?</legend>
        <div className="flex gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={outcome === o.value}
              onClick={() => setOutcome(o.value)}
              className={choiceClass(outcome === o.value)}
              data-testid={`soil-outcome-${o.value}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-ui text-grove-cream mb-2">What will you do? (optional)</legend>
        <div className="flex gap-2">
          {DECISIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              aria-pressed={decision === d.value}
              onClick={() => setDecision(decision === d.value ? '' : d.value)}
              className={choiceClass(decision === d.value)}
              data-testid={`soil-decision-${d.value}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-ui text-grove-cream mb-2">What did you notice? (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {NOTE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              aria-pressed={chips.includes(chip)}
              onClick={() => toggleChip(chip)}
              className={`rounded-pill border-hairline px-3 py-1 text-xs font-ui ${
                chips.includes(chip) ? 'border-grove-fernLine bg-grove-moss' : 'border-grove-moss bg-grove-forest'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-xs font-ui text-destructive" data-testid="soil-step-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        aria-busy={saving}
        className={cn(buttonVariants(), "w-full")}
        data-testid="soil-step-submit"
      >
        {saving ? 'Saving…' : 'Log my soil test'}
      </button>
    </div>
  );
}
