/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#2a2a2a",
        input: "#2a2a2a",
        ring: "#00a86b",
        background: "#0f0f0f",
        foreground: "#f1f5f9",
        primary: {
          DEFAULT: "#00a86b",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#d4af37",
          foreground: "#0f0f0f",
        },
        destructive: {
          DEFAULT: "#ff5152",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#333333",
          foreground: "#888888",
        },
        accent: {
          DEFAULT: "#00a86b",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#1a1a1a",
          foreground: "#f1f5f9",
        },
        card: {
          DEFAULT: "#1a1a1a",
          foreground: "#f1f5f9",
        },
        "racing-green": "#00a86b",
        "kalshi-red": "#ff5152",
        gold: "#d4af37",
        "price-up": "#00a86b",
        "price-down": "#ff5152",
        "price-neutral": "#888888",
        "bet-yes": "#00a86b",
        "bet-yes-foreground": "#ffffff",
        "bet-no": "#ff5152",
        "bet-no-foreground": "#ffffff",
        elevated: "#222222",
        "kalshi-gray": {
          50: "#f7f7f7",
          100: "#e3e3e3",
          200: "#c8c8c8",
          300: "#a4a4a4",
          400: "#818181",
          500: "#666666",
          600: "#515151",
          700: "#434343",
          800: "#383838",
          900: "#2a2a2a",
          950: "#1a1a1a",
        },
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-up": "slide-in-up 0.25s ease-out",
        "pulse-live": "pulse-live 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
