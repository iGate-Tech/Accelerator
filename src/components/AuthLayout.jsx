import {onMount, createEffect, createSignal, useContext} from "solid-js";
import {LangContext} from "../context/LangContext";
import {getPg} from "@lib/database";

import { ToastContainer } from "./GlobalUI";
import favicon from "../assets/images/favicon.svg";
import { logger } from '@lib/core';
import { initializeTheme, applyTheme } from '../lib/theme';



const AuthLayout = (props) => {
  logger.trace('AuthLayout: Starting');
     const context = useContext(LangContext) || { lang: () => 'ar', setLang: () => {} };
   const {lang, setLang} = context;

     // Make component reactive to language changes
     const [currentLang, setCurrentLang] = createSignal(lang());
     const [theme, setTheme] = createSignal('light');

    createEffect(() => {
        const newLang = lang();
        setCurrentLang(newLang);
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
        logger.debug('Language changed to:', newLang);
    });



    onMount(async () => {
        logger.debug('AuthLayout onMount: initializing worker');

        // Create Lucide icons
        if (window.lucide)
            window.lucide.createIcons();

        // Initialize theme
        initializeTheme();

        // Update local state to reflect current theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);



        // Initialize database
        try {
            const { ensureDatabaseReady } = await import('../lib/database/core.js');
            await ensureDatabaseReady();
            logger.debug('Database initialized');
        } catch (error) {
            logger.error('Failed to initialize database:', error);
        }
    });

    return (
        <>
            <link rel="icon" href="/favicon.svg" />
            <main class="min-h-screen bg-base-200 flex items-center justify-center relative">
                <div class="absolute top-4 end-4 flex gap-2">
                    <label class="swap">
                        <input
                            id="langSwap"
                            type="checkbox"
                            checked={lang() === 'ar'}
                            onChange={(e) => {
                                const newLang = e.target.checked ? 'ar' : 'en';
                                setLang(newLang);
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
                                applyTheme(newTheme); // Use the new theme utility
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