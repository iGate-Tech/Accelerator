// eslint-disable-next-line no-unused-vars
import { A, useLocation, useNavigate } from '@solidjs/router';
import {
  useContext,
  onMount,
  createSignal,
  createEffect,
  Show,
} from 'solid-js';
import logo from '../assets/images/iGate-tech-logo.svg';
import favicon from '../assets/images/favicon.svg';
import { LangContext } from '../context/LangContext';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import { getUserNotifications } from '@lib/database';
import { logger } from '@lib/core';

import ProjectsSection from './ProjectsSection';

import Footer from './Footer';

const Sidebar = () => {
  logger.trace('Sidebar: Starting');
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const location = useLocation();
  const { currentLang, t, setLang } = useLanguage();
  const [notifications, setNotifications] = createSignal([]);
  const [isCollapsed, setIsCollapsed] = createSignal(false);

  const loadNotifications = async () => {
    const userId = user()?.id;
    if (!userId) return;

    try {
      const [notifs] = await Promise.all([getUserNotifications(userId)]);
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
    } catch (error) {
      logger.warn('Failed to load sidebar data:', error.message);
    }
  };

  onMount(async () => {
    await loadNotifications();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  createEffect(() => {
    if (!isCollapsed() && window.lucide) {
      window.lucide.createIcons();
    }
    localStorage.setItem('sidebarCollapsed', isCollapsed());
    setLang(lang());
  });

  return (
    <aside
      class={`sidebar bg-base-100 border-base-300 z-[55] flex h-screen flex-col overflow-hidden border-e shadow-md transition-all duration-300 ease-in-out ${
        currentLang() === 'ar' ? 'rtl' : ''
      }`}
      style={{
        width: isCollapsed() ? '80px' : '256px',
      }}
      dir={currentLang() === 'ar' ? 'rtl' : 'ltr'}
    >
      <div class="flex h-full min-h-0 flex-col transition-all duration-300">
        <div class="relative flex flex-shrink-0 items-center justify-between gap-2 p-5 rtl:justify-between">
          <div
            onClick={e => {
              setIsCollapsed(!isCollapsed());
            }}
            class="flex cursor-pointer items-center rtl:justify-center"
          >
            <img
              src={isCollapsed() ? favicon : logo}
              alt="Logo"
              classList={{
                'h-8': true,
                'w-10': isCollapsed(),
              }}
            />
            <span
              classList={{ hidden: isCollapsed() }}
              class="text-base-content/40 self-end px-2 py-0.5 text-xs font-medium"
            >
              1.0
            </span>
          </div>
          <Show when={!isCollapsed()}>
            <div
              onClick={e => {
                setIsCollapsed(!isCollapsed());
              }}
              class="hover:bg-base-300 flex cursor-pointer rounded-lg p-1 transition-colors"
            >
              <i
                data-lucide="chevron-left"
                class="text-base-content/60 h-5 w-5"
              />
            </div>
          </Show>
        </div>

        <div class="scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto px-1">
          <ul class="menu w-full gap-1">
            <li
              classList={{
                'menu-active': location.pathname === '/home',
              }}
            >
              <A
                href="/home"
                class="hover:bg-base-300 group relative flex items-center justify-center rounded-lg p-3 transition-colors ltr:justify-center rtl:justify-center"
                aria-label={`Create new project - ${t().newProject}`}
              >
                <i
                  data-lucide="plus"
                  classList={{
                    'w-5 h-5': !isCollapsed(),
                    'w-6 h-6': isCollapsed(),
                  }}
                  class="text-base-content/60"
                  aria-hidden="true"
                />
                <Show when={!isCollapsed()}>
                  <span class="font-medium ltr:ml-3 rtl:mr-3">
                    {t().newProject}
                  </span>
                </Show>
              </A>
            </li>
            <li
              classList={{
                'menu-active': location.pathname === '/explore',
              }}
            >
              <A
                href="/explore"
                class="hover:bg-base-300 group flex items-center rounded-lg p-3 transition-colors ltr:justify-start rtl:justify-end"
                aria-label={`Explore - ${t().exploreIdeas}`}
              >
                <i
                  data-lucide="compass"
                  classList={{
                    'w-5 h-5': !isCollapsed(),
                    'w-6 h-6': isCollapsed(),
                  }}
                  class="text-base-content/60"
                  aria-hidden="true"
                />
                <Show when={!isCollapsed()}>
                  <span class="font-medium ltr:ml-3 rtl:mr-3">
                    {t().exploreIdeas}
                  </span>
                </Show>
              </A>
            </li>
            <li
              classList={{
                'menu-active': location.pathname === '/dashboard',
              }}
            >
              <A
                href="/dashboard"
                class="hover:bg-base-300 group flex items-center rounded-lg p-3 transition-colors ltr:justify-start rtl:justify-end"
                aria-label={`Dashboard - ${t().dashboard}`}
              >
                <i
                  data-lucide="bar-chart"
                  classList={{
                    'w-5 h-5': !isCollapsed(),
                    'w-6 h-6': isCollapsed(),
                  }}
                  class="text-base-content/60"
                  aria-hidden="true"
                />
                <Show when={!isCollapsed()}>
                  <span class="font-medium ltr:ml-3 rtl:mr-3">
                    {t().dashboard}
                  </span>
                </Show>
              </A>
            </li>
            <li
              classList={{
                'menu-active': location.pathname === '/portfolio',
              }}
            >
              <A
                href="/portfolio"
                class="hover:bg-base-300 group flex items-center rounded-lg p-3 transition-colors ltr:justify-start rtl:justify-end"
                aria-label={`Portfolio - ${t().portfolio}`}
              >
                <i
                  data-lucide="briefcase"
                  classList={{
                    'w-5 h-5': !isCollapsed(),
                    'w-6 h-6': isCollapsed(),
                  }}
                  class="text-base-content/60"
                  aria-hidden="true"
                />
                <Show when={!isCollapsed()}>
                  <span class="font-medium ltr:ml-3 rtl:mr-3">
                    {t().portfolio}
                  </span>
                </Show>
              </A>
            </li>
            <li
              classList={{
                'menu-active': location.pathname === '/invitations',
              }}
            >
              <A
                href="/invitations"
                class="hover:bg-base-300 group flex items-center rounded-lg p-3 transition-colors ltr:justify-start rtl:justify-end"
                aria-label={`Collaborate - Invitations`}
              >
                <i
                  data-lucide="users"
                  classList={{
                    'w-5 h-5': !isCollapsed(),
                    'w-6 h-6': isCollapsed(),
                  }}
                  class="text-base-content/60"
                  aria-hidden="true"
                />
                <Show when={!isCollapsed()}>
                  <span class="font-medium ltr:ml-3 rtl:mr-3">
                    {t().collaborate}
                  </span>
                </Show>
              </A>
            </li>
          </ul>
          <ProjectsSection isCollapsed={isCollapsed()} />
        </div>

        <Footer isCollapsed={isCollapsed} notifications={notifications} />
      </div>
    </aside>
  );
};
export default Sidebar;
