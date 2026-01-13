import { createSignal, Show, For, createEffect } from "solid-js";
import { toastManager, removeToast } from "../../lib/feedback";
import logger from '../../lib/logger.js';


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
  logger.trace('GlobalLoading: Starting');
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
    const iconClass = `w-6 h-6 flex-shrink-0`;
    switch (type) {
      case 'success':
        return <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>;
      case 'error':
        return <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>;
      case 'warning':
        return <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
      default:
        return <svg class={iconClass} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
    }
  };

  return (
    <div class="fixed top-6 right-6 z-50 space-y-4 max-w-sm">
      <For each={toasts}>{(toast, index) => (
        <div
          class={`relative overflow-hidden rounded-2xl p-5 shadow-2xl border-0 backdrop-blur-sm transform transition-all duration-300 ease-out animate-in slide-in-from-right-4 fade-in-0 ${
            toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25' :
            toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/25' :
            toast.type === 'warning' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-amber-500/25' :
            'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
          }`}
          style={{
            'animation-delay': `${index() * 100}ms`,
            'box-shadow': `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px ${
              toast.type === 'success' ? 'rgba(16, 185, 129, 0.1)' :
              toast.type === 'error' ? 'rgba(239, 68, 68, 0.1)' :
              toast.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
              'rgba(59, 130, 246, 0.1)'
            }`
          }}
        >
          {/* Subtle background pattern */}
          <div class="absolute inset-0 opacity-10">
            <div class="absolute inset-0 bg-gradient-to-br from-base-100/20 to-transparent"></div>
          </div>

          <div class="relative flex items-start gap-4">
            <div class={`flex-shrink-0 rounded-full p-2 ${
              toast.type === 'success' ? 'bg-success/10' :
              toast.type === 'error' ? 'bg-error/10' :
              toast.type === 'warning' ? 'bg-warning/10' :
              'bg-info/10'
            }`}>
              {getIcon(toast.type)}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold leading-tight">{toast.message}</p>
            </div>
            <button
              class="flex-shrink-0 rounded-full p-1 hover:bg-base-100/20 transition-colors duration-200 group"
              onClick={() => removeToast(toast.id)}
              aria-label="Close toast"
            >
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Progress bar for auto-dismiss */}
          {toast.duration && toast.duration > 0 && (
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-base-100/20">
              <div
                class="h-full bg-base-content/60 transition-all duration-75 ease-linear"
                style={{
                  'animation': `shrink ${toast.duration}ms linear forwards`,
                  'transform-origin': 'left'
                }}
              ></div>
            </div>
          )}
        </div>
      )}</For>

      <style>
        {`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
          .animate-in {
            animation: slide-in-from-right-4 0.3s ease-out, fade-in-0 0.3s ease-out;
          }
          @keyframes slide-in-from-right-4 {
            from { transform: translateX(1rem); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fade-in-0 {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export { GlobalLoading, GlobalError, ToastContainer };