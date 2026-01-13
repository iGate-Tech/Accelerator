// Simple logger wrapper
const logger = {
  trace: (...args) => console.log('[TRACE]', ...args),
  debug: (...args) => console.log('[DEBUG]', ...args),
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => {
    console.warn('[WARN]', ...args);
    // Send warnings to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureMessage(args.join(' '), 'warning');
    }
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
    // TODO: Send errors to Sentry when implemented
  },
};

export default logger;

// Logger is always at info level equivalent