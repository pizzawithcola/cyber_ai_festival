import React from 'react';
import { 
  Box, 
  Paper,
  styled,
  keyframes
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArcadeTypography, LightSign } from '../../components/ui';
import { BrainCircuit, ScanEye, Store, Fish } from 'lucide-react';
import { ARCADE_COLORS, GRID_COLOR } from '../../theme/theme';
import pkg from '../../../package.json';

interface HomePageProps {
  toggleColorMode: () => void;
}

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const neonPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const scanline = keyframes`
  0% { top: -10%; }
  100% { top: 110%; }
`;

const screenFlicker = keyframes`
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.85; }
  94% { opacity: 1; }
`;

const cursorBlink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const floatUp = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

const glitchLine = keyframes`
  0%, 100% { transform: translateX(-100%); opacity: 0; }
  10% { opacity: 1; }
  15% { transform: translateX(100%); opacity: 0; }
`;

const noiseFlicker = keyframes`
  0%, 100% { opacity: 0; }
  5% { opacity: 0.4; }
  6% { opacity: 0; }
  40% { opacity: 0; }
  41% { opacity: 0.3; }
  43% { opacity: 0; }
  78% { opacity: 0; }
  79% { opacity: 0.25; }
  80% { opacity: 0; }
`;

// --- Styled Components ---
const GameCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'accentColor'
})<{ accentColor: string }>(({ accentColor }) => ({
  position: 'relative',
  backgroundColor: '#000008',
  border: `2px solid ${accentColor}60`,
  borderRadius: '4px',
  padding: '32px 16px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.6s ease-out both`,
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)`,
    pointerEvents: 'none',
    zIndex: 0,
  },
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    borderColor: accentColor,
    boxShadow: `0 0 15px ${accentColor}80, 0 0 30px ${accentColor}40, inset 0 0 20px ${accentColor}15`,
    '& .game-icon': {
      transform: 'scale(1.15)',
      boxShadow: `0 0 12px ${accentColor}60`,
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
  backgroundColor: `${accentColor}10`,
  transition: 'all 0.3s ease',
  boxShadow: `0 0 8px ${accentColor}30, inset 0 0 8px ${accentColor}10`,
}));

const HomePage: React.FC<HomePageProps> = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'hallucinate',
      title: 'AI HALLUCINATION',
      description: 'Spot the lies AI tells',
      icon: <BrainCircuit size={30} strokeWidth={1.5} />,
      color: ARCADE_COLORS.magenta,
    },
    {
      id: 'datashadows',
      title: 'DATA\nSHADOWS',
      description: 'Uncover hidden traces',
      icon: <ScanEye size={30} strokeWidth={1.5} />,
      color: ARCADE_COLORS.cyan,
    },
    {
      id: 'retaildemolition',
      title: 'RETAIL DEMOLITION',
      description: 'Break the system',
      icon: <Store size={30} strokeWidth={1.5} />,
      color: ARCADE_COLORS.yellow,
    },
    {
      id: 'phishing',
      title: 'PHISHING ATTACK',
      description: 'Don\'t take the bait',
      icon: <Fish size={30} strokeWidth={1.5} />,
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
        backgroundColor: '#050510',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 2px, ${GRID_COLOR}60 2px, ${GRID_COLOR}60 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, ${GRID_COLOR}60 2px, ${GRID_COLOR}60 4px)
        `,
        backgroundSize: '40px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Global scanline */}
      <Box sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, transparent, ${ARCADE_COLORS.cyan}30, transparent)`,
        animation: `${scanline} 4s linear infinite`,
        zIndex: 20,
        pointerEvents: 'none',
      }} />

      {/* Arcade Cabinet Container */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 960,
          backgroundColor: '#0a0a1a',
          border: `3px solid #2a2a4a`,
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: `0 0 40px rgba(0,0,0,0.5), 0 0 15px ${ARCADE_COLORS.cyan}08`,
        }}
      >
        {/* Marquee Header - LightSign */}
        <Box
          sx={{
            py: 1.5,
            px: 3,
            mx: 2.5,
            mt: 2.5,
            textAlign: 'center',
          }}
        >
          <LightSign>CYBER AI FESTIVAL</LightSign>
        </Box>

        {/* CRT Screen Area */}
        <Box
          sx={{
            m: 2.5,
            position: 'relative',
            backgroundColor: '#000008',
            border: '4px solid #1a1a30',
            borderRadius: '8px',
            p: { xs: 3, md: 4 },
            overflow: 'hidden',
            animation: `${screenFlicker} 6s ease-in-out infinite`,
            boxShadow: `
              inset 0 0 80px rgba(0,0,0,0.6),
              inset 0 0 20px ${ARCADE_COLORS.cyan}08,
              0 0 4px #1a1a30
            `,
            /* CRT scanlines inside */
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.12) 1px, rgba(0,0,0,0.12) 2px)',
              pointerEvents: 'none',
              borderRadius: '4px',
            },
          }}
        >
          {/* CRT Vignette - darkened corners */}
          <Box sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
            pointerEvents: 'none',
            zIndex: 3,
            borderRadius: '4px',
          }} />

          {/* Random noise/static flicker */}
          <Box sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            animation: `${noiseFlicker} 8s ease-in-out infinite`,
            pointerEvents: 'none',
            zIndex: 3,
            borderRadius: '4px',
          }} />

          {/* Horizontal glitch line */}
          <Box sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '30%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${ARCADE_COLORS.white}40, ${ARCADE_COLORS.cyan}30, transparent)`,
            animation: `${glitchLine} 6s ease-in-out infinite`,
            animationDelay: '2s',
            pointerEvents: 'none',
            zIndex: 3,
          }} />

          {/* Subtitle */}
          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
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

          {/* Game Cards Grid */}
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2.5,
              position: 'relative',
              zIndex: 1,
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
                  <Box sx={{ color: game.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {game.icon}
                  </Box>
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
                      whiteSpace: 'pre-line',
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

          {/* Bottom prompt inside screen */}
          <Box sx={{ textAlign: 'center', mt: 4, position: 'relative', zIndex: 1 }}>
            <ArcadeTypography
              arcadeSize="xs"
              component="p"
              monospace
              sx={{
                color: `${ARCADE_COLORS.cyan}80`,
                fontSize: '0.55rem',
                animation: `${floatUp} 3s ease-in-out infinite`,
                '&::after': {
                  content: '"_"',
                  animation: `${cursorBlink} 1s step-end infinite`,
                  marginLeft: '2px',
                },
              }}
            >
              INSERT COIN TO START
            </ArcadeTypography>
          </Box>
        </Box>

        {/* Bottom Panel: Speaker Dots + Coin Slot */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, pb: 2.5, pt: 1 }}>
          {/* Left speaker dots */}
          <Box sx={{ display: 'flex', gap: 0.6 }}>
            {[...Array(7)].map((_, i) => (
              <Box key={`l-${i}`} sx={{
                width: '4px', height: '4px', borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? `${ARCADE_COLORS.cyan}50` : '#2a2a4a',
              }} />
            ))}
          </Box>

          {/* Coin Slot */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.5,
            border: '2px solid #3a3a5a',
            borderRadius: '4px',
            backgroundColor: '#0d0d18',
          }}>
            <ArcadeTypography
              arcadeSize="xs"
              component="span"
              monospace
              sx={{ fontSize: '0.45rem', color: `${ARCADE_COLORS.yellow}90`, letterSpacing: '1px' }}
            >
              COIN →
            </ArcadeTypography>
            <Box sx={{
              width: '24px',
              height: '4px',
              backgroundColor: '#1a1a30',
              border: '1px solid #4a4a6a',
              borderRadius: '2px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
            }} />
          </Box>

          {/* Right speaker dots */}
          <Box sx={{ display: 'flex', gap: 0.6 }}>
            {[...Array(7)].map((_, i) => (
              <Box key={`r-${i}`} sx={{
                width: '4px', height: '4px', borderRadius: '50%',
                backgroundColor: i % 2 === 0 ? `${ARCADE_COLORS.cyan}50` : '#2a2a4a',
              }} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Bottom credits */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <ArcadeTypography
          arcadeSize="xs"
          component="p"
          monospace
          sx={{
            color: `${ARCADE_COLORS.white}30`,
            fontSize: '0.5rem',
            letterSpacing: '2px',
          }}
        >
          © 2025 MENAT AI • ALL RIGHTS RESERVED • v{pkg.version}
        </ArcadeTypography>
      </Box>
    </Box>
  );
};

export default HomePage;
