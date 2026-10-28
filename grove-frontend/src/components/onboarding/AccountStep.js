import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { AppLink } from '@/components/AppLink';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { getProviderToken, CANCELLED } from '@/lib/sso';
import { looksLikeEmail, suggestEmail, nameFromEmail } from '@/lib/emailSuggest';
import StepScreen from './StepScreen';

const inputClass = 'w-full rounded-inset border-hairline border-grove-fernLine bg-grove-canopy px-4 py-3 font-ui text-sm text-grove-cream placeholder:text-grove-sage focus:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime aria-[invalid=true]:border-destructive';

function FieldError({ id, children }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-2 font-ui text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

// Step 1 of 3. Apple and Google appear only when the server has them switched on and set up.
// With both off this is just email and password.
export default function AccountStep({ config, onBack, onDone }) {
  const { register, acceptSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [ssoBusy, setSsoBusy] = useState('');

  const sso = (config && config.sso) || {};
  const providers = ['apple', 'google'].filter((p) => sso[p] && sso[p].enabled);
  const suggestion = errors.email ? suggestEmail(email) : null;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!looksLikeEmail(email)) {
      next.email = suggestEmail(email) ? 'That email looks incomplete.' : 'That email doesn’t look right. Check it and try again.';
    }
    if (password.length < 6) next.password = 'Use at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(next.email ? 'signup-email' : 'signup-password')?.focus();
      return;
    }
    setBusy(true);
    try {
      const data = await register(undefined, email.trim(), password, nameFromEmail(email) || undefined);
      onDone({ user: data.user, name: nameFromEmail(email) });
    } catch (err) {
      const detail = err.response && err.response.data && err.response.data.detail;
      let form = 'We couldn’t create your account. Check your connection and try again.';
      if (typeof detail === 'string') form = detail;
      else if (err.response && err.response.status >= 500) form = 'Something went wrong on our side. Try again in a moment.';
      else if (err.response) form = 'Check your email and password, then try again.';
      setErrors({ form });
      setBusy(false);
    }
  };

  const signInWith = async (provider) => {
    setSsoBusy(provider);
    setErrors({});
    try {
      const { idToken, name } = await getProviderToken(provider, sso[provider]);
      const res = await authAPI.sso(provider, { id_token: idToken, name });
      acceptSession(res.data);
      onDone({ user: res.data.user, name: res.data.user.display_name, sso: true });
    } catch (err) {
      if (!(err && err.message === CANCELLED)) {
        const detail = err.response && err.response.data && err.response.data.detail;
        setErrors({ form: typeof detail === 'string' ? detail : 'We couldn’t sign you in that way. Try again, or use your email.' });
      }
      setSsoBusy('');
    }
  };

  const label = (p) => (p === 'apple' ? 'Continue with Apple' : 'Continue with Google');

  return (
    <StepScreen
      step={1}
      stepLabel="Your account"
      onBack={onBack}
      heading="Create your FloraGrove account"
      intro="Free, and we never share your details."
      testId="onboarding-account"
    >
      {providers.length > 0 && (
        <div className="mt-6 space-y-2" data-testid="sso-buttons">
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => signInWith(p)}
              disabled={!!ssoBusy || busy}
              aria-busy={ssoBusy === p}
              data-testid={`sso-${p}`}
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
            >
              {ssoBusy === p ? 'Opening…' : label(p)}
            </button>
          ))}
          <p className="flex items-center gap-3 pt-2 font-ui text-sm text-grove-sage" aria-hidden="true">
            <span className="h-px flex-1 bg-grove-moss" />or<span className="h-px flex-1 bg-grove-moss" />
          </p>
        </div>
      )}

      <form onSubmit={submit} noValidate className={cn('flex flex-1 flex-col', providers.length ? 'mt-2' : 'mt-6')}>
        <div className="space-y-4">
          <div>
            <label htmlFor="signup-email" className="mb-1.5 block font-ui text-sm text-grove-cream">Email</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((x) => ({ ...x, email: undefined })); }}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              placeholder="you@example.com"
              data-testid="signup-email"
              className={inputClass}
            />
            {errors.email && (
              <FieldError id="signup-email-error">
                {errors.email}
                {suggestion && (
                  <>
                    {' '}Did you mean{' '}
                    <button
                      type="button"
                      onClick={() => { setEmail(suggestion); setErrors((x) => ({ ...x, email: undefined })); }}
                      className="min-h-touch rounded-control font-medium underline underline-offset-2"
                      data-testid="signup-email-suggestion"
                    >
                      {suggestion}
                    </button>
                    ?
                  </>
                )}
              </FieldError>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="mb-1.5 block font-ui text-sm text-grove-cream">Password</label>
            <div className="flex gap-2">
              <input
                id="signup-password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((x) => ({ ...x, password: undefined })); }}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'signup-password-error' : undefined}
                placeholder="At least 6 characters"
                data-testid="signup-password"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-pressed={show}
                data-testid="signup-password-toggle"
                className="min-h-touch min-w-touch rounded-control px-2 font-ui text-sm text-grove-cream underline underline-offset-2"
              >
                {show ? 'Hide' : 'Show'}
                <span className="sr-only"> password</span>
              </button>
            </div>
            {errors.password && <FieldError id="signup-password-error">{errors.password}</FieldError>}
          </div>
        </div>

        {errors.form && (
          <div className="mt-4" data-testid="signup-form-error">
            <FieldError id="signup-form-error">
              {errors.form}
              {errors.form === 'Email already registered' && (
                <>{' '}<AppLink to="/login" className="font-medium underline underline-offset-2">Sign in instead</AppLink></>
              )}
            </FieldError>
          </div>
        )}

        <div className="mt-auto space-y-2 pt-8">
          <button
            type="submit"
            disabled={busy || !!ssoBusy}
            aria-busy={busy}
            data-testid="signup-submit"
            className={cn(buttonVariants(), 'w-full')}
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center font-ui text-sm text-grove-cream">
            <AppLink to="/login" className="inline-flex min-h-touch items-center rounded-control px-2 underline underline-offset-2" data-testid="signup-signin">
              Already have an account? Sign in
            </AppLink>
          </p>
        </div>
      </form>
    </StepScreen>
  );
}
