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
        border: "#1f2d40",
        input: "#1f2d40",
        ring: "#00a86b",
        background: "#0a0e17",
        foreground: "#f1f5f9",
        primary: {
          DEFAULT: "#00a86b",
          foreground: "#f1f5f9",
        },
        secondary: {
          DEFAULT: "#d4af37",
          foreground: "#0a0e17",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#f1f5f9",
        },
        muted: {
          DEFAULT: "#475569",
          foreground: "#94a3b8",
        },
        accent: {
          DEFAULT: "#00a86b",
          foreground: "#0a0e17",
        },
        popover: {
          DEFAULT: "#1a2235",
          foreground: "#f1f5f9",
        },
        card: {
          DEFAULT: "#111827",
          foreground: "#f1f5f9",
        },
        "racing-green": "#00a86b",
        gold: "#d4af37",
        "price-up": "#22c55e",
        "price-down": "#ef4444",
        "price-neutral": "#94a3b8",
        "bet-yes": "#22c55e",
        "bet-yes-foreground": "#f1f5f9",
        "bet-no": "#ef4444",
        "bet-no-foreground": "#f1f5f9",
        elevated: "#1a2235",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
