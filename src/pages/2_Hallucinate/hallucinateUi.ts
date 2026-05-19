// Shared UI constants/styles for the Hallucinate chapter.

export const NEON_CYAN = '#ff00ff';
export const NEON_PINK = '#ff00ff';
export const NEON_PURPLE = '#5b2eff';
export const NEON_BLUE = '#bf00ff';
export const PRIMARY_HEADER_GRADIENT = `linear-gradient(135deg, ${NEON_PINK} 0%, ${NEON_PURPLE} 55%, ${NEON_BLUE} 100%)`;
export const PANEL_SHADOW =
  '0 0 0 1px rgba(255, 0, 255, 0.45), 0 18px 48px rgba(10, 18, 44, 0.52), 0 0 28px rgba(91, 46, 255, 0.24)';
export const PANEL_BORDER = '1px solid rgba(255, 0, 255, 0.42)';
export const PANEL_BODY_BACKGROUND =
  'linear-gradient(180deg, rgba(8, 12, 26, 0.97) 0%, rgba(5, 8, 18, 0.98) 100%)';
export const READABLE_FONT = "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif";
export const ARCADE_FONT = "'Press Start 2P', 'VT323', monospace";

export const panelCardSx = {
  width: '100%',
  boxShadow: PANEL_SHADOW,
  border: PANEL_BORDER,
  overflow: 'hidden',
  backgroundColor: 'rgba(7, 10, 24, 0.92)',
  backdropFilter: 'blur(12px)',
  borderRadius: 3,
} as const;

export const panelHeaderSx = {
  background: PRIMARY_HEADER_GRADIENT,
  color: '#fff',
  pb: 2,
  boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.12)',
  '& .MuiCardHeader-content': { minWidth: 0 },
} as const;

export const arcadeScreenSx = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 0,
  border: PANEL_BORDER,
  background:
    'linear-gradient(180deg, rgba(7, 3, 20, 0.96), rgba(9, 12, 30, 0.94) 48%, rgba(5, 4, 16, 0.98))',
  boxShadow:
    '0 0 0 1px rgba(255, 0, 255, 0.16), inset 0 0 28px rgba(255, 0, 255, 0.08), 0 24px 58px rgba(3, 0, 12, 0.5)',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'repeating-linear-gradient(0deg, rgba(255,255,255,0.035), rgba(255,255,255,0.035) 1px, transparent 1px, transparent 5px)',
    opacity: 0.28,
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    background: 'linear-gradient(90deg, transparent, rgba(255, 0, 255, 0.72), rgba(255, 191, 77, 0.62), transparent)',
    pointerEvents: 'none',
  },
} as const;

export const arcadeKickerSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: 1.15,
  py: 0.5,
  border: '1px solid rgba(255, 0, 255, 0.38)',
  background: 'rgba(255, 0, 255, 0.08)',
  color: '#ff70bf',
  fontFamily: READABLE_FONT,
  fontWeight: 900,
  fontSize: { xs: '0.74rem', sm: '0.82rem' },
  lineHeight: 1.35,
  letterSpacing: '0.11em',
  textTransform: 'uppercase',
  textShadow: '0 0 12px rgba(255, 0, 255, 0.24)',
} as const;

export const readableBodySx = {
  color: 'rgba(228, 241, 255, 0.88)',
  fontFamily: READABLE_FONT,
  lineHeight: 1.78,
  letterSpacing: '0.02em',
} as const;
