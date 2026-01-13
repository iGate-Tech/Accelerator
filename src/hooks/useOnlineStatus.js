import { createSignal, onMount, onCleanup } from 'solid-js';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = createSignal(navigator.onLine);

  const updateOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  onMount(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  });

  onCleanup(() => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  });

  return isOnline;
}