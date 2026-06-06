import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cozy fantasy palette
        cream: {
          50: "#fffdf7",
          100: "#fdf6e9",
          200: "#f8ecd2",
        },
        lavender: {
          100: "#efeafc",
          200: "#ddd4f7",
          300: "#c4b5f0",
          400: "#a78bea",
          500: "#8b66e0",
          600: "#7048c9",
          700: "#5a36a8",
        },
        sky: {
          softer: "#e8f2ff",
        },
        gold: {
          300: "#f5d98b",
          400: "#eec45c",
          500: "#e0a92e",
          600: "#bf8a1b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(124, 92, 200, 0.25)",
        glow: "0 0 24px -4px rgba(167, 139, 234, 0.5)",
        card: "0 4px 24px -8px rgba(80, 70, 120, 0.18)",
      },
      backgroundImage: {
        "aurora":
          "radial-gradient(1200px 600px at 10% -10%, rgba(167,139,234,0.25), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(120,180,255,0.22), transparent), radial-gradient(900px 600px at 50% 110%, rgba(245,217,139,0.18), transparent)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "float": "float 4s ease-in-out infinite",
        "shimmer": "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
