import {onMount, createEffect, useContext} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {LangContext} from "../context/LangContext";
import {initDb} from "../lib/db";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import favicon from "../assets/favicon.svg";

const Layout = (props) => {
    const navigate = useNavigate();
    const {lang, setLang, serverReachable, setServerReachable} = useContext(LangContext);

    createEffect(() => {
        document.documentElement.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
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
        await initDb();
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
            <Navbar/>
            <Sidebar/>
            <div class="px-5 lg:ml-80">
                {
                props.children
            } </div>
        </>
    );
};

export default Layout;
