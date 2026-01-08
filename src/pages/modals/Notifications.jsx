import { createSignal, onMount, createEffect, useContext } from "solid-js";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";

const Notifications = () => {
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [filter, setFilter] = createSignal('all'); // all, unread

  const [notifications, setNotifications] = createSignal([
    { type: 'newMessage', text: translations[currentLang()].newMessageText, read: false, time: new Date(Date.now() - 5 * 60 * 1000), id: 1 },
    { type: 'systemUpdate', text: translations[currentLang()].systemUpdateText, read: false, time: new Date(Date.now() - 2 * 60 * 60 * 1000), id: 2 },
    { type: 'reminder', text: translations[currentLang()].reminderText, read: true, time: new Date(Date.now() - 24 * 60 * 60 * 1000), id: 3 },
    { type: 'newMessage', text: 'Another new message arrived!', read: false, time: new Date(Date.now() - 10 * 60 * 1000), id: 4 },
    { type: 'systemUpdate', text: 'System maintenance completed.', read: true, time: new Date(Date.now() - 3 * 60 * 60 * 1000), id: 5 },
  ]);

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

  const markAsRead = (id) => {
    setNotifications(notifications().map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications().map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = () => {
    if (filter() === 'unread') return notifications().filter(n => !n.read);
    return notifications();
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
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-base-content">{t().notifications} ({notifications().length})</h1>
        <div class="flex gap-2">
          <button
            class="btn btn-primary"
            onClick={markAllAsRead}
            disabled={notifications().every(n => n.read)}
          >
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            Mark All as Read
          </button>
        </div>
      </div>

      <div class="tabs tabs-boxed mb-6">
        <a class={`tab ${filter() === 'all' ? 'tab-active' : ''}`} onClick={() => setFilter('all')}>
          All ({notifications().length})
        </a>
        <a class={`tab ${filter() === 'unread' ? 'tab-active' : ''}`} onClick={() => setFilter('unread')}>
          Unread ({notifications().filter(n => !n.read).length})
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
                    notif.type === 'newMessage' ? 'bg-info text-info-content' :
                    notif.type === 'systemUpdate' ? 'bg-success text-success-content' :
                    'bg-warning text-warning-content'
                  }`}>
                    <i
                      data-lucide={
                        notif.type === 'newMessage' ? 'message-circle' :
                        notif.type === 'systemUpdate' ? 'settings' :
                        'clock'
                      }
                      class="w-5 h-5"
                    ></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-semibold text-base-content">
                        {notif.type === 'newMessage' ? t().newMessage :
                         notif.type === 'systemUpdate' ? t().systemUpdate :
                         t().reminder}
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
    </div>
  );
};

export default Notifications;