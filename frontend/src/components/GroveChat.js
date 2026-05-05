import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Send, X, Edit2, Trash2, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { groveChatAPI, uploadAPI, getFileUrl } from '../lib/api';

/**
 * Phase 14C.3.c — Grove chat (5-second polling, no WebSockets).
 *
 * - Per-Grove scoped messages
 * - Polling every 5s while the tab is visible (document.visibilityState gate)
 * - Text + 1 photo per message
 * - No reactions in v1
 * - Edit / soft-delete own; Grove admin/site admin can delete any
 *
 * Polling cursor: the `next_cursor` returned by GET /messages is used as the
 * `since` query param on the next tick. Strictly-after semantics on the
 * server avoid replaying the cursor message.
 */

const POLL_INTERVAL_MS = 5000;
const MAX_BODY_LEN = 4000;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // matches /api/upload limit

export default function GroveChat({ groveId, currentUser, isAdmin = false, isSiteAdmin = false }) {
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Composer state
  const [body, setBody] = useState('');
  const [photoPath, setPhotoPath] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');

  // Auto-scroll
  const endRef = useRef(null);
  const scrollerRef = useRef(null);
  const wasNearBottomRef = useRef(true);

  const hardLoad = useCallback(async () => {
    try {
      const res = await groveChatAPI.list(groveId);
      setMessages(res.data.items || []);
      setCursor(res.data.next_cursor || null);
      setError(null);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) {
        setError('You must be a member of this Grove to read chat.');
      } else if (status === 404) {
        setError('Grove not found.');
      } else {
        setError('Could not load chat.');
      }
    } finally {
      setInitialLoading(false);
    }
  }, [groveId]);

  // Initial load
  useEffect(() => { hardLoad(); }, [hardLoad]);

  // Poll loop, paused when tab is hidden
  useEffect(() => {
    if (error) return; // don't poll if hard-load failed
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      if (cancelled) return;
      if (document.visibilityState !== 'visible') {
        // skip this tick; we'll re-arm when visibility returns
        timer = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }
      try {
        const params = cursor ? { since: cursor } : {};
        const res = await groveChatAPI.list(groveId, params);
        const newItems = res.data.items || [];
        if (newItems.length > 0) {
          setMessages((prev) => {
            // Append, de-duped by id (in case of races)
            const existingIds = new Set(prev.map((m) => m.id));
            const combined = [...prev];
            for (const m of newItems) {
              if (!existingIds.has(m.id)) combined.push(m);
            }
            return combined;
          });
          setCursor(res.data.next_cursor);
        } else if (res.data.next_cursor && !cursor) {
          setCursor(res.data.next_cursor);
        }
      } catch (e) {
        // Silent on poll failure — try again next tick
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    timer = setTimeout(tick, POLL_INTERVAL_MS);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        // Force an immediate tick on returning to the tab
        clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [groveId, cursor, error]);

  // Track scroll position so we only auto-scroll if user is near bottom
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    wasNearBottomRef.current = distance < 100;
  }, []);

  // Auto-scroll to newest when messages grow
  useEffect(() => {
    if (wasNearBottomRef.current && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  // ---------- Composer ----------

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-pick same file
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Photo too large (max 10MB).');
      return;
    }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.upload(formData);
      setPhotoPath(res.data.path);
      toast.success('Photo attached');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not upload photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed && !photoPath) return;
    if (trimmed.length > MAX_BODY_LEN) {
      toast.error(`Message too long (max ${MAX_BODY_LEN} chars).`);
      return;
    }
    setSending(true);
    try {
      const res = await groveChatAPI.send(groveId, { body: trimmed, photo_path: photoPath });
      // Optimistically append the new message; subsequent poll will dedupe by id
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setCursor(res.data.created_at);
      setBody('');
      setPhotoPath(null);
      wasNearBottomRef.current = true;
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const handleEditBegin = (msg) => {
    setEditingId(msg.id);
    setEditBody(msg.body || '');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditBody('');
  };

  const handleEditSave = async (msg) => {
    const trimmed = editBody.trim();
    if (!trimmed && !msg.photo_path) {
      toast.error('Message must include text or a photo.');
      return;
    }
    try {
      const res = await groveChatAPI.edit(groveId, msg.id, trimmed);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? res.data : m)));
      setEditingId(null);
      setEditBody('');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not save edit.');
    }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await groveChatAPI.remove(groveId, msg.id);
      // Optimistic update — the next poll will reaffirm the tombstone state
      setMessages((prev) => prev.map((m) => (m.id === msg.id
        ? { ...m, is_deleted: true, body: '', photo_path: null }
        : m)));
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Could not delete message.');
    }
  };

  // ---------- Render ----------

  if (error) {
    return (
      <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EDE5D8] p-6 text-center" data-testid="grove-chat-error">
        <AlertCircle className="h-5 w-5 text-[#BA7517] mx-auto mb-2" />
        <p className="font-plant text-sm text-[#1C2E10]">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#FDFAF6] flex flex-col overflow-hidden" data-testid="grove-chat" style={{ height: 'min(70vh, 640px)' }}>
      {/* Messages list */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F5F0E8]"
        data-testid="grove-chat-messages"
      >
        {initialLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="font-plant text-[#1C2E10] text-sm">No messages yet</p>
            <p className="font-latin italic text-[12px] text-[#888780] mt-1">
              Be the first to say hello.
            </p>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                msg={m}
                isOwn={!!currentUser && m.user_id === currentUser.id}
                canDeleteAny={isAdmin || isSiteAdmin}
                editing={editingId === m.id}
                editBody={editBody}
                setEditBody={setEditBody}
                onEditBegin={() => handleEditBegin(m)}
                onEditCancel={handleEditCancel}
                onEditSave={() => handleEditSave(m)}
                onDelete={() => handleDelete(m)}
              />
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <div className="border-t-[0.5px] border-[#D3C9B8] p-3 bg-[#FDFAF6]" data-testid="grove-chat-composer">
        {photoPath && (
          <div className="mb-2 flex items-center gap-2 rounded-[8px] border-[0.5px] border-[#3B6D11] bg-[#EAF3DE] px-3 py-2">
            <img
              src={getFileUrl(photoPath)}
              alt="attachment preview"
              className="w-10 h-10 rounded-[6px] object-cover"
            />
            <span className="font-ui text-[11px] text-[#5F5E5A] flex-1 truncate">Photo attached</span>
            <button
              type="button"
              onClick={() => setPhotoPath(null)}
              data-testid="grove-chat-remove-photo"
              className="p-1 rounded-[6px] hover:bg-white text-[#5F5E5A]"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFilePick}
            className="hidden"
            data-testid="grove-chat-file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading || !!photoPath}
            data-testid="grove-chat-attach-btn"
            className="flex-shrink-0 w-9 h-9 rounded-full border-[0.5px] border-[#D3C9B8] bg-white text-[#3B6D11] hover:border-[#3B6D11] disabled:opacity-40 flex items-center justify-center"
            aria-label="Attach photo"
          >
            {photoUploading ? (
              <div className="w-3.5 h-3.5 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </button>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Say something to your Grove…"
            rows={1}
            data-testid="grove-chat-input"
            className="flex-1 resize-none rounded-[10px] border-[0.5px] border-[#D3C9B8] bg-white px-3 py-2 font-ui text-[13px] text-[#1C2E10] placeholder:text-[#888780] focus:outline-none focus:border-[#3B6D11] max-h-32"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || (!body.trim() && !photoPath)}
            data-testid="grove-chat-send-btn"
            className="flex-shrink-0 w-9 h-9 rounded-full bg-[#3B6D11] text-white hover:bg-[#2D5016] disabled:opacity-40 flex items-center justify-center"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="font-latin italic text-[10px] text-[#888780]">
            Enter to send · Shift+Enter for newline · polls every 5 s
          </p>
          <p className="font-ui text-[10px] text-[#888780]">
            {body.length > MAX_BODY_LEN * 0.8 && `${body.length}/${MAX_BODY_LEN}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatChatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
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

function ChatMessage({ msg, isOwn, canDeleteAny, editing, editBody, setEditBody, onEditBegin, onEditCancel, onEditSave, onDelete }) {
  const initial = ((msg.author_display_name || msg.author_username || 'G')[0] || 'G').toUpperCase();

  if (msg.is_deleted) {
    return (
      <div className="flex justify-center my-1" data-testid={`chat-msg-${msg.id}`} data-deleted="true">
        <span className="font-latin italic text-[11px] text-[#888780] px-3 py-1 rounded-[12px] bg-[#EDE5D8]">
          Message deleted
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      data-testid={`chat-msg-${msg.id}`}
      data-own={isOwn ? 'true' : 'false'}
    >
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isOwn ? 'bg-[#3B6D11] text-white' : 'bg-[#EAF3DE] text-[#3B6D11]'
        }`}
        title={msg.author_display_name || msg.author_username || ''}
      >
        <span className="font-plant text-[11px]">{initial}</span>
      </div>
      <div className={`max-w-[78%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <p className="font-plant text-[11px] text-[#5F5E5A] mb-0.5 ml-1">
            {msg.author_display_name || msg.author_username || ''}
          </p>
        )}
        <div
          className={`rounded-[12px] px-3 py-2 ${
            isOwn
              ? 'bg-[#3B6D11] text-[#F5F0E8] rounded-tr-[2px]'
              : 'bg-white border-[0.5px] border-[#D3C9B8] text-[#1C2E10] rounded-tl-[2px]'
          }`}
        >
          {msg.photo_path && (
            <a
              href={getFileUrl(msg.photo_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-2"
              data-testid={`chat-msg-${msg.id}-photo-link`}
            >
              <img
                src={getFileUrl(msg.photo_path)}
                alt="message attachment"
                className="max-w-full rounded-[8px] max-h-72 object-cover"
                loading="lazy"
              />
            </a>
          )}
          {editing ? (
            <div className="space-y-1.5">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={2}
                data-testid={`chat-msg-${msg.id}-edit-input`}
                className="w-full resize-none rounded-[6px] border-[0.5px] border-[#D3C9B8] bg-white text-[#1C2E10] px-2 py-1 font-ui text-[13px] focus:outline-none focus:border-[#3B6D11]"
              />
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={onEditCancel}
                  data-testid={`chat-msg-${msg.id}-edit-cancel`}
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[9px] px-2 py-1 border-[0.5px] border-[#D3C9B8] text-[#1C2E10] bg-white hover:border-[#1C2E10]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onEditSave}
                  data-testid={`chat-msg-${msg.id}-edit-save`}
                  className="rounded-[2px] font-plant uppercase tracking-[0.08em] text-[9px] px-2 py-1 bg-[#3B6D11] text-white hover:bg-[#2D5016] inline-flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          ) : (
            msg.body && (
              <p className="font-ui text-[13px] leading-snug whitespace-pre-wrap break-words">
                {msg.body}
              </p>
            )
          )}
        </div>
        <div className={`flex items-center gap-1.5 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="font-latin italic text-[9px] text-[#888780]">
            {formatChatTime(msg.created_at)}
            {msg.edited && ' · edited'}
          </span>
          {!editing && (isOwn || canDeleteAny) && (
            <span className="flex items-center gap-1">
              {isOwn && (
                <button
                  type="button"
                  onClick={onEditBegin}
                  data-testid={`chat-msg-${msg.id}-edit-btn`}
                  className="text-[#888780] hover:text-[#1C2E10]"
                  aria-label="Edit"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                data-testid={`chat-msg-${msg.id}-delete-btn`}
                className="text-[#888780] hover:text-[#BA1818]"
                aria-label="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
