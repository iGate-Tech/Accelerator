import { onMount } from "solid-js";

export const useLucideIcons = () => {
  onMount(() => {
    window.lucide.createIcons();
  });
};