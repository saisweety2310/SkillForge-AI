/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0a0712",
        glassBg: "rgba(20, 16, 35, 0.45)",
        glassBorder: "rgba(255, 255, 255, 0.06)",
        neonPurple: "#a855f7",
        neonIndigo: "#6366f1",
        neonCyan: "#06b6d4",
        neonPink: "#ec4899",
      },
      boxShadow: {
        neon: "0 0 15px rgba(168, 85, 247, 0.4)",
        neonBlue: "0 0 15px rgba(6, 182, 212, 0.4)",
      }
    },
  },
  plugins: [],
}
