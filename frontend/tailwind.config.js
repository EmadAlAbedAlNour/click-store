/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backward compatibility for existing brand utilities
        primary: 'var(--brand-primary)',
        'primary-strong': 'var(--brand-primary-strong)',

        // Semantic colors for new design-system usage
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        'card-soft': 'var(--bg-card-soft)',
        'accent-primary': 'var(--brand-primary)',
        'accent-primary-strong': 'var(--brand-primary-strong)',
        'border-subtle': 'var(--border-subtle)',
      },
      backgroundColor: {
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        'card-soft': 'var(--bg-card-soft)',
        'accent-primary': 'var(--brand-primary)',
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        accent: 'var(--brand-primary)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
      },
      ringColor: {
        focus: 'var(--focus-ring)',
        accent: 'var(--brand-primary)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
      },
    },
  },
  plugins: [
    typography,
  ],
}
