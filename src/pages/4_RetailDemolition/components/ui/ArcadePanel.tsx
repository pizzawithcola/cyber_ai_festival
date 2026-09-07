import React from 'react';
import { Box } from '@mui/material';
import { ARCADE_COLORS, GRID_COLOR } from '../../../../theme/theme';

interface ArcadePanelProps {
  children: React.ReactNode;
  accent?: keyof typeof ARCADE_COLORS;
  padding?: number | string;
  radius?: number | string; // 圆角半径（number → px；string 原样）；默认 0 保持方角
  className?: string;
  sx?: object;
}

const ArcadePanel: React.FC<ArcadePanelProps> = ({
  children,
  accent = 'cyan',
  padding = 3,
  radius = 0,
  sx = {},
}) => {
  const accentColor = ARCADE_COLORS[accent];
  const corner = typeof radius === 'number' ? `${radius}px` : radius || '0px';
  // ::before 外圈比面板大 2px，圆角需随之 +2 才能与主面板角贴合
  const ringCorner = typeof radius === 'number' ? `${radius + 2}px` : radius || '0px';
  return (
    <Box
      sx={{
        backgroundColor: 'rgba(10, 10, 26, 0.85)',
        border: `2px solid ${GRID_COLOR}`,
        borderRadius: corner,
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
          borderRadius: ringCorner,
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
