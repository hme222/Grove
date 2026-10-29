import React, { useEffect, useRef, useState } from 'react';
import PasswordField from '../components/PasswordField';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { authAPI } from '../lib/api';
import { saveErrorMessage } from '../lib/errors';
import { blockedClass } from '../components/onboarding/StepScreen';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';

// The page the link in the reset email opens. It needs no sign-in, so it works from the phone's mail app.
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(token ? '' : 'This link is missing its code. Open the link from your email again.');
  const headingRef = useRef(null);

  useEffect(() => {
    document.title = 'Choose a new password · FloraGrove';
  }, []);

  useEffect(() => {
    if (done && headingRef.current) headingRef.current.focus();
  }, [done]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !token) return;
    if (password.length < 6) {
      setError('Use at least 6 characters.');
      document.getElementById('reset-password')?.focus();
      return;
    }
    setError('');
    setBusy(true);
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(saveErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-grove-forest px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center"><FloraGroveWordmark size={30} /></div>
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
          {done ? (
            <div data-testid="reset-done">
              <h1 ref={headingRef} tabIndex={-1} className="mb-2 font-plant text-2xl text-grove-cream focus:outline-none">Password changed</h1>
              <p className="font-ui text-sm text-grove-cream">You can sign in with your new password.</p>
              <Link to="/login" className={cn(buttonVariants(), 'mt-5 w-full')}>Sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <h1 className="mb-1 font-plant text-2xl text-grove-cream">Choose a new password</h1>
              <p className="mb-6 font-ui text-sm text-grove-cream">At least 6 characters.</p>
              <PasswordField
                id="reset-password"
                label="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                testId="reset-password"
              />
              {error && (
                <p role="alert" className="mt-3 flex items-start gap-2 font-ui text-sm text-grove-cream" data-testid="reset-error">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                  {error}
                </p>
              )}
              <button type="submit" aria-disabled={busy || !token} aria-busy={busy} data-testid="reset-submit" className={cn(buttonVariants(), 'mt-5 w-full', !token && blockedClass)}>
                {busy ? 'Saving…' : 'Change password'}
              </button>
              <div className="mt-4 text-center">
                <Link to="/forgot-password" className="inline-flex min-h-touch items-center px-2 font-ui text-sm text-grove-sprout underline underline-offset-2">Ask for a new link</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
