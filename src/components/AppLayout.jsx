import {onMount, createEffect, createSignal, useContext} from "solid-js";
import {LangContext} from "../context/LangContext";
import { getPg } from "../lib/database/core.js";

import Sidebar from "./Sidebar";
import favicon from "../assets/images/favicon.svg";
import { logger } from '../lib/core';



const AppLayout = (props) => {
  logger.trace('AppLayout: Starting');
  logger.trace('AppLayout: Starting');
    const context = useContext(LangContext) || { lang: () => 'ar', setLang: () => {} };
  const {lang, setLang} = context;

    // Make component reactive to language changes
    const [currentLang, setCurrentLang] = createSignal(lang());

    createEffect(() => {
        const newLang = lang();
        setCurrentLang(newLang);
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
        logger.debug('Language changed to:', newLang);
    });



    onMount(async () => {
        logger.debug('AppLayout onMount: initializing worker');

        // Create Lucide icons
        if (window.lucide)
            window.lucide.createIcons();

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeController = document.getElementById('theme-controller');
        if (themeController)
            themeController.checked = savedTheme === 'dark';



        // Initialize database
        try {
            await getPg();
            logger.debug('Worker initialized');
        } catch (error) {
            logger.error('Failed to initialize worker:', error);
        }
    });

    return (
        <>
            <link rel="icon" href="/favicon.svg" />
            <main class="min-h-screen bg-base-200">
                {props.children}
            </main>
            <ToastContainer />
        </>
    );
};

export default AppLayout;