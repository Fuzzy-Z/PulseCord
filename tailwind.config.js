/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sys: {
          base: 'var(--color-bg-base)',
          s1: 'var(--color-bg-surface-1)',
          s2: 'var(--color-bg-surface-2)',
          s3: 'var(--color-bg-surface-3)',
          accent: 'var(--color-accent)',
          accentHov: 'var(--color-accent-hover)',
          text: 'var(--color-text-main)',
          muted: 'var(--color-text-muted)',
          border: 'var(--color-border)',
        },
        discord: {
          darkest: '#1e1f22',
          darker: '#2b2d31',
          dark: '#313338',
          input: '#383a40',
          hover: '#35373c',
          active: '#404249',
          brand: '#5865F2',
          brandHover: '#4752C4',
          green: '#23a55a',
          yellow: '#f0b232',
          red: '#f23f43',
          text: '#dbdee1',
          muted: '#949ba4',
          channel: '#80848e',
          header: '#f2f3f5',
        }
      },
      fontFamily: {
        gg: ['"gg sans"', '"Noto Sans"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
