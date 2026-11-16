import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, zoneAPI } from '../../lib/api';
import SaveError from './SaveError';
import { useInstantSave } from './useInstantSave';

// Country, ZIP code (or postcode) and an optional hand-entered zone, inside the Your home sheet. Shown only when
// features.ZIP_ZONE_ENABLED is on; the sheet does that gating. Each change saves by itself: a code saves once the
// person stops typing (600ms) or leaves the field, and only if the lookup finds it. The server derives the zone, so
// the saved line reads the zone from the save's response. Undo puts back the country, code and zone from before, and
// clears a hemisphere the save filled in (the server fills it from a US ZIP code only when none is set).
// Saves, Undo and Try again go through one queue, and each cancels a code still being typed, so the field and the
// server cannot end up holding different codes.

const DEBOUNCE_MS = 600;
const NOT_FOUND = 'We couldn’t find that code. Nothing was saved.';
const LOOKUP_FAILED = 'We couldn’t look that up. Nothing was saved.';
const ZONE_EMPTY = 'Enter a zone, like 7b.';

const SOURCE_LABEL = {
  'zip-prefix': 'from your ZIP code',
  'state-default': 'from your state',
  'postcode-area': 'from your UK postcode',
  manual: 'entered by you',
};

const inputClass = 'w-full min-h-touch rounded-inset border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-cream placeholder:text-grove-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime aria-[invalid=true]:border-destructive';
const labelClass = 'mb-1.5 block font-ui text-sm text-grove-cream';
const linkButtonClass = 'inline-flex min-h-touch items-center rounded-control font-ui text-sm font-semibold text-grove-cream underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime disabled:opacity-50';

// Stored data uses "UK"; the server also accepts "GB".
const normalizeCountry = (c) => (['UK', 'GB', 'UNITED KINGDOM', 'GREAT BRITAIN'].includes(String(c || '').toUpperCase()) ? 'UK' : 'US');
const DERIVED_SOURCES = ['zip-prefix', 'state-default', 'postcode-area'];
const zoneName = (zone, system) => `${system === 'RHS' ? 'RHS' : 'USDA'} zone ${zone}`;
const snapshot = (u) => ({
  country: u?.location_country || '',
  postcode: u?.location_postcode || '',
  zone: u?.hardiness_zone || '',
  system: u?.hardiness_zone_system || '',
  source: u?.hardiness_zone_source || '',
  hemisphere: u?.hemisphere || '',
});

