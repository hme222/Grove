import React, { useEffect, useMemo, useState } from 'react';
import { FRAME_KEY, PHONE, fitScale, clockText, shouldFrame, frameChoice } from '../lib/phoneFrame';

const read = (k) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch { /* storage can be blocked */ } };

function StatusBar() {
  const [now, setNow] = useState(() => clockText());
  useEffect(() => {
    const t = setInterval(() => setNow(clockText()), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative flex items-end justify-between px-8 pb-2 text-grove-cream" style={{ height: PHONE.statusBar }} aria-hidden="true">
      <span className="font-ui text-lead font-semibold leading-none tracking-tight">{now}</span>
      <span className="absolute left-1/2 top-[11px] h-[34px] w-[122px] -translate-x-1/2 rounded-pill bg-grove-night" />
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="0.8" /><rect x="5" y="5.5" width="3" height="6.5" rx="0.8" /><rect x="10" y="3" width="3" height="9" rx="0.8" /><rect x="15" y="0" width="3" height="12" rx="0.8" /></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1.5 4.2a10 10 0 0 1 14 0" /><path d="M4.2 7a6 6 0 0 1 8.6 0" /><circle cx="8.5" cy="10" r="1" fill="currentColor" stroke="none" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.5" /><rect x="2" y="2" width="19" height="9" rx="2.2" fill="currentColor" /><path d="M24.2 4.3v4.4c.9-.3 1.6-1.2 1.6-2.2s-.7-1.9-1.6-2.2Z" fill="currentColor" opacity="0.5" /></svg>
      </span>
    </div>
  );
}

export default function PhonePreviewShell({ children }) {
  const [width, setWidth] = useState(() => window.innerWidth);
  const [height, setHeight] = useState(() => window.innerHeight);
  const framed = useMemo(() => {
    const embedded = window.self !== window.top;
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    const search = window.location.search;
    // An explicit ?frame= choice is remembered, so it survives navigation inside the preview.
    const p = new URLSearchParams(search).get('frame');
    if (p === 'off') write(FRAME_KEY, 'off'); else if (p === 'on') write(FRAME_KEY, null);
    return shouldFrame({ embedded, standalone, width, search, stored: read(FRAME_KEY) });
  }, [width]);

  useEffect(() => {
    const onResize = () => { setWidth(window.innerWidth); setHeight(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keep the address bar in step with where the app is inside the preview.
  useEffect(() => {
    if (!framed) return undefined;
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'grove-route') return;
      if (typeof e.data.path === 'string' && e.data.path.startsWith('/')) window.history.replaceState(null, '', e.data.path);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [framed]);

  const initialSrc = useMemo(() => `${window.location.pathname}${window.location.search.replace(/[?&]frame=(on|off)/, '')}${window.location.hash}`, []);

  if (!framed) return children;

  const scale = fitScale(height);
  const deviceH = PHONE.height + 28;
  const screenH = PHONE.height - PHONE.statusBar - PHONE.homeBar;

  const hide = () => { write(FRAME_KEY, 'off'); window.location.reload(); };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-grove-night px-4 py-8" data-testid="phone-preview">
      <div style={{ width: PHONE.width * scale + 28 * scale, height: deviceH * scale }}>
        <div style={{ width: PHONE.width + 28, height: deviceH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          className="rounded-phone border-strong border-grove-moss bg-grove-night p-3 shadow-dialog">
          <div className="overflow-hidden rounded-phoneScreen bg-grove-forest" style={{ width: PHONE.width, height: PHONE.height }}>
            <StatusBar />
            <iframe title="FloraGrove app preview" src={initialSrc} style={{ width: PHONE.width, height: screenH, border: 0, display: 'block', background: 'var(--grove-forest)' }} />
            <div className="flex items-center justify-center bg-grove-forest" style={{ height: PHONE.homeBar }} aria-hidden="true">
              <span className="h-[5px] w-[134px] rounded-pill bg-grove-cream/80" />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center font-ui text-xs text-grove-sage">
        iPhone preview. Open FloraGrove on your phone for the real thing.{' '}
        <button type="button" onClick={hide} className="underline underline-offset-2 hover:text-grove-cream" data-testid="phone-preview-hide">Hide the phone frame</button>
      </p>
    </div>
  );
}

export { frameChoice };
