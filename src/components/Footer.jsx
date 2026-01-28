import { A, useNavigate } from '@solidjs/router';

import { Show } from 'solid-js';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import { openSettingsModal } from './SettingsModal';

const Footer = props => {
  const { user, logout, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const { currentLang, t, setLang } = useLanguage();

  return (
    <div class="border-base-200 flex-shrink-0 border-t">
      <ul class="menu w-full gap-1">
        <Show when={isAuthenticated()}>
          <li>
            <details class="w-full">
              <summary
                classList={{
                  'flex items-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group w-full cursor-pointer list-none': true,
                  'justify-center': props.isCollapsed(),
                }}
              >
                {/* Avatar */}
                <div class="avatar relative flex-shrink-0">
                  <div class="bg-base-300 dark:bg-base-300 h-8 w-8 rounded-full">
                    {user()?.avatar &&
                    !user()?.avatar.startsWith('/default') ? (
                      <img
                        src={user()?.avatar}
                        alt="User avatar"
                        class="h-full w-full rounded-full object-cover"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling?.style?.removeProperty(
                            'display'
                          );
                        }}
                      />
                    ) : null}
                    <div
                      class={`flex h-full w-full items-center justify-center ${user()?.avatar && !user()?.avatar.startsWith('/default') ? 'hidden' : ''}`}
                    >
                      <i
                        data-lucide="user"
                        classList={{
                          'w-5 h-5': !props.isCollapsed(),
                          'w-6 h-6': props.isCollapsed(),
                        }}
                        class="text-base-content/60"
                      />
                    </div>
                  </div>
                  {/* Online indicator */}
                  <div class="bg-success border-base-100 absolute end-0 bottom-0 h-2 w-2 rounded-full border" />
                </div>
                {/* Name + Chevron */}
                <Show when={!props.isCollapsed()}>
                  <span class="ms-3 min-w-0 flex-1 truncate font-medium">
                    {user()?.profile?.name ?? 'User'}
                  </span>
                </Show>
              </summary>
              {/* Dropdown */}
              <Show when={!props.isCollapsed()}>
                <ul class="menu bg-base-100 m-0 w-full border border-0">
                  <li>
                    <A href="/profile" class="flex items-center gap-2">
                      <i
                        data-lucide="user"
                        class="text-base-content/60 h-4 w-4"
                      />
                      {t().profile || 'Profile'}
                    </A>
                  </li>
                  <li>
                    <button
                      onClick={openSettingsModal}
                      class="flex items-center gap-2"
                    >
                      <i
                        data-lucide="settings"
                        class="text-base-content/60 h-4 w-4"
                      />
                      {t().settings || 'Settings'}
                    </button>
                  </li>
                  <li>
                    <A href="/packages" class="flex items-center gap-2">
                      <i
                        data-lucide="crown"
                        class="text-base-content/60 h-4 w-4"
                      />
                      {t().packages || 'Packages'}
                    </A>
                  </li>
                  <li>
                    <A href="/billing" class="flex items-center gap-2">
                      <i
                        data-lucide="credit-card"
                        class="text-base-content/60 h-4 w-4"
                      />
                      {t().billingLabel || 'Billing'}
                    </A>
                  </li>
                  <li>
                    <A href="/credits" class="flex items-center gap-2">
                      <i
                        data-lucide="coins"
                        class="text-base-content/60 h-4 w-4"
                      />
                      {t().creditsLabel || 'Credits'}
                    </A>
                  </li>
                  <li>
                    <button
                      onClick={async () => {
                        await logout();
                        navigate('/auth/login');
                      }}
                      class="text-error hover:bg-error/10"
                    >
                      <i data-lucide="log-out" class="text-error h-4 w-4" />
                      {t().signOut || 'Sign Out'}
                    </button>
                  </li>
                </ul>
              </Show>
            </details>
          </li>
        </Show>
        <Show when={!props.isCollapsed()}>
          <li class="bg-base-200 grid w-full grid-cols-4 gap-1 rounded-lg">
            <A
              href="/notifications"
              class="hover:bg-base-300 group relative flex items-center justify-center rounded-lg p-3 normal-case transition-colors"
              aria-label="Notifications"
            >
              <i data-lucide="bell" class="text-base-content/40 h-5 w-5" />
              <Show when={props.notifications().some(n => !n.read)}>
                <span class="badge badge-error badge-xs absolute -top-1 -right-1">
                  {props.notifications().filter(n => !n.read).length}
                </span>
              </Show>
            </A>
            <button
              class="hover:bg-base-300 group relative flex items-center justify-center rounded-lg p-3 normal-case transition-colors"
              onClick={() => {
                import('../lib/theme').then(({ applyTheme }) => {
                  const currentTheme = localStorage.getItem('theme') || 'light';
                  const next =
                    currentTheme === 'dark' ||
                    (currentTheme === 'auto' &&
                      window.matchMedia('(prefers-color-scheme: dark)').matches)
                      ? 'light'
                      : 'dark';
                  applyTheme(next);
                });
              }}
              aria-label="Toggle theme"
            >
              <i data-lucide="sun-moon" class="text-base-content/40 h-5 w-5" />
            </button>
            <button
              class="hover:bg-base-300 group relative flex items-center justify-center rounded-lg p-3 normal-case transition-colors"
              onClick={() => {
                const next = currentLang() === 'en' ? 'ar' : 'en';
                setLang(next);
                localStorage.setItem('lang', next);
              }}
              aria-label="Change language"
            >
              <i data-lucide="globe" class="text-base-content/40 h-5 w-5" />
            </button>
            <button
              class="hover:bg-base-300 group relative flex items-center justify-center rounded-lg p-3 normal-case transition-colors"
              onClick={openSettingsModal}
              aria-label="Open settings"
            >
              <i data-lucide="settings" class="text-base-content/40 h-5 w-5" />
            </button>
          </li>
        </Show>
      </ul>
    </div>
  );
};

export default Footer;
