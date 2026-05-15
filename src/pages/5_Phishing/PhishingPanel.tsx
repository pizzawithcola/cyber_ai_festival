import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import Header from '../../components/common/Header';
import { getStoredUser } from '../../utils/userStorage';
import MatrixRainBackground from '../../components/common/MatrixRainBackground';
import PhishingTarget from './PhishingTarget';
import PhishingMailSpace from './PhishingMailSpace';
import { targets, missions } from './phishingData';
import { ARCADE_COLORS } from '../../theme/theme';


const PhishingPanel: React.FC = () => {

  const [levelIndex, setLevelIndex] = useState(0);

  const handleSwitch = useCallback(() => {
    setLevelIndex((prev) => (prev + 1) % targets.length);
  }, []);

  const currentTarget = targets[levelIndex];
  const currentMission = missions.find(m => m.targetId === currentTarget.id) || missions[0];
  const user = getStoredUser();

  return (
    <MatrixRainBackground>
      <Box className='phishing-panel' sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
        <Header
          title='MISSION V: PHISHING ATTACK'
          firstname={user?.firstname}
          lastname={user?.lastname}
          countryCode={user?.countryCode}
        />
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', gap: 2, mt: 2, mb: 1, px: 2 }}>
          <Box sx={{ flex: 5, minWidth: 0, minHeight: 0 }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${ARCADE_COLORS.lime}40`, borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(10, 10, 26, 0.9)', boxShadow: `0 0 12px ${ARCADE_COLORS.lime}20, inset 0 0 12px ${ARCADE_COLORS.lime}08` }}>
              <PhishingTarget target={currentTarget} mission={currentMission} onSwitch={handleSwitch} />
            </Box>
          </Box>
          <Box sx={{ flex: 7, minWidth: 0, minHeight: 0 }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: `1px solid ${ARCADE_COLORS.lime}40`, borderRadius: '4px', overflow: 'hidden', backgroundColor: 'rgba(10, 10, 26, 0.9)', boxShadow: `0 0 12px ${ARCADE_COLORS.lime}20, inset 0 0 12px ${ARCADE_COLORS.lime}08` }}>
              <PhishingMailSpace target={currentTarget} mission={currentMission} />
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', flexShrink: 0, py: 0.5 }}>
          <Typography sx={{ fontSize: '11px', fontFamily: '"Courier New", monospace', color: `${ARCADE_COLORS.white}50` }}>
            {'// DO NOT send any personal or sensitive information to LLM'}
          </Typography>
        </Box>
      </Box>
    </MatrixRainBackground>
  );
};

export default PhishingPanel;
