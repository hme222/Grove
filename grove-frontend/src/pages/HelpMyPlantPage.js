import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SYMPTOMS, SAFETY_NOTE } from '../lib/plantHelp';
import { ChevronLeft } from 'lucide-react';

export default function HelpMyPlantPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const symptom = SYMPTOMS.find((s) => s.id === selected);

  return (
    <div className="pb-24">
      <PageHeader
        title="Help my plant"
        rightContent={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-[44px] rounded-[12px] border-[0.5px] border-grove-moss px-3 font-ui text-xs text-grove-cream hover:border-grove-fernLine flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back
          </button>
        }
      />
      <div className="max-w-[600px] mx-auto px-4 py-5 space-y-6">
        <section aria-labelledby="symptom-heading">
          <h2 id="symptom-heading" className="font-plant text-2xl text-grove-cream">What do you see?</h2>
          <p className="mt-1 font-ui text-sm text-grove-sage">Pick the closest match. These are common causes and quick checks, not a diagnosis.</p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Symptoms" data-testid="symptom-list">
            {SYMPTOMS.map((s) => {
              const active = s.id === selected;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(active ? null : s.id)}
                  data-testid={`symptom-${s.id}`}
                  className={`min-h-[44px] rounded-full border-[0.5px] px-4 font-ui text-sm transition-colors duration-150 ${
                    active ? 'border-grove-lime bg-grove-lime text-grove-root' : 'border-grove-moss bg-grove-canopy text-grove-cream hover:border-grove-fernLine'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-live="polite" data-testid="causes">
          {symptom && (
            <div className="space-y-3">
              <h2 className="font-plant text-xl text-grove-cream">Most likely causes</h2>
              <ol className="space-y-3">
                {symptom.causes.map((c, i) => (
                  <li key={c.title} className="rounded-[22px] border-[0.5px] border-grove-moss bg-grove-canopy px-5 py-4">
                    <h3 className="font-plant text-lg text-grove-cream">{i === 0 ? 'Start here: ' : ''}{c.title}</h3>
                    <p className="mt-2 font-ui text-sm leading-relaxed text-grove-sage"><span className="text-grove-cream">What to check. </span>{c.check}</p>
                    <p className="mt-2 font-ui text-sm leading-relaxed text-grove-sage"><span className="text-grove-cream">What to try. </span>{c.fix}</p>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => navigate('/lessons')}
                className="min-h-[44px] rounded-[12px] border-[0.5px] border-grove-moss px-4 font-ui text-sm text-grove-cream hover:border-grove-fernLine"
              >
                Learn the soil finger-test
              </button>
            </div>
          )}
        </section>

        <p className="rounded-[14px] bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-sage" data-testid="safety-note">{SAFETY_NOTE}</p>
      </div>
    </div>
  );
}
