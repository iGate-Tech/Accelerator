// Simple logger wrapper
const logger = {
  trace: () => {},
  debug: () => {},
  info: () => {},
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