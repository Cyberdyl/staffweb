/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      spacing: {
        4.5: '1.125rem',
      },
      colors: {
        night: {
          950: '#070a14',
          900: '#0b1020',
          850: '#0f1528',
          800: '#141b33',
          700: '#1c2541',
          600: '#273253',
        },
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a6ff',
          500: '#3385ff',
          600: '#1f66f5',
          700: '#1a50e0',
          800: '#1c43b5',
          900: '#1d3c8f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(51,133,255,0.15), 0 12px 40px -12px rgba(51,133,255,0.35)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
