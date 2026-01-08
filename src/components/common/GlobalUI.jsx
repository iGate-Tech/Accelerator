import { createSignal, Show, For, createEffect } from "solid-js";
import { toastManager, removeToast } from "../../lib/feedback";

const [globalLoading, setGlobalLoading] = createSignal(false);
const [globalError, setGlobalError] = createSignal(null);

// Global loading management
export const loadingManager = {
  start: () => setGlobalLoading(true),
  stop: () => setGlobalLoading(false),
  isLoading: globalLoading
};

// Global error management
export const errorManager = {
  setError: (error) => setGlobalError(error),
  clearError: () => setGlobalError(null),
  getError: globalError
};

// Global loading component
const GlobalLoading = () => {
  return (
    <Show when={globalLoading()}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-base-100 p-6 rounded-lg shadow-xl">
          <div class="flex items-center space-x-4">
            <div class="loading loading-spinner loading-lg"></div>
            <span class="text-lg">Loading...</span>
          </div>
        </div>
      </div>
    </Show>
  );
};

// Global error component
const GlobalError = () => {
  return (
    <Show when={globalError()}>
      <div class="fixed top-4 right-4 z-50">
        <div class="alert alert-error shadow-lg max-w-md">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="font-bold">Error!</h3>
              <div class="text-xs">{globalError()}</div>
            </div>
          </div>
          <div class="flex-none">
            <button class="btn btn-sm btn-ghost" onClick={() => errorManager.clearError()}>
              ✕
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

// Toast container component
const ToastContainer = () => {
  const toasts = toastManager.getToasts;

  const getIcon = (type) => {
    const colorClass = type === 'success' ? 'text-success' :
                       type === 'error' ? 'text-error' :
                       type === 'warning' ? 'text-warning' :
                       'text-info';
    const iconClass = `w-5 h-5 flex-shrink-0 ${colorClass}`;
    switch (type) {
      case 'success':
        return <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>;
      case 'error':
        return <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>;
      case 'warning':
        return <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
      default:
        return <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
    }
  };

  return (
    <div class="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      <For each={toasts}>{(toast, index) => (
        <div
          class={`card bg-base-100 shadow-2xl border border-base-300 rounded-xl p-4 toast-enter ${
            toast.type === 'success' ? 'border-success/20 bg-success/5' :
            toast.type === 'error' ? 'border-error/20 bg-error/5' :
            toast.type === 'warning' ? 'border-warning/20 bg-warning/5' :
            'border-info/20 bg-info/5'
          }`}
        >
          <div class="flex items-start gap-3">
            {getIcon(toast.type)}
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content leading-tight">{toast.message}</p>
            </div>
            <button
              class="btn btn-sm btn-ghost btn-circle flex-shrink-0 hover:bg-base-200"
              onClick={() => removeToast(toast.id)}
              aria-label="Close toast"
            >
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}</For>
    </div>
  );
};

export { GlobalLoading, GlobalError, ToastContainer };