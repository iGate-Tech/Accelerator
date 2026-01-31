import { onMount, onCleanup } from 'solid-js';

// Custom hook to manage document title
export const useDocumentTitle = (title) => {
  const originalTitle = document.title;

  onMount(() => {
    document.title = title ? `${title} | iGate OS` : 'iGate OS';
  });

  // Clean up by restoring original title when component unmounts
  onCleanup(() => {
    document.title = originalTitle;
  });

  return;
};