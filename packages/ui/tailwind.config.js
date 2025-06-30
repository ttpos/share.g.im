const baseConfig = require('@ttpos/share-tailwindcss-config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    // `node_modules/@ttpos/share-ui/dist/*.{js,ts,jsx,tsx}`
  ],
  prefix: "",
  theme: {
    container: {
    },
    extend: {
    },
  },
}
