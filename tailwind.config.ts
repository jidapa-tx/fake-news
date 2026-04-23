import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',
          light: '#3B82F6',
          dark: '#1D4ED8',
        },
        danger: '#DC2626',
        verified: '#059669',
        warning: '#D97706',
        uncertain: '#CA8A04',
        likely: '#65A30D',
      },
      fontFamily: {
        sans: ['IBM Plex Sans Thai', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
