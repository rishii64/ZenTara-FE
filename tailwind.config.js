/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Material & Parekh Textile Palette: Ember, Saffron, Ivory & Deep Ink
        ember: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ea580c',
          600: '#c25e2e', // Parekh primary terracotta ember
          700: '#b45309',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        saffron: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        ivory: {
          50: '#ffffff',
          100: '#fdfbf7', // Authentic warm textile cream
          200: '#f8f4eb',
          300: '#f1ebd9',
          400: '#e4d8c0',
          500: '#cbbba1',
        },
        ink: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          700: '#342f2b',
          800: '#26221f',
          850: '#1d1916',
          900: '#151311', // Deep warm espresso ink
          950: '#0d0b0a',
        },
        // Brand maps to warm ember palette
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#c25e2e',
          600: '#b45309',
          700: '#9a3412',
          800: '#7c2d12',
          900: '#431407',
          950: '#2a0c04',
        },
        dark: {
          700: '#342f2b',
          800: '#26221f',
          850: '#1d1916',
          900: '#151311',
          950: '#0d0b0a',
        }
      },
      boxShadow: {
        'mat-1': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'mat-2': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'mat-3': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'mat-dark-1': '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.35)',
        'mat-dark-2': '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.45)',
        'ember-glow': '0 0 25px -4px rgba(194, 94, 46, 0.35)',
      }
    },
  },
  plugins: [],
}
