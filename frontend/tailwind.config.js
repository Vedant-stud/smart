/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f2f7f3",
          100: "#dfeadf",
          200: "#bdd6bf",
          300: "#93bb98",
          400: "#679c6e",
          500: "#487f4f",
          600: "#35643c",
          700: "#2b4f31",
          800: "#1b4332",
          900: "#152f22",
          950: "#0b1a13",
        },
        wheat: {
          50: "#fdf8ee",
          100: "#faedd0",
          200: "#f3d89e",
          300: "#ecbf67",
          400: "#e5a83e",
          500: "#d4a853",
          600: "#b8842c",
          700: "#946426",
          800: "#795024",
          900: "#654322",
        },
        soil: {
          50: "#f7f3e9",
          100: "#efe7d3",
          200: "#e0cda3",
          300: "#cead74",
          400: "#c0904f",
          500: "#c77b4c",
          600: "#a75f39",
          700: "#864a30",
          800: "#6d3c2c",
          900: "#5b3328",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(27, 67, 50, 0.25)",
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(27,67,50,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
