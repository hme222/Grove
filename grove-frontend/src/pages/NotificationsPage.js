import LoadError from '../components/LoadError';
import Loading from '../components/Loading';
import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../lib/api';
import { PageHeader, HeaderAction } from '../components/PageHeader';
import { AppLink } from '../components/AppLink';
import { Bell, Trophy, Droplets, Heart } from 'lucide-react';
import { toast } from 'sonner';

const NOTIFICATION_ICONS = {
  goal_completed: Trophy,
  care_reminder: Droplets,
  grove_activity: Heart,
  default: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoadError(false);
      const res = await notificationAPI.getAll(50);
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (e) {
      toast.error('Failed to mark all as read');
    }
  };

  // Where a notification leads, by entity type. Null when it only needs marking as read.
  const notificationTarget = (notification) => {
    if (!notification.entity_id) return null;
    if (notification.entity_type === 'goal') return '/care/today';
    if (notification.entity_type === 'swap') return `/swaps/${notification.entity_id}`;
    if (notification.entity_type === 'plant') return `/plants/${notification.entity_id}`;
    return null;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }
  };

  return (
    <div>
      <PageHeader back
        title="Notifications"
        count={loadError || loading ? undefined : unreadCount}
      />

      <div className="max-w-page mx-auto px-4 py-4">
        {!loadError && unreadCount > 0 && (
          <div className="mb-3 flex items-center justify-end">
            <HeaderAction onClick={handleMarkAllRead} data-testid="mark-all-read-button">
              Mark all read
            </HeaderAction>
          </div>
        )}
        {loadError && !loading ? (<LoadError what="notifications" onRetry={fetchNotifications} />) : loading ? (
          <Loading label="Loading notifications" />
        ) : notifications.length === 0 ? (
          <div className="rounded-card border-hairline border-grove-moss bg-grove-moss p-5 text-center">
            <Bell className="h-12 w-12 text-grove-sage mx-auto mb-3" />
            <p className="text-sm text-grove-cream">No notifications yet</p>
            <p className="text-xs text-grove-cream mt-1">We'll let you know about care reminders and grove activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const IconComponent = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
              const target = notificationTarget(notification);
              const Row = target ? AppLink : 'button';
              const rowProps = target ? { to: target } : { type: 'button' };
              return (
                <Row
                  {...rowProps}
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`block w-full text-left rounded-card border-hairline border-grove-moss p-5 cursor-pointer transition-all duration-150 ${
                    notification.is_read
                      ? 'bg-grove-forest hover:bg-grove-moss'
                      : 'bg-grove-moss hover:bg-grove-canopy border-grove-fernLine'
                  }`}
                  data-testid="notification-item"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.is_read ? 'bg-grove-moss' : 'bg-grove-lime'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        notification.is_read ? 'text-grove-cream' : 'text-grove-cream'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-plant text-grove-cream text-base font-semibold ">{notification.title}</h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-grove-lime flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-grove-cream mt-1">{notification.body}</p>
                      <p className="text-xs text-grove-cream mt-2">
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </Row>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
