import { onMount } from "solid-js";
import { logger } from '../lib/core';


export const useLucideIcons = () => {
  logger.trace('useLucideIcons: Starting');
  onMount(() => {
    window.lucide.createIcons({ icons: window.lucide.icons });
  });
};