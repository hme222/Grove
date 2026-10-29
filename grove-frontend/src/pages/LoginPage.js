import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import PasswordField from '../components/PasswordField';
import { FloraGroveWordmark } from '@/components/brand/FloraGroveWordmark';

// Say what went wrong: a wrong password is the person's to fix, a dropped connection or a server fault is not.
export function loginErrorMessage(err) {
  if (!err.response) return 'We couldn’t reach FloraGrove. Check your connection and try again.';
  const detail = err.response.data && err.response.data.detail;
  if (err.response.status >= 500) return 'Something went wrong on our side. Try again in a moment.';
  return typeof detail === 'string' ? detail : 'That didn’t work. Check your email and password.';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grove-forest flex">
      {/* Left panel - decorative (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-grove-lime items-center justify-center relative overflow-hidden">
        <div className="text-center px-12">
          <div className="mb-4"><FloraGroveWordmark size={48} color="var(--grove-night)" leafColor="var(--grove-forest)" /></div>
          <p className="font-ui text-grove-sprout text-lg">Grow together</p>
          <p className="font-ui text-grove-sage text-sm mt-2">Know your plants. Really know them.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div><FloraGroveWordmark size={30} /></div>
            <p className="font-ui text-grove-cream text-sm mt-1">Grow together</p>
          </div>

          <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
            <h1 className="font-plant text-grove-cream text-2xl mb-1">Welcome back</h1>
            <p className="font-ui text-grove-cream text-sm mb-6">Sign in to your garden</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="font-ui text-xs text-grove-cream block mb-1.5">Email</label>
                <input id="login-email" aria-label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="auth-login-email"
                  className="w-full bg-grove-forest border-hairline border-grove-moss rounded-inset px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                  placeholder="you@example.com"
                />
              </div>
              <PasswordField
                id="login-password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
                testId="auth-login-password"
                toggleTestId="auth-login-password-toggle"
                required
              />
              {error && (
                <p role="alert" className="flex items-start gap-2 font-ui text-sm text-grove-cream" data-testid="auth-login-error">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                  {error}
                </p>
              )}
              <div className="-mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="inline-flex min-h-touch items-center px-2 font-ui text-sm text-grove-sprout underline underline-offset-2"
                  data-testid="auth-forgot-password"
                >
                  Forgot your password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                data-testid="auth-login-submit-button"
                className={cn(buttonVariants(), "w-full disabled:opacity-50 transition-colors duration-150")}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/register"
                className="inline-flex min-h-touch items-center px-2 font-ui text-sm text-grove-sprout hover:text-grove-sprout transition-colors duration-150"
                data-testid="auth-switch-register"
              >
                New to FloraGrove? Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
