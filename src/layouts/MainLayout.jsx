import {
  onMount,
  useContext,
  Show,
  createSignal,
  onCleanup,
  createEffect,
} from 'solid-js';
import { LangContext } from '@context/LangContext';
import { useUser } from '@context/UserContext';
import { GlobalLoading, GlobalError, ToastContainer } from '@components/feedback/GlobalUI';
import OfflineIndicator from '@components/utilities/OfflineIndicator';
import Sidebar from '@components/navigation/Sidebar';
import SettingsModal from '@components/modals/SettingsModal';
import { logger } from '@lib/core';

const MainLayout = props => {
  logger.trace('MainLayout: Starting');
  const context = useContext(LangContext) || {
    lang: () => 'ar',
    setLang: () => {},
  };
  const { lang, setLang } = context;
  const { isAuthenticated } = useUser();
  const [isDrawerOpen, setIsDrawerOpen] = createSignal(true);

  const [currentLang, setCurrentLang] = createSignal(lang());

  createEffect(() => {
    const newLang = lang();
    setCurrentLang(newLang);
    document.documentElement.setAttribute(
      'dir',
      newLang === 'ar' ? 'rtl' : 'ltr'
    );
  });

  onMount(async () => {
    const link = document.querySelector('link[rel="icon"]');
    if (link) {
      link.href = '/favicon.svg';
    }
  });

  createEffect(() => {
    isDrawerOpen();
  });

  return (
    <>
      <GlobalLoading />
      <GlobalError />
      <ToastContainer />
      <OfflineIndicator />
      <SettingsModal />
      <div class="bg-base-200 flex h-screen min-h-0 overflow-hidden">
        <Show when={isAuthenticated()}>
          <Sidebar />
        </Show>
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <main
            id="main-content"
            class="bg-base-100 min-h-0 w-full flex-1 overflow-auto"
          >
            {props.children}
          </main>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
