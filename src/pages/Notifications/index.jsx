import { createSignal, createResource, For, Show, onMount } from "solid-js";
import { useUser } from "../../context/UserContext";
import { getUserNotifications, markNotificationRead, createNotification } from "../../lib/db";
import { toastManager } from "../../lib/feedback";
import logger from '../../lib/logger.js';


const Notifications = () => {
  logger.trace('Notifications: Starting');
  const { user } = useUser();
  const [filter, setFilter] = createSignal('all'); // all, unread

  const [notifications, { refetch }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return [];
      return await getUserNotifications(userId);
    }
  );

  // Force refresh on mount to ensure fresh data
  onMount(() => {
    if (user()?.id) {
      refetch();
    }
  });

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId, user().id);
      refetch();
      toastManager.success('Notification marked as read');
    } catch (error) {
      toastManager.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications().filter(n => !n.read);
      if (unreadNotifications.length === 0) {
        toastManager.info('No unread notifications');
        return;
      }
      await Promise.all(unreadNotifications.map(n => markNotificationRead(n.id, user().id)));
      refetch();
      toastManager.success(`Marked ${unreadNotifications.length} notifications as read`);
    } catch (error) {
      toastManager.error('Failed to mark all notifications as read');
    }
  
  logger.trace('filteredNotifications: Starting');};

  const filteredNotifications = () => {
    const notifs = notifications() || [];
    if (filter() === 'unread') return n
  logger.trace('getNotificationIcon: Starting');otifs.filter(n => !n.read);
    return notifs;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'system': return '🔔';
      case 'billing': return '💳';
      ca
  logger.trace('getNotificationColor: Starting');se 'credits': return '💰';
      case 'update': return '📢';
      default: return '📧';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'system': return 'border-info bg-info/10';
      case 'billing': return 'border-success bg-success/10';
      case 'credits': return 'border-warning bg-warning/10';
      case 'update': return 'border-secondary bg-secondary/10';
      default: return 'border-neutral bg-neutral/10';
    }
  };

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold">Notifications</h1>
          <button
            class="btn btn-primary"
            onClick={markAllAsRead}
            disabled={!notifications() || notifications().every(n => n.read)}
          >
            Mark All as Read
          </button>
        </div>

        <div class="tabs tabs-boxed mb-6">
          <a class={`tab ${filter() === 'all' ? 'tab-active' : ''}`} onClick={() => setFilter('all')}>
            All ({notifications()?.length || 0})
          </a>
          <a class={`tab ${filter() === 'unread' ? 'tab-active' : ''}`} onClick={() => setFilter('unread')}>
            Unread ({notifications()?.filter(n => !n.read).length || 0})
          </a>
        </div>

        <Show when={!notifications.loading} fallback={<div class="text-center py-8">Loading notifications...</div>}>
          <Show when={filteredNotifications().length > 0} fallback={
            <div class="text-center py-12">
              <div class="text-6xl mb-4">🔔</div>
              <h3 class="text-xl font-semibold mb-2">
                {filter() === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p class="text-base-content/60">
                {filter() === 'unread' ? 'All caught up!' : 'You\'ll receive notifications about your account activity here.'}
              </p>
            </div>
          }>
            <div class="space-y-4">
              <For each={filteredNotifications()}>
                {(notification) => (
                  <div class={`border-l-4 rounded-lg p-6 shadow-sm ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}>
                    <div class="flex items-start justify-between">
                      <div class="flex items-start space-x-4">
                        <div class="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div class="flex-1">
                          <h3 class="font-semibold text-lg mb-1">{notification.title}</h3>
                          <p class="text-base-content mb-3">{notification.message}</p>
                          <p class="text-sm text-base-content/60">
                            {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Show when={!notification.read}>
                        <button
                          onClick={() => markAsRead(notification.id)}
                          class="btn btn-sm btn-outline btn-primary"
                        >
                          Mark as Read
                        </button>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default Notifications;