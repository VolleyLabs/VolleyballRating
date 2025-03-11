/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom animations for UI elements
      animation: {
        // Standard fade in with slight scale effect (300ms)
        fadeIn: 'fadeIn 0.3s ease-in-out forwards',
        // Faster fade in for Telegram Mini App (200ms)
        fadeInFast: 'fadeIn 0.2s ease-in-out forwards',
        // Fade in with slide up effect
        fadeInSlideUp: 'fadeInSlideUp 0.3s ease-in-out forwards',
        // Scale animation for headings
        scaleIn: 'scaleIn 0.3s ease-in-out forwards',
      },
      // Keyframes definitions for animations
      keyframes: {
        // Fade in with scale effect
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Fade in with slide up effect
        fadeInSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Scale animation from 90% to 100%
        scaleIn: {
          '0%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} 