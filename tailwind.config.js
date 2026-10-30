/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#faf5ec',
          200: '#f3e9d6',
        },
        navy: {
          900: '#0f1f33',
          800: '#162943',
          700: '#1f3a5f',
          600: '#2b4a73',
          500: '#3a5c8a',
        },
        teal: {
          50: '#eefbf9',
          100: '#d4f5ef',
          200: '#a9ebdf',
          300: '#73daca',
          400: '#41c4b0',
          500: '#2aa89a',
          600: '#1f8780',
          700: '#1d6b69',
          800: '#1b5654',
          900: '#184645',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        success: {
          500: '#2aa89a',
        },
        warning: {
          500: '#f59e0b',
        },
        error: {
          500: '#dc4c4c',
          600: '#c63838',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(15, 31, 51, 0.08), 0 4px 16px -4px rgba(15, 31, 51, 0.06)',
        card: '0 1px 3px rgba(15, 31, 51, 0.06), 0 1px 2px rgba(15, 31, 51, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
