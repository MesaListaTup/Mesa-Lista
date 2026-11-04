/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Los valores viven en globals.css (:root = landing, .panel-theme = panel admin)
        papel: 'rgb(var(--papel) / <alpha-value>)',
        tinta: 'rgb(var(--tinta) / <alpha-value>)',
        tomate: 'rgb(var(--tomate) / <alpha-value>)',
        sifon: 'rgb(var(--sifon) / <alpha-value>)',
        limon: 'rgb(var(--limon) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};