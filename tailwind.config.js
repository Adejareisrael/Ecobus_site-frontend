/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ecobus: {
          red: "#DC2626",      // modern transport red (bold, premium)
          purple: "#7C3AED",   // accent / secondary brand color
          dark: "#0F172A",     // optional for text depth
          light: "#FDF2F8",    // soft background tone
        },
      },
    },
  },
  plugins: [],
};