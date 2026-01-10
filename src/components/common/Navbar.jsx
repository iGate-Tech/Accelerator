import { A, useLocation } from "@solidjs/router";
import {
  createSignal,
  createResource,
  Show,
  For,
} from "solid-js";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { useLucideIcons } from "../../hooks/useLucideIcons";
import { getUserNotifications, markNotificationRead } from "../../lib/db";
import avatar from "../../assets/avatar.png";

const Navbar = () => {
  const userContext = useUser() ?? {};
  const { currentLang, t, setLang } = useLanguage();
  useLucideIcons();

  const serverReachable = (() => true); // Default if not from context
  const isAuthenticated = userContext.isAuthenticated ?? (() => false);
  const user = userContext.user ?? (() => null);
  const logout = userContext.logout ?? (() => {});

  const location = useLocation();
  const [dropdownFilter, setDropdownFilter] = createSignal('all');

  // Fetch real notifications from database
  const [notifications, { refetch: refetchNotifications }] = createResource(
    () => user()?.id,
    async (userId) => {
      if (!userId) return [];
      try {
        const userNotifications = await getUserNotifications(userId);
        // Transform database notifications to match the expected format
        return userNotifications.slice(0, 5).map(notification => ({
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

  let navbarRef;

  const filteredDropdown = () => {
    const notifs = notifications() || [];
    if (dropdownFilter() === 'unread') return notifs.filter(n => !n.read);
    return notifs;
  };

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
      class="navbar bg-base-100 border-b border-base-200"
      dir={currentLang() === "ar" ? "rtl" : "ltr"}
    >
      {/* LEFT */}
      <div class="navbar-start">
        <A href="/" class="ml-2 mr-4">
          <svg width="32" height="32" viewBox="0 0 33 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8">
            <path d="M31.6035 7.28044C31.1951 7.03803 30.7235 7.06833 30.3421 7.35872L26.4519 10.3182C25.9036 10.7348 25.5764 11.4317 25.5764 12.1868V21.1636C25.5764 24.2695 23.7757 26.9638 21.1966 27.7138L6.895 31.8726V14.5099C6.895 11.7171 8.5129 9.29549 10.8326 8.62128L31.4004 2.64179C31.9126 2.4928 32.2714 1.9701 32.2714 1.37165C32.2714 1.01561 32.1405 0.672189 31.9149 0.424727C31.687 0.177265 31.3823 0.0510083 31.0777 0.0611088L27.8352 0.177265C26.7972 0.215142 25.7615 0.3818 24.7551 0.674714L7.27635 5.75527C3.11314 6.9648 0.206787 11.2853 0.206787 16.2598V32.8423C0.206787 33.7033 0.716752 34.4508 1.44785 34.6629L5.68553 35.8876C5.8164 35.9255 5.95405 35.9457 6.09169 35.9457C6.22934 35.9457 6.36698 35.9255 6.49786 35.8876L24.8792 30.5444C29.2342 29.2793 32.2759 24.7594 32.2759 19.5526V8.52785C32.2759 8.00263 32.0209 7.52538 31.6103 7.28297L31.6035 7.28044Z" fill="rgb(158, 40, 181)"/>
          </svg>
        </A>

        <Show when={isAuthenticated()}>
          <div class="hidden lg:flex gap-6">
            <NavItem href="/" label={t().home} />
            <NavItem href="/dashboard" label={t().dashboard} />
            <NavItem href="/explore" label={t().explore} />
            <NavItem href="/portfolio" label={t().portfolio} />
            <NavItem href="/help" label={t().help} />
          </div>
        </Show>
      </div>



      {/* RIGHT */}
      <div class="navbar-end gap-3">
        {/* MOBILE MENU */}
        <div class="dropdown dropdown-end lg:hidden">
          <button class="btn btn-ghost btn-circle">
            <i data-lucide="menu" class="w-5 h-5" />
          </button>

          <ul class="menu dropdown-content mt-3 p-2 shadow bg-base-100 rounded w-52">
            <Show when={isAuthenticated()} fallback={
              <>
                <li><A href="/login" class="flex items-center gap-2"><i data-lucide="log-in" class="w-4 h-4"></i>Login</A></li>
                <li><A href="/signup" class="flex items-center gap-2"><i data-lucide="user-plus" class="w-4 h-4"></i>Sign Up</A></li>
              </>
            }>
              <li><A href="/" class="flex items-center gap-2"><i data-lucide="home" class="w-4 h-4"></i>Home</A></li>
              <li><A href="/dashboard" class="flex items-center gap-2"><i data-lucide="bar-chart" class="w-4 h-4"></i>Dashboard</A></li>
              <li><A href="/explore" class="flex items-center gap-2"><i data-lucide="search" class="w-4 h-4"></i>Explore</A></li>
              <li><A href="/portfolio" class="flex items-center gap-2"><i data-lucide="briefcase" class="w-4 h-4"></i>Portfolio</A></li>
              <li><A href="/help" class="flex items-center gap-2"><i data-lucide="help-circle" class="w-4 h-4"></i>Help</A></li>
            </Show>
          </ul>
        </div>

        {/* SERVER STATUS - Desktop */}
        <Show when={isAuthenticated()}>
          <div class="hidden lg:flex">
            <i data-lucide="dot" class={`w-12 h-12 ${serverReachable() ? 'text-success' : 'text-error'}`}></i>
          </div>
        </Show>

        {/* LANGUAGE SWITCHER */}
        <label class="swap">
           <input
             id="langSwap"
             type="checkbox"
              checked={currentLang() === 'ar'}
             onChange={(e) => {
               const newLang = e.target.checked ? 'ar' : 'en';
               // Update DOM directly to avoid reconciliation issues
               if (navbarRef) {
                 navbarRef.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
               }
               setLang(newLang);
               localStorage.setItem('lang', newLang);
             }}
          />
          <div class="swap-off text-sm font-semibold flex items-center gap-1">
            EN <i data-lucide="languages" class="w-5 h-5"></i>
          </div>
          <div class="swap-on text-sm font-semibold flex items-center gap-1">
            عربي <i data-lucide="languages" class="w-5 h-5"></i>
          </div>
        </label>

        {/* THEME SWITCHER */}
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

        {/* NOTIFICATIONS - Only for authenticated users */}
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
    
    {/* Header */}
    <div class="px-4 py-3 border-b border-base-200 text-xs font-semibold uppercase text-base-content/60">
      {t().notifications || 'Notifications'}
    </div>

    {/* Tabs */}
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

    {/* Notifications List */}
    <div class="max-h-80 overflow-y-auto">
      <Show
        when={filteredDropdown().length > 0}
        fallback={
           <div class="p-6 text-center text-base-content/50 flex flex-col items-center gap-2">
             <i data-lucide="bell-off" class="w-8 h-8 opacity-40"></i>
             {dropdownFilter() === 'unread'
               ? 'No unread notifications'
               : 'No notifications'}
           </div>
        }
      >
        <For each={filteredDropdown()}>
          {(notif, index) => (
              <div
                class={`px-4 py-3 flex gap-3 items-center cursor-pointer hover:bg-base-200 transition ${
                  !notif.read ? 'bg-primary/5' : ''
                }`}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!notif.read && notif.id) {
                    try {
                      await markNotificationRead(notif.id, user()?.id);
                      refetchNotifications();
                    } catch (error) {
                      console.error('Error marking notification as read:', error);
                    }
                  }
                }}
              >
                {/* Icon */}
                <div class={`mt-1 p-2 rounded-full shrink-0 ${
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
                    class="w-4 h-4"
                  ></i>
                </div>

               {/* Content */}
               <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate text-base-content">
                    {notif.type === 'newMessage' || notif.type === 'message'
                      ? 'New Message'
                      : notif.type === 'systemUpdate' || notif.type === 'system' || notif.type === 'update'
                      ? 'System Update'
                      : notif.type === 'billing'
                      ? 'Billing Update'
                      : notif.type === 'credits'
                      ? 'Credit Update'
                      : 'Notification'}
                  </div>

                 <div class="text-xs text-base-content/70 mt-1 break-words">
                   {notif.text}
                 </div>

                 <div class="flex items-center gap-2 mt-1">
                   <span class="text-xs text-base-content/50">
                     {timeAgo(notif.time)}
                   </span>

                   {!notif.read && (
                     <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                   )}
                 </div>
               </div>
            </div>
          )}
        </For>
      </Show>
    </div>

    {/* Footer */}
    <div class="p-3 border-t border-base-200 flex gap-2">
        <button
          class="btn btn-sm btn-primary flex-1"
          disabled={!(notifications() || []).some(n => !n.read)}
          onClick={async (e) => {
            e.stopPropagation();
            const unreadNotifications = (notifications() || []).filter(n => !n.read);
            if (unreadNotifications.length > 0) {
              try {
                // Mark all unread notifications as read
                await Promise.all(
                  unreadNotifications.map(notif =>
                    markNotificationRead(notif.id, user()?.id)
                  )
                );
                refetchNotifications();
              } catch (error) {
                console.error('Error marking all notifications as read:', error);
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

        {/* AUTH */}
        <Show
          when={isAuthenticated()}
          fallback={
            <div class="hidden lg:flex gap-2">
              <A href="/login" class="btn btn-outline btn-sm">Login</A>
              <A href="/signup" class="btn btn-primary btn-sm">Sign Up</A>
            </div>
          }
        >
          <div class="dropdown dropdown-bottom dropdown-end">
            <button class="btn btn-ghost btn-circle avatar relative">
              <div class="w-8 rounded-full">
                <img src={user()?.profile?.avatar ?? avatar} alt="User avatar" />
              </div>
              <div class="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-base-100 rounded-full"></div>
            </button>

            <ul class="menu dropdown-content mt-3 z-50 p-0 shadow-xl bg-base-100 rounded-xl w-72 max-w-[calc(100vw-1rem)] border border-base-200">
              <li class="p-5 border-b border-base-200 bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
                <div class="flex items-center gap-4">
                  <div class="avatar relative">
                    <div class="w-14 rounded-full ring ring-primary/20">
                      <img src={user()?.profile?.avatar ?? avatar} alt="Avatar" />
                    </div>
                    <div class="absolute bottom-0 right-0 w-4 h-4 bg-success border-2 border-base-100 rounded-full"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-bold text-base-content text-lg">
                      {user()?.profile?.name ?? 'John Doe'}
                    </div>
                    <div class="text-sm text-base-content/70">
                      {user()?.profile?.email ?? 'john.doe@example.com'}
                    </div>
                    <div class="text-xs text-base-content/80 mt-1">
                      Package: {user()?.subscription?.plan ?? 'Pro'}
                    </div>
                    <div class="text-xs text-base-content/80 mt-1">
                      Credits: {user()?.credits?.balance ?? 150}
                    </div>
                    <div class="flex items-center gap-1 mt-1">
                      <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      <span class="text-xs text-success font-medium">Online</span>
                    </div>
                  </div>
                </div>
              </li>

              <li class="px-4 py-2">
                <div class="text-xs uppercase font-bold text-base-content/60 tracking-wider">
                  Account Management
                </div>
              </li>
              <li><A href="/profile" class="flex items-center gap-3 px-4 py-3 hover:bg-base-200/50 rounded-lg mx-2 my-1 transition-colors"><i data-lucide="user" class="w-5 h-5 text-base-content/70"></i> <span class="font-medium">Profile</span></A></li>
              <li><A href="/settings" class="flex items-center gap-3 px-4 py-3 hover:bg-base-200/50 rounded-lg mx-2 my-1 transition-colors"><i data-lucide="settings" class="w-5 h-5 text-base-content/70"></i> <span class="font-medium">Settings</span></A></li>
              <li><A href="/notifications" class="flex items-center gap-3 px-4 py-3 hover:bg-base-200/50 rounded-lg mx-2 my-1 transition-colors"><i data-lucide="bell" class="w-5 h-5 text-base-content/70"></i> <span class="font-medium">Notifications</span></A></li>

              <li class="px-4 py-2">
                <div class="text-xs uppercase font-bold text-base-content/60 tracking-wider">
                  Billing & Subscription
                </div>
              </li>
              <li><A href="/packages" class="flex items-center gap-3 px-4 py-3 hover:bg-base-200/50 rounded-lg mx-2 my-1 transition-colors"><i data-lucide="package" class="w-5 h-5 text-base-content/70"></i> <span class="font-medium">Packages</span></A></li>
              <li><A href="/credits" class="flex items-center gap-3 px-4 py-3 hover:bg-base-200/50 rounded-lg mx-2 my-1 transition-colors"><i data-lucide="credit-card" class="w-5 h-5 text-base-content/70"></i> <span class="font-medium">Credits</span></A></li>
              <li><A href="/billing" class="flex items-center gap-3 px-4 py-3 hover:bg-base-200/50 rounded-lg mx-2 my-1 transition-colors"><i data-lucide="receipt" class="w-5 h-5 text-base-content/70"></i> <span class="font-medium">Billing</span></A></li>

              <li class="border-t border-base-200 my-1"></li>
              <li class="hover:bg-error/10 hover:text-error transition-colors duration-200 rounded-lg mx-2 my-1">
                <button onClick={logout} class="flex items-center gap-3 w-full text-left px-4 py-3 font-medium">
                  <i data-lucide="log-out" class="w-5 h-5"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Navbar;
