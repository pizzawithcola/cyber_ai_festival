import React from 'react';
import { Box } from '@mui/material';
import { ARCADE_COLORS, GRID_COLOR } from '../../../../theme/theme';

interface ArcadePanelProps {
  children: React.ReactNode;
  accent?: keyof typeof ARCADE_COLORS;
  padding?: number | string;
  className?: string;
  sx?: object;
}

const ArcadePanel: React.FC<ArcadePanelProps> = ({
  children,
  accent = 'cyan',
  padding = 3,
  sx = {},
}) => {
  const accentColor = ARCADE_COLORS[accent];
  return (
    <Box
      sx={{
        backgroundColor: 'rgba(10, 10, 26, 0.85)',
        border: `2px solid ${GRID_COLOR}`,
        borderRadius: 0,
        p: padding,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          border: `1px solid ${accentColor}30`,
          pointerEvents: 'none',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default ArcadePanel;
