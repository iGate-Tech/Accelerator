import {onMount, createEffect, createSignal, useContext} from "solid-js";
import {LangContext} from "../../context/LangContext";
import {getPg} from "../../lib/db";

import { ToastContainer } from "./GlobalUI";
import favicon from "../../assets/favicon.svg";
import logger from '../../lib/logger.js';



const AuthLayout = (props) => {
  logger.trace('AuthLayout: Starting');
     const context = useContext(LangContext) || { lang: () => 'ar', setLang: () => {}, serverReachable: () => true, setServerReachable: () => {} };
   const {lang, setLang, serverReachable, setServerReachable} = context;

     // Make component reactive to language changes
     const [currentLang, setCurrentLang] = createSignal(lang());
     const [theme, setTheme] = createSignal('light');

    createEffect(() => {
        const newLang = lang();
        setCurrentLang(newLang);
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
        logger.debug('Language changed to:', newLang);
    });

    const checkServerConnectivity = async () => {
        try {
            const response = await fetch('/api/health', {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            setServerReachable(response.ok);
        } catch {
            setServerReachable(false);
        }
    };

    onMount(async () => {
        logger.debug('AuthLayout onMount: initializing worker');

        // Create Lucide icons
        if (window.lucide)
            window.lucide.createIcons();

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        setTheme(savedTheme);
        const themeController = document.getElementById('theme-controller');
        if (themeController)
            themeController.checked = savedTheme === 'dark';

        // Check server connectivity periodically
        checkServerConnectivity();
        const interval = setInterval(checkServerConnectivity, 30000); // Check every 30 seconds

        // Initialize database
        try {
            await getPg();
            logger.debug('Worker initialized');
        } catch (error) {
            logger.error('Failed to initialize worker:', error);
        }

        return () => clearInterval(interval);
    });

    return (
        <>
            <link rel="icon" href="/favicon.svg" />
            <main class="min-h-screen bg-base-200 flex items-center justify-center relative">
                <div class="absolute top-4 right-4 flex gap-2">
                    <label class="swap">
                        <input
                            id="langSwap"
                            type="checkbox"
                            checked={lang() === 'ar'}
                            onChange={(e) => {
                                const newLang = e.target.checked ? 'ar' : 'en';
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
                    <label class="swap swap-rotate">
                        <input
                            id="theme-controller"
                            type="checkbox"
                            class="theme-controller"
                            value="dark"
                            checked={theme() === 'dark'}
                            onChange={(e) => {
                                const newTheme = e.target.checked ? 'dark' : 'light';
                                setTheme(newTheme);
                                document.documentElement.setAttribute('data-theme', newTheme);
                                localStorage.setItem('theme', newTheme);
                            }}
                        />
                        <i data-lucide="sun" class="swap-off h-5 w-5"></i>
                        <i data-lucide="moon" class="swap-on h-5 w-5"></i>
                    </label>
                </div>
                {props.children}
            </main>
            <ToastContainer />
        </>
    );
};

export default AuthLayout;