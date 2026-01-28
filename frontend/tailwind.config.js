/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nude: {
          50: '#FAF8F6',
          100: '#F5F1ED',
          200: '#EBE3DB',
          300: '#DDD1C5',
          400: '#C9B8A8',
          500: '#B39F8F',
          600: '#9A8574',
          700: '#7D6B5C',
          800: '#5F5149',
          900: '#423A34',
        },
        cream: {
          50: '#FFFEF9',
          100: '#FFFCF0',
          200: '#FFF8E1',
          300: '#FFF3D0',
          400: '#FFEDB8',
          500: '#FFE69F',
          600: '#F5D889',
          700: '#E0C470',
          800: '#C7AB5C',
          900: '#A18C47',
        },
        sand: {
          50: '#FBF9F7',
          100: '#F7F4F0',
          200: '#EFE8E0',
          300: '#E5D9CC',
          400: '#D4C2B0',
          500: '#C0AA94',
          600: '#A89279',
          700: '#8B7862',
          800: '#6D5F4C',
          900: '#504739',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}