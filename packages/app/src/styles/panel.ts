/** Lattice-inspired panel design tokens */

export const PANEL = {
  BG: 'rgba(10, 10, 18, 0.88)',
  BG_SOLID: '#0a0a12',
  BORDER: 'rgba(68, 136, 255, 0.12)',
  BLUR: 'blur(12px)',
  RADIUS: '8px',
  SHADOW: '0 4px 24px rgba(0, 0, 0, 0.5)',

  // Accent colors
  ACCENT: '#4488ff',
  ACCENT_DIM: 'rgba(68, 136, 255, 0.3)',
  ACCENT_GLOW: 'rgba(68, 136, 255, 0.15)',

  // Side colors
  BLUE: '#4499ff',
  RED: '#ff4444',
  NEUTRAL: '#aaaaaa',

  // Text
  TEXT_PRIMARY: '#e0e0e0',
  TEXT_SECONDARY: '#888888',
  TEXT_MUTED: '#555555',

  // Status colors
  SUCCESS: '#44aa44',
  WARNING: '#ffaa33',
  DANGER: '#ff3333',

  // Drawer dimensions
  DRAWER_WIDTH: 320,
  STATUS_BAR_HEIGHT: 36,

  // Font
  FONT_MONO: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

/** Common floating panel CSS */
export const floatingPanelStyle: React.CSSProperties = {
  position: 'absolute',
  backgroundColor: PANEL.BG,
  backdropFilter: PANEL.BLUR,
  WebkitBackdropFilter: PANEL.BLUR,
  border: `1px solid ${PANEL.BORDER}`,
  borderRadius: PANEL.RADIUS,
  boxShadow: PANEL.SHADOW,
  fontFamily: PANEL.FONT_MONO,
  overflow: 'hidden',
};
