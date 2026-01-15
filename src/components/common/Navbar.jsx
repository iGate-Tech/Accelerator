import { A, useLocation, useNavigate } from "@solidjs/router";
import { createSignal, onMount, Show, For } from "solid-js";
import logger from '../../lib/logger.js';
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { useLucideIcons } from "../../hooks/useLucideIcons";

const Navbar = () => {
  logger.trace('Navbar: Starting');
  const userContext = useUser() ?? {};
  const { currentLang, t, setLang } = useLanguage();
  useLucideIcons();

  const isAuthenticated = userContext.isAuthenticated ?? (() => false);
  const user = userContext.user ?? (() => null);
  const logout = userContext.logout ?? (() => {});

  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownFilter, setDropdownFilter] = createSignal('all');
  const [notifications, setNotifications] = createSignal([]);
  const [creditBalance, setCreditBalance] = createSignal(50);
  const [subscription, setSubscription] = createSignal({ plan: 'free' });
  const [projectsCount, setProjectsCount] = createSignal(0);

  onMount(async () => {
    const userId = user()?.id;
    if (!userId) return;

    try {
      const { getUserNotifications, getCreditBalance, getUserSubscription, getProjects } = await import('../../lib/db');
      const [notifs, balance, sub, projects] = await Promise.all([
        getUserNotifications(userId),
        getCreditBalance(userId),
        getUserSubscription(userId),
        getProjects(userId)
      ]);

      setNotifications(notifs.slice(0, 5).map(n => ({
        ...n,
        type: n.type === 'system' ? 'systemUpdate' : n.type === 'billing' ? 'billing' : n.type === 'credits' ? 'credits' : n.type === 'getting-started' ? 'gettingStarted' : n.type === 'subscription' ? 'subscription' : n.type === 'ai' ? 'aiFeature' : n.type === 'explore' ? 'explore' : n.type === 'help' ? 'help' : n.type === 'project' ? 'project' : 'newMessage',
        time: new Date(n.created_at)
      })));
      setCreditBalance(balance !== null ? balance : (user()?.credits?.balance || 50));
      setSubscription(sub ? { plan: sub.package_name || 'free' } : (user()?.subscription || { plan: 'free' }));
      setProjectsCount(Array.isArray(projects) ? projects.length : 0);
    } catch (error) {
      logger.warn('Failed to load navbar data:', error.message);
    }
  });

  let navbarRef;

  const filteredDropdown = () => {
    const notifs = notifications() || [];
    if (dropdownFilter() === 'unread') return notifs.filter(n => !n.read);
    return notifs;
  };

  const timeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const NavItem = (props) => (
    <div class="flex flex-col items-center group">
      <div
        class="nav-bar h-1 bg-primary w-4 rounded-md opacity-0 group-hover:opacity-100"
        classList={{ "opacity-100": location.pathname === props.href }}
      />
      <A
        href={props.href}
        class="text-sm text-base-content/70 hover:text-base-content leading-[2.7]"
        classList={{ "text-base-content": location.pathname === props.href }}
      >
        {props.label}
      </A>
    </div>
  );

  return (
    <div
      ref={navbarRef}
      class="navbar bg-base-100 border-b border-base-200 flex-shrink-0"
      dir={currentLang() === "ar" ? "rtl" : "ltr"}
    >
      <div class="navbar-start gap-2">
        <Show when={isAuthenticated()}>
          <label
            for="my-drawer-4"
            class="btn btn-square btn-ghost md:hidden p-1.5"
            aria-label="Open sidebar"
          >
            <img src="/src/assets/favicon.svg" alt="Menu" class="w-6 h-6" />
          </label>
        </Show>
        <div class="flex flex-col leading-tight hidden md:flex">
          <div class="flex items-center gap-2">
            <span class="font-medium text-lg md:text-xl text-base-content/80 tracking-tight">iGate Accelerator</span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xs md:text-sm text-base-content/60">AI-Powered Startup Builder</span>
            <span class="w-1 h-1 rounded-full bg-base-content/30"></span>
            <span class="badge badge-primary badge-xs md:badge-sm">v1.0</span>
          </div>
        </div>
        
        <div class="flex items-center gap-1.5 md:hidden">
          <span class="font-medium text-base text-base-content/80">iGate</span>
          <span class="text-sm text-base-content/60">Accelerator</span>
          <span class="badge badge-primary badge-xs">v1.0</span>
        </div>
      </div>

      <div class="navbar-end gap-3">
        <label class="swap">
          <input
            id="langSwap"
            type="checkbox"
            checked={currentLang() === 'ar'}
            onChange={(e) => {
              const newLang = e.target.checked ? 'ar' : 'en';
              if (navbarRef) {
                navbarRef.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
              }
              setLang(newLang);
              localStorage.setItem('lang', newLang);
            }}
          />
          <div class="swap-off text-sm font-semibold flex items-center gap-1">EN</div>
          <div class="swap-on text-sm font-semibold flex items-center gap-1">عربي</div>
        </label>

        <label class="swap swap-rotate">
          <input
            id="theme-controller"
            type="checkbox"
            class="theme-controller"
            value="dark"
            onChange={(e) => {
              const theme = e.target.checked ? 'dark' : 'light';
              document.documentElement.setAttribute('data-theme', theme);
              localStorage.setItem('theme', theme);
            }}
          />
          <i data-lucide="sun" class="swap-off h-5 w-5"></i>
          <i data-lucide="moon" class="swap-on h-5 w-5"></i>
        </label>

        <Show when={isAuthenticated()}>
          <div class="dropdown dropdown-end">
            <button class="btn btn-ghost btn-circle relative">
              <i data-lucide="bell" class="w-5 h-5"></i>
              <Show when={(notifications() || []).some(n => !n.read)}>
                <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-base-100">
                  {(notifications() || []).filter(n => !n.read).length}
                </span>
              </Show>
            </button>

            <div class="dropdown-content mt-3 z-50 w-72 max-w-[calc(100vw-1rem)] rounded-xl bg-base-100 shadow-xl border border-base-200 overflow-hidden">
              <div class="px-4 py-3 border-b border-base-200 text-xs font-semibold uppercase text-base-content">
                {t().notifications || 'Notifications'}
              </div>

              <div class="px-3 py-2 border-b border-base-200">
                <div class="tabs tabs-boxed tabs-xs">
                  <button
                    class={`tab ${dropdownFilter() === 'all' ? 'tab-active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setDropdownFilter('all'); }}
                  >
                    All
                  </button>
                  <button
                    class={`tab ${dropdownFilter() === 'unread' ? 'tab-active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setDropdownFilter('unread'); }}
                  >
                    Unread
                  </button>
                </div>
              </div>

              <div class="max-h-80 overflow-y-auto">
                <Show when={filteredDropdown().length > 0} fallback={
                  <div class="p-6 text-center text-base-content/50 flex flex-col items-center gap-2">
                    <i data-lucide="bell-off" class="w-8 h-8 opacity-40"></i>
                    {dropdownFilter() === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </div>
                }>
                  <For each={filteredDropdown()}>
                    {(notif) => (
                      <div
                        class={`px-4 py-3 flex gap-3 items-center cursor-pointer hover:bg-base-200 transition ${!notif.read ? 'bg-primary/5' : ''}`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!notif.read && notif.id) {
                            try {
                              const { markNotificationRead } = await import('../../lib/db');
                              await markNotificationRead(notif.id, user()?.id);
                              setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            } catch (error) {
                              logger.warn('Error marking notification:', error.message);
                            }
                          }
                        }}
                      >
                        <div class={`mt-1 p-2 rounded-full shrink-0 ${
                          notif.type === 'newMessage' || notif.type === 'message' ? 'bg-blue-500 text-white' :
                          notif.type === 'systemUpdate' || notif.type === 'system' ? 'bg-green-500 text-white' :
                          notif.type === 'billing' ? 'bg-purple-500 text-white' :
                          notif.type === 'credits' ? 'bg-yellow-500 text-black' :
                          notif.type === 'gettingStarted' ? 'bg-primary text-white' :
                          notif.type === 'subscription' ? 'bg-success text-white' :
                          notif.type === 'aiFeature' ? 'bg-accent text-white' :
                          notif.type === 'explore' ? 'bg-secondary text-white' :
                          notif.type === 'help' ? 'bg-info text-white' :
                          notif.type === 'project' ? 'bg-primary/80 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          <i data-lucide={
                            notif.type === 'newMessage' || notif.type === 'message' ? 'message-circle' :
                            notif.type === 'systemUpdate' || notif.type === 'system' ? 'settings' :
                            notif.type === 'billing' ? 'credit-card' :
                            notif.type === 'credits' ? 'coins' :
                            notif.type === 'gettingStarted' ? 'book-open' :
                            notif.type === 'subscription' ? 'star' :
                            notif.type === 'aiFeature' ? 'brain' :
                            notif.type === 'explore' ? 'compass' :
                            notif.type === 'help' ? 'help-circle' :
                            notif.type === 'project' ? 'folder' : 'bell'
                          } class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium truncate text-base-content">
                            {notif.type === 'newMessage' || notif.type === 'message' ? 'New Message' :
                             notif.type === 'systemUpdate' || notif.type === 'system' ? 'System Update' :
                             notif.type === 'billing' ? 'Billing Update' :
                             notif.type === 'credits' ? 'Credits Update' :
                             notif.type === 'gettingStarted' ? 'Getting Started' :
                             notif.type === 'subscription' ? 'Subscription' :
                             notif.type === 'aiFeature' ? 'AI Feature' :
                             notif.type === 'explore' ? 'Explore' :
                             notif.type === 'help' ? 'Help & Support' :
                             notif.type === 'project' ? 'Project' : 'Notification'}
                          </div>
                          <div class="text-xs text-base-content mt-1 break-words">{notif.text}</div>
                          <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-base-content/70">{timeAgo(notif.time)}</span>
                            {!notif.read && <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>

              <div class="p-3 border-t border-base-200 flex gap-2">
                <button
                  class="btn btn-sm btn-primary flex-1"
                  disabled={!(notifications() || []).some(n => !n.read)}
                  onClick={async (e) => {
                    e.stopPropagation();
                    const unread = (notifications() || []).filter(n => !n.read);
                    if (unread.length > 0) {
                      try {
                        const { markNotificationRead } = await import('../../lib/db');
                        await Promise.all(unread.map(n => markNotificationRead(n.id, user()?.id)));
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      } catch (error) {
                        logger.warn('Error marking all:', error.message);
                      }
                    }
                  }}
                >
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                  Mark all
                </button>
                <A href="/notifications" class="btn btn-sm btn-ghost flex-1">
                  <i data-lucide="eye" class="w-4 h-4"></i>
                  View all
                </A>
              </div>
            </div>
          </div>
        </Show>

        <Show when={isAuthenticated()} fallback={
          <div class="hidden lg:flex gap-2">
            <A href="/auth/login" class="btn btn-outline btn-sm">Login</A>
            <A href="/auth/signup" class="btn btn-primary btn-sm">Sign Up</A>
          </div>
        }>
          <div class="dropdown dropdown-bottom dropdown-end">
            <button class="btn btn-ghost btn-circle avatar relative p-0">
              <div class="w-9 rounded-full ring ring-primary/30 ring-offset-2 ring-offset-base-100">
                {user()?.avatar && user()?.avatar !== '/src/assets/avatar.png' ? (
                  <img src={user()?.avatar} alt="User avatar" class="w-full h-full object-cover" />
                ) : (
                  <div class="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                    <i data-lucide="user" class="w-5 h-5 text-primary"></i>
                  </div>
                )}
              </div>
              <div class="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-base-100 rounded-full shadow-sm"></div>
            </button>
            <div class="dropdown-content z-50 mt-2">
              <div class="card bg-base-100 shadow-xl border border-base-200 rounded-xl w-80 overflow-hidden">
                {/* User Info Header */}
                <div class="bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 p-4 border-b border-base-200">
                  <div class="flex items-center gap-3">
                    <div class="avatar relative">
                      <div class="w-14 rounded-full ring ring-primary/40 ring-offset-2 ring-offset-base-100 shadow-lg">
                        {user()?.avatar && user()?.avatar !== '/src/assets/avatar.png' ? (
                          <img src={user()?.avatar} alt="Avatar" class="w-full h-full object-cover" />
                        ) : (
                          <div class="w-full h-full bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                            <i data-lucide="user" class="w-7 h-7 text-white"></i>
                          </div>
                        )}
                      </div>
                      <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-3 border-base-100 rounded-full shadow"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-base-content text-lg truncate">
                        {user()?.profile?.name ?? 'User'}
                      </div>
                      <div class="text-sm text-base-content/70 truncate">
                        {user()?.profile?.email ?? 'user@example.com'}
                      </div>
                      <div class="flex items-center gap-2 mt-2">
                        <span class="badge badge-primary badge-sm gap-1">
                          <i data-lucide="zap" class="w-3 h-3"></i>
                          {subscription()?.plan ?? 'free'}
                        </span>
                        <span class="badge badge-outline badge-sm gap-1">
                          <i data-lucide="coins" class="w-3 h-3"></i>
                          {creditBalance() ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div class="grid grid-cols-2 gap-1 p-2 bg-base-200/30 border-b border-base-200">
                  <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base-200/50 transition-colors cursor-pointer" onclick={() => navigate('/credits')}>
                    <div class="p-1.5 rounded-md bg-warning/20">
                      <i data-lucide="coins" class="w-4 h-4 text-warning"></i>
                    </div>
                    <div>
                      <div class="text-xs text-base-content/60">Credits</div>
                      <div class="text-sm font-semibold">{creditBalance() ?? 0}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-base-200/50 transition-colors cursor-pointer" onclick={() => navigate('/projects')}>
                    <div class="p-1.5 rounded-md bg-primary/20">
                      <i data-lucide="folder" class="w-4 h-4 text-primary"></i>
                    </div>
                    <div>
                      <div class="text-xs text-base-content/60">Projects</div>
                      <div class="text-sm font-semibold">{projectsCount()}</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <ul class="menu w-full p-2 pb-3 gap-0.5">
                  <li>
                    <div class="text-xs uppercase font-bold text-base-content/50 tracking-wider px-3 py-2">Account</div>
                  </li>
                  <li>
                    <A href="/profile" class="flex items-center gap-3 rounded-lg transition-all">
                      <div class="p-2 rounded-lg bg-primary/10">
                        <i data-lucide="user" class="w-4 h-4 text-primary"></i>
                      </div>
                      <div>
                        <div class="font-medium">Profile</div>
                        <div class="text-xs text-base-content/60">Manage your account</div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 ml-auto text-base-content/30"></i>
                    </A>
                  </li>
                  <li>
                    <A href="/settings" class="flex items-center gap-3 rounded-lg transition-all">
                      <div class="p-2 rounded-lg bg-info/10">
                        <i data-lucide="settings" class="w-4 h-4 text-info"></i>
                      </div>
                      <div>
                        <div class="font-medium">Settings</div>
                        <div class="text-xs text-base-content/60">Preferences & privacy</div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 ml-auto text-base-content/30"></i>
                    </A>
                  </li>
                  <li>
                    <A href="/notifications" class="flex items-center gap-3 rounded-lg transition-all">
                      <div class="p-2 rounded-lg bg-secondary/10 relative">
                        <i data-lucide="bell" class="w-4 h-4 text-secondary"></i>
                        <span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
                      </div>
                      <div>
                        <div class="font-medium">Notifications</div>
                        <div class="text-xs text-base-content/60">Manage alerts</div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 ml-auto text-base-content/30"></i>
                    </A>
                  </li>
                  <li>
                    <div class="text-xs uppercase font-bold text-base-content/50 tracking-wider px-3 py-2 mt-2">Billing</div>
                  </li>
                  <li>
                    <A href="/packages" class="flex items-center gap-3 rounded-lg transition-all">
                      <div class="p-2 rounded-lg bg-accent/10">
                        <i data-lucide="crown" class="w-4 h-4 text-accent"></i>
                      </div>
                      <div>
                        <div class="font-medium">Packages</div>
                        <div class="text-xs text-base-content/60">Upgrade your plan</div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 ml-auto text-base-content/30"></i>
                    </A>
                  </li>
                  <li>
                    <A href="/credits" class="flex items-center gap-3 rounded-lg transition-all">
                      <div class="p-2 rounded-lg bg-warning/10">
                        <i data-lucide="credit-card" class="w-4 h-4 text-warning"></i>
                      </div>
                      <div>
                        <div class="font-medium">Credits</div>
                        <div class="text-xs text-base-content/60">Buy more credits</div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 ml-auto text-base-content/30"></i>
                    </A>
                  </li>
                  <li>
                    <A href="/billing" class="flex items-center gap-3 rounded-lg transition-all">
                      <div class="p-2 rounded-lg bg-success/10">
                        <i data-lucide="receipt" class="w-4 h-4 text-success"></i>
                      </div>
                      <div>
                        <div class="font-medium">Billing</div>
                        <div class="text-xs text-base-content/60">Payment history</div>
                      </div>
                      <i data-lucide="chevron-right" class="w-4 h-4 ml-auto text-base-content/30"></i>
                    </A>
                  </li>
                </ul>

                {/* Footer */}
                <div class="p-2 border-t border-base-200 bg-base-200/30">
                  <button
                    onClick={async () => { await logout(); navigate('/auth/login'); }}
                    class="btn btn-ghost btn-sm w-full justify-start gap-3 rounded-lg text-error hover:bg-error/10 transition-colors"
                  >
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                    <span class="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Navbar;
