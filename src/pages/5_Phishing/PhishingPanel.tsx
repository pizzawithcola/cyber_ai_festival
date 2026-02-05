import React from 'react';
import { Grid, Paper, Box, Typography, useTheme } from '@mui/material';
import PhishingTarget from './PhishingTarget';
import PhishingMailSpace from './PhishingMailSpace';


const PhishingPanel: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <Typography variant='h4' gutterBottom>
        Phishing Panel
      </Typography>
      <Grid container spacing={2} sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', mb: 2 }}>
        <Grid size={{ xs: 12, md: 5.8 }} sx={{ ml: 2 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.palette.divider}`,}}>
            <PhishingTarget />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5.8 }} sx={{ mr: 2 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.palette.divider}`,}}>
            <PhishingMailSpace />
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto' }}>
        <Typography sx={{ fontSize: '12px' }}>Please <b>DO NOT</b> send any personal or sensitive information to LLM.</Typography>
      </Box>
    </Box>
  );
};

export default PhishingPanel;
