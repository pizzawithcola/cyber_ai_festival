import React from 'react';
import { 
  Container, 
  Box, 
  Paper,
  styled,
  keyframes
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArcadeTypography, LightSign } from '../../components/ui';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';

interface HomePageProps {
  toggleColorMode: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const neonPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const GameCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'accentColor'
})<{ accentColor: string }>(({ accentColor }) => ({
  position: 'relative',
  backgroundColor: ARCADE_COLORS.dark,
  border: `3px solid ${accentColor}`,
  borderRadius: '4px',
  padding: '32px 16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.6s ease-out both`,
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      repeating-linear-gradient(0deg, transparent, transparent 2px, ${GRID_COLOR}40 2px, ${GRID_COLOR}40 4px),
      repeating-linear-gradient(90deg, transparent, transparent 2px, ${GRID_COLOR}40 2px, ${GRID_COLOR}40 4px)
    `,
    backgroundSize: '4px 4px',
    opacity: 0.3,
    pointerEvents: 'none',
    zIndex: 0,
  },
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    borderColor: accentColor,
    boxShadow: `0 0 15px ${accentColor}80, 0 0 30px ${accentColor}40, inset 0 0 20px ${accentColor}20`,
    '& .game-icon': {
      transform: 'scale(1.15)',
    },
    '& .game-title': {
      textShadow: `0 0 10px ${accentColor}, 0 0 20px ${accentColor}80`,
    },
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
}));

const IconBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'accentColor'
})<{ accentColor: string }>(({ accentColor }) => ({
  width: '64px',
  height: '64px',
  margin: '0 auto 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `2px solid ${accentColor}`,
  borderRadius: '8px',
  backgroundColor: `${accentColor}15`,
  transition: 'all 0.3s ease',
}));

const HomePage: React.FC<HomePageProps> = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'hallucinate',
      title: 'AI HALLUCINATION',
      description: 'Spot the lies AI tells',
      icon: '🧠',
      color: ARCADE_COLORS.magenta,
    },
    {
      id: 'datashadows',
      title: 'DATA SHADOWS',
      description: 'Uncover hidden traces',
      icon: '👻',
      color: ARCADE_COLORS.cyan,
    },
    {
      id: 'retaildemolition',
      title: 'RETAIL DEMOLITION',
      description: 'Break the system',
      icon: '🏪',
      color: ARCADE_COLORS.yellow,
    },
    {
      id: 'phishing',
      title: 'PHISHING ATTACK',
      description: 'Don\'t take the bait',
      icon: '🎣',
      color: ARCADE_COLORS.lime,
    }
  ];

  const handleGameClick = (gameId: string) => {
    navigate(`/login/${gameId}`);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: ARCADE_COLORS.dark,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 2px, ${GRID_COLOR} 2px, ${GRID_COLOR} 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, ${GRID_COLOR} 2px, ${GRID_COLOR} 4px)
        `,
        backgroundSize: '40px 40px',
        py: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        {/* Title */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LightSign>CYBER AI FESTIVAL</LightSign>
        </Box>

        {/* Subtitle */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <ArcadeTypography 
            arcadeSize="sm" 
            component="h2" 
            sx={{ 
              color: ARCADE_COLORS.cyan,
              textShadow: `0 0 8px ${ARCADE_COLORS.cyan}, 0 0 16px ${ARCADE_COLORS.cyan}80`,
              animation: `${neonPulse} 2s ease-in-out infinite`,
            }}
          >
            SELECT YOUR CHALLENGE
          </ArcadeTypography>
        </Box>

        {/* Game Cards */}
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3,
          }}
        >
          {games.map((game, index) => (
            <GameCard
              key={game.id}
              accentColor={game.color}
              elevation={0}
              onClick={() => handleGameClick(game.id)}
              sx={{ animationDelay: `${index * 0.15}s` }}
            >
              <IconBox className="game-icon" accentColor={game.color}>
                <span style={{ fontSize: '32px' }}>{game.icon}</span>
              </IconBox>
              
              <Box sx={{ textAlign: 'center' }}>
                <ArcadeTypography
                  arcadeSize="xs"
                  component="h3"
                  className="game-title"
                  sx={{
                    color: game.color,
                    mb: 1,
                    transition: 'text-shadow 0.3s ease',
                  }}
                >
                  {game.title}
                </ArcadeTypography>
                
                <ArcadeTypography
                  arcadeSize="xs"
                  component="p"
                  monospace
                  sx={{
                    color: ARCADE_COLORS.white,
                    opacity: 0.6,
                    fontSize: '0.65rem',
                  }}
                >
                  {game.description}
                </ArcadeTypography>
              </Box>
            </GameCard>
          ))}
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <ArcadeTypography
            arcadeSize="xs"
            component="p"
            monospace
            sx={{
              color: ARCADE_COLORS.white,
              opacity: 0.3,
              fontSize: '0.6rem',
            }}
          >
            PRESS START TO BEGIN • INSERT COIN TO CONTINUE
          </ArcadeTypography>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
