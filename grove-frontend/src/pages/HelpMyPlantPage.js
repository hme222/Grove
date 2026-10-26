import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SYMPTOMS, SAFETY_NOTE, SOIL_CHECK } from '../lib/plantHelp';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';

export default function HelpMyPlantPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const symptom = SYMPTOMS.find((s) => s.id === selected);

  return (
    <div className="pb-24">
      <PageHeader
        title="Help my plant"
        back
      />
      <div className="max-w-column mx-auto px-4 py-5 space-y-6">
        <section aria-labelledby="symptom-heading">
          <h2 id="symptom-heading" className="font-plant text-xl font-semibold text-grove-cream">What do you see?</h2>
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
                  className={buttonVariants({ variant: 'chip' })}
                    aria-pressed={active}
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
              {symptom.soilCheck && (
                <div className="rounded-card border-hairline border-grove-sun/40 bg-grove-canopy p-5" data-testid="soil-check">
                  <h2 className="font-plant text-xl font-semibold text-grove-cream">{SOIL_CHECK.title}</h2>
                  <p className="mt-1 font-ui text-sm text-grove-sage">{SOIL_CHECK.body}</p>
                  <ul className="mt-2 space-y-1 font-ui text-sm text-grove-cream">
                    <li>{SOIL_CHECK.dry}</li>
                    <li>{SOIL_CHECK.wet}</li>
                  </ul>
                </div>
              )}
              <h2 className="font-plant text-xl font-semibold text-grove-cream">{symptom.soilCheck ? 'Then match what you see' : 'Most likely causes'}</h2>
              <ol className="space-y-3">
                {symptom.causes.map((c, i) => (
                  <li key={c.title} className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5">
                    <h3 className="font-plant text-base font-semibold text-grove-cream">{i === 0 && !symptom.soilCheck ? 'Start here: ' : ''}{c.title}</h3>
                    <p className="mt-2 font-ui text-sm leading-relaxed text-grove-sage"><span className="text-grove-cream">What to check. </span>{c.check}</p>
                    <p className="mt-2 font-ui text-sm leading-relaxed text-grove-sage"><span className="text-grove-cream">What to try. </span>{c.fix}</p>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => navigate('/lessons')}
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Learn the soil finger-test
              </button>
            </div>
          )}
        </section>

        <p className="rounded-small bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-sage" data-testid="safety-note">{SAFETY_NOTE}</p>
      </div>
    </div>
  );
}
