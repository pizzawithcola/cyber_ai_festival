import React from 'react';
import { Paper, Box, Typography, useTheme, Chip, Card, CardContent, IconButton, Tooltip } from '@mui/material';
import { Autorenew } from '@mui/icons-material';
import type { Target, Mission } from './phishingData';

interface PhishingTargetProps {
  target: Target;
  mission: Mission;
  onSwitch?: () => void;
}

const PhishingTarget: React.FC<PhishingTargetProps> = ({ target: currentTarget, mission: currentMission, onSwitch }) => {
  const theme = useTheme();

  return (
    <Box sx={{ padding: 2, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', mb: 1 }}>
        <Typography variant='h5' sx={{ fontWeight: 700, color: '#1976d2', textAlign: 'center' }}>
          PHISHING TARGET
        </Typography>
        {onSwitch && (
          <Tooltip title='Switch Target'>
            <IconButton
              onClick={onSwitch}
              size='small'
              sx={{
                position: 'absolute',
                right: 0,
                color: '#1976d2',
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
        {/* 目标信息 - 纵向排列 */}
        <Paper sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
          {/* 上半部分：照片 + 基本信息 横向排列 */}
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', mb: 2, gap: 2 }}>
            {/* 左侧：照片1:1靠左 */}
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
                  borderRadius: 1,
                  border: '3px rgba(17, 29, 78, 0.3)',
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
                  // backgroundColor: theme.palette.action.hover,
                  backgroundColor: 'rgb(151, 151, 151)',
                }}
              />
            </Box>
            {/* 右侧：文字靠左对齐，空间不够时换行到下方 */}
            <Box sx={{ flex: '1 1 45%', minWidth: 150, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 1.5 }}>
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>Name:</Typography>
                <Typography variant='body2'>{currentTarget.name}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>Department:</Typography>
                <Typography variant='body2'>{currentTarget.department}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>Position:</Typography>
                <Typography variant='body2'>{currentTarget.position}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>Email:</Typography>
                <Typography variant='body2'>{currentTarget.email}</Typography>
              </Box>
            </Box>
          </Box>

          {/* 下半部分：Hobbies + Personality */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>Hobbies:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {currentTarget.hobbies.map((hobby: string, index: number) => (
                  <Chip key={index} label={hobby} size='small' variant='outlined' />
                ))}
              </Box>
            </Box>
            <Box>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>Personality:</Typography>
              <Typography variant='body2'>{currentTarget.personality}</Typography>
            </Box>
          </Box>
        </Paper>
        
        {/* 钓鱼任务 - 纵向排列 */}
        <Paper sx={{ px: 2, backgroundColor: theme.palette.background.paper }}>
          <Typography variant='h5' gutterBottom sx={{ fontWeight: 600, color: '#d32f2f', textAlign: 'center', mb: 3 }}>
            YOUR MISSION
          </Typography>
          
          <Card sx={{ border: '2px solid #d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant='h5' sx={{ fontWeight: 600, color: '#d32f2f' }}>
                  {currentMission.title}
                </Typography>
                <Chip label={currentMission.difficulty} size='small' color='primary' variant='outlined' />
              </Box>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {currentMission.description}
              </Typography>
              <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
                Target Link: {currentMission.targetLink}
              </Typography>
              <Typography variant='body2' sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                <strong>Strategy Hint:</strong> {currentMission.hint}
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Box>
      
      {/* 占位元素确保内容可以滚动 */}
      <Box sx={{ height: '20px' }} />
    </Box>
  );
};

export default PhishingTarget;
