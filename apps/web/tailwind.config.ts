import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        stroke: "rgb(var(--stroke) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentSoft: "rgb(var(--accent-soft) / <alpha-value>)",
        accentAlt: "rgb(var(--accent-alt) / <alpha-value>)"
      },
      boxShadow: {
        float: "0 20px 60px rgba(15, 23, 42, 0.18)"
      },
      fontFamily: {
        display: [
          "var(--font-display)"
        ],
        body: [
          "var(--font-body)"
        ]
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.24), transparent 38%), radial-gradient(circle at 85% 10%, rgba(59, 130, 246, 0.18), transparent 32%), radial-gradient(circle at 60% 80%, rgba(249, 115, 22, 0.18), transparent 30%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

