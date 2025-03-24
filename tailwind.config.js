/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#121212", // Fondo oscuro de Spotify
        foreground: "#FFFFFF", // Texto principal blanco
        primary: {
          DEFAULT: "#1DB954", // Verde de Spotify para botones y detalles
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1ED760", // Verde claro para resaltar elementos secundarios
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#535353", // Gris medio para elementos menos destacados
          foreground: "#B3B3B3",
        },
        accent: {
          DEFAULT: "#1DB954", // Verde de Spotify para acentos
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#181818", // Fondo de tarjetas en gris oscuro
          foreground: "#FFFFFF",
        },
        border: "#282828", // Bordes en gris oscuro
        input: "#3A3A3A", // Fondos de campos de entrada en gris
        ring: "#1DB954", // Resaltado en verde Spotify
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Fuente principal similar a la de Spotify
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
        slideUp: "slideUp 0.3s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

