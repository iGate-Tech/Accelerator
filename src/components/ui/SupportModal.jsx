import { createSignal, createEffect, Show } from "solid-js";
import { errorHandler } from "./ErrorHandler";

const SupportModal = () => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [errorReport, setErrorReport] = createSignal(null);
  const [message, setMessage] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Listen for support requests
  createEffect(() => {
    const handleSupportRequest = (event) => {
      const { errorId, context } = event.detail || {};
      if (errorId) {
        const errors = errorHandler.getRecentErrors();
        const error = errors.find(e => e.id === errorId);
        if (error) {
          setErrorReport(error);
        }
      }
      setIsOpen(true);
    };

    window.addEventListener('openSupportModal', handleSupportRequest);
    return () => window.removeEventListener('openSupportModal', handleSupportRequest);
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supportData = {
        message: message(),
        errorReport: errorReport(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: 'anonymous' // In a real app, this would be the actual user ID
      };

      // In a real application, this would send to a support API
      // For now, we'll create a mailto link
      const subject = 'Support Request - Accelerator App';
      const body = `
Support Request Details:

Message: ${message()}

Error Report: ${errorReport() ? JSON.stringify(errorReport(), null, 2) : 'No error report'}

Technical Information:
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}

Please help resolve this issue.
      `.trim();

      const mailto = `mailto:support@accelerator.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailto);

      setIsOpen(false);
      setMessage('');
      setErrorReport(null);

      // Show success message
      if (window.toastManager) {
        window.toastManager.success('Support request opened in your email client');
      }

    } catch (error) {
      await errorHandler.handleError(error, { action: 'support_submission' }, {
        category: 'general',
        showToast: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class={`modal ${isOpen() ? 'modal-open' : ''}`}>
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">
          <i data-lucide="help-circle" class="w-5 h-5 inline mr-2"></i>
          Contact Support
        </h3>

        <Show when={errorReport()}>
          <div class="alert alert-info mb-4">
            <i data-lucide="info" class="w-4 h-4"></i>
            <div>
              <h4 class="font-medium">Error Report Included</h4>
              <p class="text-sm">Technical details about your issue have been automatically included.</p>
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
            onInput={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>

        <div class="modal-action">
          <button
            class="btn btn-ghost"
            onClick={() => setIsOpen(false)}
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
              <span class="loading loading-spinner loading-sm mr-2"></span>
            </Show>
            Send Support Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;