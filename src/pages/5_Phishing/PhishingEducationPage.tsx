import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, useTheme, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MatrixRainBackground from '../../components/common/MatrixRainBackground';

const PhishingEducationPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const texts = [
    "Phishing nowadays, is still a big problem for Cybersecurity.",
    "In HSBC, we have blocked more than 23,000,000 phishing emails last year (I just made it up)",
    "Now, we want to invite you to be the one who write the phishing email..."
  ];
  
  const [currentTextIndex, setCurrentTextIndex] = useState(-1); // Start with no text
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Initial delay before first text appears
    if (currentTextIndex === -1) {
      const initialTimer = setTimeout(() => {
        setCurrentTextIndex(0);
      }, 500);
      return () => clearTimeout(initialTimer);
    }

    // Fade in happens immediately when currentTextIndex changes
    
    // After 3 seconds, start fade out
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3000);

    // After fade out completes (400ms), move to next text or navigate
    const nextTextTimer = setTimeout(() => {
      if (currentTextIndex < texts.length - 1) {
        setIsFadingOut(false);
        setCurrentTextIndex(prev => prev + 1);
      } else {
        // Last text finished, add delay before navigation for smooth transition
        setTimeout(() => {
          navigate('/phishing');
        }, 400);
      }
    }, 3400);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(nextTextTimer);
    };
  }, [currentTextIndex, navigate, texts.length]);

  // Highlight numbers with color
  const highlightNumbers = (text: string) => {
    const parts = text.split(/(\d+(?:,\d{3})*(?:\.\d+)?)/g);
    return parts.map((part, index) => {
      if (/^\d+(?:,\d{3})*(?:\.\d+)?$/.test(part)) {
        return (
          <Typography
            key={index}
            component="span"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 700,
              fontSize: 'inherit', // Inherit font size from parent h3
            }}
          >
            {part}
          </Typography>
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
          bgcolor: 'transparent', // Make background transparent to show matrix rain
        }}
      >
        {/* Skip button in top-right corner */}
        <Box
          sx={{
          position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 10,
          }}
        >
          <Button
          variant="outlined"
          onClick={() => navigate('/phishing')}
            sx={{
            color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.main,
              color: '#fff',
              },
            }}
          >
            Skip
          </Button>
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
            }}
          >
          {texts.map((text, index) => (
            <Typography
              key={index}
              variant="h3"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                opacity: index === currentTextIndex ? (isFadingOut ? 0 : 1) : 0,
                transition: 'opacity 0.4s ease-in-out',
                position: index === currentTextIndex ? 'relative' : 'absolute',
                pointerEvents: 'none',
                maxWidth: '100%',
                wordWrap: 'break-word',
              }}
            >
              {highlightNumbers(text)}
            </Typography>
          ))}
        </Box>
      </Container>
      </Box>
    </MatrixRainBackground>
  );
};

export default PhishingEducationPage;
