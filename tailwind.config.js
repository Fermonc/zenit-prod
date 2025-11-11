
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'zenit-dark': '#1A1A2E',
        'zenit-light': '#2A2A4E',
        'zenit-primary': '#8A2BE2',
        'zenit-accent': '#F8B400',
        'zenit-success': '#00B894',
        'zenit-error': '#D63031',
      }
    },
  },
  plugins: [],
}
