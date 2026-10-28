import React, { useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { plantAPI, experimentAPI } from '../lib/api';

// "Check with a photo", the treatment arm of the help_diagnosis experiment (see grove-backend/experiments.py).
// The soil question comes first and the photo can't be sent without it: a photo can't show how wet the soil is.

const SOIL = [
  { id: 'dry', label: 'Dry' },
  { id: 'damp', label: 'Slightly damp' },
  { id: 'wet', label: 'Wet or soggy' },
  { id: 'not_checked', label: 'I haven’t checked' },
];
const EXPERIMENT = 'help_diagnosis';
const log = (event, props) => { experimentAPI.event(EXPERIMENT, event, props).catch(() => {}); };

export default function PhotoCheck() {
  const [soil, setSoil] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | working | done | failed | rejected
  const [result, setResult] = useState(null);
  const [noneFit, setNoneFit] = useState(false);
  const fileRef = useRef(null);

  const choosePhoto = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file || !soil || soil === 'not_checked') return;
    setStatus('working'); setResult(null); setNoneFit(false);
    log('photo_check_started', { soil });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await plantAPI.upload(fd);
      const res = await plantAPI.diagnosePhoto({ path: up.data.path, soil_answer: soil });
      if (res.data.error || res.data.needsSoilCheck) { setStatus('failed'); return; }
      setResult(res.data);
      setStatus('done');
    } catch {
      setStatus('failed');
    }
  };

  return (
    <section className="rounded-card border-hairline border-grove-moss bg-grove-canopy p-5" aria-labelledby="photo-check-heading" data-testid="photo-check">
      <h2 id="photo-check-heading" className="font-plant text-xl font-semibold text-grove-cream">Check with a photo</h2>
      <p className="mt-1 font-ui text-sm text-grove-sage">First, the soil. Push a finger in two knuckles deep. A photo can’t show how wet it is.</p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="How does the soil feel?" data-testid="soil-answer">
        {SOIL.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={soil === s.id}
            onClick={() => { setSoil(s.id); setStatus('idle'); setResult(null); }}
            data-testid={`soil-${s.id}`}
            className={buttonVariants({ variant: 'chip' })}
          >
            {s.label}
          </button>
        ))}
      </div>

      {soil === 'not_checked' && (
        <p className="mt-3 font-ui text-sm text-grove-cream" data-testid="soil-needed" role="status">
          Check the soil first, then come back and tell us how it feels. The symptom list below works without it.
        </p>
      )}

      {soil && soil !== 'not_checked' && (
        <div className="mt-4">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={choosePhoto} aria-label="Choose a photo of the plant" data-testid="photo-check-file" />
          <button
            type="button"
            disabled={status === 'working'}
            onClick={() => fileRef.current && fileRef.current.click()}
            className={cn(buttonVariants(), 'w-full')}
            data-testid="photo-check-choose"
          >
            {status === 'working' ? 'Looking at your photo…' : 'Take or choose a photo'}
          </button>
        </div>
      )}

      <div aria-live="polite" data-testid="photo-check-result">
        {status === 'failed' && (
          <p className="mt-4 font-ui text-sm text-grove-cream" data-testid="photo-check-failed">
            We couldn’t check that photo. Your answer is kept. Try again, or use the symptom list below.
          </p>
        )}
        {status === 'done' && result && (
          <div className="mt-4 space-y-3" data-testid="photo-check-done">
            <p className="font-ui text-sm font-semibold text-grove-cream" data-testid="photo-check-confidence">{result.confidence}</p>
            {result.causes.length === 0 ? (
              <p className="font-ui text-sm text-grove-sage">We couldn’t spot a clear cause in this photo. The symptom list below may help.</p>
            ) : (
              <ol className="space-y-3">
                {result.causes.map((c) => (
                  <li key={c.title} className="rounded-small bg-grove-forest p-4">
                    <h3 className="font-plant text-base font-semibold text-grove-cream">{c.likelihood}: {c.title}</h3>
                    {c.why && <p className="mt-2 font-ui text-sm text-grove-sage"><span className="text-grove-cream">Why. </span>{c.why}</p>}
                    {c.check && <p className="mt-2 font-ui text-sm text-grove-sage"><span className="text-grove-cream">What to check. </span>{c.check}</p>}
                    {c.fix && <p className="mt-2 font-ui text-sm text-grove-sage"><span className="text-grove-cream">What to try. </span>{c.fix}</p>}
                  </li>
                ))}
              </ol>
            )}
            <p className="font-ui text-xs text-grove-sage">{result.limits}</p>
            {!noneFit ? (
              <button
                type="button"
                onClick={() => { setNoneFit(true); log('photo_check_none_fit'); }}
                className={buttonVariants({ variant: 'outline' })}
                data-testid="photo-check-none-fit"
              >
                None of these fit
              </button>
            ) : (
              <p className="font-ui text-sm text-grove-cream" role="status" data-testid="photo-check-none-fit-note">
                Thanks. Pick the closest symptom below to see other causes and quick checks.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