export default function LocationFields() {
  const { user, refreshUser } = useAuth();
  const [country, setCountry] = useState(() => normalizeCountry(user?.location_country));
  const [code, setCode] = useState(user?.location_postcode || '');
  const [status, setStatus] = useState('idle'); // idle | looking | notfound
  const [lookupError, setLookupError] = useState('');
  const [saved, setSaved] = useState(null); // { text, prev, focus }
  const [announce, setAnnounce] = useState('');
  const [current, setCurrent] = useState(() => snapshot(user));
  const [manualOpen, setManualOpen] = useState(false);
  const [manualZone, setManualZone] = useState(user?.hardiness_zone || '');
  const [manualError, setManualError] = useState('');

  const locationSave = useInstantSave();
  const zoneSave = useInstantSave();
  const undoSave = useInstantSave();

  // What the server holds now, from the user at mount and then from each save's response.
  const server = useRef(snapshot(user));
  const seq = useRef(0); // the latest code typed; older lookups are ignored
  const timer = useRef(null);
  const inflight = useRef(Promise.resolve());
  const pending = useRef(null); // the { ctry, value } a running debounce will save
  const codeRef = useRef(null);
  const manualRef = useRef(null);
  const undoRef = useRef(null);
  const undoFocus = useRef(null); // the field focus returns to after a retried Undo
  const openedManual = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;
  const attemptRef = useRef(null);

  // The saved location can change outside this sheet (a save that finished after an earlier copy of the sheet
  // closed). Follow it, but only in the fields the person has not edited since.
  useEffect(() => {
    const next = snapshot(user);
    const old = server.current;
    if (['country', 'postcode', 'zone', 'system', 'source'].every((k) => old[k] === next[k])) return;
    server.current = next;
    setCurrent(next);
    setCountry((c) => (c === normalizeCountry(old.country) ? normalizeCountry(next.country) : c));
    setCode((c) => (c.trim() === old.postcode ? next.postcode : c));
    setManualZone((z) => (z.trim() === old.zone ? next.zone : z));
  }, [user?.location_country, user?.location_postcode, user?.hardiness_zone, user?.hardiness_zone_system, user?.hardiness_zone_source]); // eslint-disable-line react-hooks/exhaustive-deps

  // Closing the sheet mid-typing must not throw the code away: save a pending debounce now, and leave seq alone
  // so a lookup already running still saves. useInstantSave stops setting state once unmounted.
  useEffect(() => () => {
    if (timer.current && pending.current) attemptRef.current(pending.current.ctry, pending.current.value);
  }, []);

  useEffect(() => {
    if (manualOpen && openedManual.current && manualRef.current) manualRef.current.focus();
    openedManual.current = false;
  }, [manualOpen]);

  const applyServer = (data, fallback) => {
    const next = data ? { ...snapshot(data) } : { ...server.current, ...fallback };
    server.current = next;
    setCurrent(next);
  };

  const refresh = async () => {
    try { if (refreshUser) await refreshUser(); } catch (_e) { /* the save itself worked */ }
  };

  // Saves one at a time, so a newer code never races an older save to the server.
  const queue = (promise) => { inflight.current = promise.catch(() => {}); return promise; };

  // filledHemisphere: the hemisphere this save set where there was none, so Undo can clear it again.
  const showSaved = (data, prev, focus, filledHemisphere = '') => {
    const zone = data?.hardiness_zone;
    setAnnounce('');
    setSaved({ text: zone ? `✓ Saved · ${zoneName(zone, data.hardiness_zone_system)}` : '✓ Saved', prev, focus, filledHemisphere });
  };

  // Stops a code that is still being typed or looked up from saving after this point.
  const cancelTyping = () => {
    clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    seq.current += 1;
  };

  const attempt = async (ctry, raw) => {
    clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    const value = raw.trim();
    const mine = ++seq.current;
    setLookupError('');
    setAnnounce('');
    if (!value) { setStatus('idle'); return false; }
    const s = server.current;
    if (normalizeCountry(s.country) === ctry && s.postcode === value) {
      // Already saved, so a failed save's message no longer applies.
      setStatus('idle');
      locationSave.clear();
      return true;
    }
    setStatus('looking');
    let data;
    try {
      data = (await zoneAPI.lookup(ctry, value)).data;
    } catch (_e) {
      if (mine === seq.current) { setStatus('idle'); setLookupError(LOOKUP_FAILED); }
      return false;
    }
    if (mine !== seq.current) return false;
    if (!data || !data.zone) { setStatus('notfound'); return false; }
    setStatus('idle');
    await inflight.current;
    if (mine !== seq.current) return false;
    const prev = { ...server.current };
    const hadHemisphere = !!userRef.current?.hemisphere;
    return queue(locationSave.run(
      () => setSaved(null),
      async () => {
        const res = await userAPI.updateMe({ location_country: ctry, location_postcode: value });
        applyServer(res?.data, { country: ctry, postcode: value });
        // A newer code or an Undo has taken over; the server state is applied, but this save is not the one to show.
        if (mine === seq.current) showSaved(res?.data, prev, codeRef, hadHemisphere ? '' : res?.data?.hemisphere || '');
        await refresh();
      },
      // Controller ruling: the text field keeps what the person typed. Nothing to undo locally, because the saved
      // and current-zone lines only change after a successful save, so they still show the old saved value.
      () => {},
    ));
  };
  attemptRef.current = attempt;

  // Try again saves what is in the field now, through the same queue and checks as typing.
  const retryLocation = () => attempt(country, code);

  const retryLookup = async () => {
    const ok = await attempt(country, code);
    // The retry may end in not-found, which removes this Try again; keep focus on the field either way.
    setTimeout(() => { if (codeRef.current) codeRef.current.focus(); }, 0);
    return ok;
  };

  const schedule = (ctry, value) => {
    clearTimeout(timer.current);
    seq.current += 1; // a lookup still running is for a code no longer in the field
    pending.current = { ctry, value };
    setStatus('idle');
    setLookupError('');
    timer.current = setTimeout(() => { attempt(ctry, value); }, DEBOUNCE_MS);
  };

  const onCodeChange = (e) => { setCode(e.target.value); schedule(country, e.target.value); };
  const onCountryChange = (e) => {
    const next = e.target.value;
    setCountry(next);
    if (code.trim()) schedule(next, code); else setStatus('idle');
  };
  const onCodeBlur = () => { if (timer.current) attempt(country, code); };

  const undo = () => {
    if (!saved) return;
    const { prev, focus, filledHemisphere } = saved;
    const shown = saved;
    undoFocus.current = focus.current;
    // Clicking Undo blurs the code field, which may have started saving a newly typed code. Undo wins.
    cancelTyping();
    queue(undoSave.run(
      () => setSaved(null),
      async () => {
        await inflight.current;
        // The server marks any zone it is sent as manual. A zone it derived is restored by sending back the code
        // alone, so it derives the same zone with the right source. An empty zone clears it.
        const derived = DERIVED_SOURCES.includes(prev.source) && prev.postcode;
        const patch = { location_country: prev.country, location_postcode: prev.postcode };
        if (!derived) {
          patch.hardiness_zone = prev.zone;
          if (prev.system) patch.hardiness_zone_system = prev.system;
        }
        // Clear a hemisphere the save filled in, unless the person has picked one since.
        if (filledHemisphere && userRef.current?.hemisphere === filledHemisphere) patch.hemisphere = '';
        const res = await userAPI.updateMe(patch);
        cancelTyping();
        applyServer(res?.data, prev);
        setSaved(null);
        locationSave.clear();
        setCountry(normalizeCountry(prev.country));
        setCode(prev.postcode);
        setManualZone(prev.zone);
        setStatus('idle');
        setAnnounce(prev.postcode || prev.zone
          ? `Undone. Back to ${[prev.postcode, prev.zone && zoneName(prev.zone, prev.system)].filter(Boolean).join(', ')}.`
          : 'Undone. Your location is cleared.');
        // The Undo button is gone; put focus back on the field that was saved.
        setTimeout(() => { if (focus.current) focus.current.focus(); }, 0);
        await refresh();
      },
      () => {
        setSaved(shown);
        // The Undo button unmounted when it was pressed; put focus back on it once it returns.
        setTimeout(() => { if (undoRef.current) undoRef.current.focus(); }, 0);
      },
    ));
  };

  const retryUndo = () => { cancelTyping(); return queue(undoSave.retry()); };

  const onManualBlur = () => {
    const value = manualZone.trim();
    if (!value) { setManualError(ZONE_EMPTY); return; }
    setManualError('');
    if (value === server.current.zone) return;
    const prev = { ...server.current };
    setAnnounce('');
    queue(zoneSave.run(
      () => setSaved(null),
      async () => {
        await inflight.current;
        const res = await userAPI.updateMe({ hardiness_zone: value });
        applyServer(res?.data, { zone: value, source: 'manual' });
        showSaved(res?.data, prev, manualRef);
        await refresh();
      },
      () => {},
    ));
  };

  const isUK = country === 'UK';
  const codeDescribedBy = [
    status === 'notfound' && 'location-not-found',
    lookupError && 'location-lookup-error',
    locationSave.error && 'location-error',
  ].filter(Boolean).join(' ') || undefined;
  const manualDescribedBy = [
    manualError && 'zone-manual-error',
    zoneSave.error && 'zone-manual-save-error',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-4" data-testid="location-fields">
      <div>
        <label htmlFor="location-country" className={labelClass}>Country</label>
        <select
          id="location-country"
          value={country}
          onChange={onCountryChange}
          data-testid="location-country"
          className={inputClass}
        >
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
        </select>
      </div>

      <div>
        <label htmlFor="location-code" className={labelClass}>{isUK ? 'Postcode' : 'ZIP code'}</label>
        <input
          id="location-code"
          ref={codeRef}
          type="text"
          autoComplete="postal-code"
          value={code}
          onChange={onCodeChange}
          onBlur={onCodeBlur}
          placeholder={isUK ? 'e.g. SW1A 1AA' : 'e.g. 10001'}
          aria-invalid={status === 'notfound' ? 'true' : 'false'}
          aria-describedby={codeDescribedBy}
          data-testid="location-code"
          className={inputClass}
        />
        <SaveError id="location-lookup-error" testId="location-lookup-error" error={lookupError} onRetry={retryLookup} />
        <SaveError id="location-error" testId="location-error" error={locationSave.error} onRetry={retryLocation} focusAfter={codeRef} />
      </div>

      <div role="status" aria-live="polite" data-testid="location-status" className="font-ui text-sm text-grove-cream">
        {status === 'looking' && <p className="text-grove-sage">Looking up…</p>}
        {status === 'notfound' && <p id="location-not-found" data-testid="location-not-found">{NOT_FOUND}</p>}
        {saved && (
          <p data-testid="location-saved" className="flex flex-wrap items-center gap-x-3">
            <span>{saved.text}</span>
            <button
              type="button"
              ref={undoRef}
              onClick={undo}
              disabled={undoSave.busy}
              aria-describedby={undoSave.error ? 'location-undo-error' : undefined}
              className={linkButtonClass}
            >
              Undo
            </button>
          </p>
        )}
        {announce && <p data-testid="location-announce">{announce}</p>}
      </div>
      <SaveError id="location-undo-error" testId="location-undo-error" error={undoSave.error} onRetry={retryUndo} focusAfter={undoFocus} />

      {current.zone && !saved && (
        <p className="font-ui text-sm text-grove-sage" data-testid="zone-source-label">
          Your zone: {zoneName(current.zone, current.system)}
          {SOURCE_LABEL[current.source] ? `, ${SOURCE_LABEL[current.source]}` : ''}
        </p>
      )}

      {manualOpen ? (
        <div>
          <label htmlFor="profile-zone-manual" className={labelClass}>Your zone</label>
          <input
            id="profile-zone-manual"
            ref={manualRef}
            type="text"
            value={manualZone}
            onChange={(e) => { setManualZone(e.target.value); setManualError(''); }}
            onBlur={onManualBlur}
            placeholder="e.g. 7b or H4"
            aria-invalid={manualError ? 'true' : 'false'}
            aria-describedby={manualDescribedBy}
            data-testid="profile-zone-manual"
            className={inputClass}
          />
          {manualError && (
            <p id="zone-manual-error" role="alert" data-testid="zone-manual-error" className="mt-2 font-ui text-sm text-destructive">
              {manualError}
            </p>
          )}
          <SaveError id="zone-manual-save-error" testId="zone-manual-save-error" error={zoneSave.error} onRetry={zoneSave.retry} focusAfter={manualRef} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { openedManual.current = true; setManualOpen(true); }}
          data-testid="location-enter-zone"
          className={linkButtonClass}
        >
          Enter it instead
        </button>
      )}
    </div>
  );
}
