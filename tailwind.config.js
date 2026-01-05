/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'electrolize': ['Electrolize', 'monospace'],
      },
    },
  },
  plugins: [require('daisyui')],
}