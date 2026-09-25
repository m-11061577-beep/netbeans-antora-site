/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        night: {
          950: "#05070a",
          900: "#0a0d12",
          800: "#10151d",
          700: "#1a2230",
          600: "#273244",
        },
        ember: {
          300: "#ffb56b",
          400: "#ff9e3d",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        volt: {
          300: "#7df9c1",
          400: "#34d399",
          500: "#10b981",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(249,115,22,0.35)",
        glowlg: "0 0 60px rgba(249,115,22,0.25)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        flicker: "flicker 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
