/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0E0F13',
          900: '#14161C',
          800: '#161922',
          700: '#1E2230',
          600: '#262B3A',
          500: '#3A4156',
        },
        gold: {
          DEFAULT: '#E8B547',
          soft: '#F0C76A',
          dim: '#9C7A2E',
        },
        teal: {
          DEFAULT: '#4A9D8C',
          dim: '#2E6B5E',
        },
        crimson: '#D9534F',
        paper: '#F5F1E8',
        muted: '#8B8680',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
}
