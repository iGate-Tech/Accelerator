import { render } from 'solid-js/web';
import App from './App';
import { LoggerProvider } from './context/LoggerContext';
import { dataEncryption } from './lib/auth/security.js';
import './assets/styles/input.css';
import './lib/vendor/lucide.js';
import 'animate.css';

// Clean up any corrupted localStorage data on startup
dataEncryption.cleanupCorruptedData();

render(() => (
  <LoggerProvider>
    <App />
  </LoggerProvider>
), document.getElementById('root'));