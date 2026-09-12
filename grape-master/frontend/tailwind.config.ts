import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        vine: {
          DEFAULT: '#10b981', // Emerald 500
          deep: '#047857',    // Emerald 700
          soft: '#d1fae5',    // Emerald 100
        },
        grape: {
          DEFAULT: '#8b5cf6', // Violet 500
          deep: '#6d28d9',    // Violet 700
          soft: '#ede9fe',    // Violet 100
        },
        harvest: '#f59e0b',
        ink: '#0f172a',       // Slate 900
        paper: '#f8fafc',     // Slate 50
        muted: '#64748b',     // Slate 500
        line: '#e2e8f0',      // Slate 200
        danger: {
          DEFAULT: '#ef4444',
          soft: '#fee2e2',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      },
      boxShadow: {
        'card': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      borderRadius: {
        'card': '1.25rem',
      }
    },
  },
  plugins: [],
};
export default config;
