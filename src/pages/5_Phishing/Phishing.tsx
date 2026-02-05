import React from 'react';
import {  
  Typography, 
  Box, 
} from '@mui/material';
import PhishingPanel from './PhishingPanel';

const Phishing: React.FC = () => {

  return (
    <Box>
      <Typography variant="h2" component="h1" gutterBottom>
          This is Phishing Page
      </Typography>
      <PhishingPanel />
    </Box>
  );
};

export default Phishing;
