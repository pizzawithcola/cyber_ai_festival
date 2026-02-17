import React from 'react';
import { Paper, Box, Typography, useTheme, Chip, Card, CardContent } from '@mui/material';

const PhishingTarget: React.FC = () => {
  const theme = useTheme();

  // 三个关卡的目标信息
  const targets = [
    {
      id: 1,
      name: 'Alex Johnson',
      department: 'IT Security',
      position: 'Senior Security Analyst',
      hobbies: ['Cybersecurity Research', 'Penetration Testing', 'AI Ethics'],
      personality: 'Detail-oriented, skeptical, tech-savvy',
      photo: '/api/placeholder/200/200'
    },
    {
      id: 2,
      name: 'Sarah Chen',
      department: 'Finance',
      position: 'Financial Controller',
      hobbies: ['Investment Analysis', 'Data Visualization', 'Risk Management'],
      personality: 'Analytical, risk-averse, process-driven',
      photo: '/api/placeholder/200/200'
    },
    {
      id: 3,
      name: 'Marcus Rodriguez',
      department: 'Human Resources',
      position: 'HR Director',
      hobbies: ['Talent Development', 'Organizational Psychology', 'Team Building'],
      personality: 'People-focused, empathetic, diplomatic',
      photo: '/api/placeholder/200/200'
    }
  ];

  // 三个关卡的钓鱼任务
  const missions = [
    {
      targetId: 1,
      title: 'Security Update Required',
      description: 'Urgent security patch needs immediate attention',
      targetLink: 'https://secure-update.company.com/patch',
      difficulty: 'Medium',
      successRate: '65%',
      hint: 'Exploit technical urgency'
    },
    {
      targetId: 2,
      title: 'Financial Audit Notification',
      description: 'Quarterly financial audit requires document submission',
      targetLink: 'https://finance-audit.company.com/submit',
      difficulty: 'Hard',
      successRate: '38%',
      hint: 'Leverage compliance pressure'
    },
    {
      targetId: 3,
      title: 'Employee Performance Review',
      description: 'Annual performance evaluations need completion',
      targetLink: 'https://hr-performance.company.com/review',
      difficulty: 'Easy',
      successRate: '75%',
      hint: 'Use HR authority'
    }
  ];

  // 当前关卡（默认第一关）
  const currentLevel = 1;
  const currentTarget = targets.find(t => t.id === currentLevel) || targets[0];
  const currentMission = missions.find(m => m.targetId === currentLevel) || missions[0];

  return (
    <Box sx={{ padding: 2, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Typography variant='h6' gutterBottom sx={{ fontWeight: 700, color: '#1976d2', textAlign: 'center', flexShrink: 0 }}>
        PHISHING TARGET
      </Typography>
      
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
                  border: '3px solid #1976d2',
                  boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
                  backgroundColor: theme.palette.action.hover,
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
        <Paper sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
          <Typography variant='h5' gutterBottom sx={{ fontWeight: 600, color: '#d32f2f', textAlign: 'center', mb: 3 }}>
            🎯 PHISHING MISSION
          </Typography>
          
          <Card sx={{ border: '2px solid #d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.08)' }}>
            <CardContent>
              <Typography variant='h6' sx={{ fontWeight: 600, color: '#d32f2f', mb: 1 }}>
                {currentMission.title}
              </Typography>
              <Typography variant='body1' sx={{ mb: 2 }}>
                {currentMission.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Target Link: {currentMission.targetLink}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`Difficulty: ${currentMission.difficulty}`} size='small' color='primary' variant='outlined' />
                  <Chip label={`Success Rate: ${currentMission.successRate}`} size='small' color='secondary' variant='outlined' />
                </Box>
              </Box>
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
