import { A, useLocation, useNavigate } from '@solidjs/router';
import { createSignal, onMount, Show, For } from 'solid-js';
import { logger } from '@lib/core';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import { useLucideIcons } from '../hooks/useLucideIcons';
import { navbarTranslations } from '../assets/translations/translations-index.js';

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

  // Get navbar translations reactively
  const nt = () => {
    const langKey = currentLang() || 'ar';
    return navbarTranslations[langKey] || navbarTranslations.ar;
  };

  onMount(async () => {
    const userId = user()?.id;
    if (!userId) return;

    try {
      const {
        getUserNotifications,
        getCreditBalance,
        getUserSubscription,
        getProjects,
      } = await import('../lib/database');
      const [notifs, balance, sub, projects] = await Promise.all([
        getUserNotifications(userId),
        getCreditBalance(userId),
        getUserSubscription(userId),
        getProjects(userId),
      ]);

      setNotifications(
        notifs.slice(0, 5).map(n => ({
          ...n,
          type:
            n.type === 'system'
              ? 'systemUpdate'
              : n.type === 'billing'
                ? 'billing'
                : n.type === 'credits'
                  ? 'credits'
                  : n.type === 'getting-started'
                    ? 'gettingStarted'
                    : n.type === 'subscription'
                      ? 'subscription'
                      : n.type === 'ai'
                        ? 'aiFeature'
                        : n.type === 'explore'
                          ? 'explore'
                          : n.type === 'help'
                            ? 'help'
                            : n.type === 'project'
                              ? 'project'
                              : 'newMessage',
          time: new Date(n.created_at),
        }))
      );
      setCreditBalance(
        balance !== null ? balance : user()?.credits?.balance || 50
      );
      setSubscription(
        sub
          ? { plan: sub.package_name || 'free' }
          : user()?.subscription || { plan: 'free' }
      );
      setProjectsCount(Array.isArray(projects) ? projects.length : 0);
    } catch (error) {
      // Ignore errors
    }
  });

  let navbarRef;

  const filteredDropdown = () => {
    const notifs = notifications() || [];
    if (dropdownFilter() === 'unread') return notifs.filter(n => !n.read);
    return notifs;
  };

  const timeAgo = date => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return nt().justNow;
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const NavItem = props => (
    <div class="group flex flex-col items-center">
      <div
        class="nav-bar bg-primary h-1 w-4 rounded-md opacity-0 group-hover:opacity-100"
        classList={{ 'opacity-100': location.pathname === props.href }}
      />
      <A
        href={props.href}
        class="text-base-content/70 hover:text-base-content text-sm leading-[2.7]"
        classList={{ 'text-base-content': location.pathname === props.href }}
      >
        {props.label}
      </A>
    </div>
  );

  return (
    <div
      ref={navbarRef}
      class="bg-base-100 border-base-200 flex h-auto shrink-0 flex-col px-2 py-3 md:px-4"
      dir={currentLang() === 'ar' ? 'rtl' : 'ltr'}
    >
      <div class="flex items-center justify-end gap-1 md:gap-3">
        <label class="swap">
          <input
            id="langSwap"
            type="checkbox"
            checked={currentLang() === 'ar'}
            onChange={e => {
              const newLang = e.target.checked ? 'ar' : 'en';
              if (navbarRef) {
                navbarRef.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
              }
              setLang(newLang);
              localStorage.setItem('lang', newLang);
            }}
          />
          <div class="swap-off flex items-center gap-1 text-sm font-semibold">
            {nt().english}
          </div>
          <div class="swap-on flex items-center gap-1 text-sm font-semibold">
            {nt().arabic}
          </div>
        </label>

        <label class="swap swap-rotate">
          <input
            id="theme-controller"
            type="checkbox"
            class="theme-controller"
            value="dark"
            onChange={e => {
              const theme = e.target.checked ? 'dark' : 'light';
              import('../lib/theme').then(({ applyTheme }) => {
                applyTheme(theme);
              });
            }}
          />
          <i data-lucide="sun" class="swap-off h-5 w-5" />
          <i data-lucide="moon" class="swap-on h-5 w-5" />
        </label>

        <Show
          when={isAuthenticated()}
          fallback={
            <div class="flex gap-2">
              <A href="/auth/login" class="btn btn-outline btn-sm">
                {nt().login}
              </A>
              <A href="/auth/signup" class="btn btn-primary btn-sm">
                {nt().signUp}
              </A>
            </div>
          }
        >
          <div class="flex items-center gap-2">
            <div class="dropdown dropdown-bottom dropdown-end">
              <button class="btn btn-ghost btn-circle avatar relative p-0">
                <div class="ring-primary/30 ring-offset-base-100 w-9 rounded-full ring ring-offset-2">
                  {user()?.avatar ? (
                    <img
                      src={user()?.avatar}
                      alt="User avatar"
                      class="h-full w-full object-cover"
                    />
                  ) : (
                    <div class="from-primary/20 to-secondary/20 flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br">
                      <i data-lucide="user" class="text-primary h-5 w-5" />
                    </div>
                  )}
                </div>
                <div class="bg-success border-base-100 absolute end-0 bottom-0 h-3 w-3 rounded-full border-2 shadow-sm" />
              </button>
              <div class="dropdown-content z-[60]">
                <div class="card bg-base-100 border-base-200 max-h-[calc(100vh-2rem)] w-80 overflow-hidden overflow-y-auto rounded-xl border shadow-xl">
                  {/* User Info Header */}
                  <div class="from-primary/10 via-base-100 to-secondary/10 border-base-200 border-b bg-gradient-to-br p-4">
                    <div class="flex items-center gap-3">
                      <div class="avatar relative">
                        <div class="ring-primary/40 ring-offset-base-100 w-14 rounded-full shadow-lg ring ring-offset-2">
                          {user()?.avatar ? (
                            <img
                              src={user()?.avatar}
                              alt="Avatar"
                              class="h-full w-full object-cover"
                            />
                          ) : (
                            <div class="from-primary to-secondary flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br">
                              <i
                                data-lucide="user"
                                class="h-7 w-7 text-white"
                              />
                            </div>
                          )}
                        </div>
                        <div class="bg-success border-base-100 absolute -end-1 -bottom-1 h-5 w-5 rounded-full border-3 shadow" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-base-content truncate text-lg font-bold">
                          {user()?.profile?.name ?? 'User'}
                        </div>
                        <div class="text-base-content/70 truncate text-sm">
                          {user()?.profile?.email ?? 'user@example.com'}
                        </div>
                        <div class="mt-2 flex items-center gap-2">
                          <span class="badge badge-primary badge-sm gap-1">
                            <i data-lucide="zap" class="h-3 w-3" />
                            {subscription()?.plan ?? nt().freePlan}
                          </span>
                          <span class="badge badge-outline badge-sm gap-1">
                            <i data-lucide="coins" class="h-3 w-3" />
                            {creditBalance() ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div class="bg-base-200/30 border-base-200 grid grid-cols-2 gap-1 border-b p-2">
                    <div
                      class="hover:bg-base-200/50 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                      onClick={() => navigate('/credits')}
                    >
                      <div class="bg-warning/20 rounded-md p-1.5">
                        <i data-lucide="coins" class="text-warning h-4 w-4" />
                      </div>
                      <div>
                        <div class="text-base-content/60 text-xs">
                          {nt().credits}
                        </div>
                        <div class="text-sm font-semibold">
                          {creditBalance() ?? 0}
                        </div>
                      </div>
                    </div>
                    <div
                      class="hover:bg-base-200/50 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                      onClick={() => navigate('/projects')}
                    >
                      <div class="bg-primary/20 rounded-md p-1.5">
                        <i data-lucide="folder" class="text-primary h-4 w-4" />
                      </div>
                      <div>
                        <div class="text-base-content/60 text-xs">
                          {nt().projects}
                        </div>
                        <div class="text-sm font-semibold">
                          {projectsCount()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <ul class="menu w-full gap-0.5 p-2 pb-3">
                    <li>
                      <div class="text-base-content/50 px-3 py-2 text-xs font-bold tracking-wider uppercase">
                        {nt().account}
                      </div>
                    </li>
                    <li>
                      <A
                        href="/profile"
                        class="flex items-center gap-3 rounded-lg transition-all"
                      >
                        <div class="bg-primary/10 rounded-lg p-2">
                          <i data-lucide="user" class="text-primary h-4 w-4" />
                        </div>
                        <div>
                          <div class="font-medium">{nt().profile}</div>
                          <div class="text-base-content/60 text-xs">
                            {nt().profileDesc}
                          </div>
                        </div>
                        <i
                          data-lucide="chevron-right"
                          class="text-base-content/30 ms-auto h-4 w-4"
                        />
                      </A>
                    </li>
                    <li>
                      <A
                        href="/settings"
                        class="flex items-center gap-3 rounded-lg transition-all"
                      >
                        <div class="bg-info/10 rounded-lg p-2">
                          <i data-lucide="settings" class="text-info h-4 w-4" />
                        </div>
                        <div>
                          <div class="font-medium">{nt().settings}</div>
                          <div class="text-base-content/60 text-xs">
                            {nt().settingsDesc}
                          </div>
                        </div>
                        <i
                          data-lucide="chevron-right"
                          class="text-base-content/30 ms-auto h-4 w-4"
                        />
                      </A>
                    </li>
                    <li>
                      <A
                        href="/notifications"
                        class="flex items-center gap-3 rounded-lg transition-all"
                      >
                        <div class="bg-secondary/10 relative rounded-lg p-2">
                          <i
                            data-lucide="bell"
                            class="text-secondary h-4 w-4"
                          />
                          <span class="bg-error absolute -end-1 -top-1 h-2 w-2 rounded-full" />
                        </div>
                        <div>
                          <div class="font-medium">
                            {nt().notificationsLabel}
                          </div>
                          <div class="text-base-content/60 text-xs">
                            {nt().notificationsDesc}
                          </div>
                        </div>
                        <i
                          data-lucide="chevron-right"
                          class="text-base-content/30 ms-auto h-4 w-4"
                        />
                      </A>
                    </li>
                    <li>
                      <div class="text-base-content/50 mt-2 px-3 py-2 text-xs font-bold tracking-wider uppercase">
                        {nt().billing}
                      </div>
                    </li>
                    <li>
                      <A
                        href="/packages"
                        class="flex items-center gap-3 rounded-lg transition-all"
                      >
                        <div class="bg-accent/10 rounded-lg p-2">
                          <i data-lucide="crown" class="text-accent h-4 w-4" />
                        </div>
                        <div>
                          <div class="font-medium">{nt().packages}</div>
                          <div class="text-base-content/60 text-xs">
                            {nt().packagesDesc}
                          </div>
                        </div>
                        <i
                          data-lucide="chevron-right"
                          class="text-base-content/30 ms-auto h-4 w-4"
                        />
                      </A>
                    </li>
                    <li>
                      <A
                        href="/credits"
                        class="flex items-center gap-3 rounded-lg transition-all"
                      >
                        <div class="bg-warning/10 rounded-lg p-2">
                          <i
                            data-lucide="credit-card"
                            class="text-warning h-4 w-4"
                          />
                        </div>
                        <div>
                          <div class="font-medium">{nt().creditsLabel}</div>
                          <div class="text-base-content/60 text-xs">
                            {nt().creditsDesc}
                          </div>
                        </div>
                        <i
                          data-lucide="chevron-right"
                          class="text-base-content/30 ms-auto h-4 w-4"
                        />
                      </A>
                    </li>
                    <li>
                      <A
                        href="/billing"
                        class="flex items-center gap-3 rounded-lg transition-all"
                      >
                        <div class="bg-success/10 rounded-lg p-2">
                          <i
                            data-lucide="receipt"
                            class="text-success h-4 w-4"
                          />
                        </div>
                        <div>
                          <div class="font-medium">{nt().billingLabel}</div>
                          <div class="text-base-content/60 text-xs">
                            {nt().billingDesc}
                          </div>
                        </div>
                        <i
                          data-lucide="chevron-right"
                          class="text-base-content/30 ms-auto h-4 w-4"
                        />
                      </A>
                    </li>
                  </ul>

                  {/* Footer */}
                  <div class="border-base-200 bg-base-200/30 border-t p-2">
                    <button
                      onClick={async () => {
                        await logout();
                        navigate('/auth/login');
                      }}
                      class="btn btn-ghost btn-sm text-error hover:bg-error/10 w-full justify-start gap-3 rounded-lg transition-colors"
                    >
                      <i data-lucide="log-out" class="h-4 w-4" />
                      <span class="font-medium">{nt().signOut}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="dropdown dropdown-end">
              <button class="btn btn-ghost btn-circle relative">
                <i data-lucide="bell" class="h-5 w-5" />
                <Show when={(notifications() || []).some(n => !n.read)}>
                  <span class="bg-primary text-base-100 absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                    {(notifications() || []).filter(n => !n.read).length}
                  </span>
                </Show>
              </button>

              <div class="dropdown-content bg-base-100 border-base-200 z-[60] mt-3 w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border shadow-xl">
                <div class="border-base-200 text-base-content border-b px-4 py-3 text-xs font-semibold uppercase">
                  {nt().notifications}
                </div>

                <div class="border-base-200 border-b px-3 py-2">
                  <div class="tabs tabs-boxed tabs-xs">
                    <button
                      class={`tab ${dropdownFilter() === 'all' ? 'tab-active' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        setDropdownFilter('all');
                      }}
                    >
                      {nt().all}
                    </button>
                    <button
                      class={`tab ${dropdownFilter() === 'unread' ? 'tab-active' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        setDropdownFilter('unread');
                      }}
                    >
                      {nt().unread}
                    </button>
                  </div>
                </div>

                <div class="max-h-[calc(100vh-2rem)] overflow-y-auto">
                  <Show
                    when={filteredDropdown().length > 0}
                    fallback={
                      <div class="text-base-content/50 flex flex-col items-center gap-2 p-6 text-center">
                        <i data-lucide="bell-off" class="h-8 w-8 opacity-40" />
                        {dropdownFilter() === 'unread'
                          ? nt().noUnreadNotifications
                          : nt().noNotifications}
                      </div>
                    }
                  >
                    <For each={filteredDropdown()}>
                      {notif => (
                        <div
                          class={`hover:bg-base-200 flex cursor-pointer items-center gap-3 px-4 py-3 transition ${!notif.read ? 'bg-primary/5' : ''}`}
                          onClick={async e => {
                            e.stopPropagation();
                            if (!notif.read && notif.id) {
                              try {
                                const { markNotificationRead } =
                                  await import('../lib/database');
                                await markNotificationRead(
                                  notif.id,
                                  user()?.id
                                );
                                setNotifications(prev =>
                                  prev.map(n =>
                                    n.id === notif.id ? { ...n, read: true } : n
                                  )
                                );
                              } catch (error) {
                                logger.warn(
                                  'Error marking notification:',
                                  error.message
                                );
                              }
                            }
                          }}
                        >
                          <div
                            class={`mt-1 shrink-0 rounded-full p-2 ${
                              notif.type === 'newMessage' ||
                              notif.type === 'message'
                                ? 'bg-blue-500 text-white'
                                : notif.type === 'systemUpdate' ||
                                    notif.type === 'system'
                                  ? 'bg-green-500 text-white'
                                  : notif.type === 'billing'
                                    ? 'bg-purple-500 text-white'
                                    : notif.type === 'credits'
                                      ? 'bg-yellow-500 text-black'
                                      : notif.type === 'gettingStarted'
                                        ? 'bg-primary text-white'
                                        : notif.type === 'subscription'
                                          ? 'bg-success text-white'
                                          : notif.type === 'aiFeature'
                                            ? 'bg-accent text-white'
                                            : notif.type === 'explore'
                                              ? 'bg-secondary text-white'
                                              : notif.type === 'help'
                                                ? 'bg-info text-white'
                                                : notif.type === 'project'
                                                  ? 'bg-primary/80 text-white'
                                                  : 'bg-gray-500 text-white'
                            }`}
                          >
                            <i
                              data-lucide={
                                notif.type === 'newMessage' ||
                                notif.type === 'message'
                                  ? 'message-circle'
                                  : notif.type === 'systemUpdate' ||
                                      notif.type === 'system'
                                    ? 'settings'
                                    : notif.type === 'billing'
                                      ? 'credit-card'
                                      : notif.type === 'credits'
                                        ? 'coins'
                                        : notif.type === 'gettingStarted'
                                          ? 'book-open'
                                          : notif.type === 'subscription'
                                            ? 'star'
                                            : notif.type === 'aiFeature'
                                              ? 'brain'
                                              : notif.type === 'explore'
                                                ? 'compass'
                                                : notif.type === 'help'
                                                  ? 'help-circle'
                                                  : notif.type === 'project'
                                                    ? 'folder'
                                                    : 'bell'
                              }
                              class="h-4 w-4"
                            />
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="text-base-content truncate text-sm font-medium">
                              {notif.type === 'newMessage' ||
                              notif.type === 'message'
                                ? nt().newMessage
                                : notif.type === 'systemUpdate' ||
                                    notif.type === 'system'
                                  ? nt().systemUpdate
                                  : notif.type === 'billing'
                                    ? nt().billingUpdate
                                    : notif.type === 'credits'
                                      ? nt().creditsUpdate
                                      : notif.type === 'gettingStarted'
                                        ? nt().gettingStarted
                                        : notif.type === 'subscription'
                                          ? nt().subscription
                                          : notif.type === 'aiFeature'
                                            ? nt().aiFeature
                                            : notif.type === 'explore'
                                              ? nt().explore
                                              : notif.type === 'help'
                                                ? nt().helpSupport
                                                : notif.type === 'project'
                                                  ? nt().project
                                                  : nt().notification}
                            </div>
                            <div class="text-base-content mt-1 text-xs break-words">
                              {notif.text}
                            </div>
                            <div class="mt-1 flex items-center gap-2">
                              <span class="text-base-content/70 text-xs">
                                {timeAgo(notif.time)}
                              </span>
                              {!notif.read && (
                                <span class="bg-primary h-2 w-2 animate-pulse rounded-full" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </Show>
                </div>

                <div class="border-base-200 flex gap-2 border-t p-3">
                  <button
                    class="btn btn-sm btn-primary flex-1"
                    disabled={!(notifications() || []).some(n => !n.read)}
                    onClick={async e => {
                      e.stopPropagation();
                      const unread = (notifications() || []).filter(
                        n => !n.read
                      );
                      if (unread.length > 0) {
                        try {
                          const { markNotificationRead } =
                            await import('../lib/database');
                          await Promise.all(
                            unread.map(n =>
                              markNotificationRead(n.id, user()?.id)
                            )
                          );
                          setNotifications(prev =>
                            prev.map(n => ({ ...n, read: true }))
                          );
                        } catch (error) {
                          logger.warn('Error marking all:', error.message);
                        }
                      }
                    }}
                  >
                    <i data-lucide="check-circle" class="h-4 w-4" />
                    {nt().markAll}
                  </button>
                  <A href="/notifications" class="btn btn-sm btn-ghost flex-1">
                    <i data-lucide="eye" class="h-4 w-4" />
                    {nt().viewAll}
                  </A>
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
