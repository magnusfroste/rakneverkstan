/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Fredoka", "system-ui", "sans-serif"] },
      colors: {
        paper: "#faf7f2",
        ink: "#14181f",
        muted: "#5b6472",
        line: "#e7e2d9",
        brand: { DEFAULT: "#2563eb", dark: "#1d4fd7", soft: "#e8effd" },
        good: "#1c7a43",
        bad: "#a33024",
      },
      borderRadius: { card: "24px", btn: "16px" },
    },
  },
  plugins: [],
};