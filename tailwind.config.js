/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        w: {
          // Backgrounds
          bg:          '#1C1610',   // deepest background
          surface:     '#251D14',   // card/container surface
          surfaceHi:   '#2E2318',   // elevated surface (hover etc.)
          border:      '#3D2E22',   // subtle border
          // Accent (mascot orange)
          accent:      '#E8744A',
          accentDark:  '#C95B35',
          accentLight: '#F4A475',
          // Text
          text:        '#F5E6D3',   // primary text (warm white)
          muted:       '#A0886B',   // secondary text
          faint:       '#5A4232',   // disabled / very dim
          // Status
          green:       '#5CB85C',
          yellow:      '#F5A623',
          red:         '#E85D5D',
          blue:        '#5B9BD5',
          // Alert highlight (compact widget tint)
          alertBg:     '#2E1F0E',
          alertBorder: '#8B4513',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono:  ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        widget: '18px',
        badge:  '6px',
      },
      boxShadow: {
        widget: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        badge:  '0 2px 6px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'pulse-alert': 'pulseAlert 2s ease-in-out infinite',
        'bob':         'bob 3s ease-in-out infinite',
        'zzz':         'zzz 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseAlert: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        zzz: {
          '0%':   { transform: 'translateY(0) scale(1)',   opacity: '1' },
          '100%': { transform: 'translateY(-14px) scale(0.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
