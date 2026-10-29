import { LoadErrorPage } from '../components/LoadError';
import { scrollBehavior } from '../lib/motion';
import { actionErrorMessage } from '../lib/errors';
import Loading from '../components/Loading';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { buttonVariants } from '../components/ui/button';
import BackButton from '../components/BackButton';
import { useParams, useNavigate } from 'react-router-dom';
import { swapsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Send, Leaf, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import VerifiedProBadge from '../components/VerifiedProBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const POLL_INTERVAL_MS = 5000;

export default function SwapChatPage() {
  const { swapId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [swap, setSwap] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(null); // true while the cancel-swap question is open
  const endRef = useRef(null);
  const scrollerRef = useRef(null);

  const loadSwap = useCallback(async () => {
    try {
      setLoadError(false);
      setNotFound(false);
      const res = await swapsAPI.getSwap(swapId);
      setSwap(res.data.swap);
      setOtherUser(res.data.other_user);
      setMessages(res.data.messages || []);
    } catch (e) {
      // A swap that is gone is not a network problem: say so, instead of offering a retry that cannot work.
      if (e?.response?.status === 404) setNotFound(true);
      else setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [swapId]);

  useEffect(() => { loadSwap(); }, [loadSwap]);

  // Poll for new messages
  useEffect(() => {
    if (!swap || swap.status === 'completed' || swap.status === 'cancelled') return;
    let cancelled = false;
    let timer = null;
    const tick = async () => {
      if (cancelled || document.visibilityState !== 'visible') {
        timer = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }
      try {
        const res = await swapsAPI.getSwap(swapId);
        setSwap(res.data.swap);
        setMessages(res.data.messages || []);
      } catch (e) { /* silent */ }
      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    timer = setTimeout(tick, POLL_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') { clearTimeout(timer); tick(); }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; clearTimeout(timer); document.removeEventListener('visibilitychange', onVis); };
  }, [swapId, swap?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'end' });
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const res = await swapsAPI.sendMessage(swapId, trimmed);
      setMessages((prev) => [...prev, res.data]);
      setBody('');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await swapsAPI.confirm(swapId);
      if (res.data.completed) {
        toast.success('Swap completed! Happy growing.');
      } else {
        toast.success('You confirmed — waiting for the other grower.');
      }
      loadSwap();
    } catch (e) {
      toast.error(actionErrorMessage(e, 'confirm the swap'));
    }
  };

  const handleCancel = () => setPending(true);

  const performCancel = async () => {
    try {
      await swapsAPI.cancel(swapId);
      toast('Swap cancelled');
      navigate('/swaps/matches');
    } catch (e) {
      toast.error(actionErrorMessage(e, 'cancel the swap'));
    }
  };

  if (loadError) {
    return <LoadErrorPage back title="Swap" onRetry={loadSwap} />;
  }
  if (loading) {
    return (
      <div>
        <PageHeader back title="Swap" />
        <Loading label="Loading the chat" />
      </div>
    );
  }

  if (notFound || !swap) {
    return (
      <div>
        <PageHeader back title="Swap" />
        <div className="mx-auto max-w-form px-4 py-16 text-center" data-testid="swap-not-found">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-grove-sun" aria-hidden="true" />
          <h2 className="font-plant text-xl text-grove-cream">That swap isn&rsquo;t here</h2>
          <p className="mt-2 font-ui text-sm text-grove-sage">It may have been cancelled or the link may be old.</p>
          <button
            type="button"
            onClick={() => navigate('/swaps')}
            className={cn(buttonVariants(), "mt-5")}
          >
            Back to swaps
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = swap.status === 'completed';
  const isCancelled = swap.status === 'cancelled';
  const myConfirmed = swap.user_a === user?.id ? swap.confirmed_a : swap.confirmed_b;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - var(--nav-height) - env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b-hairline border-grove-moss bg-grove-canopy px-4 py-3">
        <div className="flex items-center gap-3">
          <BackButton to="/swaps/matches" where="matches" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-ui text-grove-cream text-sm font-medium truncate">
                @{otherUser?.username || 'grower'}
              </p>
              {otherUser && (
                <VerifiedProBadge
                  verified_user={otherUser.verified_user}
                  verified_by_admin={otherUser.verified_by_admin}
                  size={12}
                />
              )}
            </div>
            <p className="font-latin italic text-xs text-grove-lichen">
              {isCompleted ? 'Swap completed' : isCancelled ? 'Swap cancelled' : `Swap · ${swap.status}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-grove-forest"
      >
        {/* Match announcement */}
        <div className="flex justify-center my-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-grove-moss border-hairline border-grove-fernLine px-2.5 py-1.5 font-ui text-xs font-medium text-grove-sprout min-h-6">
            <Leaf className="h-3 w-3" /> You matched — introduce yourself
          </span>
        </div>

        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-pill flex items-center justify-center ${
                  isOwn ? 'bg-grove-lime text-grove-root' : 'bg-grove-moss text-grove-sprout'
                }`}
              >
                <span className="font-ui text-xs font-medium">
                  {isOwn
                    ? (user?.display_name?.[0] || 'Y').toUpperCase()
                    : (otherUser?.display_name?.[0] || 'G').toUpperCase()}
                </span>
              </div>
              <div className={`max-w-4/5 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-control px-3 py-2 ${
                    isOwn
                      ? 'bg-grove-lime text-grove-root rounded-tr-hairline'
                      : 'bg-grove-canopy border-hairline border-grove-moss text-grove-cream rounded-tl-hairline'
                  }`}
                >
                  <p className="font-ui text-xs leading-snug whitespace-pre-wrap break-words">
                    {msg.body}
                  </p>
                </div>
                <span className="font-latin italic text-xs text-grove-lichen mt-0.5 mx-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Completed/Cancelled banner */}
      {isCompleted && (
        <div className="flex-shrink-0 bg-grove-moss border-t-hairline border-grove-fernLine px-4 py-3 text-center">
          <p className="font-ui text-sm font-medium text-grove-sprout flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Swap completed — happy growing!
          </p>
        </div>
      )}
      {isCancelled && (
        <div className="flex-shrink-0 bg-grove-sun/15 border-t-hairline border-grove-moss px-4 py-3 text-center">
          <p className="font-ui text-sm font-medium text-grove-sun flex items-center justify-center gap-1.5">
            <XCircle className="h-4 w-4" /> This swap was cancelled
          </p>
        </div>
      )}

      {/* Actions bar */}
      {!isCompleted && !isCancelled && (
        <div className="flex-shrink-0 border-t-hairline border-grove-moss bg-grove-canopy">
          {/* Confirm/Cancel buttons */}
          <div className="flex items-center gap-2 px-4 py-2 border-b-hairline border-grove-moss">
            {myConfirmed ? (
              <span className="flex items-center gap-1 font-ui text-xs font-medium text-grove-sprout">
                <CheckCircle2 className="h-3.5 w-3.5" /> You confirmed — waiting on them
              </span>
            ) : (
              <button
                onClick={handleConfirm}
                className={buttonVariants()}
              >
                Confirm swap
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleCancel}
              className="rounded-control font-ui text-xs px-3 py-1.5 border-hairline border-grove-moss text-grove-sage hover:border-grove-moss hover:text-destructive"
            >
              Cancel
            </button>
          </div>

          {/* Composer */}
          <div className="flex items-end gap-2 p-3">
            <textarea aria-label="Message about the swap"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message about the swap…"
              rows={1}
              className="flex-1 resize-none rounded-chip border-hairline border-grove-moss bg-grove-canopy px-3 py-2 font-ui text-xs text-grove-cream placeholder:text-grove-lichen focus:outline-none focus:border-grove-fernLine max-h-32"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !body.trim()}
              className={cn(buttonVariants({ size: 'icon' }), "rounded-pill flex-shrink-0")}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={pending != null}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title="Cancel this swap?"
        description="The swap ends and the other grower is notified. This can’t be undone."
        confirmLabel="Cancel swap"
        cancelLabel="Keep swap"
        testId="swap-cancel-confirm"
        onConfirm={() => { const t = pending; setPending(null); performCancel(t); }}
      />
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}
