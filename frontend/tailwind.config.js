/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0e5aa7',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0e5aa7',
          600: '#0c4f96',
          700: '#0a4385',
        },
        accent: {
          DEFAULT: '#e15541',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#e15541',
          600: '#dc2626',
          700: '#b91c1c',
        },
        success: {
          DEFAULT: '#059669',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#059669',
          600: '#047857',
          700: '#065f46',
        },
        warning: {
          DEFAULT: '#d97706',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
        },
        danger: {
          DEFAULT: '#dc2626',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
