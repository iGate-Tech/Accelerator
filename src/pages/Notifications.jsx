import { createSignal, onMount, createEffect, For, Show, createResource } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../hooks/useLanguage";
import { getUserNotifications, markNotificationRead, createNotification } from "../lib/database";
import { toastManager } from "../lib/ui/feedback";
import { logger } from '../lib/core';

const Notifications = () => {
  logger.trace('Notifications: Starting');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const { currentLang, t } = useLanguage();

  const [settings, setSettings] = createSignal({
    browser: user()?.preferences?.notifications?.browser ?? false,
    projectUpdates: user()?.preferences?.notifications?.projectUpdates ?? true
  });

  const [filter, setFilter] = createSignal('all');

  const fetchNotifications = async () => {
    if (!user()?.id) return [];
    try {
      const notifs = await getUserNotifications(user().id);
      return notifs.map(n => ({
        ...n,
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: new Date(n.created_at || n.timestamp),
        read: Boolean(n.read)
      }));
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      return [];
    }
  };

  const [notifications, { refetch: refetchNotifications }] = createResource(
    () => user()?.id,
    fetchNotifications
  );

  // Redirect if not authenticated
  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth/login', { replace: true });
    }
  });

  const saveSettings = async () => {
    try {
      const { updatePreferences } = await import("../context/UserContext");
      await updatePreferences({ notifications: settings() });
      toastManager.success(t().settingsSaved);
    } catch (error) {
      logger.error('Error saving notification settings:', error);
      toastManager.error(t().failedToSave);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id, user().id);
      refetchNotifications();
      toastManager.success(t().markAsRead);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications()?.filter(n => !n.read) || [];
    if (unreadNotifs.length === 0) {
      toastManager.info(t().noUnreadNotifications);
      return;
    }
    try {
      for (const notif of unreadNotifs) {
        await markNotificationRead(notif.id, user().id);
      }
      refetchNotifications();
      toastManager.success(t().markedAsRead.replace('{count}', unreadNotifs.length));
    } catch (error) {
      logger.error('Error marking all as read:', error);
    }
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
      case 'subscription': return 'star';
      case 'collaboration': return 'users';
      case 'getting-started': return 'book-open';
      case 'credits': return 'coins';
      case 'ai': return 'brain';
      case 'explore': return 'compass';
      case 'help': return 'help-circle';
      default: return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'project': return 'border-primary bg-primary/10';
      case 'credit': return 'border-warning bg-warning/10';
      case 'system': return 'border-info bg-info/10';
      case 'subscription': return 'border-success bg-success/10';
      case 'collaboration': return 'border-secondary bg-secondary/10';
      case 'getting-started': return 'border-primary bg-primary/10';
      case 'credits': return 'border-warning bg-warning/10';
      case 'ai': return 'border-accent bg-accent/10';
      case 'explore': return 'border-secondary bg-secondary/10';
      case 'help': return 'border-info bg-info/10';
      default: return 'border-neutral bg-neutral/10';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (isNaN(diff)) return t().timeUnknown;
    if (minutes < 1) return t().timeJustNow;
    if (minutes < 60) return t().timeMinutesAgo.replace('{minutes}', minutes);
    if (hours < 24) return t().timeHoursAgo.replace('{hours}', hours);
    if (days < 7) return t().timeDaysAgo.replace('{days}', days);
    return date.toLocaleDateString();
  };

  const createSampleNotification = async () => {
    try {
      await createNotification(
        user().id,
        'system',
        'Welcome to Accelerator',
        'Your account has been set up successfully. Start exploring your startup ideas!'
      );
      refetchNotifications();
      toastManager.success(t().sampleCreated);
    } catch (error) {
      logger.error('Error creating notification:', error);
    }
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
     <div class="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 py-6 sm:py-8 overflow-visible">
       {/* Header */}
       <div class="py-6">
         <div class="flex justify-start mb-4">
           <button
             onClick={() => navigate('/')}
             class="btn btn-ghost btn-sm gap-2"
           >
             <svg class="w-4 h-4 rtl:transform rtl:scale-x-[-1]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
             <span class="hidden sm:inline">Back</span>
           </button>
         </div>

         <div class="text-center">
           <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content mb-3">{t().notificationsTitle}</h1>
           <p class="text-sm sm:text-base text-base-content/70 max-w-2xl mx-auto mb-6">
             {t().notificationsDesc}
           </p>
         </div>
       </div>

       {/* Content */}
       <div class="bg-base-100 rounded-box p-4 sm:p-6 md:p-8 shadow-sm border border-base-200">
         <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Sidebar */}
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body">
              <h3 class="card-title">
                <i data-lucide="settings" class="w-5 h-5 me-2"></i>
                {t().notificationSettingsTitle}
              </h3>
              <div class="space-y-4">
                <label class="flex items-center justify-between">
                  <div>
                    <span class="font-medium">{t().browserNotificationsTitle}</span>
                    <p class="text-sm text-base-content/60">{t().showInBrowser}</p>
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
                    <span class="font-medium">{t().projectUpdatesTitle}</span>
                    <p class="text-sm text-base-content/60">{t().projectChanges}</p>
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
                  {t().saveSettings}
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
                  <i data-lucide="bell" class="w-5 h-5 me-2"></i>
                  {t().recentNotifications}
                </h3>
                <div class="flex gap-2">
                  <div class="tabs tabs-boxed">
                    <a class={`tab tab-sm ${filter() === 'all' ? 'tab-active' : ''}`} onClick={() => setFilter('all')}>
                      {t().all} ({notifications().length})
                    </a>
                    <a class={`tab tab-sm ${filter() === 'unread' ? 'tab-active' : ''}`} onClick={() => setFilter('unread')}>
                      {t().unread} ({notifications().filter(n => !n.read).length})
                    </a>
                  </div>
                  <button
                    class="btn btn-ghost btn-sm"
                    onClick={markAllAsRead}
                  >
                    {t().markAllRead}
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
                            <span class="text-xs text-base-content/60 ms-2">
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
                    <p>{filter() === 'unread' ? t().noUnreadNotifications : t().noNotifications}</p>
                    <button
                      class="btn btn-primary btn-sm mt-4"
                      onClick={createSampleNotification}
                    >
                      <i data-lucide="plus" class="w-4 h-4 me-2"></i>
                      {t().createSample}
                    </button>
                  </div>
                </Show>
              </div>
            </div>
          </div>
         </div>
       </div>
     </div>
     </div>
   );
 };

export default Notifications;