/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c2733',
        navy: {
          50: '#f0f5fa', 100: '#dce8f3', 200: '#bcd5e9', 300: '#8fb9d8',
          400: '#5c98c3', 500: '#3a7dab', 600: '#2b6488', 700: '#24506e',
          800: '#134e78', 900: '#16344a', 950: '#0f2434'
        },
        saffron: { 400: '#f4b41a', 500: '#e8a00c', 600: '#c78307' }
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', '"Noto Sans"', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,42,67,.06), 0 1px 6px rgba(16,42,67,.05)'
      }
    }
  },
  plugins: []
}
