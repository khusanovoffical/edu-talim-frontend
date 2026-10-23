/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1E3A8A",      // Primary deep blue
          blueLight: "#3B82F6",
          violet: "#7C3AED",    // AI Accent violet
          violetLight: "#DDD6FE",
          emerald: "#059669",   // Success green
          slate: "#0F172A",
          bgLight: "#F8FAFC"
        }
      }
    },
  },
  plugins: [],
}
