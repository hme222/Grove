import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../lib/api';
import Loading from '../components/Loading';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';

// The page the link in the confirmation email opens. It needs no sign-in, so it works from the phone's
// mail app. If the person is signed in here, "Continue" picks the first-run flow up where it was.
export default function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  const [state, setState] = useState(token ? 'working' : 'error'); // working | done | error
  const [message, setMessage] = useState(token ? '' : 'This link is missing its code. Open the link from your email again.');
  const headingRef = useRef(null);
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    authAPI.confirmEmail(token)
      .then(() => { setState('done'); if (fetchUser) fetchUser(); })
      .catch((err) => {
        const detail = err.response && err.response.data && err.response.data.detail;
        setMessage(err.response && err.response.status < 500 && typeof detail === 'string'
          ? detail
          : 'We couldn’t reach FloraGrove. Check your connection, then open the link again.');
        setState('error');
      });
  }, [token, fetchUser]);

  useEffect(() => {
    document.title = 'Confirm your email · FloraGrove';
  }, []);

  useEffect(() => {
    if (state !== 'working' && headingRef.current) headingRef.current.focus({ preventScroll: true });
  }, [state]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-grove-forest px-4 py-8" data-testid="confirm-email-page">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center"><FloraGroveWordmark size={30} /></p>
        {state === 'working' && <Loading label="Confirming your email" />}
        {state !== 'working' && (
          <div className="rounded-card border-hairline border-grove-fernLine bg-grove-canopy p-5 text-center">
            <span className={cn('mx-auto flex h-16 w-16 items-center justify-center rounded-pill', state === 'done' ? 'bg-grove-lime text-grove-root' : 'bg-grove-moss text-grove-cream')} aria-hidden="true">
              {state === 'done' ? <Check className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
            </span>
            <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-plant text-2xl text-grove-cream focus:outline-none" data-testid="confirm-heading">
              {state === 'done' ? 'You’re confirmed' : 'We couldn’t confirm that'}
            </h1>
            <p className="mt-2 font-ui text-sm text-grove-cream" data-testid="confirm-message">
              {state === 'done' ? 'Thanks. Go back to FloraGrove and carry on.' : message}
            </p>
            <button
              type="button"
              onClick={() => navigate(user ? '/' : '/login', { replace: true })}
              className={cn(buttonVariants(), 'mt-6 w-full')}
              data-testid="confirm-continue"
            >
              {user ? 'Continue' : 'Go to sign in'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
