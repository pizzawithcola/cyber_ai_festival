import React, { useState, useEffect } from 'react';
import { Box, Container, keyframes } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MatrixRainBackground from '../../components/common/MatrixRainBackground';
import { ArcadeButton, ArcadeTypography } from '../../components/ui';
import { ARCADE_COLORS } from '../../theme/theme';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PhishingEducationPage: React.FC = () => {
  const navigate = useNavigate();
  
  const texts = [
    "Phishing is the art of using fake emails to impersonate trusted brands, colleagues, or friends.",
    "Today, nearly half of UK businesses are still falling victim to these digital traps.",
    "And in many cases, the attacker's big breakthrough is an employee clicking like 'sure, why not' on a fake login page.",
    "Today, you aren't the target, you are the attacker.",
    "Craft the ultimate lure and see if our employees bite the bait."
  ];
  
  const [currentTextIndex, setCurrentTextIndex] = useState(-1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (currentTextIndex === -1) {
      const initialTimer = setTimeout(() => {
        setCurrentTextIndex(0);
      }, 500);
      return () => clearTimeout(initialTimer);
    }

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 5000);

    const nextTextTimer = setTimeout(() => {
      if (currentTextIndex < texts.length - 1) {
        setIsFadingOut(false);
        setCurrentTextIndex(prev => prev + 1);
      } else {
        setTimeout(() => {
          navigate('/phishing');
        }, 400);
      }
    }, 5400);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(nextTextTimer);
    };
  }, [currentTextIndex, navigate, texts.length]);

  // Highlight numbers with arcade color
  const highlightNumbers = (text: string) => {
    const parts = text.split(/(\d+(?:,\d{3})*(?:\.\d+)?)/g);
    return parts.map((part, index) => {
      if (/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(part)) {
        return (
          <Box
            key={index}
            component="span"
            sx={{
              color: ARCADE_COLORS.yellow,
              textShadow: `0 0 8px ${ARCADE_COLORS.yellow}80`,
              fontWeight: 700,
            }}
          >
            {part}
          </Box>
        );
      }
      return part;
    });
  };

  return (
    <MatrixRainBackground>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
          position: 'relative',
        }}
      >
        {/* Skip button */}
        <Box
          sx={{
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 10,
          }}
        >
          <ArcadeButton
            color="lime"
            variant="outline"
            size="sm"
            onClick={() => navigate('/phishing')}
          >
            SKIP
          </ArcadeButton>
        </Box>

        {/* Progress indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
          }}
        >
          {texts.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: index <= currentTextIndex ? ARCADE_COLORS.lime : `${ARCADE_COLORS.lime}30`,
                boxShadow: index <= currentTextIndex ? `0 0 6px ${ARCADE_COLORS.lime}` : 'none',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
        
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              px: 3,
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {texts.map((text, index) => (
              <Box
                key={index}
                sx={{
                  opacity: index === currentTextIndex ? (isFadingOut ? 0 : 1) : 0,
                  transition: 'opacity 0.4s ease-in-out',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  pointerEvents: 'none',
                  animation: index === currentTextIndex && !isFadingOut ? `${fadeIn} 0.4s ease-out` : 'none',
                }}
              >
                <ArcadeTypography
                  font="electrolize"
                  arcadeSize="lg"
                  component="p"
                  sx={{
                    color: 'transparent',
                    lineHeight: 1.8,
                    background: `repeating-linear-gradient(
                      0deg,
                      ${ARCADE_COLORS.white} 0px,
                      ${ARCADE_COLORS.white} 3px,
                      ${ARCADE_COLORS.white}B0 3px,
                      ${ARCADE_COLORS.white}B0 6px
                    )`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: `0 0 12px ${ARCADE_COLORS.lime}50, 0 0 24px ${ARCADE_COLORS.lime}20`,
                    filter: 'drop-shadow(0 0 4px rgba(57, 100, 57, 0.3))',
                  }}
                >
                  {highlightNumbers(text)}
                </ArcadeTypography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>
    </MatrixRainBackground>
  );
};

export default PhishingEducationPage;
