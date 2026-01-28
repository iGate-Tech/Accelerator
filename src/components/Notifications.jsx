import {
  createSignal,
  createResource,
  createMemo,
  onMount,
  createEffect,
  useContext,
  Show,
} from 'solid-js';
import { LangContext } from '../context/LangContext';
import { translations } from '../assets/translations/translations-index.js';
import { useUser } from '../context/UserContext';
import { getUserNotifications, markNotificationRead } from '@lib/database';
import { logger } from '@lib/core';

const Notifications = () => {
  logger.trace('Notifications: Starting');
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [filter, setFilter] = createSignal('all'); // all, unread

  // Fetch real notifications from database
  const [notifications, { refetch }] = createResource(
    () => user()?.id,
    async userId => {
      if (!userId) return [];
      try {
        const userNotifications = await getUserNotifications(userId);
        // Transform to match expected format
        return userNotifications.map(notification => ({
          id: notification.id,
          type:
            notification.type === 'system'
              ? 'systemUpdate'
              : notification.type === 'billing'
                ? 'billing'
                : notification.type === 'credits'
                  ? 'credits'
                  : notification.type === 'update'
                    ? 'systemUpdate'
                    : 'newMessage',
          text: notification.message,
          read: notification.read || false,
          time: new Date(notification.created_at),
        }));
      } catch (error) {
        logger.error('Error fetching notifications:', error);
        return [];
      }
    }
  );

  const t = createMemo(() => translations[currentLang()]);

  const timeAgo = date => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t().justNow || 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const markAsRead = async id => {
    try {
      await markNotificationRead(id, user()?.id);
      refetch();
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = (notifications() || []).filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        await Promise.all(
          unreadNotifications.map(notif =>
            markNotificationRead(notif.id, user()?.id)
          )
        );
        refetch();
      }
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  };

  const filteredNotifications = () => {
    const notifs = notifications() || [];
    if (filter() === 'unread') return notifs.filter(n => !n.read);
    return notifs;
  };

  createEffect(() => {
    setCurrentLang(lang());
  });

  createEffect(() => {
    filter();
    notifications();
    if (window.lucide) window.lucide.createIcons();
  });

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class="container mx-auto max-w-4xl px-4 py-8">
      <Show
        when={!notifications.loading}
        fallback={
          <div class="flex items-center justify-center py-12">
            <div class="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
          </div>
        }
      >
        <div class="mb-6 flex items-center justify-between">
          <h1 class="text-base-content text-3xl font-bold">
            {t().notifications} ({(notifications() || []).length})
          </h1>
          <div class="flex gap-2">
            <button
              class="btn btn-primary"
              onClick={markAllAsRead}
              disabled={!(notifications() || []).some(n => !n.read)}
            >
              <i data-lucide="check-circle" class="h-4 w-4" />
              {t().markAllRead}
            </button>
          </div>
        </div>

        <div class="tabs tabs-boxed mb-6">
          <a
            class={`tab ${filter() === 'all' ? 'tab-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t().all} ({(notifications() || []).length})
          </a>
          <a
            class={`tab ${filter() === 'unread' ? 'tab-active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            {t().unread} ({(notifications() || []).filter(n => !n.read).length})
          </a>
        </div>

        <div class="space-y-4">
          {filteredNotifications().length === 0 ? (
            <div class="py-12 text-center">
              <i
                data-lucide="bell-off"
                class="text-base-content/30 mx-auto mb-4 h-16 w-16"
              />
              <p class="text-base-content/50 text-lg">{t().noNotifications}</p>
            </div>
          ) : (
            filteredNotifications().map(notif => (
              <div
                class={`card bg-base-100 shadow-lg ${
                  !notif.read ? 'border-primary bg-primary/5 border-l-4' : ''
                }`}
              >
                <div class="card-body p-4">
                  <div class="flex items-start gap-4">
                    <div
                      class={`rounded-full p-2 ${
                        notif.type === 'newMessage' || notif.type === 'message'
                          ? 'bg-info text-info-content'
                          : notif.type === 'systemUpdate' ||
                              notif.type === 'system' ||
                              notif.type === 'update'
                            ? 'bg-success text-success-content'
                            : notif.type === 'billing'
                              ? 'bg-secondary text-secondary-content'
                              : notif.type === 'credits'
                                ? 'bg-warning text-warning-content'
                                : 'bg-neutral text-neutral-content'
                      }`}
                    >
                      <i
                        data-lucide={
                          notif.type === 'newMessage' ||
                          notif.type === 'message'
                            ? 'message-circle'
                            : notif.type === 'systemUpdate' ||
                                notif.type === 'system' ||
                                notif.type === 'update'
                              ? 'settings'
                              : notif.type === 'billing'
                                ? 'credit-card'
                                : notif.type === 'credits'
                                  ? 'dollar-sign'
                                  : 'bell'
                        }
                        class="h-5 w-5"
                      />
                    </div>
                    <div class="flex-1">
                      <div class="mb-2 flex items-center justify-between">
                        <h3 class="text-base-content font-semibold">
                          {notif.type === 'newMessage' ||
                          notif.type === 'message'
                            ? t().newMessage
                            : notif.type === 'systemUpdate' ||
                                notif.type === 'system' ||
                                notif.type === 'update'
                              ? t().systemUpdate
                              : notif.type === 'billing'
                                ? t().billingUpdate
                                : notif.type === 'credits'
                                  ? t().creditsUpdate
                                  : t().notification}
                        </h3>
                        <span class="text-base-content/60 text-xs">
                          {timeAgo(notif.time)}
                        </span>
                      </div>
                      <p class="text-base-content/70 mb-3 text-sm">
                        {notif.text}
                      </p>
                      <div class="flex items-center gap-2">
                        {!notif.read && (
                          <div class="bg-primary h-2 w-2 rounded-full" />
                        )}
                        {!notif.read && (
                          <button
                            class="btn btn-sm btn-outline"
                            onClick={() => markAsRead(notif.id)}
                          >
                            {t().markAsRead}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Show>
    </div>
  );
};

export default Notifications;
