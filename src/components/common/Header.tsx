import React from 'react';
import { Box, Typography } from '@mui/material';

interface HeaderProps {
  title: string;
  firstname?: string;
  lastname?: string;
  countryCode?: string;
}

const Header: React.FC<HeaderProps> = ({ title, firstname, lastname, countryCode }) => {
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
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        backgroundColor: theme => theme.palette.background.paper,
        flexShrink: 0,
      }}
    >
      <Typography
        variant='h6'
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      {(fullName) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant='h6' sx={{ color: 'text.secondary', fontSize: '15px' }}>
            {fullName || ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Header;
