/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ninja: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          500: '#8c593e',
          600: '#6f3f27',
          700: '#532f1d',
          800: '#3d2214',
          900: '#25140b',
        }
      }
    },
  },
  plugins: [],
}
