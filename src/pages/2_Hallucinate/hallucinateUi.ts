// Shared UI constants/styles for the Hallucinate chapter.

export const NEON_CYAN = '#00ffd9';
export const NEON_PINK = '#ff2e93';
export const NEON_PURPLE = '#5b2eff';
export const NEON_BLUE = '#2ee3ff';
export const PRIMARY_HEADER_GRADIENT = `linear-gradient(135deg, ${NEON_PINK} 0%, ${NEON_PURPLE} 100%)`;
export const PANEL_SHADOW =
  '0 0 0 1px rgba(0, 255, 217, 0.55), 0 18px 46px rgba(0, 255, 217, 0.18), 0 0 32px rgba(91, 46, 255, 0.2)';
export const PANEL_BORDER = '1px solid rgba(0, 255, 217, 0.6)';
export const PANEL_BODY_BACKGROUND =
  'linear-gradient(180deg, rgba(7, 12, 28, 0.98) 0%, rgba(6, 10, 22, 0.98) 100%)';

export const panelCardSx = {
  width: '100%',
  boxShadow: PANEL_SHADOW,
  border: PANEL_BORDER,
  overflow: 'hidden',
  backgroundColor: 'rgba(8, 12, 26, 0.95)',
} as const;

export const panelHeaderSx = {
  background: PRIMARY_HEADER_GRADIENT,
  color: '#fff',
  pb: 2,
  '& .MuiCardHeader-content': { minWidth: 0 },
} as const;
