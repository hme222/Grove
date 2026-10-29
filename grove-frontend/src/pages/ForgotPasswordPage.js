import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { authAPI } from '../lib/api';
import { saveErrorMessage } from '../lib/errors';
import { blockedClass } from '../components/onboarding/StepScreen';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';

// Ask for a reset link. The answer is the same for every address, so this page never says whether one has an account.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const headingRef = useRef(null);

  useEffect(() => {
    document.title = 'Reset your password · FloraGrove';
  }, []);

  useEffect(() => {
    if (sent && headingRef.current) headingRef.current.focus();
  }, [sent]);

  const blocked = !email.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (blocked || busy) return;
    setError('');
    setBusy(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(saveErrorMessage(err, { fallback: 'We couldn’t send the link. That’s on our side. Try again in a moment.' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-grove-forest px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center"><FloraGroveWordmark size={30} /></div>
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
          {sent ? (
            <div data-testid="forgot-sent">
              <h1 ref={headingRef} tabIndex={-1} className="mb-2 font-plant text-2xl text-grove-cream focus:outline-none">Check your email</h1>
              <p className="font-ui text-sm text-grove-cream">
                If there is a FloraGrove account for that address, we have sent a link to choose a new password. It works for one hour.
              </p>
              <Link to="/login" className={cn(buttonVariants(), 'mt-5 w-full')}>Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h1 className="mb-1 font-plant text-2xl text-grove-cream">Reset your password</h1>
              <p className="mb-6 font-ui text-sm text-grove-cream">Enter your email and we will send you a link.</p>
              <label htmlFor="forgot-email" className="mb-1.5 block font-ui text-sm text-grove-cream">Email</label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="forgot-email"
                placeholder="you@example.com"
                className="w-full rounded-inset border-hairline border-grove-moss bg-grove-forest px-4 py-3 font-ui text-sm text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
              />
              {error && (
                <p role="alert" className="mt-3 flex items-start gap-2 font-ui text-sm text-grove-cream" data-testid="forgot-error">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                  {error}
                </p>
              )}
              {blocked && <p id="forgot-hint" className="mt-3 font-ui text-sm text-grove-cream" data-testid="forgot-hint">Enter your email to get the link.</p>}
              <button type="submit" aria-disabled={blocked || busy} aria-describedby={blocked ? 'forgot-hint' : undefined} aria-busy={busy} data-testid="forgot-submit" className={cn(buttonVariants(), 'mt-5 w-full', blocked && blockedClass)}>
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
              <div className="mt-4 text-center">
                <Link to="/login" className="inline-flex min-h-touch items-center px-2 font-ui text-sm text-grove-sprout underline underline-offset-2">Back to sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
