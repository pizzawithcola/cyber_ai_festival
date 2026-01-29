import React from 'react';
import {  
  Typography, 
  Box, 
} from '@mui/material';

interface HomePageProps {
  toggleColorMode: () => void;
}

const Phishing: React.FC<HomePageProps> = () => {

  return (
    <Box>
    <Typography variant="h2" component="h1" gutterBottom>
        This is DeepFake Page
    </Typography>
    </Box>
  );
};

export default Phishing;
