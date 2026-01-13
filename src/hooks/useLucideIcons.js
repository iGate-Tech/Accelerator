import { onMount } from "solid-js";
import logger from '../lib/logger.js';


export const useLucideIcons = () => {
  logger.trace('useLucideIcons: Starting');
  onMount(() => {
    window.lucide.createIcons({ icons: window.lucide.icons });
  });
};