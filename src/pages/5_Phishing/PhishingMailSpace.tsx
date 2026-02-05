import React from 'react';
import {  Typography, Box, useTheme } from '@mui/material';

const PhishingMailSpace: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Left Panel
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Content for the left side of the phishing panel.
      </Typography>
    </Box>
  );
};

export default PhishingMailSpace;
