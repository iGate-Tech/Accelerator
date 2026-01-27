// eslint-disable-next-line no-unused-vars
import {A, useNavigate} from "@solidjs/router";
// eslint-disable-next-line no-unused-vars
import {Show} from "solid-js";
import {useUser} from "../context/UserContext";
import {useLanguage} from "../hooks/useLanguage";

const Footer = ({isCollapsed, notifications}) => {
    const {user, logout, isAuthenticated} = useUser();
    const navigate = useNavigate();
    const {currentLang, t, setLang} = useLanguage();

    return (
        <div class="flex-shrink-0 border-t border-base-200">
            <ul class="menu w-full gap-1">
                <Show when={isAuthenticated()}>
                    <li>
                        <details class="w-full">
                            <summary classList={{
                                'flex items-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group w-full cursor-pointer list-none': true,
                                'justify-center': isCollapsed()
                            }}>
                                {/* Avatar */}
                                <div class="avatar relative flex-shrink-0">
                                    <div class="w-8 h-8 rounded-full bg-base-300 dark:bg-base-300">
                                        {user()?.avatar && !user()?.avatar.startsWith('/default') ? (
                                            <img src={user()?.avatar} alt="User avatar" class="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.style?.removeProperty('display'); }}/>
                                        ) : null}
                                        <div class={`w-full h-full flex items-center justify-center ${user()?.avatar && !user()?.avatar.startsWith('/default') ? 'hidden' : ''}`}>
                                            <i data-lucide="user" classList={{'w-5 h-5': !isCollapsed(), 'w-6 h-6': isCollapsed()}} class="text-base-content/60"></i>
                                        </div>
                                    </div>
                                    {/* Online indicator */}
                                    <div class="absolute bottom-0 end-0 w-2 h-2 bg-success border border-base-100 rounded-full"></div>
                                </div>
                                {/* Name + Chevron */}
                                <Show when={!isCollapsed()}>
                                    <span class="font-medium ms-3 flex-1 min-w-0 truncate">
                                        {user()?.profile?.name ?? 'User'}
                                    </span>
                                </Show>
                            </summary>
                            {/* Dropdown */}
                            <Show when={!isCollapsed()}>
                                <ul class="menu m-0 border border-0 w-full bg-base-100">
                                    <li>
                                        <A href="/profile" class="flex items-center gap-2">
                                            <i data-lucide="user" class="w-4 h-4 text-base-content/60"></i>
                                            {t().profile || 'Profile'}
                                        </A>
                                    </li>
                                    <li>
                                        <A href="/settings" class="flex items-center gap-2">
                                            <i data-lucide="settings" class="w-4 h-4 text-base-content/60"></i>
                                            {t().settings || 'Settings'}
                                        </A>
                                    </li>
                                    <li>
                                        <A href="/packages" class="flex items-center gap-2">
                                            <i data-lucide="crown" class="w-4 h-4 text-base-content/60"></i>
                                            {t().packages || 'Packages'}
                                        </A>
                                    </li>
                                    <li>
                                        <A href="/billing" class="flex items-center gap-2">
                                            <i data-lucide="credit-card" class="w-4 h-4 text-base-content/60"></i>
                                            {t().billingLabel || 'Billing'}
                                        </A>
                                    </li>
                                    <li>
                                        <A href="/credits" class="flex items-center gap-2">
                                            <i data-lucide="coins" class="w-4 h-4 text-base-content/60"></i>
                                            {t().creditsLabel || 'Credits'}
                                        </A>
                                    </li>
                                    <li>
                                        <button onClick={async () => { await logout(); navigate('/auth/login'); }} class="text-error hover:bg-error/10">
                                            <i data-lucide="log-out" class="w-4 h-4 text-error"></i>
                                            {t().signOut || 'Sign Out'}
                                        </button>
                                    </li>
                                </ul>
                            </Show>
                        </details>
                    </li>
                </Show>
                <Show when={!isCollapsed()}>
                    <li class="grid grid-cols-4 gap-1 w-full bg-base-200 rounded-lg">
                        <A href="/notifications" class="flex items-center justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group normal-case" aria-label="Notifications">
                            <i data-lucide="bell" class="w-5 h-5 text-base-content/40"></i>
                            <Show when={notifications().some(n => !n.read)}>
                                <span class="badge badge-error badge-xs absolute -top-1 -right-1">
                                    {notifications().filter(n => !n.read).length}
                                </span>
                            </Show>
                        </A>
                        <button class="flex items-center justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group normal-case"
                            onClick={() => {
                                import('../lib/theme').then(({ applyTheme }) => {
                                  const currentTheme = localStorage.getItem('theme') || 'light';
                                  const next = currentTheme === 'dark' || (currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'light' : 'dark';
                                  applyTheme(next);
                                });
                            }}
                            aria-label="Toggle theme">
                            <i data-lucide="sun-moon" class="w-5 h-5 text-base-content/40"></i>
                        </button>
                        <button class="flex items-center justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group normal-case"
                            onClick={() => {
                                const next = currentLang() === 'en' ? 'ar' : 'en';
                                setLang(next);
                                localStorage.setItem('lang', next);
                            }}
                            aria-label="Change language">
                            <i data-lucide="globe" class="w-5 h-5 text-base-content/40"></i>
                        </button>
                        <A href="/help" class="flex items-center justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group normal-case" aria-label="Get help and support">
                            <i data-lucide="help-circle" class="w-5 h-5 text-base-content/40"></i>
                        </A>
                    </li>
                </Show>
            </ul>
        </div>
    );
};

export default Footer;