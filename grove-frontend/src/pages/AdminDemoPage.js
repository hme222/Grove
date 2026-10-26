import { LoadErrorPage } from '../components/LoadError';
import Loading from '../components/Loading';
import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { PageHeader } from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../lib/api';
import { RefreshCw, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminDemoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
      setLoadError(false);
      const res = await adminAPI.getDemoStatus();
      setStatus(res.data);
    } catch (e) {
      if (e.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/profile');
      } else {
        setLoadError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [pendingReset, setPendingReset] = useState(null);
  const handleReset = (username) => setPendingReset(username);
  const performReset = async (username) => {
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

  if (loadError) {
    return <LoadErrorPage title="Admin" onRetry={fetchStatus} />;
  }
  if (loading) {
    return (
      <Loading label="Loading" className="min-h-screen bg-grove-forest" />
    );
  }

  return (
    <div className="min-h-screen bg-grove-forest pb-6">
      {/* Header */}
      <PageHeader
        title="Demo Admin Panel"
        back={{ to: '/profile', where: 'Profile' }}
        hideProfile
        rightContent={
          <button
            type="button"
            onClick={fetchStatus}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-control text-grove-sprout hover:text-grove-cream"
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Refresh status</span>
          </button>
        }
      />

      <div className="max-w-page mx-auto px-4 pt-6 space-y-6">
        {/* Warning */}
        <div className="rounded-card border-hairline border-grove-bloom bg-grove-bloom/15 p-5">
          <p className="flex items-start gap-2 text-sm text-grove-blush">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span><strong>Admin Only:</strong> These controls modify test account data. Use for demos and testing only.</span>
          </p>
        </div>

        {/* Account Status */}
        {status?.accounts?.map((account) => (
          <div
            key={account.username}
            className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-grove-moss flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-grove-sprout" />
              </div>
              <div className="flex-1">
                <h2 className="font-plant text-xl font-semibold text-grove-cream">
                  {account.display_name} <span className="text-sm text-grove-cream">@{account.username}</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-grove-canopy text-grove-cream text-xs font-ui min-h-6 border-hairline border-grove-moss">
                    {account.tier}
                  </span>
                  <span className="text-xs text-grove-cream">
                    Check-ins this week: {account.check_ins_this_week}
                  </span>
                  <span className="text-xs text-grove-cream">
                    Plants: {account.plants_count}
                  </span>
                  <span className="text-xs text-grove-cream">
                    Active bouquets: {account.active_bouquets}
                  </span>
                </div>
                
              </div>
            </div>

            <div className="space-y-3">
              {/* Reset Button */}
              <Button
                onClick={() => handleReset(account.username)}
                disabled={actionLoading === `reset-${account.username}`}
                className="w-full rounded-control font-ui text-xs font-medium px-3 py-2 bg-transparent text-grove-blush border-hairline border-grove-moss hover:border-grove-moss"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {actionLoading === `reset-${account.username}` ? 'Resetting…' : `Reset ${account.username}`}
              </Button>
            </div>
          </div>
        ))}

        {/* Instructions */}
        <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5">
          <h3 className="font-ui text-xs text-grove-cream mb-2">
            Re-seed Instructions
          </h3>
          <p className="text-sm text-grove-cream mb-2">
            To fully restore test accounts after reset, run:
          </p>
          <pre className="text-xs font-ui bg-grove-lime text-grove-root p-3 rounded-inset overflow-x-auto">
            cd /app/backend && python seed_testing.py
          </pre>
        </div>
      </div>
      <ConfirmDialog
        open={pendingReset != null}
        onOpenChange={(o) => { if (!o) setPendingReset(null); }}
        title={`Reset ${pendingReset}?`}
        description="This clears all data for this account and cannot be undone. Run the seed script afterwards to restore it."
        confirmLabel="Reset account"
        cancelLabel="Keep account"
        onConfirm={() => { const u = pendingReset; setPendingReset(null); performReset(u); }}
        testId="reset-dialog"
      />
    </div>
  );
}
