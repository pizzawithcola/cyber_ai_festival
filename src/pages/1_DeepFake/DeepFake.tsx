import React from 'react';
import {  
  Typography, 
  Box, 
} from '@mui/material';

interface HomePageProps {
  toggleColorMode: () => void;
}

const DeepFake: React.FC<HomePageProps> = () => {

  return (
    <Box>
    <Typography variant="h2" component="h1" gutterBottom>
        This is DeepFake Page
    </Typography>
    </Box>
  );
};

export default DeepFake;