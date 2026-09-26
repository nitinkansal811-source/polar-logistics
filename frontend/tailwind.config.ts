import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        polar: {
          950: '#070D18', // Base deep polar night
          900: '#0B132B', // Mission control panel dark
          850: '#0F1A30', // Deep card fill
          800: '#14213D', // Elevated card / border
          700: '#1E293B', // Subtle slate border
          600: '#334155', // Muted text/indicators
          500: '#64748B', // Secondary labels
          cyan: '#38BDF8', // Active telemetry cyan
          ice: '#5EEAD4',  // Live Antarctic Ice accent
          warning: '#F59E0B', // Amber caution
          danger: '#EF4444',  // Code-Red emergency
          success: '#10B981', // Verified / Online green
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
};
export default config;
