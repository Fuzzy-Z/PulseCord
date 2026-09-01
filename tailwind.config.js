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
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.02) inset',
        'md': '0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.03) inset',
        'lg': '0 10px 24px -4px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04) inset',
        'xl': '0 20px 40px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
        '2xl': '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset',
        'inner': 'inset 0 2px 8px 0 rgba(0,0,0,0.25)',
      }
    },
  },
  plugins: [],
}
