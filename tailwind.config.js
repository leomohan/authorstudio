/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f1e7",
        parchment: "#fffaf2",
        ink: "#1f2933",
        muted: "#697586",
        line: "#ddcfbb",
        accent: "#245c4a",
        accentSoft: "#dcebe5",
        panel: "#fffdf8",
        gold: "#b8893c",
      },
      fontFamily: {
        sans: ["Avenir Next", "Segoe UI", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "serif"],
      },
      boxShadow: {
        panel: "0 24px 80px rgba(77, 61, 32, 0.12)",
      },
      backgroundImage: {
        vellum:
          "radial-gradient(circle at top left, rgba(184,137,60,0.1), transparent 35%), linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,250,242,0.96))",
      },
    },
  },
  plugins: [],
};
