import {onMount, createEffect, createSignal, useContext} from "solid-js";
import {LangContext} from "../../context/LangContext";
import {getPg} from "../../lib/db";

import Navbar from "./Navbar";
import { ToastContainer } from "./GlobalUI";
import favicon from "../../assets/favicon.svg";

const AuthLayout = (props) => {
    const context = useContext(LangContext) || { lang: () => 'ar', setLang: () => {}, serverReachable: () => true, setServerReachable: () => {} };
  const {lang, setLang, serverReachable, setServerReachable} = context;

    // Make component reactive to language changes
    const [currentLang, setCurrentLang] = createSignal(lang());

    createEffect(() => {
        const newLang = lang();
        setCurrentLang(newLang);
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
        console.log('Language changed to:', newLang);
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
        console.log('AuthLayout onMount: initializing worker');

        // Create Lucide icons
        if (window.lucide)
            window.lucide.createIcons();

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeController = document.getElementById('theme-controller');
        if (themeController)
            themeController.checked = savedTheme === 'dark';

        // Check server connectivity periodically
        checkServerConnectivity();
        const interval = setInterval(checkServerConnectivity, 30000); // Check every 30 seconds

        // Initialize database
        try {
            await getPg();
            console.log('Worker initialized');
        } catch (error) {
            console.error('Failed to initialize worker:', error);
        }

        return () => clearInterval(interval);
    });

    return (
        <>
            <link rel="icon" href="/favicon.svg" />
            <Navbar />
            <main class="min-h-screen bg-base-200 flex items-center justify-center">
                {props.children}
            </main>
            <ToastContainer />
        </>
    );
};

export default AuthLayout;