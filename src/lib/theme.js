/**
 * Theme utility functions
 */

/**
 * Gets the system's preferred theme based on media query
 * @returns {string} 'dark' or 'light'
 */
export function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return darkModeMediaQuery.matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Applies the theme to the document
 * @param {string} theme - 'light', 'dark', or 'auto'
 */
export function applyTheme(theme) {
  let actualTheme = theme;

  if (theme === 'auto') {
    actualTheme = getSystemTheme();
  }

  document.documentElement.setAttribute('data-theme', actualTheme);

  // Update theme controllers if they exist
  const themeControllers = document.querySelectorAll('.theme-controller');
  themeControllers.forEach(controller => {
    if (controller.type === 'checkbox') {
      // For checkboxes, we want to check if the actual theme is dark
      controller.checked = actualTheme === 'dark';
    } else if (controller.tagName === 'SELECT') {
      // For select elements, we want to preserve the user's selection (including 'auto')
      controller.value = theme;
    }
  });

  // Save to localStorage - store the user's preference, not the resolved theme
  localStorage.setItem('theme', theme);
}

/**
 * Initializes the theme based on saved preference or system preference
 */
export function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Listen for system theme changes if using auto theme
  if (savedTheme === 'auto' && typeof window !== 'undefined' && window.matchMedia) {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', () => {
      if (localStorage.getItem('theme') === 'auto') {
        // When system theme changes, update the actual theme without changing the user's preference
        const newActualTheme = getSystemTheme();
        document.documentElement.setAttribute('data-theme', newActualTheme);
      }
    });
  }
}