import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Box } from '@mui/material';
import { ARCADE_COLORS } from '../../theme/theme';

interface QRCodeProps {
  value: string;
  size?: number;
}

const QRCode: React.FC<QRCodeProps> = ({ value, size = 200 }) => {
  return (
    <Box
      sx={{
        display: 'inline-block',
        p: 2,
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        border: `2px solid ${ARCADE_COLORS.cyan}40`,
        boxShadow: `0 0 15px ${ARCADE_COLORS.cyan}30`,
      }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#050510"
        level="M"
      />
    </Box>
  );
};

export default QRCode;
