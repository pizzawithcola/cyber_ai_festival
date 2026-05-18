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
