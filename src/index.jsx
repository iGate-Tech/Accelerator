import { render } from 'solid-js/web';
import App from './App';
import { LoggerProvider } from './context/LoggerContext';
import './assets/input.css';
import './lib/lucide.js';
import 'animate.css';


// Analytics setup (optional)
try {
  // Dynamic import for analytics - will only load if GA_TRACKING_ID is available
  import('./lib/analytics.js').then(({ initAnalytics }) => {
    // initAnalytics will handle checking for GA_TRACKING_ID internally
    initAnalytics();
  });
} catch (error) {
  console.log('Analytics not configured');
}

render(() => (
  <LoggerProvider>
    <App />
  </LoggerProvider>
), document.getElementById('root'));