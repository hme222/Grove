import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../lib/api';
import { Bell, X, Check, Trash2, Leaf, Sun, Scissors, Flame, Sprout, Users, Heart, MessageCircle, Flower2 } from 'lucide-react';
import { toast } from 'sonner';

const UNREAD_POLL_MS = 45000;

function iconForType(type) {
  switch (type) {
    case 'streak_milestone': return Flame;
    case 'streak_at_risk': return Flame;
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

function routeForNotification(n) {
  const t = n.type;
  if (t === 'swap_match') return n.entity_id ? `/swaps/${n.entity_id}` : '/swaps/matches';
  if (t === 'swap_message') return n.entity_id ? `/swaps/${n.entity_id}` : '/swaps/matches';
  if (t === 'swap_completed') return n.entity_id ? `/swaps/${n.entity_id}` : '/swaps/matches';
  if (t === 'swap_cancelled') return '/swaps/matches';
  if (t === 'unlock') return '/swap';
  if (t === 'care_due' || t === 'care_overdue') return '/care/today';
  if (t === 'streak_at_risk' || t === 'streak_milestone') return '/care/today';
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
      toast.error('Failed to load notifications');
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
  }, [open, fetchItems]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

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
    } catch (e) { toast.error('Failed'); }
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
      <button
        onClick={() => setOpen(o => !o)}
        data-testid="notification-bell"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className="relative w-9 h-9 rounded-full border-[0.5px] border-grove-moss bg-grove-forest text-grove-cream hover:border-grove-fernLine flex items-center justify-center transition-colors duration-150"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-grove-bloom text-grove-root text-[10px] font-plant flex items-center justify-center px-1"
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="notification-center"
          className="absolute right-0 top-[46px] z-[120] w-[330px] max-h-[70vh] overflow-hidden rounded-[14px] border-[0.5px] border-grove-moss bg-grove-forest shadow-[0_2px_0_0_#D3C9B8]"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b-[0.5px] border-grove-moss">
            <div className="flex items-center gap-2">
              <h3 className="font-plant text-grove-cream text-sm">Notifications</h3>
              {unread > 0 && (
                <span className="font-latin text-[10px] text-grove-bloom">{unread} new</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {items.some(i => !i.is_read) && (
                <button
                  onClick={handleMarkAll}
                  data-testid="notification-mark-all-read"
                  className="font-plant text-[10px] text-grove-sprout hover:text-grove-sprout"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-grove-cream hover:text-grove-cream"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-48px)]" data-testid="notification-list">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-grove-fernLine border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-10 px-4" data-testid="notification-empty">
                <div className="w-10 h-10 mx-auto rounded-full bg-grove-moss border-[0.5px] border-grove-moss flex items-center justify-center mb-2">
                  <Bell className="h-4 w-4 text-grove-sprout" />
                </div>
                <p className="font-ui text-sm text-grove-cream">Nothing new right now.</p>
                <p className="font-latin text-[10px] text-grove-cream mt-0.5">We'll ping you when your grove needs attention.</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = iconForType(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={handleOpen(n)}
                    data-testid="notification-item"
                    data-unread={!n.is_read}
                    className={`w-full text-left px-4 py-3 border-b-[0.5px] border-grove-moss/60 flex items-start gap-3 transition-colors duration-150 ${
                      !n.is_read
                        ? 'bg-grove-moss border-l-[3px] border-l-[#3B6D11] hover:bg-[#dfe8d1]'
                        : 'hover:bg-grove-moss'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !n.is_read ? 'bg-grove-forest' : 'bg-grove-moss'
                    }`}>
                      <Icon className="h-4 w-4 text-grove-sprout" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-ui text-sm text-grove-cream truncate">{n.title}</p>
                      {n.body && (
                        <p className="font-ui text-xs text-grove-cream line-clamp-2 mt-0.5">{n.body}</p>
                      )}
                      <p className="font-latin text-[10px] text-grove-lichen mt-1">{relativeTime(n.created_at)}</p>
                    </div>
                    <span
                      onClick={handleDelete(n.id)}
                      role="button"
                      aria-label="Delete"
                      data-testid="notification-delete"
                      className="text-grove-sage hover:text-grove-bloom flex-shrink-0 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
