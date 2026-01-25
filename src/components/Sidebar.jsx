// eslint-disable-next-line no-unused-vars
import {A, useLocation, useNavigate} from "@solidjs/router";
import {
    useContext,
    onMount,
    createSignal,
    createEffect
} from "solid-js";
import logo from "../assets/images/iGate-tech-logo.svg";
import favicon from "../assets/images/favicon.svg";
import {LangContext} from "../context/LangContext";
import {useUser} from "../context/UserContext";
import {useLanguage} from "../hooks/useLanguage";
import {
    getUserNotifications
} from "../lib/database";
import { logger } from "../lib/core";
// eslint-disable-next-line no-unused-vars
import ProjectsSection from './ProjectsSection';
// eslint-disable-next-line no-unused-vars
import Footer from './Footer';

const Sidebar = () => {
    logger.trace('Sidebar: Starting');
    const {lang} = useContext(LangContext);
    const {user} = useUser();
    const location = useLocation();
    const {currentLang, t, setLang} = useLanguage();
    const [notifications, setNotifications] = createSignal([]);
    const [isCollapsed, setIsCollapsed] = createSignal(false);

    const loadNotifications = async () => {
        const userId = user()?.id;
        if (!userId)
            return;

        try {
            const [notifs] = await Promise.all([getUserNotifications(userId)]);
            setNotifications(notifs.slice(0, 5).map(n => ({
                ...n,
                type: n.type === 'system' ? 'systemUpdate' : n.type === 'billing' ? 'billing' : n.type === 'credits' ? 'credits' : n.type === 'getting-started' ? 'gettingStarted' : n.type === 'subscription' ? 'subscription' : n.type === 'ai' ? 'aiFeature' : n.type === 'explore' ? 'explore' : n.type === 'help' ? 'help' : n.type === 'project' ? 'project' : 'newMessage',
                time: new Date(n.created_at)
            })));
        } catch (error) {
            logger.warn('Failed to load sidebar data:', error.message);
        }
    };

    







    onMount(async () => {
        await loadNotifications();
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // Load collapsed state from localStorage
        const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        setIsCollapsed(savedCollapsed);
        // User dropdown is always anchored above (footer menu pattern)
    });

    createEffect(() => {
        const newLang = lang();
        setLang(newLang);
    });


    createEffect(() => {
        if (!isCollapsed() && window.lucide) {
            window.lucide.createIcons();
        }
    });

    // Persist collapsed state
    createEffect(() => {
        localStorage.setItem('sidebarCollapsed', isCollapsed().toString());
    });
    return (
        <aside class={
                `sidebar h-screen shadow-md bg-base-100 border-e border-base-300 flex flex-col z-[55] transition-all duration-300 ease-in-out overflow-hidden ${
                    currentLang() === 'ar' ? 'rtl' : ''
                }`
            }
            style={
                {
                    width: isCollapsed() ? '80px' : '256px'
                }
            }
            dir={
                currentLang() === "ar" ? "rtl" : "ltr"
        }>
            <div class="flex flex-col h-full min-h-0 transition-all duration-300">
                <div class="flex-shrink-0 relative p-5 flex items-center justify-between rtl:justify-between gap-2">
                    <A href="/"
                        onClick={
                            (e) => {
                                e.preventDefault();
                                setIsCollapsed(!isCollapsed());
                            }
                        }
                        class="cursor-pointer flex items-center rtl:justify-center">
                        <img src={
                                isCollapsed() ? favicon : logo
                            }
                            alt="Logo"
                            classList={
                                {
                                    'h-8': true,
                                    'w-10': isCollapsed()
                                }
                            }/>
                              <span 
                                classList={{
                                  'hidden': isCollapsed()
                                }} 
                                class="px-2 py-0.5 text-xs font-medium text-base-content/40 self-end">1.0</span>

                    </A>
                    <Show when={
                        !isCollapsed()
                    }>
                        <A href="/"
                            onClick={
                                (e) => {
                                    e.preventDefault();
                                    setIsCollapsed(!isCollapsed());
                                }
                            }
                            class="cursor-pointer p-1 hover:bg-base-300 rounded-lg flex transition-colors">
                            <i data-lucide="chevron-left" class="w-5 h-5 text-base-content/60"></i>
                        </A>
                    </Show>
                </div>

                <div class="flex-1 overflow-y-auto px-1 min-h-0 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
                    <ul class="menu w-full gap-1">
                        <li classList={
                            {
                                "menu-active": location.pathname === "/"
                            }
                        }>
                            <A href="/"
                                class="flex items-center justify-center ltr:justify-center rtl:justify-center p-3 hover:bg-base-300 transition-colors rounded-lg relative group"
                                aria-label={
                                    `Create new project - ${
                                        t().newProject
                                    }`
                            }>
                                <i data-lucide="plus"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().newProject
                                    }</span>
                                </Show>
                            </A>
                        </li>
                        <li classList={
                            {
                                "menu-active": location.pathname === "/explore"
                            }
                        }>
                            <A href="/explore" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group"
                                aria-label={
                                    `Explore - ${
                                        t().exploreIdeas
                                    }`
                            }>
                                <i data-lucide="compass"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().exploreIdeas
                                    }</span>
                                </Show>
                            </A>
                        </li>
                        <li classList={
                            {
                                "menu-active": location.pathname === "/dashboard"
                            }
                        }>
                            <A href="/dashboard" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group"
                                aria-label={
                                    `Dashboard - ${
                                        t().dashboard
                                    }`
                            }>
                                <i data-lucide="bar-chart"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().dashboard
                                    }</span>
                                </Show>
                            </A>
                        </li>
                        <li classList={
                            {
                                "menu-active": location.pathname === "/portfolio"
                            }
                        }>
                            <A href="/portfolio" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group"
                                aria-label={
                                    `Portfolio - ${
                                        t().portfolio
                                    }`
                            }>
                                <i data-lucide="briefcase"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().portfolio
                                    }</span>
                                </Show>
                            </A>
                        </li>
                        <li classList={
                            {
                                "menu-active": location.pathname === "/invitations"
                            }
                        }>
                            <A href="/invitations" class="flex items-center ltr:justify-start rtl:justify-end p-3 hover:bg-base-300 transition-colors rounded-lg group"
                                aria-label={`Collaborate - Invitations`}>
                                <i data-lucide="users"
                                    classList={
                                        {
                                            "w-5 h-5": !isCollapsed(),
                                            "w-6 h-6": isCollapsed()
                                        }
                                    }
                                    class="text-base-content/60"
                                    aria-hidden="true"></i>
                                <Show when={
                                    !isCollapsed()
                                }>
                                    <span class="font-medium ltr:ml-3 rtl:mr-3">
                                        {
                                        t().collaborate
                                    }</span>
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
