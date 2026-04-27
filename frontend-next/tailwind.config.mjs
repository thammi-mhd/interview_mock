/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06070a",
        surface: "#0e1017",
        s2: "#161922",
        border: "rgba(255,255,255,0.06)",
        accent: "#c8f04d",
        text: "#f2f2f0",
        muted: "#5a6175",
        muted2: "#8892a4",
        red: "#ff4d6d",
        green: "#3dffc0"
      },
      fontFamily: {
        outfit: ['var(--font-outfit)', 'sans-serif'],
        bebas: ['var(--font-bebas)', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
