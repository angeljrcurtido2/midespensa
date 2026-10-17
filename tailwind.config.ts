import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    "./node_modules/tailwind-datepicker-react/dist/**/*.js",
  ],

  theme: {
    extend: {
      /**
       * Breakpoints personalizados
       */
      screens: {
        '2xl-plus': '1914px', // >= 1914px
      },

      /**
       * Tamaños máximos reutilizables
       */
      maxWidth: {
        'layout-2xl': '1920px',
      },

      maxHeight: {
        'modal-2xl': '700px',
      },
    },
  },

  plugins: [],
};

export default config;
