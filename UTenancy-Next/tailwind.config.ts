import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ── UTenancy colour palette ──────────────────────
      colors: {
        cream:       '#faf5f2',
        linen:       '#ede0d8',
        clay:        '#6b4c3b',
        'clay-dark': '#513526',
        terra:       '#9c7060',
        sand:        '#c4a090',
        espresso:    '#2e1e18',
        stone:       '#1e1410',
        surf:        '#fff8f5',
        'surf-lo':   '#fff1e9',
        'surf-hi':   '#f3e6de',
        muted:       '#50443f',
        outline:     '#82746e',
        'out-var':   '#d4c3bc',
        'sec-con':   '#fec8b6',
      },

      // ── Type scale ───────────────────────────────────
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        head:    ['var(--font-plus-jakarta)', 'sans-serif'],
        body:    ['var(--font-be-vietnam)', 'sans-serif'],
      },

      // ── Animation utilities ──────────────────────────
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(28px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        floatA:   { '0%,100%': { transform: 'translateY(0px) rotate(-1deg)' }, '50%': { transform: 'translateY(-12px) rotate(1deg)' } },
        floatB:   { '0%,100%': { transform: 'translateY(0px) rotate(1deg)' },  '50%': { transform: 'translateY(-8px) rotate(-1deg)' } },
        pulseDot: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.5', transform: 'scale(.85)' } },
        marquee:  { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        slideLeft:  { from: { opacity: '0', transform: 'translateX(30px)' },  to: { opacity: '1', transform: 'translateX(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-30px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:    { from: { opacity: '0', transform: 'scale(.92)' },         to: { opacity: '1', transform: 'scale(1)' } },
        spin:       { to: { transform: 'rotate(360deg)' } },
        checkPop:   {
          '0%':   { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.2) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)',   opacity: '1' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%':     { transform: 'translateX(-6px)' },
          '75%':     { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'fade-up':    'fadeUp .65s both',
        'fade-in':    'fadeIn .4s both',
        'float-a':    'floatA 5s ease-in-out infinite',
        'float-b':    'floatB 6s ease-in-out infinite',
        'float-slow': 'floatA 7s 1s ease-in-out infinite',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'marquee':    'marquee 28s linear infinite',
        'slide-l':    'slideLeft .4s ease both',
        'slide-r':    'slideRight .4s ease both',
        'scale-in':   'scaleIn .4s cubic-bezier(.34,1.56,.64,1) both',
        'check-pop':  'checkPop .5s cubic-bezier(.34,1.56,.64,1) both',
        'spin-fast':  'spin .7s linear infinite',
        'shake':      'shake .3s ease',
      },
    },
  },
  plugins: [],
}

export default config
