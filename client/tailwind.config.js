/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        'surface': '#FAFAFA',
        'border-subtle': '#E5E5E5',
        'text-primary': '#111111',
        'text-secondary': '#737373',
        'brand-black': '#111111',
        'brand-hover': '#262626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
