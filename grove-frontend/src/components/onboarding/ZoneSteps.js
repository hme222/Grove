import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { userAPI, zoneAPI } from '@/lib/api';
import StepScreen, { StepActions, blockedClass } from './StepScreen';
import PhotoBand from '../PhotoBand';

const ZIP = /^\d{5}$/;
const inputClass = 'w-full rounded-inset border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-cream placeholder:text-grove-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime aria-[invalid=true]:border-destructive';

// What a zip lookup means for the screen.
//   found     a zone we have for this zip's first three digits
//   known     a US zip we can place, with no zone of our own for it
//   missing   not a zip we know
//   unchecked the lookup itself failed (offline): the zip can still be saved
export function describeLookup(data) {
  if (!data) return 'unchecked';
  if (data.zone && data.source === 'zip-prefix') return 'found';
  if (data.hemisphere) return 'known';
  return 'missing';
}

const SEASON_NOTE = 'US zip codes only for now. Outside the US, skip this and tell us your hemisphere next.';

// Step 2 of 3, "Where do you grow?". Optional. A zone is shown only when we really have one for the zip.
export function ZoneStep({ onBack, onSaved, onSkip }) {
  const [zip, setZip] = useState('');
  const [state, setState] = useState('idle'); // idle | checking | found | known | missing | unchecked
  const [zone, setZone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const seq = useRef(0);

  useEffect(() => {
    setZone(null);
    if (!ZIP.test(zip)) { setState('idle'); return undefined; }
    const mine = ++seq.current;
    setState('checking');
    zoneAPI.lookup('US', zip)
      .then((res) => {
        if (mine !== seq.current) return;
        setZone(res.data);
        setState(describeLookup(res.data));
      })
      .catch(() => { if (mine === seq.current) setState('unchecked'); });
    return () => { seq.current += 1; };
  }, [zip]);

  const canContinue = ['found', 'known', 'unchecked'].includes(state) && !saving;

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await userAPI.updateMe({ location_country: 'US', location_postcode: zip });
      onSaved(res.data);
    } catch {
      setError('We couldn’t save that. Check your connection and try again, or skip for now.');
      setSaving(false);
    }
  };

  const invalid = state === 'missing';
  const zoneText = zone && zone.zone ? `Zone ${zone.zone}` : '';

  return (
    <StepScreen
      step={2}
      stepLabel="Your space"
      onBack={onBack}
      heading="Where do you grow?"
      intro="Your zip code helps us tailor seasonal care tips. We never share it. You can skip this."
      testId="onboarding-zone"
      hero={<PhotoBand src="/photos/window-1.jpg" ratio="short" eager />}
    >
      <div className="mt-6 flex flex-1 flex-col">
        <label htmlFor="zone-zip" className="mb-1.5 block font-ui text-sm text-grove-cream">Zip code</label>
        <input
          id="zone-zip"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="e.g. 10019"
          aria-invalid={invalid ? 'true' : 'false'}
          aria-describedby="zone-result zone-help"
          data-testid="zone-zip"
          className={inputClass}
        />
        <p id="zone-help" className="mt-1.5 font-ui text-sm text-grove-sage">{SEASON_NOTE}</p>

        <div id="zone-result" role="status" aria-live="polite" className="mt-4" data-testid="zone-result">
          {state === 'checking' && <p className="font-ui text-sm text-grove-sage">Checking your zip…</p>}
          {state === 'found' && (
            <div className="rounded-small border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3" data-testid="zone-found">
              <p className="flex items-center gap-2 font-ui text-base font-semibold text-grove-cream">
                <MapPin className="h-4 w-4 text-grove-sprout" aria-hidden="true" />
                {zoneText}
              </p>
              <p className="mt-1 font-ui text-sm text-grove-cream">
                {zone.description ? `In a typical winter the coldest night is about ${zone.description}. ` : ''}
                This is an estimate from the first three digits, so a boundary may sit close to you.
              </p>
            </div>
          )}
          {state === 'known' && (
            <div className="rounded-small border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3" data-testid="zone-known">
              <p className="font-ui text-base font-semibold text-grove-cream">No zone for this zip yet</p>
              <p className="mt-1 font-ui text-sm text-grove-cream">We&apos;ll still save your zip and leave the zone blank.</p>
            </div>
          )}
          {state === 'missing' && (
            <div className="rounded-small border-hairline border-destructive bg-grove-canopy px-4 py-3" data-testid="zone-missing">
              <p className="flex items-center gap-2 font-ui text-base font-semibold text-grove-cream">
                <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                Zip not found
              </p>
              <p className="mt-1 font-ui text-sm text-grove-cream">Check the digits, or skip for now. You can add it later in Settings.</p>
            </div>
          )}
          {state === 'unchecked' && (
            <p className="font-ui text-sm text-grove-cream" data-testid="zone-unchecked">
              We couldn&apos;t look that up just now. You can still continue and we&apos;ll save your zip.
            </p>
          )}
        </div>
        {error && <p role="alert" className="mt-3 font-ui text-sm text-destructive" data-testid="zone-error">{error}</p>}

        {!canContinue && !saving && (
          <p id="zone-continue-hint" className="mt-6 text-center font-ui text-sm text-grove-sage" data-testid="zone-continue-hint">
            {state === 'checking' ? 'Checking your zip…' : 'Enter a zip or choose Skip for now'}
          </p>
        )}
        <StepActions
          className={canContinue || saving ? undefined : 'pt-2'}
          primary={(
            <button
              type="button"
              onClick={canContinue ? save : undefined}
              aria-disabled={canContinue ? undefined : 'true'}
              aria-describedby={canContinue || saving ? undefined : 'zone-continue-hint'}
              aria-busy={saving}
              className={cn(buttonVariants(), 'w-full', !canContinue && blockedClass)}
              data-testid="zone-continue"
            >
              {saving ? 'Saving…' : 'Continue'}
            </button>
          )}
          secondary={(
            <button type="button" onClick={onSkip} className={cn(buttonVariants({ variant: 'ghost' }), 'w-full underline underline-offset-2')} data-testid="zone-skip">
              Skip for now
            </button>
          )}
        />
      </div>
    </StepScreen>
  );
}

