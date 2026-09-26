/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#fbf7ee',
          card: '#fffdf9',
          panel: '#f5efdf',
          subpanel: '#f4ebd9',
          header: '#f4ebd9',
          border: '#d6c7ab',
          'border-light': '#e4d9c0',
          text: '#2c221e',
          dark: '#3c2415',
          muted: '#6b5a4b',
          amber: '#b45309',
          'amber-hover': '#92400e',
          'amber-dark': '#8b5e34',
          'amber-light': '#fef3c7',
          badge: '#fbf3de'
        }
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"PingFang TC"', '"Microsoft JhengHei"', '"微軟正黑體"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Cinzel"', '"Noto Serif TC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        fu: ['"Fabula Ultima Icons"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
