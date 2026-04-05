/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/web/**/*.{html,tsx,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#141413',
          light: '#faf9f5',
          'mid-gray': '#b0aea5',
          'light-gray': '#e8e6dc',
          orange: '#d97757',
          blue: '#6a9bcc',
          green: '#788c5d',
        },
        surface: {
          primary: 'var(--surface-primary)',
          card: 'var(--surface-card)',
          elevated: 'var(--surface-elevated)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'SF Pro Display', 'system-ui', 'sans-serif'],
        body: ['Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(20,20,19,0.06), 0 1px 2px rgba(20,20,19,0.04)',
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
};