// Asked once, only when the zip step did not answer it: a zip we can place is northern.
export function HemisphereStep({ onBack, onDone }) {
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  const choose = async (hemisphere) => {
    setSaving(hemisphere); setError('');
    try {
      const res = await userAPI.updateMe({ hemisphere });
      onDone(res.data);
    } catch {
      setError('We couldn’t save that. Check your connection and try again, or skip for now.');
      setSaving('');
    }
  };

  return (
    <StepScreen
      step={2}
      stepLabel="Your space"
      onBack={onBack}
      heading="Which hemisphere do you grow in?"
      intro="The seasons run the other way in the south, so we time seasonal tips to yours. You can skip this."
      testId="onboarding-hemisphere"
    >
      <div className="mt-6 flex flex-1 flex-col">
        <div role="group" aria-label="Hemisphere" className="space-y-2">
          {[['north', 'Northern hemisphere', 'For example the US, Canada, the UK and most of Europe and Asia.'],
            ['south', 'Southern hemisphere', 'For example Australia, New Zealand, Argentina and South Africa.']].map(([id, label, hint]) => (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              disabled={!!saving}
              aria-busy={saving === id}
              data-testid={`hemisphere-${id}`}
              className="flex min-h-row w-full flex-col items-start justify-center rounded-small border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3 text-left hover:border-grove-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime disabled:opacity-50"
            >
              <span className="font-ui text-base font-semibold text-grove-cream">{saving === id ? 'Saving…' : label}</span>
              <span className="font-ui text-sm text-grove-sage">{hint}</span>
            </button>
          ))}
        </div>
        {error && <p role="alert" className="mt-3 font-ui text-sm text-destructive" data-testid="hemisphere-error">{error}</p>}
        <div className="mt-auto pt-8">
          <button type="button" onClick={() => onDone(null)} disabled={!!saving} className={cn(buttonVariants({ variant: 'ghost' }), 'w-full underline underline-offset-2')} data-testid="hemisphere-skip">
            Skip for now
          </button>
        </div>
      </div>
    </StepScreen>
  );
}
