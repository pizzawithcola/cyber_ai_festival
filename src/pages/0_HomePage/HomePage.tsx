import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card,
  CardContent,
  styled,
  useTheme
} from '@mui/material';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  toggleColorMode: () => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'light'
    ? `linear-gradient(145deg, ${theme.palette.grey[50]}, ${theme.palette.common.white})`
    : `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[800]})`,
  borderRadius: '16px',
  border: `1px solid ${
    theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.05)'
  }`,
  boxShadow: theme.palette.mode === 'dark'
    ? `0 8px 32px rgba(0,0,0,0.3)`
    : `0 8px 32px rgba(0,0,0,0.1)`,
  backdropFilter: 'blur(4px)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  height: '100%',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 12px 40px ${theme.palette.primary.main}40` 
      : `0 12px 40px ${theme.palette.primary.main}30`,
  },
}));

const GameIcon = styled(Box)(({ theme }) => ({
  width: '64px',
  height: '64px',
  margin: '0 auto 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  background: `linear-gradient(135deg, ${
    theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
  border: `1px solid ${theme.palette.primary.main}40`,
}));

const HomePage: React.FC<HomePageProps> = ({ toggleColorMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const games = [
    {
      id: 'deepfake',
      title: 'DeepFake',
      description: 'Detect manipulated media content',
      icon: '🔍',
      path: '/deepfake'
    },
    {
      id: 'hallucinate',
      title: 'AI Hallucination',
      description: 'Identify false AI-generated content',
      icon: '🧠',
      path: '/hallucinate'
    },
    {
      id: 'datashadows',
      title: 'Data Shadows',
      description: 'Discover hidden data traces',
      icon: '👻',
      path: '/datashadows'
    },
    {
      id: 'retaildemolition',
      title: 'Retail Demolition',
      description: 'Analyze retail vulnerabilities',
      icon: '🏪',
      path: '/retaildemolition'
    },
    {
      id: 'phishing',
      title: 'Phishing Defense',
      description: 'Spot phishing attempts',
      icon: '🎣',
      path: '/phishing'
    }
  ];

  const handleGameClick = (path: string) => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', py: 4 }}>
      <Box sx={{ textAlign: 'center', width: '100%', mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Cyber AI Festival
        </Typography>
        <Box sx={{ display: 'inline-block', mb: 2 }}>
          <ThemeToggle toggleColorMode={toggleColorMode} />
        </Box>
      </Box>
      
      <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'text.secondary', mb: 4 }}>
        Choose a challenge to begin
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        {games.map((game) => (
          <Box 
            key={game.id} 
            sx={{ 
              flex: { xs: '1 1 calc(50% - 16px)', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(20% - 16px)' },
              minWidth: { xs: '140px', sm: '160px', md: '180px' },
              maxWidth: { md: 'calc(20% - 16px)' },
            }}
          >
            <StyledCard onClick={() => handleGameClick(game.path)}>
              <CardContent sx={{ textAlign: 'center', padding: 3 }}>
                <GameIcon>
                  <Typography variant="h4">{game.icon}</Typography>
                </GameIcon>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {game.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  {game.description}
                </Typography>
              </CardContent>
            </StyledCard>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default HomePage;