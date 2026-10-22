import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to Grove');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grove-forest flex">
      {/* Left panel - decorative (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-grove-lime items-center justify-center relative overflow-hidden">
        <div className="text-center px-12">
          <Leaf className="h-16 w-16 text-grove-sprout mx-auto mb-6" />
          <h1 className="font-plant text-grove-cream text-5xl tracking-[0.12em] mb-4">Grove</h1>
          <p className="font-ui text-grove-sprout text-lg">Grow together</p>
          <p className="font-ui text-grove-sage text-sm mt-2">Know your plants. Really know them.</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Leaf className="h-10 w-10 text-grove-sprout mx-auto mb-3" />
            <h1 className="font-plant text-grove-cream text-3xl tracking-[0.12em]">Grove</h1>
            <p className="font-ui text-grove-cream text-sm mt-1">Grow together</p>
          </div>

          <div className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-6">
            <h2 className="font-plant text-grove-cream text-2xl mb-1">Welcome back</h2>
            <p className="font-ui text-grove-cream text-sm mb-6">Sign in to your garden</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-ui text-xs text-grove-cream block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="auth-login-email"
                  className="w-full bg-grove-forest border-[0.5px] border-grove-moss rounded-[8px] px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="font-ui text-xs text-grove-cream block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="auth-login-password"
                    className="w-full bg-grove-forest border-[0.5px] border-grove-moss rounded-[8px] px-4 py-3 pr-11 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-grove-sage hover:text-grove-cream transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                data-testid="auth-login-submit-button"
                className="w-full rounded-[12px] font-ui text-xs px-4 py-3.5 border-[0.5px] bg-grove-lime text-grove-root border-grove-fernLine hover:bg-grove-sprout hover:border-grove-fernLine disabled:opacity-50 transition-colors duration-150"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/register"
                className="font-ui text-sm text-grove-sprout hover:text-grove-sprout transition-colors duration-150"
                data-testid="auth-switch-register"
              >
                New to Grove? Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
