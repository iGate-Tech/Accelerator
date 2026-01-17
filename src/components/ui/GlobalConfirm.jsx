import { createSignal, createEffect, Show } from "solid-js";

const [confirmState, setConfirmState] = createSignal({
  isOpen: false,
  title: "",
  message: "",
  details: "",
  type: "danger",
  icon: null,
  confirmText: null,
  cancelText: null,
  resolve: null
});

let resolveCallback = null;

export const showConfirm = (options) => {
  return new Promise((resolve) => {
    setConfirmState({
      isOpen: true,
      title: options.title || "Confirm Action",
      message: options.message || "Are you sure you want to proceed?",
      details: options.details || "",
      type: options.type || "danger",
      icon: options.icon || null,
      confirmText: options.confirmText || null,
      cancelText: options.cancelText || null,
      resolve: resolve
    });
  });
};

export const confirmDelete = (itemName, details = "") => {
  return showConfirm({
    title: "Delete Confirmation",
    message: `Are you sure you want to delete "${itemName}"?`,
    details: details || "This action cannot be undone.",
    type: "danger",
    icon: "trash-2",
    confirmText: "Delete",
    cancelText: "Cancel"
  });
};

export const confirmLogout = () => {
  return showConfirm({
    title: "Logout",
    message: "Are you sure you want to log out?",
    type: "info",
    icon: "log-out",
    confirmText: "Logout",
    cancelText: "Cancel"
  });
};

export const confirmReset = (title, message, details = "") => {
  return showConfirm({
    title: title,
    message: message,
    details: details,
    type: "warning",
    icon: "refresh-cw",
    confirmText: "Reset",
    cancelText: "Cancel"
  });
};

export const confirmDanger = (title, message, details = "") => {
  return showConfirm({
    title: title,
    message: message,
    details: details,
    type: "danger",
    icon: "alert-triangle",
    confirmText: "Continue",
    cancelText: "Cancel"
  });
};

const ConfirmModal = () => {
  const handleConfirm = () => {
    if (confirmState().resolve) {
      confirmState().resolve(true);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (confirmState().resolve) {
      confirmState().resolve(false);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  createEffect(() => {
    if (confirmState().isOpen && window.lucide) {
      setTimeout(() => window.lucide.createIcons(), 50);
    }
  });

  const getIconSvg = (iconName, className) => {
    const icons = {
      "trash-2": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
      "log-out": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
      "refresh-cw": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
      "alert-triangle": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`
    };
    return icons[iconName] || "";
  };

  return (
    <Show when={confirmState().isOpen}>
      <div class="modal modal-open">
        <div class="modal-box relative">
          <button
            onClick={handleCancel}
            class="btn btn-sm btn-circle btn-ghost absolute end-2 top-2"
          >
            ✕
          </button>
          
          <div class="flex items-start gap-4">
            <div class={`p-3 rounded-full ${confirmState().type === 'danger' ? 'bg-error/20' : 'bg-warning/20'}`}>
              <div 
                class={`w-6 h-6 ${confirmState().type === 'danger' ? 'text-error' : 'text-warning'}`}
                innerHTML={getIconSvg(confirmState().icon || "alert-triangle", "")}
              />
            </div>
            
            <div class="flex-1">
              <h3 class="font-bold text-lg mb-2">{confirmState().title}</h3>
              <p class="text-base-content/70">{confirmState().message}</p>
              
              <Show when={confirmState().details}>
                <div class="mt-3 p-3 bg-base-200 rounded-lg">
                  <p class="text-sm font-medium">{confirmState().details}</p>
                </div>
              </Show>
            </div>
          </div>

          <div class="modal-action mt-6">
            <button
              class="btn btn-ghost"
              onClick={handleCancel}
            >
              {confirmState().cancelText || "Cancel"}
            </button>
            <button
              class={`btn ${confirmState().type === 'danger' ? 'btn-error' : 'btn-primary'}`}
              onClick={handleConfirm}
            >
              {confirmState().confirmText || "Confirm"}
            </button>
          </div>
        </div>
        
        <div
          class="modal-backdrop bg-black/50"
          onClick={handleCancel}
        ></div>
      </div>
    </Show>
  );
};

export default ConfirmModal;
