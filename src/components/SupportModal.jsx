import { createSignal, createEffect, Show } from 'solid-js';
import { errorHandler } from './ErrorHandler';

// Global state for support modal
const [supportModalState, setSupportModalState] = createSignal({
  isOpen: false,
  errorReport: null,
});

// Export function to open the modal from anywhere
export const openSupportModal = (errorId, context = null) => {
  if (errorId) {
    const errors = errorHandler.getRecentErrors();
    const error = errors.find(e => e.id === errorId);
    if (error) {
      setSupportModalState({
        isOpen: true,
        errorReport: error,
      });
    }
  } else {
    setSupportModalState({
      isOpen: true,
      errorReport: null,
    });
  }
};

const SupportModal = () => {
  const [message, setMessage] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Access the global state
  const state = supportModalState();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supportData = {
        message: message(),
        errorReport: state.errorReport,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: 'anonymous', // In a real app, this would be the actual user ID
      };

      // In a real application, this would send to a support API
      // For now, we'll create a mailto link
      const subject = 'Support Request - Accelerator App';
      const body = `
Support Request Details:

Message: ${message()}

Error Report: ${state.errorReport ? JSON.stringify(state.errorReport, null, 2) : 'No error report'}

Technical Information:
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}

Please help resolve this issue.
      `.trim();

      const mailto = `mailto:support@accelerator.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto);

      // Close the modal
      setSupportModalState({
        isOpen: false,
        errorReport: null,
      });

      setMessage('');

      // Show success message
      if (window.toastManager) {
        window.toastManager.success(
          'Support request opened in your email client'
        );
      }
    } catch (error) {
      await errorHandler.handleError(
        error,
        { action: 'support_submission' },
        {
          category: 'general',
          showToast: true,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class={`modal ${state.isOpen ? 'modal-open' : ''}`}>
      <div class="modal-box max-w-lg">
        <h3 class="mb-4 text-lg font-bold">
          <i data-lucide="help-circle" class="mr-2 inline h-5 w-5" />
          Contact Support
        </h3>

        <Show when={state.errorReport}>
          <div class="alert alert-info mb-4">
            <i data-lucide="info" class="h-4 w-4" />
            <div>
              <h4 class="font-medium">Error Report Included</h4>
              <p class="text-sm">
                Technical details about your issue have been automatically
                included.
              </p>
            </div>
          </div>
        </Show>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Describe your issue</span>
          </label>
          <textarea
            class="textarea textarea-bordered h-24"
            placeholder="Please describe what happened and what you were trying to do..."
            value={message()}
            onInput={e => setMessage(e.target.value)}
          />
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            onClick={() =>
              setSupportModalState({
                isOpen: false,
                errorReport: null,
              })
            }
            disabled={isSubmitting()}
          >
            Cancel
          </button>
          <button
            class="btn btn-primary"
            onClick={handleSubmit}
            disabled={!message().trim() || isSubmitting()}
          >
            <Show when={isSubmitting()}>
              <span class="loading loading-spinner loading-sm mr-2" />
            </Show>
            Send Support Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
