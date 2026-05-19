import React from 'react';
import { Box } from '@mui/material';
import { ARCADE_COLORS, GRID_COLOR } from '../../../../theme/theme';

const ArcadeBackground: React.FC = () => (
  <>
    {/* Grid */}
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: `
          linear-gradient(90deg, ${GRID_COLOR} 1px, transparent 1px),
          linear-gradient(180deg, ${GRID_COLOR} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        backgroundColor: ARCADE_COLORS.dark,
        pointerEvents: 'none',
      }}
    />
  </>
);

export default ArcadeBackground;
