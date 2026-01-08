import {onMount, createEffect, createSignal, useContext} from "solid-js";
import {LangContext} from "../../context/LangContext";
import {getPg} from "../../lib/db";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import favicon from "../../assets/favicon.svg";

const AppLayout = (props) => {
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
        console.log('AppLayout onMount: initializing worker');
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
            <Navbar variant="app" />
            <div class="flex">

            <Sidebar/>
            <div
                class="px-5"
                style={{
                    'margin-left': currentLang() === 'ar' ? '0' : '20rem',
                    'margin-right': currentLang() === 'ar' ? '20rem' : '0'
                }}
                >
                {
                    props.children
                } </div>
                </div>
        </>
    );
};

export default AppLayout;