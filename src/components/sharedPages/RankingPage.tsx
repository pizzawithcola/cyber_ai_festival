import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const RankingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Challenge Completed!
      </Typography>
      <Typography variant="h6" sx={{ mb: 4 }}>
        Your ranking will be displayed here
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate(-1)}
      >
        Go Back
      </Button>
    </Box>
  );
};

export default RankingPage;