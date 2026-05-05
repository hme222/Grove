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
    <div className="min-h-screen bg-[#F5F0E8] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1C2E10] items-center justify-center">
        <div className="text-center px-12">
          <Leaf className="h-16 w-16 text-[#5DCAA5] mx-auto mb-6" />
          <h1 className="font-plant text-[#F5F0E8] text-5xl tracking-[0.12em] mb-4">Grove</h1>
          <p className="font-ui text-[#9FE1CB] text-lg">Grow together</p>
          <p className="font-ui text-[#D3C9B8] text-sm mt-2">Know your plants. Really know them.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Leaf className="h-10 w-10 text-[#3B6D11] mx-auto mb-3" />
            <h1 className="font-plant text-[#1C2E10] text-3xl tracking-[0.12em]">Grove</h1>
          </div>

          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-6">
            <h2 className="font-plant text-[#1C2E10] text-2xl mb-1">Join Grove</h2>
            <p className="font-ui text-[#2B2B26] text-sm mb-6">Start growing your collection</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  data-testid="auth-register-username"
                  className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                  placeholder="plantlover42"
                />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  data-testid="auth-register-displayname"
                  className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                  placeholder="Jane the Grower"
                />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="auth-register-email"
                  className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="font-ui text-xs uppercase tracking-[0.12em] text-[#1A1A17] block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="auth-register-password"
                  className="w-full bg-[#F5F0E8] border-[0.5px] border-[#D3C9B8] rounded-[8px] px-4 py-3 text-sm font-ui text-[#1A1A17] placeholder:text-[#D3C9B8] focus:outline-none focus:ring-2 focus:ring-[#5DCAA5]"
                  placeholder="At least 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                data-testid="auth-register-submit-button"
                className="w-full rounded-[2px] font-plant uppercase tracking-[0.08em] text-xs px-4 py-3.5 border-[0.5px] bg-[#1C2E10] text-[#F5F0E8] border-[#1C2E10] hover:bg-[#2D5016] disabled:opacity-50 transition-colors duration-150"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/login" className="font-ui text-sm text-[#3B6D11] hover:text-[#2D5016] transition-colors duration-150" data-testid="auth-switch-login">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
