import React from 'react';
import { Paper, Box, Typography, useTheme } from '@mui/material';
import PhishingTarget from './PhishingTarget';
import PhishingMailSpace from './PhishingMailSpace';
import { targets, missions } from './phishingData';


const PhishingPanel: React.FC = () => {
  const theme = useTheme();

  const currentLevel = 1;
  const currentTarget = targets.find(t => t.id === currentLevel) || targets[0];
  const currentMission = missions.find(m => m.targetId === currentLevel) || missions[0];

  return (
    <Box className='phishing-panel' sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', gap: 2, mt: 2, mb: 1, px: 2 }}>
        <Box sx={{ flex: 5, minWidth: 0, minHeight: 0 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
            <PhishingTarget target={currentTarget} mission={currentMission} />
          </Paper>
        </Box>
        <Box sx={{ flex: 7, minWidth: 0, minHeight: 0 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
            <PhishingMailSpace target={currentTarget} mission={currentMission} />
          </Paper>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', flexShrink: 0, py: 0.5 }}>
        <Typography sx={{ fontSize: '12px' }}>Please <b>DO NOT</b> send any personal or sensitive information to LLM.</Typography>
      </Box>
    </Box>
  );
};

export default PhishingPanel;
