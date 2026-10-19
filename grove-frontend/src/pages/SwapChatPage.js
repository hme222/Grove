import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { swapsAPI, getFileUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Send, Leaf, CheckCircle2, XCircle, ChevronLeft, AlertCircle } from 'lucide-react';
import VerifiedProBadge from '../components/VerifiedProBadge';
import { toast } from 'sonner';

const POLL_INTERVAL_MS = 5000;

export default function SwapChatPage() {
  const { swapId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [swap, setSwap] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const scrollerRef = useRef(null);

  const loadSwap = useCallback(async () => {
    try {
      const res = await swapsAPI.getSwap(swapId);
      setSwap(res.data.swap);
      setOtherUser(res.data.other_user);
      setMessages(res.data.messages || []);
    } catch (e) {
      toast.error('Could not load swap');
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
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
      toast.error('Could not confirm swap');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this swap? The other grower will be notified.')) return;
    try {
      await swapsAPI.cancel(swapId);
      toast('Swap cancelled');
      navigate('/swaps/matches');
    } catch (e) {
      toast.error('Could not cancel swap');
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Swap" />
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!swap) {
    return (
      <div>
        <PageHeader title="Swap" />
        <div className="text-center py-16">
          <AlertCircle className="h-8 w-8 text-[#BA7517] mx-auto mb-3" />
          <p className="font-plant text-[#1C2E10]">Swap not found</p>
        </div>
      </div>
    );
  }

  const isCompleted = swap.status === 'completed';
  const isCancelled = swap.status === 'cancelled';
  const myConfirmed = swap.user_a === user?.id ? swap.confirmed_a : swap.confirmed_b;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 84px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/swaps/matches')}
            className="flex-shrink-0 p-1 rounded-[6px] hover:bg-[#EDE5D8]"
            aria-label="Back to matches"
          >
            <ChevronLeft className="h-5 w-5 text-[#1C2E10]" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-plant text-[#1C2E10] text-sm truncate">
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
            <p className="font-latin italic text-[10px] text-[#888780]">
              {isCompleted ? 'Swap completed' : isCancelled ? 'Swap cancelled' : `Swap · ${swap.status}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F5F0E8]"
      >
        {/* Match announcement */}
        <div className="flex justify-center my-2">
          <span className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#EAF3DE] border-[0.5px] border-[#3B6D11] px-3 py-1.5 font-plant text-[10px] text-[#3B6D11]">
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
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  isOwn ? 'bg-[#3B6D11] text-white' : 'bg-[#EAF3DE] text-[#3B6D11]'
                }`}
              >
                <span className="font-plant text-[11px]">
                  {isOwn
                    ? (user?.display_name?.[0] || 'Y').toUpperCase()
                    : (otherUser?.display_name?.[0] || 'G').toUpperCase()}
                </span>
              </div>
              <div className={`max-w-[78%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-[12px] px-3 py-2 ${
                    isOwn
                      ? 'bg-[#3B6D11] text-[#F5F0E8] rounded-tr-[2px]'
                      : 'bg-white border-[0.5px] border-[#D3C9B8] text-[#1C2E10] rounded-tl-[2px]'
                  }`}
                >
                  <p className="font-ui text-[13px] leading-snug whitespace-pre-wrap break-words">
                    {msg.body}
                  </p>
                </div>
                <span className="font-latin italic text-[9px] text-[#888780] mt-0.5 mx-1">
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
        <div className="flex-shrink-0 bg-[#EAF3DE] border-t-[0.5px] border-[#3B6D11] px-4 py-3 text-center">
          <p className="font-plant text-sm text-[#3B6D11] flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Swap completed — happy growing!
          </p>
        </div>
      )}
      {isCancelled && (
        <div className="flex-shrink-0 bg-[#FBF1E1] border-t-[0.5px] border-[#BA7517] px-4 py-3 text-center">
          <p className="font-plant text-sm text-[#7A4F0E] flex items-center justify-center gap-1.5">
            <XCircle className="h-4 w-4" /> This swap was cancelled
          </p>
        </div>
      )}

      {/* Actions bar */}
      {!isCompleted && !isCancelled && (
        <div className="flex-shrink-0 border-t-[0.5px] border-[#D3C9B8] bg-[#FDFAF6]">
          {/* Confirm/Cancel buttons */}
          <div className="flex items-center gap-2 px-4 py-2 border-b-[0.5px] border-[#D3C9B8]">
            {myConfirmed ? (
              <span className="flex items-center gap-1 font-plant text-[10px] text-[#3B6D11] uppercase tracking-[0.08em]">
                <CheckCircle2 className="h-3.5 w-3.5" /> You confirmed — waiting on them
              </span>
            ) : (
              <button
                onClick={handleConfirm}
                className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 bg-[#3B6D11] text-[#F5F0E8] hover:bg-[#2D5016]"
              >
                Confirm swap
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleCancel}
              className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 border-[0.5px] border-[#D3C9B8] text-[#5F5E5A] hover:border-[#BA1818] hover:text-[#BA1818]"
            >
              Cancel
            </button>
          </div>

          {/* Composer */}
          <div className="flex items-end gap-2 p-3">
            <textarea
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
              className="flex-1 resize-none rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-white px-3 py-2 font-ui text-[13px] text-[#1C2E10] placeholder:text-[#888780] focus:outline-none focus:border-[#3B6D11] max-h-32"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !body.trim()}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-[#3B6D11] text-white hover:bg-[#2D5016] disabled:opacity-40 flex items-center justify-center"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
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
