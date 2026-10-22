import React, { useState } from 'react';
import api from '@/lib/api';
import { WelcomeStage } from '@/components/WelcomeStage';
import '@/components/WelcomeScreen.css';
import './WaitlistPage.css';

// Studio 12 waitlist landing page (design/studio/Studio12-Rise.dc.html), headline #2b.
// The phone shows the real welcome screen, looping slowly. Signups go to POST /api/waitlist.
// The reply is the same for new and existing emails; only a new signup gets a token,
// which is what lets the visitor turn the beta opt-in on or off.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LeafMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#92B44B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 19.5C4.5 11 9.5 5 20 4c-.8 10.5-6.8 15.5-15.5 15.5z" />
      <path d="M4.5 19.5 13 11" />
    </svg>
  );
}

export default function WaitlistPage() {
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
      setError("That email doesn't look quite right.");
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
        ? "That email doesn't look quite right."
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
        <div className="wl-brand">
          <LeafMark />
          <span className="wl-wordmark">Grove</span>
        </div>
        <div className="wl-meta">iPhone · December</div>
      </header>

      <section className="wl-hero">
        <h1 className="wl-headline wl-in wl-in-2">Stop guessing when to water.</h1>
        <p className="wl-sub wl-in wl-in-3">Grove tells you what each plant needs today, from water and light to soil, and why.</p>

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
              <div>You're on the list. We'll write to <strong>{email.trim()}</strong> in December.</div>
              {token && (
                <button type="button" className="wl-beta" onClick={toggleBeta} aria-pressed={beta} disabled={betaSaving}>
                  {beta ? 'We’ll invite you to test early. Tap to undo.' : 'Want to test Grove before launch?'}
                </button>
              )}
              {error && <div role="alert" className="wl-error">{error}</div>}
            </div>
          )}
        </div>
        <div className="wl-proof wl-in wl-in-5">Free to join.</div>
      </section>

      <div className="wl-stage">
        <div className="wl-glow" aria-hidden="true" />
        <div
          className="wl-phone"
          role="img"
          aria-label="The Grove app's welcome screen: Welcome to Grove. A grove is a small group of trees growing closely together. Grove is a safe space to learn about plants. Providing tools to help you feel confident in caring for your plants."
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
    </main>
  );
}
