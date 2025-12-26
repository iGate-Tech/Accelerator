/** @type {import('tailwindcss').Config} */
export default {
  content: ["./lib/**/*.hbs"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Newsreader", "serif"],
      },
      colors: {
        brand: {
          purple: "#9E28B5",
          dark: "#050505",
          panel: "#0F110E",
        },
        primary: {
          50: "hsl(290 20% 96%)",
          100: "hsl(290 35% 92%)",
          200: "hsl(290 48% 82%)",
          300: "hsl(290 58% 70%)",
          400: "hsl(290 64% 58%)",
          500: "hsl(290 64% 43%)",
          600: "hsl(290 68% 36%)",
          700: "hsl(290 72% 28%)",
          800: "hsl(290 72% 20%)",
          900: "hsl(290 72% 14%)",
        },
        secondary: {
          200: "hsl(260 36% 92%)",
          500: "hsl(260 56% 44%)",
          700: "hsl(260 66% 28%)",
        },
        accent: {
          200: "hsl(200 36% 92%)",
          500: "hsl(200 56% 43%)",
          700: "hsl(200 66% 28%)",
        },
        neutral: {
          DEFAULT: "hsl(290 10% 50%)",
          muted: "hsl(290 8% 40%)",
          border: "hsl(290 8% 88%)",
        },
        base: {
          100: "hsl(0 0% 100%)",
          200: "hsl(0 0% 98%)",
          300: "hsl(0 0% 96%)",
        },
        info: "hsl(217 91% 60%)",
        success: "hsl(142 76% 36%)",
        warning: "hsl(38 92% 50%)",
        error: "hsl(0 84% 60%)",
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(circle at 70% 50%, rgba(158, 40, 181, 0.25) 0%, rgba(5, 5, 5) 0%, rgba(5, 5, 5) 60%)",
      },
      animation: {
        beam: "beam 3s linear infinite",
        "spin-slow": "spin 12s linear infinite",
        "spin-slow-reverse": "spin 15s linear infinite reverse",
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        beam: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },

  plugins: [require("tailwindcss-rtl")],
};
