/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: '#0A0A1A',
        surface: '#1A1A2E',
        violet: '#5A46DA',
        muted: '#8B7FD4',
        blush: '#F5EDED',
      },
      fontFamily: { sans: ['Inter', ...defaultTheme.fontFamily.sans] },
    },
  },
  plugins: [],
}