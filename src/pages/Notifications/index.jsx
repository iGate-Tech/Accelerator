import { createSignal, onMount, createEffect, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { toastManager } from "../../lib/feedback";
import logger from '../../lib/logger.js';

const Notifications = () => {
  logger.trace('Notifications: Starting');
  const navigate = useNavigate();
  const { user, isAuthenticated, updatePreferences } = useUser();
  const { currentLang, t } = useLanguage();

  const [notifications, setNotifications] = createSignal([
    {
      id: 1,
      type: 'project',
      title: 'Project Completed',
      message: 'Your project "Startup Idea" has been completed successfully.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false
    },
    {
      id: 2,
      type: 'credit',
      title: 'Credit Alert',
      message: 'You have used 25 credits this week.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true
    },
    {
      id: 3,
      type: 'system',
      title: 'Welcome to Accelerator',
      message: 'Welcome! Your account has been set up successfully.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    }
  ]);

  const [settings, setSettings] = createSignal({
    email: user()?.preferences?.notifications?.email ?? true,
    browser: user()?.preferences?.notifications?.browser ?? false,
    projectUpdates: user()?.preferences?.notifications?.projectUpdates ?? true
  });

  const [filter, setFilter] = createSignal('all'); // all, unread

  // Redirect if not authenticated
  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login', { replace: true });
    }
  });

  const saveSettings = async () => {
    try {
      await updatePreferences({
        notifications: settings()
      });
      toastManager.success('Notification settings saved successfully!');
    } catch (error) {
      logger.error('Error saving notification settings:', error);
      toastManager.error('Failed to save settings');
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    toastManager.success('Notification marked as read');
  };

  const markAllAsRead = () => {
    const unreadCount = notifications().filter(n => !n.read).length;
    if (unreadCount === 0) {
      toastManager.info('No unread notifications');
      return;
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toastManager.success(`Marked ${unreadCount} notifications as read`);
  };

  const filteredNotifications = () => {
    const notifs = notifications() || [];
    if (filter() === 'unread') return notifs.filter(n => !n.read);
    return notifs;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'project': return 'folder';
      case 'credit': return 'credit-card';
      case 'system': return 'info';
      default: return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'project': return 'border-primary bg-primary/10';
      case 'credit': return 'border-warning bg-warning/10';
      case 'system': return 'border-info bg-info/10';
      default: return 'border-neutral bg-neutral/10';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class={`max-w-4xl mx-auto space-y-8 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-base-content mb-4">Notifications</h1>
        <p class="text-lg text-base-content/70">
          Manage your notifications and stay updated.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Sidebar */}
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="settings" class="w-5 h-5 mr-2"></i>
                Notification Settings
              </h3>
              <div class="space-y-4">
                <label class="flex items-center justify-between">
                  <div>
                    <span class="font-medium">Email Notifications</span>
                    <p class="text-sm text-base-content/60">Receive emails</p>
                  </div>
                  <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    checked={settings().email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.checked }))}
                  />
                </label>
                <label class="flex items-center justify-between">
                  <div>
                    <span class="font-medium">Browser Notifications</span>
                    <p class="text-sm text-base-content/60">Show in browser</p>
                  </div>
                  <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    checked={settings().browser}
                    onChange={(e) => setSettings(prev => ({ ...prev, browser: e.target.checked }))}
                  />
                </label>
                <label class="flex items-center justify-between">
                  <div>
                    <span class="font-medium">Project Updates</span>
                    <p class="text-sm text-base-content/60">Project changes</p>
                  </div>
                  <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    checked={settings().projectUpdates}
                    onChange={(e) => setSettings(prev => ({ ...prev, projectUpdates: e.target.checked }))}
                  />
                </label>
                <button
                  class="btn btn-primary btn-block"
                  onClick={saveSettings}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div class="lg:col-span-2">
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <div class="flex justify-between items-center mb-6">
                <h3 class="card-title">
                  <i data-lucide="bell" class="w-5 h-5 mr-2"></i>
                  Recent Notifications
                </h3>
                <div class="flex gap-2">
                  <div class="tabs tabs-boxed">
                    <a class={`tab tab-sm ${filter() === 'all' ? 'tab-active' : ''}`} onClick={() => setFilter('all')}>
                      All ({notifications().length})
                    </a>
                    <a class={`tab tab-sm ${filter() === 'unread' ? 'tab-active' : ''}`} onClick={() => setFilter('unread')}>
                      Unread ({notifications().filter(n => !n.read).length})
                    </a>
                  </div>
                  <button
                    class="btn btn-ghost btn-sm"
                    onClick={markAllAsRead}
                  >
                    Mark All Read
                  </button>
                </div>
              </div>
              <div class="space-y-4">
                <For each={filteredNotifications()}>
                  {(notification) => (
                    <div
                      class={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        notification.read
                          ? 'bg-base-200 border-base-300'
                          : 'bg-primary/5 border-primary/20'
                      } ${getNotificationColor(notification.type)}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div class="flex items-start gap-4">
                        <div class={`p-2 rounded-full ${
                          notification.read ? 'bg-base-300' : 'bg-primary/20'
                        }`}>
                          <i data-lucide={getNotificationIcon(notification.type)} class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex justify-between items-start">
                            <h4 class="font-semibold text-base-content">
                              {notification.title}
                            </h4>
                            <span class="text-xs text-base-content/60 ml-2">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p class="text-sm text-base-content/80 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <Show when={!notification.read}>
                          <div class="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
                <Show when={filteredNotifications().length === 0}>
                  <div class="text-center py-12 text-base-content/60">
                    <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p>{filter() === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;