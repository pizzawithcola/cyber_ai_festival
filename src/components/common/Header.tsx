import React from 'react';
import { Box, Typography } from '@mui/material';
import { ARCADE_COLORS } from '../../theme/theme';
import { ArcadeTypography } from '../ui';

interface HeaderProps {
  title: string;
  firstname?: string;
  lastname?: string;
  countryCode?: string;
}

const Header: React.FC<HeaderProps> = ({ title, firstname, lastname }) => {
  const normalizedFirstname =
    firstname && firstname.length > 0
      ? firstname[0].toUpperCase() + firstname.slice(1).toLowerCase()
      : firstname;
  const normalizedLastname = lastname ? lastname.toUpperCase() : lastname;
  const fullName = [normalizedFirstname, normalizedLastname].filter(Boolean).join(' ');

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        px: 3,
        py: 1,
        borderBottom: `1px solid ${ARCADE_COLORS.lime}30`,
        backgroundColor: ARCADE_COLORS.dark,
        flexShrink: 0,
        boxShadow: `0 2px 8px ${ARCADE_COLORS.lime}15`,
      }}
    >
      <ArcadeTypography
        font="electrolize"
        arcadeColor="lime"
        arcadeSize="sm"
        component="h6"
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '1rem',
        }}
      >
        {title}
      </ArcadeTypography>
      {(fullName) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontFamily: '"Courier New", monospace', color: ARCADE_COLORS.white, fontSize: '0.85rem' }}>
            {fullName || ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Header;
