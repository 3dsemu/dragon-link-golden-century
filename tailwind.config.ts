import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: '#FFD700',
        'gold-dark': '#B8860B',
        'red-dragon': '#DC143C',
        'deep-red': '#8B0000',
        'bg-dark': '#0a0a1a',
        'bg-panel': '#1a0a2e',
        'reel-bg': '#0d0d2b',
      },
      fontFamily: {
        game: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 0.5s ease-in-out infinite',
        'fireball-pulse': 'fireballPulse 1.5s ease-in-out infinite',
        'jackpot-flash': 'jackpotFlash 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
