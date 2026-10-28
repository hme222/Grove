import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SYMPTOMS, SAFETY_INTRO, SAFETY_CONTACTS, SAFETY_STEPS, SOIL_CHECK } from '../lib/plantHelp';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { experimentAPI } from '../lib/api';
import PhotoCheck from '../components/PhotoCheck';

export default function HelpMyPlantPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const symptom = SYMPTOMS.find((s) => s.id === selected);

  // The help_diagnosis experiment. Anyone we can't place, or if the call fails, gets the plain symptom list.
  const [arm, setArm] = useState('control');
  useEffect(() => {
    let alive = true;
    experimentAPI.helpDiagnosisArm()
      .then((res) => {
        if (!alive) return;
        setArm(res.data.arm);
        experimentAPI.event('help_diagnosis', 'exposure').catch(() => {});
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const pickSymptom = (id, active) => {
    setSelected(active ? null : id);
    if (!active) experimentAPI.event('help_diagnosis', 'triage_symptom_picked', { symptom: id }).catch(() => {});
  };

  return (
    <div className="pb-24">
      <PageHeader
        title="Help my plant"
        back
      />
      <div className="max-w-column mx-auto px-4 py-5 space-y-6">
        {arm === 'photo_check' && <PhotoCheck />}
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
                  onClick={() => pickSymptom(s.id, active)}
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

        <section className="rounded-small bg-grove-canopy px-4 py-4" data-testid="safety-note" aria-labelledby="safety-heading">
          <h2 id="safety-heading" className="font-plant text-base font-semibold text-grove-cream">{SAFETY_INTRO}</h2>
          <dl className="mt-3 space-y-3 font-ui text-sm text-grove-sage">
            {SAFETY_CONTACTS.map((c) => (
              <div key={c.id} data-testid={`safety-${c.id}`}>
                <dt className="font-medium text-grove-cream">{c.heading}</dt>
                <dd>
                  <span>{c.text}</span>
                  {c.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="flex min-h-touch items-center text-grove-sprout underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
                    >
                      {l.label}
                    </a>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 font-ui text-sm text-grove-cream" data-testid="safety-steps">{SAFETY_STEPS}</p>
        </section>
      </div>
    </div>
  );
}
