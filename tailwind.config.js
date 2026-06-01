/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50, #eef2ff)',
          100: 'var(--color-primary-100, #e0e7ff)',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: 'var(--color-primary-700, #4338ca)',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          50: 'var(--color-secondary-50, #f0fdfa)',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: 'var(--color-secondary-600, #0d9488)',
          700: 'var(--color-secondary-700, #0f766e)',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        enterprise: {
          dark: 'var(--color-enterprise-dark, #1a1a2e)',
          navy: 'var(--color-enterprise-navy, #16213e)',
          blue: 'var(--color-enterprise-blue, #0f3460)',
          accent: 'var(--color-enterprise-accent, #e94560)',
          light: 'var(--color-enterprise-light, #f8f9fa)',
          muted: 'var(--color-enterprise-muted, #6c757d)',
          border: 'var(--color-enterprise-border, #dee2e6)',
          surface: 'var(--color-enterprise-surface, #ffffff)',
          background: 'var(--color-enterprise-background, #f4f6f9)',
        },
        success: {
          50: 'var(--color-success-50, #f0fdf4)',
          500: 'var(--color-success-500, #22c55e)',
          700: 'var(--color-success-700, #15803d)',
        },
        warning: {
          50: 'var(--color-warning-50, #fffbeb)',
          500: 'var(--color-warning-500, #f59e0b)',
          700: 'var(--color-warning-700, #b45309)',
        },
        danger: {
          50: 'var(--color-danger-50, #fef2f2)',
          500: 'var(--color-danger-500, #ef4444)',
          700: 'var(--color-danger-700, #b91c1c)',
        },
        info: {
          50: 'var(--color-info-50, #eff6ff)',
          500: 'var(--color-info-500, #3b82f6)',
          700: 'var(--color-info-700, #1d4ed8)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
        '128': '32rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'sidebar': '2px 0 8px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      minHeight: {
        'screen-content': 'calc(100vh - 4rem)',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}