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
            const response = await fetch('/api/llm/stream', {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            setServerReachable(response.ok);
        } catch {
            setServerReachable(false);
        }};

    onMount(async () => {
        console.log('AuthLayout onMount: initializing worker');
        // Initialize worker early
        await getPg();
        console.log('Worker initialized');
        // Create Lucide icons
        if (window.lucide)
            window.lucide.createIcons();


        // Set favicon
        const link = document.querySelector('link[rel="icon"]');
        if (link)
            link.href = favicon;


        // Check server connectivity initially and every 30 seconds
        await checkServerConnectivity();
        setInterval(checkServerConnectivity, 30000);

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeController = document.getElementById('theme-controller');
        if (themeController)
            themeController.checked = savedTheme === 'dark';


        // Initialize language
        setLang(localStorage.getItem('lang') || 'en');
        const langSwap = document.getElementById('langSwap');
        if (langSwap)
            langSwap.checked = lang() === 'ar';

    });

    return (
        <>
            <ToastContainer />
            {/* Floating Switches */}
            <div class="fixed top-4 right-4 z-40 flex gap-2">
                <button
                    class="btn btn-ghost btn-sm btn-circle"
                    onClick={() => {
                        const current = document.documentElement.getAttribute('data-theme');
                        const newTheme = current === 'dark' ? 'light' : 'dark';
                        document.documentElement.setAttribute('data-theme', newTheme);
                        localStorage.setItem('theme', newTheme);
                    }}
                    title="Toggle Theme"
                >
                    <i data-lucide="sun" class="w-4 h-4"></i>
                </button>
                <button
                    class="btn btn-ghost btn-sm btn-circle"
                    onClick={() => {
                        const newLang = lang() === 'en' ? 'ar' : 'en';
                        setLang(newLang);
                        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
                    }}
                    title="Switch Language"
                >
                    <i data-lucide="languages" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 flex items-center justify-center px-4 ">
                <main class="w-full overflow-auto">
                    {props.children}
                </main>
            </div>
        </>
    );
};

export default AuthLayout;