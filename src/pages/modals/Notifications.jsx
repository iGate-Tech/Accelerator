import { createSignal, createResource, onMount, createEffect, useContext } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";
import { useUser } from "../../context/UserContext";
import { getUserNotifications, markNotificationRead } from "../../lib/db";

const Notifications = () => {
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [filter, setFilter] = createSignal('all'); // all, unread

  // Fetch real notifications from database
  const [notifications, { refetch }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return [];
      try {
        const userNotifications = await getUserNotifications(userId);
        // Transform to match expected format
        return userNotifications.map(notification => ({
          id: notification.id,
          type: notification.type === 'system' ? 'systemUpdate' :
                notification.type === 'billing' ? 'billing' :
                notification.type === 'credits' ? 'credits' :
                notification.type === 'update' ? 'systemUpdate' : 'newMessage',
          text: notification.message,
          read: notification.read || false,
          time: new Date(notification.created_at)
        }));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    }
  );

  const t = () => translations[currentLang()];

  const timeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id, user()?.id);
      refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
      console.error('Error marking all notifications as read:', error);
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
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <Show when={!notifications.loading} fallback={
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold text-base-content">{t().notifications} ({(notifications() || []).length})</h1>
          <div class="flex gap-2">
            <button
              class="btn btn-primary"
              onClick={markAllAsRead}
              disabled={!((notifications() || []).some(n => !n.read))}
            >
              <i data-lucide="check-circle" class="w-4 h-4"></i>
              Mark All as Read
            </button>
          </div>
        </div>

        <div class="tabs tabs-boxed mb-6">
          <a class={`tab ${filter() === 'all' ? 'tab-active' : ''}`} onClick={() => setFilter('all')}>
            All ({(notifications() || []).length})
          </a>
          <a class={`tab ${filter() === 'unread' ? 'tab-active' : ''}`} onClick={() => setFilter('unread')}>
            Unread ({((notifications() || []).filter(n => !n.read)).length})
          </a>
        </div>

        <div class="space-y-4">
          {filteredNotifications().length === 0 ? (
            <div class="text-center py-12">
              <i data-lucide="bell-off" class="w-16 h-16 text-base-content/30 mx-auto mb-4"></i>
              <p class="text-lg text-base-content/50">No notifications</p>
            </div>
          ) : (
            filteredNotifications().map((notif) => (
              <div
                class={`card bg-base-100 shadow-lg ${
                  !notif.read ? 'border-l-4 border-primary bg-primary/5' : ''
                }`}
              >
                <div class="card-body p-4">
                  <div class="flex items-start gap-4">
                    <div class={`p-2 rounded-full ${
                      notif.type === 'newMessage' || notif.type === 'message' ? 'bg-blue-500 text-white' :
                      notif.type === 'systemUpdate' || notif.type === 'system' || notif.type === 'update' ? 'bg-green-500 text-white' :
                      notif.type === 'billing' ? 'bg-purple-500 text-white' :
                      notif.type === 'credits' ? 'bg-yellow-500 text-black' :
                      'bg-gray-500 text-white'
                    }`}>
                      <i
                        data-lucide={
                          notif.type === 'newMessage' || notif.type === 'message' ? 'message-circle' :
                          notif.type === 'systemUpdate' || notif.type === 'system' || notif.type === 'update' ? 'settings' :
                          notif.type === 'billing' ? 'credit-card' :
                          notif.type === 'credits' ? 'dollar-sign' :
                          'bell'
                        }
                        class="w-5 h-5"
                      ></i>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-base-content">
                          {notif.type === 'newMessage' || notif.type === 'message'
                            ? 'New Message'
                            : notif.type === 'systemUpdate' || notif.type === 'system' || notif.type === 'update'
                            ? 'System Update'
                            : notif.type === 'billing'
                            ? 'Billing Update'
                            : notif.type === 'credits'
                            ? 'Credit Update'
                            : 'Notification'}
                        </h3>
                        <span class="text-xs text-base-content/60">{timeAgo(notif.time)}</span>
                      </div>
                      <p class="text-sm text-base-content/70 mb-3">{notif.text}</p>
                      <div class="flex items-center gap-2">
                        {!notif.read && (
                          <div class="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                        {!notif.read && (
                          <button
                            class="btn btn-sm btn-outline"
                            onClick={() => markAsRead(notif.id)}
                          >
                            Mark as Read
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