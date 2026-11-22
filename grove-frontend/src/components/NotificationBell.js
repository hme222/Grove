import React, { useState, useEffect, useRef, useCallback } from 'react';
import { actionErrorMessage } from '../lib/errors';
import Loading from './Loading';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../lib/api';
import { Bell, X, Trash2, Leaf, Sprout, Users, Heart, MessageCircle, Flower2 } from 'lucide-react';
import { toast } from 'sonner';

const UNREAD_POLL_MS = 45000;

function iconForType(type) {
  switch (type) {
    case 'care_due':
    case 'care_overdue': return Sprout;
    case 'swap_match': return Users;
    case 'swap_message': return MessageCircle;
    case 'swap_completed': return Heart;
    case 'swap_cancelled': return Users;
    case 'kudos_received':
    case 'reaction_received': return Heart;
    case 'comment_received': return MessageCircle;
    case 'goal_completed': return Sprout;
    case 'bouquet_reminder': return Flower2;
    case 'unlock': return Leaf;
    default: return Bell;
  }
}

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function routeForNotification(n) {
  const t = n.type;
  if (t === 'swap_match') return n.entity_id ? `/swaps/${n.entity_id}` : '/swaps/matches';
  if (t === 'swap_message') return n.entity_id ? `/swaps/${n.entity_id}` : '/swaps/matches';
  if (t === 'swap_completed') return n.entity_id ? `/swaps/${n.entity_id}` : '/swaps/matches';
  if (t === 'swap_cancelled') return '/swaps/matches';
  if (t === 'unlock') return '/swap';
  if (t === 'care_due' || t === 'care_overdue') return '/care/today';
  if (t === 'goal_completed') return '/badges';
  if (t === 'kudos_received' || t === 'comment_received' || t === 'reaction_received') return '/feed';
  if (t === 'bouquet_reminder') return '/bouquets';
  return '/profile';
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const headingRef = useRef(null);

  // Closing gives focus back to the bell, so a screen-reader or keyboard user is not dropped onto the page.
  const close = useCallback((restore = true) => {
    setOpen(false);
    if (restore) setTimeout(() => { if (buttonRef.current) buttonRef.current.focus(); }, 0);
  }, []);
  const toggle = () => {
    if (open) { close(); return; }
    setOpen(true);
  };

  const fetchUnread = useCallback(async () => {
    try {
      const res = await notificationAPI.getUnreadCount();
      setUnread(res.data.unread_count || 0);
    } catch (e) { /* silent */ }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getAll();
      setItems(res.data.notifications || []);
      setUnread(res.data.unread_count || 0);
    } catch (e) {
      toast.error(actionErrorMessage(e, 'load notifications'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, UNREAD_POLL_MS);
    return () => clearInterval(t);
  }, [fetchUnread]);

  useEffect(() => {
    if (open) fetchItems();
    // Say that a panel opened by moving focus into it.
    if (open && headingRef.current) headingRef.current.focus();
  }, [open, fetchItems]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) close(false);
    };
    const esc = (e) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open, close]);

  const handleOpen = (n) => async () => {
    try {
      if (!n.is_read) {
        await notificationAPI.markRead(n.id);
        setItems((prev) => prev.map(i => i.id === n.id ? { ...i, is_read: true } : i));
        setUnread((u) => Math.max(0, u - 1));
      }
    } catch (_) { /* ignore */ }
    setOpen(false);
    navigate(routeForNotification(n));
  };

  const handleMarkAll = async () => {
    try {
      await notificationAPI.markAllRead();
      setItems((prev) => prev.map(i => ({ ...i, is_read: true })));
      setUnread(0);
    } catch (e) { toast.error(actionErrorMessage(e, 'do that')); }
  };

  const handleDelete = (id) => async (e) => {
    e.stopPropagation();
    try {
      await notificationAPI.remove(id);
      setItems((prev) => prev.filter(i => i.id !== id));
    } catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* While its panel is open the bell wears the same "you are here" ring as the profile button on Profile. */}
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? 'notification-center' : undefined}
        data-testid="notification-bell"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className={`relative w-touch h-touch rounded-pill border-hairline text-grove-cream hover:border-grove-fernLine flex items-center justify-center transition-colors duration-150 ${open ? 'border-grove-lime bg-grove-moss' : 'border-grove-moss bg-grove-canopy'}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-0.5 -right-0.5 min-w-5 h-5 rounded-pill bg-grove-bloom text-grove-root text-xs font-ui font-medium flex items-center justify-center px-1"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
        {/* A drawer from the right edge. The page stays visible on the left under a scrim; tapping it closes the drawer. */}
        <div aria-hidden="true" onClick={() => close()} className="fixed inset-0 z-popover bg-grove-night/60" data-testid="notification-scrim" />
        <div
          id="notification-center"
          role="dialog"
          aria-labelledby="notification-center-title"
          data-testid="notification-center"
          className="fixed inset-y-0 right-0 z-popover flex w-popover max-w-full flex-col overflow-hidden rounded-l-card border-hairline border-grove-moss bg-grove-forest"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b-hairline border-grove-moss">
            <div className="flex items-center gap-2">
              <h3 id="notification-center-title" ref={headingRef} tabIndex={-1} className="font-plant text-grove-cream text-base font-semibold focus:outline-none">Notifications</h3>
              {unread > 0 && (
                <span className="font-latin text-xs text-grove-blush">{unread} new</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {items.some(i => !i.is_read) && (
                <button
                  onClick={handleMarkAll}
                  data-testid="notification-mark-all-read"
                  className="font-ui text-xs font-medium text-grove-sprout hover:text-grove-sprout"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => close()}
                aria-label="Close notifications"
                data-testid="notification-close"
                className="flex h-touch w-touch items-center justify-center rounded-pill text-grove-cream hover:bg-grove-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto" data-testid="notification-list">
            {loading ? (
              <Loading label="Loading notifications" className="py-10" />
            ) : items.length === 0 ? (
              <div className="text-center py-10 px-4" data-testid="notification-empty">
                <div className="w-10 h-10 mx-auto rounded-pill bg-grove-moss border-hairline border-grove-moss flex items-center justify-center mb-2">
                  <Bell className="h-4 w-4 text-grove-sprout" />
                </div>
                <p className="font-ui text-sm text-grove-cream">Nothing new right now.</p>
                <p className="font-latin text-xs text-grove-cream mt-0.5">We’ll let you know when a plant needs you.</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = iconForType(n.type);
                return (
                  <div
                    key={n.id}
                    className={`w-full border-b-hairline border-grove-moss/80 flex items-start transition-colors duration-150 ${
                      !n.is_read
                        ? 'bg-grove-moss border-l-accent border-l-grove-lime hover:bg-grove-moss'
                        : 'hover:bg-grove-moss'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleOpen(n)}
                      data-testid="notification-item"
                      data-unread={!n.is_read}
                      className="flex-1 min-w-0 text-left pl-4 py-3 flex items-start gap-3"
                    >
                      <div className={`w-8 h-8 rounded-pill flex items-center justify-center flex-shrink-0 ${
                        !n.is_read ? 'bg-grove-forest' : 'bg-grove-moss'
                      }`}>
                        <Icon className="h-4 w-4 text-grove-sprout" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-ui text-sm text-grove-cream truncate">{n.title}</p>
                        {n.body && (
                          <p className="font-ui text-xs text-grove-cream line-clamp-2 mt-0.5">{n.body}</p>
                        )}
                        <p className="font-latin text-xs text-grove-lichen mt-1">{relativeTime(n.created_at)}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete(n.id)}
                      aria-label="Delete"
                      data-testid="notification-delete"
                      className="text-grove-sage hover:text-grove-blush flex-shrink-0 min-h-touch min-w-touch flex items-center justify-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          {/* The way to fewer (or no) notifications, from where people look for it. */}
          <div className="border-t-hairline border-grove-moss px-4 py-2">
            <button
              type="button"
              onClick={() => { close(false); navigate('/settings/notifications'); }}
              data-testid="notification-settings-link"
              className="flex min-h-touch w-full items-center font-ui text-sm text-grove-sprout underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime"
            >
              Notification settings
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
