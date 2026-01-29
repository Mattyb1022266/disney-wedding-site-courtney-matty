/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fbfbff",
        pastel: {
          lavender: "#e9e3ff",
          lilac: "#f0e6ff",
          blush: "#ffe4ef",
          peach: "#ffe9df",
          sky: "#e6f3ff",
          mint: "#e7fff3",
          butter: "#fff6d8",
        },
      },
      boxShadow: {
        soft: "0 12px 40px rgba(17, 24, 39, 0.08)",
        card: "0 10px 25px rgba(17, 24, 39, 0.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        }
      },
      animation: {
        floaty: "floaty 5s ease-in-out infinite",
      }
    },
  },
  plugins: [],
}
