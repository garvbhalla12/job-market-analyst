/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#070a13',
          900: '#0b1020',
          800: '#101729',
          700: '#161f36',
          600: '#1f2a47',
        },
        brand: {
          purple: '#8b5cf6',
          blue: '#3b82f6',
          cyan: '#22d3ee',
        },
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(139,92,246,0.35), 0 8px 30px -10px rgba(139,92,246,0.35)',
      },
    },
  },
  plugins: [],
};
