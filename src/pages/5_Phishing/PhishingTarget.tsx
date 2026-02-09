import React from 'react';
import { Grid, Paper, Box, Typography, useTheme, Avatar, Chip, Card, CardContent } from '@mui/material';

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
      clearance: 'Level 5 - Classified',
      photo: '/api/placeholder/200/200'
    },
    {
      id: 2,
      name: 'Sarah Chen',
      department: 'Finance',
      position: 'Financial Controller',
      hobbies: ['Investment Analysis', 'Data Visualization', 'Risk Management'],
      personality: 'Analytical, risk-averse, process-driven',
      clearance: 'Level 3 - Confidential',
      photo: '/api/placeholder/200/200'
    },
    {
      id: 3,
      name: 'Marcus Rodriguez',
      department: 'Human Resources',
      position: 'HR Director',
      hobbies: ['Talent Development', 'Organizational Psychology', 'Team Building'],
      personality: 'People-focused, empathetic, diplomatic',
      clearance: 'Level 4 - Secret',
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
    <Box sx={{ flexGrow: 1, padding: 2, overflowY: 'auto', height: '100%' }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 700, color: '#1976d2', textAlign: 'center' }}>
        🕵️ MI6 PHISHING MISSION - LEVEL {currentLevel}
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minHeight: 'fit-content' }}>
        {/* 目标信息 - 纵向排列 */}
        <Paper sx={{ p: 3, backgroundColor: theme.palette.background.paper, flexShrink: 0 }}>
          <Typography variant='h5' gutterBottom sx={{ fontWeight: 600, color: '#1976d2', textAlign: 'center', mb: 3 }}>
            📋 TARGET PROFILE
          </Typography>
          
          {/* 目标照片 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Avatar 
              src={currentTarget.photo} 
              sx={{ 
                width: 100, 
                height: 100, 
                border: '3px solid #1976d2',
                boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)'
              }} 
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>Name:</Typography>
              <Typography variant='body2' sx={{ mb: 1 }}>{currentTarget.name}</Typography>
              
              <Typography variant='body2' sx={{ fontWeight: 500 }}>Department:</Typography>
              <Typography variant='body2' sx={{ mb: 1 }}>{currentTarget.department}</Typography>
              
              <Typography variant='body2' sx={{ fontWeight: 500 }}>Position:</Typography>
              <Typography variant='body2' sx={{ mb: 1 }}>{currentTarget.position}</Typography>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant='body2' sx={{ fontWeight: 500 }}>Clearance Level:</Typography>
              <Chip label={currentTarget.clearance} size='small' color='error' variant='outlined' sx={{ mb: 2 }} />
              
              <Typography variant='body2' sx={{ fontWeight: 500 }}>Hobbies:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, mb: 2 }}>
                {currentTarget.hobbies.map((hobby: string, index: number) => (
                  <Chip key={index} label={hobby} size='small' variant='outlined' />
                ))}
              </Box>
              
              <Typography variant='body2' sx={{ fontWeight: 500 }}>Personality:</Typography>
              <Typography variant='body2'>{currentTarget.personality}</Typography>
            </Grid>
          </Grid>
        </Paper>
        
        {/* 钓鱼任务 - 纵向排列 */}
        <Paper sx={{ p: 3, backgroundColor: theme.palette.background.paper, flexShrink: 0 }}>
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
