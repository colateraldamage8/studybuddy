import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── Brand colours ──────────────────────────────────────
      colors: {
        primary: {
          DEFAULT: '#4A90D9',
          50: '#EBF4FF',
          100: '#D7E9FF',
          200: '#AED3FF',
          300: '#85BDFF',
          400: '#5CA7FF',
          500: '#4A90D9',
          600: '#357ABD',
          700: '#2863A0',
          800: '#1B4D83',
          900: '#0E3766',
        },
        secondary: {
          DEFAULT: '#7ED321',
          50: '#F2FDE0',
          100: '#E5FAC1',
          200: '#CCF683',
          300: '#B2F145',
          400: '#99ED07',
          500: '#7ED321',
          600: '#68B01B',
          700: '#528D15',
          800: '#3C6A0F',
          900: '#264709',
        },
        background: {
          DEFAULT: '#F8F9FF',
          dark: '#EEF0FF',
        },
        bot: {
          bubble: '#EBF4FF',
          border: '#C7D9F0',
        },
        user: {
          bubble: '#DCF8C6',
          border: '#B7E89F',
        },
        // Additional palette
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F5F7FF',
        },
      },

      // ── Typography ─────────────────────────────────────────
      fontFamily: {
        nunito: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      // ── Border radius ──────────────────────────────────────
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ── Box shadow ─────────────────────────────────────────
      boxShadow: {
        'soft': '0 2px 12px rgba(74, 144, 217, 0.08)',
        'soft-md': '0 4px 20px rgba(74, 144, 217, 0.12)',
        'soft-lg': '0 8px 32px rgba(74, 144, 217, 0.18)',
        'inner-soft': 'inset 0 2px 8px rgba(74, 144, 217, 0.06)',
      },

      // ── Animations ─────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },

      // ── Backdrop blur ──────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },

      // ── Screens (ensure standard breakpoints) ─────────────
      screens: {
        xs: '480px',
      },

      // ── Spacing extras ─────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },

      // ── Max width ──────────────────────────────────────────
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
