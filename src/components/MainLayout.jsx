import { onMount, useContext, Show, createSignal, onCleanup, createEffect } from "solid-js";
import { LangContext } from "../context/LangContext";
import { useUser } from "../context/UserContext";
import { GlobalLoading, GlobalError, ToastContainer } from "./GlobalUI";
import OfflineIndicator from "./OfflineIndicator";
import Sidebar from "./Sidebar";
import { logger } from "../lib/core";


const MainLayout = (props) => {
  logger.trace('MainLayout: Starting');
  const context = useContext(LangContext) || { lang: () => 'ar', setLang: () => {} };
  const { lang, setLang } = context;
  const { isAuthenticated } = useUser();
  const [isDrawerOpen, setIsDrawerOpen] = createSignal(true);

  const [currentLang, setCurrentLang] = createSignal(lang());

  createEffect(() => {
    const newLang = lang();
    setCurrentLang(newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
  });

  onMount(async () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }

    const link = document.querySelector('link[rel="icon"]');
    if (link) {
      link.href = '/favicon.svg';
    }
  });

  createEffect(() => {
    isDrawerOpen();
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 50);
  });

  return (
    <>
      <GlobalLoading />
      <GlobalError />
      <ToastContainer />
      <OfflineIndicator />
      <div class="flex h-screen min-h-0 overflow-hidden bg-base-200">
        <Show when={isAuthenticated()}>
          <Sidebar />
        </Show>
        <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main id="main-content" class="flex-1 w-full min-h-0 overflow-auto">
            
            {props.children}
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
