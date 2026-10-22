import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../lib/api';
import { ChevronLeft, RefreshCw, Zap, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminDemoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      toast.error('Admin access required');
      navigate('/profile');
    }
  }, [user, loading, navigate]);

  const fetchStatus = async () => {
    try {
      const res = await adminAPI.getDemoStatus();
      setStatus(res.data);
    } catch (e) {
      if (e.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/profile');
      } else {
        toast.error('Failed to load demo status');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = async (username) => {
    if (!confirm(`Reset ${username}? This will clear all data for this account. You'll need to run the seed script again to restore.`)) {
      return;
    }
    
    setActionLoading(`reset-${username}`);
    try {
      await adminAPI.resetAccount(username);
      toast.success(`${username} reset. Run: cd /app/backend && python seed_testing.py`);
      fetchStatus();
    } catch (e) {
      toast.error('Reset failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuickState = async (username, action, label) => {
    setActionLoading(`${username}-${action}`);
    try {
      const res = await adminAPI.setQuickState(username, action);
      toast.success(res.data.message || label);
      fetchStatus();
    } catch (e) {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-grove-forest">
        <div className="w-6 h-6 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grove-forest pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-grove-forest border-b-[0.5px] border-grove-moss px-4 py-3">
        <div className="flex items-center gap-3 max-w-[1100px] mx-auto">
          <button
            onClick={() => navigate('/profile')}
            className="text-grove-cream hover:text-grove-sprout transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-plant text-xl text-grove-cream">Demo Admin Panel</h1>
          <button
            onClick={fetchStatus}
            className="ml-auto text-grove-sprout hover:text-grove-cream transition-colors"
            aria-label="Refresh status"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 pt-6 space-y-6">
        {/* Warning */}
        <div className="rounded-[14px] border-[0.5px] border-grove-bloom bg-grove-bloom/15 p-4">
          <p className="text-sm text-grove-bloom">
            ⚠️ <strong>Admin Only:</strong> These controls modify test account data. Use for demos and testing only.
          </p>
        </div>

        {/* Account Status */}
        {status?.accounts?.map((account) => (
          <div
            key={account.username}
            className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-5"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-grove-moss flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-grove-sprout" />
              </div>
              <div className="flex-1">
                <h2 className="font-plant text-lg text-grove-cream">
                  {account.display_name} <span className="text-sm text-grove-cream">@{account.username}</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2 py-1 rounded-[20px] bg-grove-moss text-grove-cream text-xs font-sans uppercase tracking-[0.12em]">
                    {account.tier}
                  </span>
                  <span className="text-xs text-grove-cream">
                    Streak: {account.current_streak} days
                  </span>
                  <span className="text-xs text-grove-cream">
                    Plants: {account.plants_count}
                  </span>
                  <span className="text-xs text-grove-cream">
                    Active bouquets: {account.active_bouquets}
                  </span>
                </div>
                
                {/* Unlocks */}
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-sans uppercase tracking-[0.12em] text-grove-cream">Unlocks:</span>
                  {Object.entries(account.unlocks).map(([key, unlocked]) => (
                    <div key={key} className="flex items-center gap-1">
                      {unlocked ? (
                        <Check className="h-3 w-3 text-grove-sprout" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-grove-moss" />
                      )}
                      <span className="text-xs text-grove-cream capitalize">{key.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick State Buttons */}
            <div className="space-y-3">
              <h3 className="font-sans text-xs uppercase tracking-[0.12em] text-grove-cream">Quick State Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {account.username === 'mayagreens' && (
                  <>
                    <Button
                      onClick={() => handleQuickState('mayagreens', 'set_streak_6', 'Streak set to 6 days')}
                      disabled={actionLoading === 'mayagreens-set_streak_6'}
                      className="rounded-[2px] font-[Georgia] text-xs px-3 py-2 bg-grove-lime text-grove-root hover:bg-grove-sprout"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Set streak to 6 days
                    </Button>
                    <Button
                      onClick={() => handleQuickState('mayagreens', 'set_streak_7', 'Feed unlocked!')}
                      disabled={actionLoading === 'mayagreens-set_streak_7'}
                      className="rounded-[2px] font-[Georgia] text-xs px-3 py-2 bg-grove-lime text-grove-root hover:bg-grove-sprout"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Unlock feed (7 days)
                    </Button>
                  </>
                )}
                
                {account.username === 'rootsandstems' && (
                  <>
                    <Button
                      onClick={() => handleQuickState('rootsandstems', 'set_streak_30', 'Swaps unlocked!')}
                      disabled={actionLoading === 'rootsandstems-set_streak_30'}
                      className="rounded-[2px] font-[Georgia] text-xs px-3 py-2 bg-grove-lime text-grove-root hover:bg-grove-sprout"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Unlock swaps (30 days)
                    </Button>
                  </>
                )}
              </div>

              {/* Reset Button */}
              <Button
                onClick={() => handleReset(account.username)}
                disabled={actionLoading === `reset-${account.username}`}
                className="w-full rounded-[2px] font-[Georgia] text-xs px-3 py-2 bg-transparent text-grove-bloom border-[0.5px] border-grove-moss hover:border-grove-moss"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {actionLoading === `reset-${account.username}` ? 'Resetting...' : `Reset ${account.username}`}
              </Button>
            </div>
          </div>
        ))}

        {/* Instructions */}
        <div className="rounded-[14px] border-[0.5px] border-grove-moss bg-grove-moss p-4">
          <h3 className="font-sans text-xs uppercase tracking-[0.12em] text-grove-cream mb-2">
            Re-seed Instructions
          </h3>
          <p className="text-sm text-grove-cream mb-2">
            To fully restore test accounts after reset, run:
          </p>
          <pre className="text-xs font-mono bg-grove-lime text-grove-root p-3 rounded-[8px] overflow-x-auto">
            cd /app/backend && python seed_testing.py
          </pre>
        </div>
      </div>
    </div>
  );
}
