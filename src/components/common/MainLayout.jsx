import {onMount, createEffect, createSignal, useContext, Show} from "solid-js";
import { useLocation } from "@solidjs/router";
import {LangContext} from "../../context/LangContext";
import {useUser} from "../../context/UserContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { GlobalLoading, GlobalError, ToastContainer } from "./GlobalUI";
import OfflineIndicator from "./OfflineIndicator";
import favicon from "../../assets/favicon.svg";
import logger from '../../lib/logger.js';


const MainLayout = (props) => {
  logger.trace('MainLayout: Starting');
    const context = useContext(LangContext) || { lang: () => 'ar', setLang: () => {} };
  const {lang, setLang} = context;
  const { isAuthenticated } = useUser();
  const location = useLocation();

  // Log route changes
  createEffect(() => {
    const currentPath = location.pathname;
    const search = location.search;
    const hash = location.hash;
    logger.info('Router: Route changed to:', currentPath + search + hash);
    logger.debug('Router: Query params:', Object.fromEntries(new URLSearchParams(search)));
    if (hash) logger.debug('Router: Hash:', hash);
  });

    // Make component reactive to language changes
    const [currentLang, setCurrentLang] = createSignal(lang());

    createEffect(() => {
        const newLang = lang();
        setCurrentLang(newLang);
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
        logger.debug('Language changed to:', newLang);
    });



    onMount(async () => {
        logger.debug('MainLayout onMount');

        // Create Lucide icons
        if (window.lucide)
            window.lucide.createIcons();

        // Set favicon
        const link = document.querySelector('link[rel="icon"]');
        if (link)
            link.href = favicon;





        // Initialize language
        setLang(localStorage.getItem('lang') || 'en');
        const langSwap = document.getElementById('langSwap');
        if (langSwap)
            langSwap.checked = lang() === 'ar';
    });

    return (
        <>
            {/* Skip to main content link for accessibility */}
            {/* <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-content px-4 py-2 rounded z-50">
                Skip to main content
            </a> */}
            <div class="flex">

            <GlobalLoading />
            <GlobalError />
            <ToastContainer />
            <OfflineIndicator />
                          <Show when={isAuthenticated()}>
                <Sidebar />
              </Show>
            <div class="flex flex-col w-full h-[calc(100vh-4rem)]">
            <Navbar />

               <main id="main-content" class={`px-5 overflow-auto ${isAuthenticated() ? 'flex-1' : 'flex-1'}`}>
                 {props.children}
               </main>
            </div>
            </div>
        </>
    );
};

export default MainLayout;