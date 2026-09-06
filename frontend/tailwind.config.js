/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e1a",
        panel: "#131a2e",
        panel2: "#1a2338",
        accent: "#4f8cff",
        accent2: "#7c5cff",
        good: "#2dd4bf",
        warn: "#f5a524",
        bad: "#f45b69"
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
