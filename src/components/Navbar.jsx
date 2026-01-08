import { A, useLocation, useNavigate } from "@solidjs/router";
import { useContext, createSignal, onMount, createEffect } from "solid-js";
import { LangContext } from "../context/LangContext";
import { useUser } from "../context/UserContext";
import { translations } from "../assets/translations/translations-index.js";
import avatar from "../assets/avatar.png";

const Navbar = () => {
  const { lang, setLang, serverReachable } = useContext(LangContext);
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
   const [currentLang, setCurrentLang] = createSignal(lang());

   const t = () => translations[currentLang()];

    const [dropdownFilter, setDropdownFilter] = createSignal('all');

    const [notifications, setNotifications] = createSignal([
      { type: 'newMessage', text: t().newMessageText, read: false, time: new Date(Date.now() - 5 * 60 * 1000) }, // 5 min ago
      { type: 'systemUpdate', text: t().systemUpdateText, read: false, time: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2 hours ago
      { type: 'reminder', text: t().reminderText, read: false, time: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 1 day ago
    ]);

    const filteredDropdown = () => {
      if (dropdownFilter() === 'unread') return notifications().filter(n => !n.read);
      return notifications();
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

  createEffect(() => {
    setCurrentLang(lang());
  });

  createEffect(() => {
    notifications();
    dropdownFilter();
    if (window.lucide) window.lucide.createIcons();
  });

  onMount(() => {
    // Create Lucide icons
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class={`navbar bg-base-100 border-b border-base-200 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      <div class="navbar-start">
        <A href="/" class="mr-6 ml-2" >
          <svg width="24" height="26" viewBox="0 0 33 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8">
            <path d="M31.6035 7.28044C31.1951 7.03803 30.7235 7.06833 30.3421 7.35872L26.4519 10.3182C25.9036 10.7348 25.5764 11.4317 25.5764 12.1868V21.1636C25.5764 24.2695 23.7757 26.9638 21.1966 27.7138L6.895 31.8726V14.5099C6.895 11.7171 8.5129 9.29549 10.8326 8.62128L31.4004 2.64179C31.9126 2.4928 32.2714 1.9701 32.2714 1.37165C32.2714 1.01561 32.1405 0.672189 31.9149 0.424727C31.687 0.177265 31.3823 0.0510083 31.0777 0.0611088L27.8352 0.177265C26.7972 0.215142 25.7615 0.3818 24.7551 0.674714L7.27635 5.75527C3.11314 6.9648 0.206787 11.2853 0.206787 16.2598V32.8423C0.206787 33.7033 0.716752 34.4508 1.44785 34.6629L5.68553 35.8876C5.8164 35.9255 5.95405 35.9457 6.09169 35.9457C6.22934 35.9457 6.36698 35.9255 6.49786 35.8876L24.8792 30.5444C29.2342 29.2793 32.2759 24.7594 32.2759 19.5526V8.52785C32.2759 8.00263 32.0209 7.52538 31.6103 7.28297L31.6035 7.28044Z" fill="rgb(158, 40, 181)"/>
          </svg>
        </A>
        <div class="hidden lg:flex items-center gap-4">
            <div class="flex flex-col items-center justify-center group">
              <div class="nav-bar h-1 bg-primary w-4 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" classList={{ 'opacity-100': location.pathname === '/' }}></div>
               <A href="/" class="nav-link text-base-content/70 hover:text-base-content text-sm leading-[2.7]" classList={{ 'text-base-content': location.pathname === '/' }}>
                 <span class="nav-text">{t().home}</span>
               </A>
            </div>
            <div class="flex flex-col items-center justify-center group">
              <div class="nav-bar h-1 bg-primary w-4 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" classList={{ 'opacity-100': location.pathname === '/dashboard' }}></div>
               <A href="/dashboard" class="nav-link text-base-content/70 hover:text-base-content text-sm leading-[2.7]" classList={{ 'text-base-content': location.pathname === '/dashboard' }}>
                 <span class="nav-text">{t().dashboard}</span>
               </A>
            </div>
            <div class="flex flex-col items-center justify-center group">
              <div class="nav-bar h-1 bg-primary w-4 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" classList={{ 'opacity-100': location.pathname === '/explore' }}></div>
               <A href="/explore" class="nav-link text-base-content/70 hover:text-base-content text-sm leading-[2.7]" classList={{ 'text-base-content': location.pathname === '/explore' }}>
                 <span class="nav-text">{t().explore}</span>
               </A>
            </div>
            <div class="flex flex-col items-center justify-center group">
              <div class="nav-bar h-1 bg-primary w-4 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" classList={{ 'opacity-100': location.pathname === '/portfolio' }}></div>
               <A href="/portfolio" class="nav-link text-base-content/70 hover:text-base-content text-sm leading-[2.7]" classList={{ 'text-base-content': location.pathname === '/portfolio' }}>
                 <span class="nav-text">{t().portfolio}</span>
               </A>
            </div>
            <div class="flex flex-col items-center justify-center group">
              <div class="nav-bar h-1 bg-primary w-4 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" classList={{ 'opacity-100': location.pathname === '/help' }}></div>
               <A href="/help" class="nav-link text-base-content/70 hover:text-base-content text-sm leading-[2.7]" classList={{ 'text-base-content': location.pathname === '/help' }}>
                 <span class="nav-text">{t().help}</span>
               </A>
            </div>

        </div>
      </div>

      <div class="navbar-center">
      </div>
      <div class="navbar-end gap-4">
        <div class={`dropdown ${currentLang() === 'ar' ? 'dropdown-right' : 'dropdown-left'} lg:hidden`}>
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <i data-lucide="menu" class="w-5 h-5"></i>
          </div>
            <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-lg w-52 border border-base-200">
              <li classList={{ active: location.pathname === '/' }}><A href="/" class="flex items-center gap-2"><i data-lucide="home" class="w-4 h-4"></i>{t().home}</A></li>
              <li classList={{ active: location.pathname === '/dashboard' }}><A href="/dashboard" class="flex items-center gap-2"><i data-lucide="bar-chart" class="w-4 h-4"></i>{t().dashboard}</A></li>
              <li classList={{ active: location.pathname === '/explore' }}><A href="/explore" class="flex items-center gap-2"><i data-lucide="search" class="w-4 h-4"></i>{t().explore}</A></li>
              <li classList={{ active: location.pathname === '/portfolio' }}><A href="/portfolio" class="flex items-center gap-2"><i data-lucide="briefcase" class="w-4 h-4"></i>{t().portfolio}</A></li>
              <li classList={{ active: location.pathname === '/help' }}><A href="/help" class="flex items-center gap-2"><i data-lucide="help-circle" class="w-4 h-4"></i>{t().help}</A></li>
            </ul>
        </div>
        <div class="divider divider-vertical"></div>
        <i data-lucide="dot" class={`w-12 h-12 ${serverReachable() ? 'text-success' : 'text-error'}`}></i>
        <label class="swap">
          <input id="langSwap" type="checkbox" checked={lang() === 'ar'} onChange={(e) => {
            const newLang = e.target.checked ? 'ar' : 'en';
            setLang(newLang);
            localStorage.setItem('lang', newLang);
          }} />
          <div class="swap-off text-sm font-semibold flex items-center gap-1">
            EN <i data-lucide="languages" class="w-5 h-5"></i>
          </div>
          <div class="swap-on text-sm font-semibold flex items-center gap-1">
            عربي <i data-lucide="languages" class="w-5 h-5"></i>
          </div>
         </label>
     
        <label class="swap swap-rotate">
          <input id="theme-controller" type="checkbox" class="theme-controller" value="dark" onChange={(e) => {
            const theme = e.target.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
          }} />
           <i data-lucide="sun" class="swap-off h-5 w-5"></i>
           <i data-lucide="moon" class="swap-on h-5 w-5"></i>
        </label>

         <div class={`dropdown ${currentLang() === 'ar' ? 'dropdown-right' : 'dropdown-left'}`}>
           <div tabindex="0" role="button" class="btn btn-ghost btn-circle relative">
             <i data-lucide="bell" class="w-5 h-5"></i>
              {notifications().filter(n => !n.read).length > 0 && (
                <span class="badge badge-primary absolute -top-1 -right-1 w-5 h-5 text-xs animate-ping">{notifications().filter(n => !n.read).length}</span>
              )}
           </div>
            <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-10 p-0 shadow-lg bg-base-100 rounded-lg w-64 max-h-96 overflow-y-auto overflow-x-hidden border border-base-200 transition-all duration-200">
              <li class="p-4 pb-2 text-xs uppercase font-semibold text-base-content/60 border-b border-base-200">{t().notifications}</li>
              <li class="px-4 py-2">
                <div class="tabs tabs-boxed">
                  <a class={`tab tab-xs ${dropdownFilter() === 'all' ? 'tab-active' : ''}`} onClick={() => setDropdownFilter('all')}>All</a>
                  <a class={`tab tab-xs ${dropdownFilter() === 'unread' ? 'tab-active' : ''}`} onClick={() => setDropdownFilter('unread')}>Unread</a>
                </div>
              </li>

              {filteredDropdown().length === 0 ? (
                <li class="p-4 text-center text-base-content/50 flex flex-col items-center gap-2">
                  <i data-lucide="bell-off" class="w-8 h-8 text-base-content/30"></i>
                  {dropdownFilter() === 'unread' ? 'No unread notifications' : 'No notifications'}
                </li>
              ) : (
                filteredDropdown().map((notif, index) => (
                  <li key={index} class={`p-3 hover:bg-base-200 dark:hover:bg-base-700 cursor-pointer transition-all duration-200 ${!notif.read ? 'bg-primary/5 border-l-4 border-primary animate-pulse' : ''}`} onClick={() => setNotifications(notifications().map((n, i) => i === index ? {...n, read: true} : n))}>
                    <div class="flex items-start gap-3">
                      <div class={`p-1 rounded-full ${notif.type === 'newMessage' ? 'bg-info text-info-content' : notif.type === 'systemUpdate' ? 'bg-success text-success-content' : 'bg-warning text-warning-content'}`}>
                        <i data-lucide={notif.type === 'newMessage' ? 'message-circle' : notif.type === 'systemUpdate' ? 'settings' : 'clock'} class="w-4 h-4"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-base-content">{notif.type === 'newMessage' ? t().newMessage : notif.type === 'systemUpdate' ? t().systemUpdate : t().reminder}</div>
                        <div class="text-xs text-base-content/70 mt-1 break-words">{notif.text}</div>
                        <div class="text-xs text-base-content/60 mt-1">{timeAgo(notif.time)}</div>
                        {!notif.read && <div class="w-2 h-2 bg-primary rounded-full mt-1"></div>}
                      </div>
                    </div>
                  </li>
                ))
              )}
              <li class="p-3 border-t border-base-200">
                <div class="flex gap-2">
                  <button class="btn btn-sm btn-primary flex-1" onClick={() => setNotifications(notifications().map(n => ({...n, read: true})))}>
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                    Mark all
                  </button>
                  <A href="/notifications" class="btn btn-sm btn-ghost flex-1">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                    View all
                  </A>
                </div>
              </li>
            </ul>
          </div>

          <div class={`dropdown dropdown-top ${currentLang() === 'ar' ? 'dropdown-right' : 'dropdown-left'}`}>
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
              <div class="w-8 rounded-full">
                <img src={avatar} alt="User avatar" />
              </div>
            </div>
             <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-0 shadow-lg bg-base-100 rounded-lg w-64 border border-base-200 transition-all duration-200">
               <li class="p-4 pb-2 text-xs uppercase font-semibold text-base-content/60 border-b border-base-200 flex items-center gap-2"><i data-lucide="user" class="w-4 h-4"></i>User Account</li>
              <li class="p-4 border-b border-base-200">
                <div class="flex items-center gap-3">
                  <div class="avatar">
                    <div class="w-10 rounded-full">
                      <img src={avatar} alt="Avatar" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-base-content">{user()?.name}</div>
                    <div class="text-sm text-base-content/60">{user()?.email}</div>
                  </div>
                </div>
              </li>
              <li><A href="/settings" class="flex items-center gap-2"><i data-lucide="settings" class="w-4 h-4"></i> Settings</A></li>
              <li><A href="/packages" class="flex items-center gap-2"><i data-lucide="package" class="w-4 h-4"></i> Packages</A></li>
              <li><A href="/credits" class="flex items-center gap-2"><i data-lucide="credit-card" class="w-4 h-4"></i> Credits</A></li>
               <li><A href="/billing" class="flex items-center gap-2"><i data-lucide="receipt" class="w-4 h-4"></i> Billing</A></li>
               <li><A href="/notifications" class="flex items-center gap-2"><i data-lucide="bell" class="w-4 h-4"></i> Notifications</A></li>
                <li class="hover:bg-error/10 hover:text-error transition-colors duration-200"><button onClick={logout} class="flex items-center gap-2 w-full text-left"><i data-lucide="log-out" class="w-4 h-4"></i> Logout</button></li>
            </ul>
          </div>

       </div>
     </div>
   );
 };

export default Navbar;