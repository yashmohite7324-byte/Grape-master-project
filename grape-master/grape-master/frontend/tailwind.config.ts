import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F3',
        ink: '#1A2420',
        muted: '#5B6660',
        line: '#E6E1D6',
        vine: {
          DEFAULT: '#1F6B4A',
          deep: '#164A34',
          soft: '#E7F0EA',
        },
        grape: {
          DEFAULT: '#6B3A5B',
          soft: '#F1E8EE',
        },
        harvest: {
          DEFAULT: '#B4741F',
          soft: '#F6ECDA',
        },
        danger: {
          DEFAULT: '#A5342B',
          soft: '#F6E3E1',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,36,32,0.04), 0 8px 24px -12px rgba(26,36,32,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
