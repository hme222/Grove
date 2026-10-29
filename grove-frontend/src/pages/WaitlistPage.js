import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import api from '@/lib/api';
import { WelcomeStage } from '@/components/WelcomeStage';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';
import '@/components/WelcomeScreen.css';
import './WaitlistPage.css';

// FloraGrove waitlist landing page (Studio 12) (design/studio/Studio12-Rise.dc.html), headline #2b.
// The phone shows the real welcome screen, looping slowly. Signups go to POST /api/waitlist.
// The reply is the same for new and existing emails; only a new signup gets a token,
// which is what lets the visitor turn the beta opt-in on or off.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pointer tilt on the phone (GSAP). Desktop pointers only, and never with reduced motion.
function usePhoneTilt(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
      gsap.set(el, { transformPerspective: 1400, transformOrigin: '50% 30%' });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      const onMove = (e) => {
        ry((e.clientX / window.innerWidth - 0.5) * 8);
        rx(-(e.clientY / window.innerHeight - 0.5) * 5);
      };
      window.addEventListener('pointermove', onMove);
      return () => window.removeEventListener('pointermove', onMove);
    });
    return () => mm.revert();
  }, [ref]);
}

export default function WaitlistPage() {
  const tiltRef = useRef(null);
  usePhoneTilt(tiltRef);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');
  const [token, setToken] = useState(null);
  const [beta, setBeta] = useState(false);
  const [betaSaving, setBetaSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("That email doesn’t look quite right.");
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const res = await api.post('/waitlist', { email: value, source: 'studio12' });
      setToken(res.data?.token || null);
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      setError(err.response?.status === 422
        ? "That email doesn’t look quite right."
        : 'Something went wrong. Please try again.');
    }
  };

  const toggleBeta = async () => {
    if (!token || betaSaving) return;
    const next = !beta;
    setBetaSaving(true);
    try {
      await api.patch('/waitlist/beta', { token, beta: next });
      setBeta(next);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBetaSaving(false);
    }
  };

  return (
    <main className="wl" data-testid="waitlist-page">
      <header className="wl-header wl-in wl-in-1">
        <a className="wl-brand" href="/waitlist" aria-label="FloraGrove home">
          <FloraGroveWordmark size={26} />
        </a>
        <div className="wl-meta">
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <rect x="1" y="0.7" width="10" height="14.6" rx="2.4" />
            <path d="M4.6 2.8h2.8" strokeLinecap="round" />
          </svg>
          Coming to iPhone · Dec 2026
        </div>
      </header>

      <section className="wl-hero">
        <h1 className="wl-headline wl-in wl-in-2">Stop guessing when to water.</h1>
        <p className="wl-sub wl-in wl-in-3">FloraGrove tells you what each plant needs today, from water and light to soil, and why.</p>

        <div className="wl-form-wrap wl-in wl-in-4">
          {status !== 'done' ? (
            <>
              <form className={`wl-form ${error ? 'wl-form-error' : ''}`} onSubmit={submit} noValidate>
                <label htmlFor="wl-email" className="wl-sr">Email address</label>
                <input
                  id="wl-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'wl-error' : undefined}
                  data-testid="waitlist-email"
                />
                <button type="submit" disabled={status === 'sending'} data-testid="waitlist-submit">
                  {status === 'sending' ? 'Joining…' : 'Join the waitlist'}
                </button>
              </form>
              {error && <div id="wl-error" role="alert" className="wl-error">{error}</div>}
            </>
          ) : (
            <div role="status" className="wl-done" data-testid="waitlist-done">
              <div>You’re on the list. We’ll write to <strong>{email.trim()}</strong> in December.</div>
              {token && (
                <button type="button" className="wl-beta" onClick={toggleBeta} aria-pressed={beta} disabled={betaSaving}>
                  {beta ? 'We’ll invite you to test early. Tap to undo.' : 'Want to test FloraGrove before launch?'}
                </button>
              )}
              {error && <div role="alert" className="wl-error">{error}</div>}
            </div>
          )}
        </div>
        <div className="wl-proof wl-in wl-in-5">Free to join. Coming to iPhone in December.</div>
      </section>

      <div className="wl-stage">
        <div className="wl-glow" aria-hidden="true" />
        <div className="wl-tilt" ref={tiltRef}>
        <div
          className="wl-phone"
          role="img"
          aria-label="The FloraGrove app's welcome screen: Welcome to FloraGrove. A grove is a small group of trees growing closely together. FloraGrove is a safe space to learn about plants. Providing tools to help you feel confident in caring for your plants."
        >
          <span className="wl-btn wl-btn-action" aria-hidden="true" />
          <span className="wl-btn wl-btn-up" aria-hidden="true" />
          <span className="wl-btn wl-btn-down" aria-hidden="true" />
          <span className="wl-btn wl-btn-power" aria-hidden="true" />
          <div className="wl-screen" aria-hidden="true">
            <div className="gw-screen gw-loop">
              <div className="gw-stage wl-stage-scale">
                <div className="wl-island" />
                <WelcomeStage decorative />
              </div>
            </div>
            <div className="wl-sheen" />
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
