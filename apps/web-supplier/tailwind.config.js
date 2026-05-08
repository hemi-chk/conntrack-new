/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3B82F6',
          DEFAULT: '#1E40AF', // ConTrack Brand Blue
          dark: '#1E3A8A',
        },
        dark: {
          DEFAULT: '#1E293B', // Deep text color
          light: '#334155',
          dark: '#0F172A',
        },
        surface: {
          light: '#00ff00', // Page background
          DEFAULT: '#FFFFFF', // Card background
        },
        success: '#16A34A',
        error: '#DC2626',
        warning: '#EA580C',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
