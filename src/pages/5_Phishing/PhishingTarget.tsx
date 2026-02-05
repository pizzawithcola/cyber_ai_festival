import React from 'react';
import {  Typography, Box, useTheme } from '@mui/material';

const PhishingTarget: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant='h3' gutterBottom>
        Target
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Content for the left side of the phishing panel.
      </Typography>
    </Box>
  );
};

export default PhishingTarget;
