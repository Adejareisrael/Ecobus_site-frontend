/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ecobus: {
          red: "rgb(var(--ecobus-primary) / <alpha-value>)",
          purple: "rgb(var(--ecobus-secondary) / <alpha-value>)",
          dark: "rgb(var(--ecobus-ink) / <alpha-value>)",
          light: "rgb(var(--ecobus-soft) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
