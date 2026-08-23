/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2E6F73',
          'primary-dark': '#23575A',
          'primary-light': '#3B898E',
          secondary: '#79B8A4',
          'secondary-dark': '#5DA58E',
          'secondary-light': '#9AC8B9',
          bg: '#F7FAF9',
          'bg-dark': '#12181B',
          surface: '#FFFFFF',
          'surface-dark': '#1E262B',
          'surface-card': '#FFFFFF',
          'surface-card-dark': '#253037',
          highlight: '#DDEFE9',
          'highlight-dark': '#23383B',
          text: '#1F2933',
          'text-dark': '#F0F4F8',
          muted: '#66737D',
          'muted-dark': '#9AA5B1',
          warning: '#D97757',
          error: '#B94A48',
          border: '#DCE5E2',
          'border-dark': '#2D3740',
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
