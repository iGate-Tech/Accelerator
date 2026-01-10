import { createSignal, createResource, For, Show, onMount } from "solid-js";
import { useUser } from "../../context/UserContext";
import { getUserNotifications, markNotificationRead, createNotification } from "../../lib/db";
import { toastManager } from "../../lib/feedback";

const Notifications = () => {
  const { user } = useUser();

  const [notifications, { refetch }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return [];
      return await getUserNotifications(userId);
    }
  );

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId, user().id);
      refetch();
      toastManager.success('Notification marked as read');
    } catch (error) {
      toastManager.error('Failed to mark notification as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'system': return '🔔';
      case 'billing': return '💳';
      case 'credits': return '💰';
      case 'update': return '📢';
      default: return '📧';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'system': return 'border-blue-500 bg-blue-50';
      case 'billing': return 'border-green-500 bg-green-50';
      case 'credits': return 'border-yellow-500 bg-yellow-50';
      case 'update': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Notifications</h1>

        <Show when={!notifications.loading} fallback={<div class="text-center py-8">Loading notifications...</div>}>
          <Show when={notifications().length > 0} fallback={
            <div class="text-center py-12">
              <div class="text-6xl mb-4">🔔</div>
              <h3 class="text-xl font-semibold mb-2">No notifications yet</h3>
              <p class="text-gray-600">You'll receive notifications about your account activity here.</p>
            </div>
          }>
            <div class="space-y-4">
              <For each={notifications()}>
                {(notification) => (
                  <div class={`border-l-4 rounded-lg p-6 shadow-sm ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}>
                    <div class="flex items-start justify-between">
                      <div class="flex items-start space-x-4">
                        <div class="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div class="flex-1">
                          <h3 class="font-semibold text-lg mb-1">{notification.title}</h3>
                          <p class="text-gray-700 mb-3">{notification.message}</p>
                          <p class="text-sm text-gray-500">
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