// theme.js - Theme functionality

const themeController = document.getElementById('theme-controller');
const html = document.documentElement;
console.log('theme.js loaded, themeController:', themeController);

// Set up event listeners
if (themeController) {
  console.log('Adding theme change listener');
  themeController.addEventListener('change', () => {
    const isChecked = themeController.checked;
    const newTheme = isChecked ? 'dark' : 'light';
    console.log('Theme change detected, new theme:', newTheme);
    // Immediately update UI for instant reactivity
    html.setAttribute('data-theme', newTheme);
    console.log('Set html data-theme to:', newTheme);
    // Persist to localStorage
    localStorage.setItem('theme', newTheme);
    console.log('Theme saved to localStorage');
  });
} else {
  console.warn('themeController not found, cannot add listener');
}

// Load initial settings from localStorage
const initialTheme = localStorage.getItem('theme') || 'light';
console.log('Initial theme from localStorage:', initialTheme);
html.setAttribute('data-theme', initialTheme);
if (themeController) {
  themeController.checked = initialTheme === 'dark';
}

// Storage event listener for cross-tab sync
window.addEventListener('storage', (e) => {
  console.log('Storage event:', e.key, e.oldValue, '->', e.newValue);
  if (e.key === 'theme') {
    const theme = e.newValue;
    console.log('Applying theme from storage:', theme);
    html.setAttribute('data-theme', theme);
    if (themeController) {
      themeController.checked = theme === 'dark';
      console.log('Updated themeController checked');
    }
  }
});