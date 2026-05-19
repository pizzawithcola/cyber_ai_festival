import React from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Autorenew } from '@mui/icons-material';
import type { Target, Mission } from './phishingData';
import { ArcadeTypography } from '../../components/ui';
import { ARCADE_COLORS } from '../../theme/theme';

interface PhishingTargetProps {
  target: Target;
  mission: Mission;
  onSwitch?: () => void;
}

const PhishingTarget: React.FC<PhishingTargetProps> = ({ target: currentTarget, mission: currentMission, onSwitch }) => {

  return (
    <Box sx={{ padding: 2, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', mb: 1 }}>
        <ArcadeTypography font="audiowide" arcadeColor="lime" arcadeSize="sm" component="h5" sx={{ fontSize: '1.1rem' }}>
          PHISHING TARGET
        </ArcadeTypography>
        {onSwitch && (
          <Tooltip title='Switch Target'>
            <IconButton
              onClick={onSwitch}
              size='small'
              sx={{
                position: 'absolute',
                right: 0,
                color: ARCADE_COLORS.lime,
                '&:hover': { color: ARCADE_COLORS.white },
                '&:focus': { outline: 'none', boxShadow: 'none' },
                '&:focus-visible': { outline: 'none', boxShadow: 'none' },
              }}
            >
              <Autorenew />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Target info */}
        <Box sx={{ p: 2.5, backgroundColor: 'rgba(10, 10, 26, 0.95)', border: `1px solid ${ARCADE_COLORS.lime}30`, borderRadius: '4px', boxShadow: `0 0 8px ${ARCADE_COLORS.lime}15` }}>
          {/* Top: photo + basic info */}
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', mb: 2, gap: 2 }}>
            {/* Left: photo */}
            <Box sx={{ flex: '1 1 45%', minWidth: 120, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <Box
                component='img'
                src={currentTarget.photo}
                alt={currentTarget.name}
                sx={{
                  aspectRatio: '1 / 1',
                  width: '100%',
                  maxWidth: 200,
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: `2px solid ${ARCADE_COLORS.lime}60`,
                  boxShadow: `0 0 12px ${ARCADE_COLORS.lime}30`,
                  backgroundColor: '#1a1a2e',
                }}
              />
            </Box>
            {/* Right: text fields */}
            <Box sx={{ flex: '1 1 45%', minWidth: 150, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 1.5 }}>
              <Box>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 600, fontSize: '0.8rem', color: ARCADE_COLORS.white }}>Name:</Typography>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.85rem', color: `${ARCADE_COLORS.white}CC` }}>{currentTarget.name}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 600, fontSize: '0.8rem', color: ARCADE_COLORS.white }}>Department:</Typography>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.85rem', color: `${ARCADE_COLORS.white}CC` }}>{currentTarget.department}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 600, fontSize: '0.8rem', color: ARCADE_COLORS.white }}>Position:</Typography>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.85rem', color: `${ARCADE_COLORS.white}CC` }}>{currentTarget.position}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 600, fontSize: '0.8rem', color: ARCADE_COLORS.white }}>Email:</Typography>
                <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.85rem', color: `${ARCADE_COLORS.white}CC` }}>{currentTarget.email}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Bottom: Hobbies + Personality */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 600, fontSize: '0.8rem', color: ARCADE_COLORS.white }}>Hobbies:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {currentTarget.hobbies.map((hobby: string, index: number) => (
                  <Chip
                    key={index}
                    label={hobby}
                    size='small'
                    variant='outlined'
                    sx={{
                      borderColor: `${ARCADE_COLORS.lime}80`,
                      color: ARCADE_COLORS.lime,
                      fontFamily: '"Electrolize", sans-serif',
                      fontSize: '0.7rem',
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 600, fontSize: '0.8rem', color: ARCADE_COLORS.white }}>Personality:</Typography>
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.85rem', color: `${ARCADE_COLORS.white}CC` }}>{currentTarget.personality}</Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Mission */}
        <Box sx={{ px: 2, py: 2, backgroundColor: 'rgba(10, 10, 26, 0.95)', border: `1px solid ${ARCADE_COLORS.lime}30`, borderRadius: '4px', boxShadow: `0 0 8px ${ARCADE_COLORS.lime}15` }}>
          <ArcadeTypography font="audiowide" arcadeColor="lime" arcadeSize="sm" component="h5" sx={{ fontSize: '1.1rem', textAlign: 'center', mb: 2 }}>
            YOUR MISSION
          </ArcadeTypography>
          
          <Box sx={{ border: `2px solid ${ARCADE_COLORS.lime}60`, borderRadius: '4px', backgroundColor: `${ARCADE_COLORS.lime}08`, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontWeight: 600, fontSize: '1rem', color: ARCADE_COLORS.lime }}>
                {currentMission.title}
              </Typography>
              <Chip
                label={currentMission.difficulty}
                size='small'
                variant='outlined'
                sx={{
                  borderColor: `${ARCADE_COLORS.lime}80`,
                  color: ARCADE_COLORS.lime,
                  fontFamily: '"Electrolize", sans-serif',
                  fontSize: '0.65rem',
                }}
              />
            </Box>
            <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.85rem', color: ARCADE_COLORS.white, mb: 1.5 }}>
              {currentMission.description}
            </Typography>
            <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.8rem', color: `${ARCADE_COLORS.white}80`, mb: 1 }}>
              Target Link: {currentMission.targetLink}
            </Typography>
            <Typography sx={{ fontFamily: '"Electrolize", sans-serif', fontSize: '0.8rem', fontStyle: 'italic', color: `${ARCADE_COLORS.white}80` }}>
              <strong>Strategy Hint:</strong> {currentMission.hint}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Spacer */}
      <Box sx={{ height: '20px' }} />
    </Box>
  );
};

export default PhishingTarget;
