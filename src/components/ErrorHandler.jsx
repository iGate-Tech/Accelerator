import { createSignal, createEffect, onMount } from "solid-js";
import { activityLogger } from "@lib/business.js";
import { openSupportModal } from "./SupportModal";

// Enhanced error handling system
class ErrorHandler {
  constructor() {
    this.errors = new Map();
    this.listeners = new Set();
  }

  // Handle and display errors with user-friendly messages
  async handleError(error, context = {}, options = {}) {
    const {
      showToast = true,
      logError = true,
      category = 'general',
      recoverable = false,
      recoveryAction = null
    } = options;

    // Create error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Categorize and enhance error message
    const enhancedError = this.enhanceError(error, context, category);

    // Log the error
    if (logError) {
      await activityLogger.logError(category, enhancedError, {
        ...context,
        errorId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }

    // Store error for potential display
    this.errors.set(errorId, {
      ...enhancedError,
      id: errorId,
      timestamp: new Date(),
      recoverable,
      recoveryAction,
      category
    });

    // Show toast notification
    if (showToast && window.toastManager) {
      const toastType = enhancedError.severity === 'error' ? 'error' : 'warning';
      window.toastManager[toastType](enhancedError.userMessage, {
        duration: 5000,
        action: recoverable ? {
          label: 'Get Help',
          onClick: () => {
            openSupportModal(errorId, context);
          }
        } : undefined
      });

      // Show recovery suggestion if available
      if (recoverable && enhancedError.recoverySuggestion) {
        setTimeout(() => {
          window.toastManager.info(enhancedError.recoverySuggestion);
        }, 2000);
      }
    }

    // Notify listeners
    this.notifyListeners();

    return errorId;
  }

  // Enhance error with user-friendly messages and recovery suggestions
  enhanceError(error, context, category) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    const errorCode = error?.code || error?.status;

    let userMessage = 'An unexpected error occurred. Please try again.';
    let recoverySuggestion = 'Try refreshing the page or contact support if the problem persists.';
    let severity = 'error';

    // Categorize errors and provide specific handling
    switch (category) {
      case 'network':
        if (errorMessage.includes('fetch')) {
          userMessage = 'Connection failed. Please check your internet connection.';
          recoverySuggestion = 'Check your internet connection and try again.';
        } else if (errorCode === 429) {
          userMessage = 'Too many requests. Please wait a moment.';
          recoverySuggestion = 'Wait a few minutes before trying again.';
          severity = 'warning';
        } else if (errorCode >= 500) {
          userMessage = 'Server error. Our team has been notified.';
          recoverySuggestion = 'Try again in a few minutes.';
        }
        break;

      case 'auth':
        userMessage = 'Authentication failed. Please log in again.';
        recoverySuggestion = 'Log out and log back in to refresh your session.';
        break;

      case 'validation':
        userMessage = errorMessage; // Validation errors are usually user-friendly
        recoverySuggestion = 'Please check your input and try again.';
        severity = 'warning';
        break;

      case 'ai':
        if (errorMessage.includes('busy') || errorMessage.includes('429')) {
          userMessage = 'AI service is busy. Please try again.';
          recoverySuggestion = 'Wait a moment and try your request again.';
          severity = 'warning';
        } else if (errorMessage.includes('timeout')) {
          userMessage = 'AI request timed out. Please try a shorter request.';
          recoverySuggestion = 'Try with less content or try again later.';
        } else {
          userMessage = 'AI service temporarily unavailable.';
          recoverySuggestion = 'Try again in a few minutes.';
        }
        break;

      case 'storage':
        userMessage = 'Storage operation failed.';
        recoverySuggestion = 'Try clearing your browser cache or use a different browser.';
        break;

      case 'permission':
        userMessage = 'Permission denied for this operation.';
        recoverySuggestion = 'Check your account permissions or contact support.';
        break;

      default:
        // Generic error handling based on error type
        if (errorMessage.includes('timeout')) {
          userMessage = 'Operation timed out. Please try again.';
          recoverySuggestion = 'Try again or contact support if it persists.';
        } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          userMessage = 'Usage limit reached.';
          recoverySuggestion = 'Check your account limits or upgrade your plan.';
          severity = 'warning';
        }
    }

    return {
      originalError: error,
      userMessage,
      recoverySuggestion,
      severity,
      category,
      context,
      errorCode,
      technicalDetails: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    };
  }

