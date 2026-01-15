import { render } from 'solid-js/web';
import App from './App';
import { LoggerProvider } from './context/LoggerContext';
import './assets/input.css';
import './lib/lucide.js';
import 'animate.css';


render(() => (
  <LoggerProvider>
    <App />
  </LoggerProvider>
), document.getElementById('root'));