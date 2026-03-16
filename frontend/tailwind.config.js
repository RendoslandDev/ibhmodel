/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C8963E',
          light: '#E8B96A',
          pale: '#F5E9D5',
          muted: 'rgba(200,150,62,0.3)',
        },
        ibh: {
          dark: '#0D0D0D',
          'dark-2': '#141414',
          'dark-3': '#1A1A1A',
          'dark-4': '#252525',
          cream: '#FAF7F2',
          text: '#E8E0D0',
          muted: '#888070',
        },
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.4,0,0.2,1) both',
        'fade-in': 'fadeIn 0.5s ease both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gold-shimmer': 'linear-gradient(90deg, #C8963E 25%, #E8B96A 50%, #C8963E 75%)',
      },
    },
  },
  plugins: [],
};
