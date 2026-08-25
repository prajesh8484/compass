export const THEME_CONFIG = {
  colors: {
    background: '#0d0d0d',
    surface: '#141414',
    surfaceAlt: '#1a1a1a',
    border: '#222222',
    borderSubtle: '#1a1a1a',
    text: '#f0f0f0',
    textMuted: '#5a5a5a',
    textDim: '#404040',
    accent: '#5b8dee',
    accentDim: 'rgba(91, 141, 238, 0.1)',
    danger: '#e05b5b',
    dangerDim: 'rgba(224, 91, 91, 0.1)',
    success: '#5be08a',
    successDim: 'rgba(91, 224, 138, 0.1)',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    baseSize: '14px',
    lineHeight: 1.5,
  },
  spacing: {
    base: '8px',
  },
  transitions: {
    default: '150ms ease',
  },
} as const;
