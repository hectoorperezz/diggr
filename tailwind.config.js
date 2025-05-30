/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: {
          DEFAULT: '#121212',
          lighter: '#181818',
        },
        // Brand colors
        brand: {
          primary: '#1DB954',    // Spotify Green
          secondary: '#9B59B6',  // Purple
        },
        // Text colors
        text: {
          primary: '#F5F5F7',    // Soft white
          secondary: '#A3A3A3',  // Muted gray
        },
      },
      borderRadius: {
        '2xl': '1rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'card-hover': '0 8px 16px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        blob: 'blob 7s infinite',
        'slow-spin': 'slow-spin 20s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        'slow-spin': {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: 0.5,
          },
          '50%': {
            opacity: 1,
          },
        },
        'gradient-x': {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          },
        },
      },
      backgroundSize: {
        '400%': '400% 400%',
      },
    },
  },
  plugins: [],
}; 