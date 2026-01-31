import { createSignal, createEffect } from 'solid-js';
import { errorHandler } from '@components/utilities/ErrorHandler';

// Custom hook for error handling in components
export const useErrorHandler = () => {
  const [errors, setErrors] = createSignal([]);

  // Subscribe to global errors
  createEffect(() => {
    const unsubscribe = errorHandler.subscribe(errorMap => {
      const componentErrors = Array.from(errorMap.values());
      setErrors(componentErrors);
    });

    return unsubscribe;
  });

  const handleError = async (error, context = {}, options = {}) => {
    return await errorHandler.handleError(error, context, options);
  };

  const clearError = errorId => {
    errorHandler.errors.delete(errorId);
    errorHandler.notifyListeners();
  };

  const getErrorsByCategory = category => {
    return errors().filter(error => error.category === category);
  };

  const hasErrors = (category = null) => {
    if (category) {
      return getErrorsByCategory(category).length > 0;
    }
    return errors().length > 0;
  };

  return {
    errors,
    handleError,
    clearError,
    getErrorsByCategory,
    hasErrors,
  };
};

// Error boundary for SolidJS components
export const createErrorBoundary = fallback => {
  return props => {
    const [error, setError] = createSignal(null);

    // In SolidJS, error boundaries are handled differently
    // This is a simplified implementation
    try {
      return props.children;
    } catch (err) {
      errorHandler.handleError(
        err,
        { boundary: true },
        { category: 'boundary' }
      );
      setError(err);
      return fallback ? (
        fallback(err)
      ) : (
        <div class="error-fallback bg-error/10 border-error rounded border p-4">
          <h3 class="text-error font-semibold">Something went wrong</h3>
          <p>Please refresh the page or contact support.</p>
        </div>
      );
    }
  };
};

// Utility for async operations with error handling
export const withErrorHandling = (asyncFn, errorOptions = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      await errorHandler.handleError(error, {}, errorOptions);
      throw error;
    }
  };
};
