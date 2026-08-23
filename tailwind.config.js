/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1320px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E7477',
          dark: '#20595C',
          light: '#DDEFEA',
          muted: '#B8DBD7',
        },
        secondary: {
          DEFAULT: '#79B8A4',
          light: '#E4F2EC',
        },
        bg: {
          DEFAULT: '#F5F8F7',
          dark: '#111718',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#EEF4F2',
          dark: '#1A2325',
          'dark-sec': '#232F31',
        },
        content: {
          primary: '#172B2D',
          secondary: '#607174',
          muted: '#8A9A9D',
          dark: '#F0F5F5',
          'dark-sec': '#9CB0B3',
        },
        appBorder: {
          DEFAULT: '#D8E3E0',
          strong: '#BDCCC8',
          dark: '#2D3D40',
        },
        appSuccess: {
          DEFAULT: '#428568',
          light: '#E8F5EF',
        },
        appWarning: {
          DEFAULT: '#D47754',
          light: '#FDF2EC',
        },
        appError: {
          DEFAULT: '#B84C4C',
          light: '#FDF0F0',
        },
        appInfo: {
          DEFAULT: '#426E91',
          light: '#EDF4F9',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
