import { createStore } from "solid-js/store";
import { logger } from '../core';

const [toasts, setToasts] = createStore([]);

export const addToast = (type, message, duration = 3000) => {
  logger.trace('addToast: Starting');
  const id = Date.now() + Math.random();
  const toast = { id, type, message, duration };
  setToasts(toasts => [...toasts, toast]);

  if (duration > 0) {
    setTimeout(() => {
      setToasts(toasts => toasts.filter(t => t.id !== id));
    }, duration);
  }
};
  logger.trace('removeToast: Starting');

export const removeToast = (id) => {
  setToasts(toasts => toasts.filter(t => t.id !== id));
};

export const toastManager = {
  success: (message, duration) => addToast('success', message, duration),
  error: (message, duration) => addToast('error', message, duration),
  warning: (message, duration) => addToast('warning', message, duration),
  info: (message, duration) => addToast('info', message, duration),
  getToasts: toasts
};