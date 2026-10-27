import React, { useEffect, useRef, useState } from 'react';
import { Mail, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { useDialogA11y } from '@/lib/useDialogA11y';
import { looksLikeEmail } from '@/lib/emailSuggest';
import StepScreen from './StepScreen';

const POLL_MS = 5000;
const isApple = () => typeof navigator !== 'undefined' && /iPhone|iPad|Macintosh/.test(navigator.userAgent || '');

const inputClass = 'w-full rounded-inset border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-cream placeholder:text-grove-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime';

// "Open your email with..." A sheet, so it traps focus, closes on Escape and gives focus back.
// Apple Mail is offered only on Apple devices: its link does nothing anywhere else.
function EmailAppPicker({ onClose }) {
  const ref = useRef(null);
  useDialogA11y(ref, onClose, true);
  const rowClass = cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between');
  return (
    <div className="fixed inset-0 z-sheet flex items-end justify-center bg-scrim" data-testid="email-app-picker">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-picker-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-t-card border-hairline border-grove-fernLine bg-grove-forest p-5 focus:outline-none"
      >
        <h2 id="email-picker-title" className="font-plant text-xl text-grove-cream">Open your email with…</h2>
        <div className="mt-4 space-y-2">
          {isApple() && (
            <a href="message://" className={rowClass} data-testid="email-app-apple">
              Apple Mail <ChevronRight aria-hidden="true" />
            </a>
          )}
          <a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer" className={rowClass} data-testid="email-app-gmail">
            <span>Gmail<span className="sr-only"> (opens in a new tab)</span></span> <ChevronRight aria-hidden="true" />
          </a>
        </div>
        <button type="button" onClick={onClose} className={cn(buttonVariants({ variant: 'ghost' }), 'mt-3 w-full')} data-testid="email-app-close">
          Close
        </button>
      </div>
    </div>
  );
}

// "Check your email". The link opens on /confirm-email, so this screen watches for the confirmation
// (when the app regains focus, and every few seconds) and moves on by itself.
export function CheckEmailStep({ onBack, onConfirmed, onLater }) {
  const { user, fetchUser } = useAuth();
  const [picker, setPicker] = useState(false);
  const [changing, setChanging] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const confirmed = !!(user && user.email_confirmed);

  useEffect(() => {
    if (confirmed) { onConfirmed(); return undefined; }
    const check = () => { if (document.visibilityState !== 'hidden') fetchUser(); };
    const timer = setInterval(check, POLL_MS);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [confirmed, fetchUser, onConfirmed]);

  const resend = async () => {
    setBusy(true); setError(''); setNote('');
    try {
      await authAPI.sendConfirmation();
      setNote('Sent again. Check your inbox.');
    } catch (err) {
      const detail = err.response && err.response.data && err.response.data.detail;
      setError(typeof detail === 'string' ? detail : 'We couldn’t send that. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  const change = async (e) => {
    e.preventDefault();
    if (!looksLikeEmail(newEmail)) { setError('That email doesn’t look right. Check it and try again.'); return; }
    setBusy(true); setError('');
    try {
      await authAPI.changeEmail(newEmail.trim());
      await fetchUser();
      setChanging(false); setNewEmail(''); setNote('Sent to your new email.');
    } catch (err) {
      const detail = err.response && err.response.data && err.response.data.detail;
      setError(typeof detail === 'string' ? detail : 'We couldn’t change that. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  if (changing) {
    return (
      <StepScreen heading="Use a different email" onBack={() => { setChanging(false); setError(''); }} testId="onboarding-change-email"
        intro="We’ll send the link to the new address instead.">
        <form onSubmit={change} noValidate className="mt-6 flex flex-1 flex-col">
          <label htmlFor="change-email" className="mb-1.5 block font-ui text-sm text-grove-cream">New email</label>
          <input id="change-email" type="email" autoComplete="email" inputMode="email" value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" className={inputClass}
            aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? 'change-email-error' : undefined} data-testid="change-email-input" />
          {error && <p id="change-email-error" role="alert" className="mt-1.5 font-ui text-sm text-destructive">{error}</p>}
          <div className="mt-auto space-y-2 pt-8">
            <button type="submit" disabled={busy} className={cn(buttonVariants(), 'w-full')} data-testid="change-email-submit">
              {busy ? 'Sending…' : 'Send the link'}
            </button>
          </div>
        </form>
      </StepScreen>
    );
  }

  return (
    <StepScreen heading="Check your email" testId="onboarding-check-email" onBack={onBack}
      intro={<>We sent a link to <strong className="font-semibold break-all">{user && user.email}</strong>. Tap it to confirm, then come back here.</>}>
      <div className="mt-6 flex flex-1 flex-col">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-grove-moss text-grove-sprout" aria-hidden="true">
          <Mail className="h-8 w-8" />
        </span>
        <p className="mt-4 font-ui text-sm text-grove-sage">Not there? Check spam.</p>
        <p role="status" className="mt-2 font-ui text-sm text-grove-cream" data-testid="check-email-note">{note}</p>
        {error && <p role="alert" className="mt-2 font-ui text-sm text-destructive" data-testid="check-email-error">{error}</p>}
        <div className="mt-auto space-y-2 pt-8">
          <button type="button" onClick={() => setPicker(true)} className={cn(buttonVariants(), 'w-full')} data-testid="open-email-app">
            Open email app
          </button>
          <button type="button" onClick={resend} disabled={busy} className={cn(buttonVariants({ variant: 'outline' }), 'w-full')} data-testid="resend-email">
            Send it again
          </button>
          <div className="flex flex-wrap justify-center gap-x-2">
            <button type="button" onClick={() => { setChanging(true); setError(''); setNote(''); }}
              className="min-h-touch rounded-control px-3 font-ui text-sm text-grove-cream underline underline-offset-2" data-testid="use-different-email">
              Use a different email
            </button>
            <button type="button" onClick={onLater}
              className="min-h-touch rounded-control px-3 font-ui text-sm text-grove-cream underline underline-offset-2" data-testid="confirm-later">
              Confirm later
            </button>
          </div>
        </div>
      </div>
      {picker && <EmailAppPicker onClose={() => setPicker(false)} />}
    </StepScreen>
  );
}

// "You're confirmed". Shown on the sign-up screen once the link has been opened.
export function ConfirmedStep({ name, onContinue }) {
  return (
    <StepScreen heading="You’re confirmed" testId="onboarding-confirmed"
      intro={`${name ? `Thanks, ${name}. ` : 'Thanks. '}Next, a quick look at your growing space.`}>
      <div className="mt-6 flex flex-1 flex-col">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-grove-lime text-grove-root" aria-hidden="true">
          <Check className="h-8 w-8" />
        </span>
        <div className="mt-auto pt-8">
          <button type="button" onClick={onContinue} className={cn(buttonVariants(), 'w-full')} data-testid="confirmed-continue">
            Continue
          </button>
        </div>
      </div>
    </StepScreen>
  );
}
