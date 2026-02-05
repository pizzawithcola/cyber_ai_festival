import React from 'react';
import { Grid, Paper, useTheme } from '@mui/material';

const PhishingPanel: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Paper
      sx={{
        height: '100vh',
        width: '100%',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 0 20px rgba(10, 25, 41, 0.5)' 
          : '0 0 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Grid container sx={{ height: '100%' }}>
        {/* 左侧区域 - 占2格 (2/12) */}
        <Grid 
          size={2} 
          sx={{ 
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            height: '100%',
            overflowY: 'auto',
            p: 2,
          }}
        >
          <div>
            <h3>Left Panel</h3>
            <p>Left panel content goes here...</p>
          </div>
        </Grid>
        
        {/* 中间区域 - 占8格 (8/12) */}
        <Grid 
          size={8} 
          sx={{ 
            backgroundColor: theme.palette.background.default,
            borderRight: `1px solid ${theme.palette.divider}`,
            height: '100%',
            overflowY: 'auto',
            p: 2,
          }}
        >
          <div>
            <h3>Middle Panel</h3>
            <p>Middle panel content goes here...</p>
          </div>
        </Grid>
        
        {/* 右侧区域 - 占2格 (2/12) */}
        <Grid 
          size={2} 
          sx={{ 
            backgroundColor: theme.palette.background.paper,
            height: '100%',
            overflowY: 'auto',
            p: 2,
          }}
        >
          <div>
            <h3>Right Panel</h3>
            <p>Right panel content goes here...</p>
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PhishingPanel;