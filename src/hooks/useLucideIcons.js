import { onMount } from "solid-js";

export const useLucideIcons = () => {
  onMount(() => {
    window.lucide.createIcons({ icons: window.lucide.icons });
  });
};