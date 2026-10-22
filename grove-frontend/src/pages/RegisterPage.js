import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Leaf } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password, displayName || username);
      toast.success('Welcome to Grove!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grove-forest flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-grove-lime items-center justify-center">
        <div className="text-center px-12">
          <Leaf className="h-16 w-16 text-grove-sprout mx-auto mb-6" />
          <h1 className="font-plant text-grove-cream text-5xl tracking-[0.12em] mb-4">Grove</h1>
          <p className="font-ui text-grove-sprout text-lg">Grow together</p>
          <p className="font-ui text-grove-sage text-sm mt-2">Know your plants. Really know them.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Leaf className="h-10 w-10 text-grove-sprout mx-auto mb-3" />
            <h1 className="font-plant text-grove-cream text-3xl tracking-[0.12em]">Grove</h1>
          </div>

          <div className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-6">
            <h2 className="font-plant text-grove-cream text-2xl mb-1">Join Grove</h2>
            <p className="font-ui text-grove-cream text-sm mb-6">Start growing your collection</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.12em] text-grove-cream block mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  data-testid="auth-register-username"
                  className="w-full bg-grove-forest border-[0.5px] border-grove-moss rounded-[8px] px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                  placeholder="plantlover42"
                />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.12em] text-grove-cream block mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  data-testid="auth-register-displayname"
                  className="w-full bg-grove-forest border-[0.5px] border-grove-moss rounded-[8px] px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                  placeholder="Jane the Grower"
                />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.12em] text-grove-cream block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="auth-register-email"
                  className="w-full bg-grove-forest border-[0.5px] border-grove-moss rounded-[8px] px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.12em] text-grove-cream block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="auth-register-password"
                  className="w-full bg-grove-forest border-[0.5px] border-grove-moss rounded-[8px] px-4 py-3 text-sm font-ui text-grove-cream placeholder:text-grove-sage focus:outline-none focus:ring-2 focus:ring-grove-lime"
                  placeholder="At least 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                data-testid="auth-register-submit-button"
                className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3.5 border-[0.5px] bg-grove-lime text-grove-root border-grove-fernLine hover:bg-grove-sprout disabled:opacity-50 transition-colors duration-150"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/login" className="font-ui text-sm text-grove-sprout hover:text-grove-sprout transition-colors duration-150" data-testid="auth-switch-login">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
