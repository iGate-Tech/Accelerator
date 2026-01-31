/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./public/settings-modal-prototype.html",
    "./settings-modal.html",
    "./settings-modal.html2",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['IBM Plex Sans Arabic', 'sans-serif'],
        sans: ['IBM Plex Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}