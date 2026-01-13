import { render } from 'solid-js/web';
import App from './App';
import { LoggerProvider } from './context/LoggerContext';
import './assets/input.css';
import './lib/lucide.js';
import 'animate.css';


// TODO: Add error tracking (Sentry)
// import * as Sentry from "@sentry/browser";
// Sentry.init({ dsn: process.env.SENTRY_DSN });

// TODO: Add analytics (Google Analytics or Mixpanel)
// import { initAnalytics } from './lib/analytics';
// initAnalytics(process.env.GA_TRACKING_ID);

render(() => (
  <LoggerProvider>
    <App />
  </LoggerProvider>
), document.getElementById('root'));