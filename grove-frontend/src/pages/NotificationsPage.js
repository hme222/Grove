import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { Bell, Check, Trophy, Target, Droplets, Heart } from 'lucide-react';
import { toast } from 'sonner';

const NOTIFICATION_ICONS = {
  goal_completed: Trophy,
  care_reminder: Droplets,
  grove_activity: Heart,
  default: Bell,
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll(50);
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (e) {
      toast.error('Failed to load notifications');
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

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }
    // Navigate based on entity type
    if (notification.entity_type === 'goal' && notification.entity_id) {
      navigate('/goals');
    } else if (notification.entity_type === 'plant' && notification.entity_id) {
      navigate(`/plants/${notification.entity_id}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        count={unreadCount}
        rightContent={
          unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-sans uppercase tracking-[0.12em] text-[#3B6D11] hover:text-[#1C2E10] transition-colors"
              data-testid="mark-all-read-button"
            >
              Mark all read
            </button>
          )
        }
      />

      <div className="max-w-[1100px] mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[14px] border-[0.5px] border-[#D3C9B8] bg-[#EAF3DE] p-6 text-center">
            <Bell className="h-12 w-12 text-[#D3C9B8] mx-auto mb-3" />
            <p className="text-sm text-[#2B2B26]">No notifications yet</p>
            <p className="text-xs text-[#3B3A33] mt-1">We'll notify you about goals, care reminders, and grove activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const IconComponent = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`rounded-[14px] border-[0.5px] border-[#D3C9B8] p-4 cursor-pointer transition-all duration-150 ${
                    notification.is_read
                      ? 'bg-[#F5F0E8] hover:bg-[#EDE5D8]'
                      : 'bg-[#EAF3DE] hover:bg-[#E0EDD1] border-[#3B6D11]'
                  }`}
                  data-testid="notification-item"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.is_read ? 'bg-[#D3C9B8]' : 'bg-[#3B6D11]'
                    }`}>
                      <IconComponent className={`h-5 w-5 ${
                        notification.is_read ? 'text-[#1C2E10]' : 'text-[#F5F0E8]'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-plant text-[#1C2E10] text-sm">{notification.title}</h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-[#3B6D11] flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-[#2B2B26] mt-1">{notification.body}</p>
                      <p className="text-xs text-[#3B3A33] mt-2">
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