  // Get recent errors for debugging/support
  getRecentErrors(limit = 10) {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Clear old errors
  clearOldErrors(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    for (const [id, error] of this.errors) {
      if (error.timestamp < cutoff) {
        this.errors.delete(id);
      }
    }
    this.notifyListeners();
  }

  // Subscribe to error updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.errors));
  }
}

export const errorHandler = new ErrorHandler();

// Error boundary component for catching React-style errors
export const ErrorBoundary = (props) => {
  const [hasError, setHasError] = createSignal(false);
  const [error, setError] = createSignal(null);

  const handleError = (error, errorInfo) => {
    console.error('Error boundary caught an error:', error, errorInfo);
    errorHandler.handleError(error, { boundary: true, ...errorInfo }, {
      category: 'boundary',
      showToast: false
    });
    setError(error);
    setHasError(true);
  };

  // Note: In SolidJS, we would typically use ErrorBoundary from solid-js
  // This is a simplified version for demonstration

  return (
    <div>
      {hasError() ? (
        <div class="error-boundary p-6 bg-error/10 border border-error rounded-lg">
          <h3 class="text-lg font-semibold text-error mb-2">Something went wrong</h3>
          <p class="text-base-content/70 mb-4">
            We encountered an unexpected error. Please refresh the page or contact support.
          </p>
          <div class="flex gap-2">
            <button
              class="btn btn-primary btn-sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            <button
              class="btn btn-outline btn-sm"
              onClick={() => {
                const errorReport = errorHandler.getRecentErrors(1)[0];
                const mailto = `mailto:support@accelerator.app?subject=Error Report&body=${encodeURIComponent(
                  `Error Details:\n${JSON.stringify(errorReport, null, 2)}`
                )}`;
                window.open(mailto);
              }}
            >
              Contact Support
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details class="mt-4">
              <summary class="cursor-pointer text-sm">Technical Details</summary>
              <pre class="text-xs mt-2 p-2 bg-base-200 rounded overflow-auto">
                {error()?.stack || error()?.message || 'No details available'}
              </pre>
            </details>
          )}
        </div>
      ) : (
        props.children
      )}
    </div>
  );
};

// Global error display component
export const GlobalErrorDisplay = () => {
  const [errors, setErrors] = createSignal([]);

  onMount(() => {
    // Subscribe to error updates
    const unsubscribe = errorHandler.subscribe((errorMap) => {
      setErrors(Array.from(errorMap.values()).filter(e => e.severity === 'error'));
    });

    return unsubscribe;
  });

  return (
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors().map((error) => (
        <div
          key={error.id}
          class={`alert alert-error shadow-lg transition-all duration-300 ${
            errors().indexOf(error) > 2 ? 'opacity-0 translate-x-full' : ''
          }`}
        >
          <i data-lucide="alert-triangle" class="w-4 h-4"></i>
          <div class="flex-1">
            <h4 class="font-medium">Error</h4>
            <p class="text-sm">{error.userMessage}</p>
            {error.recoverySuggestion && (
              <p class="text-xs mt-1 opacity-75">{error.recoverySuggestion}</p>
            )}
          </div>
          <div class="flex gap-1">
            {error.recoverable && (
              <button
                class="btn btn-xs btn-primary"
                onClick={() => {
                  openSupportModal(error.id, error.context);
                }}
              >
                Help
              </button>
            )}
            <button
              class="btn btn-xs btn-ghost"
              onClick={() => {
                // Remove this error
                errorHandler.errors.delete(error.id);
                errorHandler.notifyListeners();
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Utility function for consistent error handling
export const handleAsyncError = async (asyncFn, context = {}, options = {}) => {
  try {
    return await asyncFn();
  } catch (error) {
    await errorHandler.handleError(error, context, options);
    throw error; // Re-throw so calling code can handle if needed
  }
};