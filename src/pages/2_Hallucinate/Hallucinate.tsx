import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Stack,
  Container,
  Chip,
  Collapse,
} from '@mui/material';
import {
  FiberManualRecord as FiberManualRecordIcon,
} from '@mui/icons-material';

import { SCENARIOS } from './scenarios';
import { InteractiveScenarioChat } from './components/InteractiveScenarioChat';
import { TrainingArena } from './components/TrainingArena';
import { getStoredUser } from '../../utils/userStorage';
import { apiFetch } from '../../services/api';

/** =========================================================
 *  MAIN PAGE
 *  ========================================================= */

const Hallucinate: React.FC = () => {
  const navigate = useNavigate();
  const [showAnimatedIntro, setShowAnimatedIntro] = useState(true);
  const [currentIntroTextIndex, setCurrentIntroTextIndex] = useState(0);
  const [isIntroFadingOut, setIsIntroFadingOut] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showScenarioChat, setShowScenarioChat] = useState(false);
  const [showTrainingGame, setShowTrainingGame] = useState(false);
  const [hasVerifiedSession] = useState(() => Boolean(getStoredUser()));
  const [caseFileOpen, setCaseFileOpen] = useState(false);
  const [caseFileUnlocking, setCaseFileUnlocking] = useState(false);
  const scenarioId = SCENARIOS[0].id;
  const selectedScenario = SCENARIOS.find((s) => s.id === scenarioId);
  const chatAnchorRef = useRef<HTMLDivElement>(null);
  const unlockTimerRef = useRef<number | null>(null);
  const statusText = caseFileUnlocking ? 'DECRYPTING FILE' : 'CASE FILE READY';
  const tickerItems = [
    'VERIFY BEFORE TRUST',
    'CONFIDENCE IS NOT EVIDENCE',
    'AI DOES NOT KNOW WHAT IT DOES NOT KNOW',
    'ALWAYS ASK: WHERE IS THIS FROM',
    'SLOW DOWN BEFORE YOU COPY AND PASTE',
  ];
  const introLines = [
    'AI hallucination is not just a harmless chatbot mistake.',
    'When a model sounds confident, people can copy false facts into homework, reports, code, medical searches, or legal work.',
    'ChatGPT alone fields over 2.5 billion prompts a day — that is 29,000 chances for a confidently wrong answer every single second.',
    'AI hallucinations have already triggered court sanctions, product rollbacks, and billion-dollar market losses.',
    'But one habit can protect you: slow down, spot the confidence trap, and verify before you trust.',
  ];
  const terminalLineOne = '> briefing packet detected';
  const terminalLineTwo = '> authentication passed';
  const arcadeFontCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Press+Start+2P&family=VT323&display=swap');
  `;

  const arcadeSx = {
    position: 'relative',
    color: '#f2fbff',
    backgroundColor: '#050710',
    backgroundImage:
      'radial-gradient(circle at 12% 10%, rgba(255, 46, 147, 0.28), transparent 36%), radial-gradient(circle at 84% 14%, rgba(0, 255, 217, 0.2), transparent 34%), radial-gradient(circle at 48% 78%, rgba(91, 46, 255, 0.24), transparent 42%), linear-gradient(180deg, #050710 0%, #070b18 52%, #090f1f 100%)',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '100% 4px',
      opacity: 0.22,
      pointerEvents: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(90deg, rgba(0,255,217,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(0,255,217,0.04) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      opacity: 0.18,
      pointerEvents: 'none',
    },
    '@keyframes ambientFloat': {
      '0%': { transform: 'translate3d(0, 0, 0) scale(1)' },
      '50%': { transform: 'translate3d(0, -10px, 0) scale(1.02)' },
      '100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
    },
    '@keyframes softFadeUp': {
      '0%': { opacity: 0, transform: 'translateY(16px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
    '@keyframes marqueeSlide': {
      '0%': { transform: 'translateX(0)' },
      '100%': { transform: 'translateX(-50%)' },
    },
    '@keyframes buttonGlow': {
      '0%': { boxShadow: '0 0 0 1px rgba(0,255,217,0.4), 0 12px 26px rgba(0,255,217,0.24)' },
      '50%': { boxShadow: '0 0 0 1px rgba(255,46,147,0.48), 0 16px 34px rgba(91,46,255,0.34)' },
      '100%': { boxShadow: '0 0 0 1px rgba(0,255,217,0.4), 0 12px 26px rgba(0,255,217,0.24)' },
    },
    '@keyframes statusBlink': {
      '0%': { opacity: 0.55 },
      '100%': { opacity: 1 },
    },
    '@keyframes startBlink': {
      '0%': { opacity: 0.45 },
      '100%': { opacity: 1 },
    },
    '@keyframes scanLine': {
      '0%': { transform: 'translateY(-100%)' },
      '100%': { transform: 'translateY(100%)' },
    },
    '@keyframes decryptPulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(0,255,217,0.32)' },
      '100%': { boxShadow: '0 0 0 12px rgba(0,255,217,0)' },
    },
    '@keyframes decryptSweep': {
      '0%': { transform: 'translateX(-115%)' },
      '100%': { transform: 'translateX(115%)' },
    },
    '@keyframes terminalFlicker': {
      '0%': { opacity: 0.92 },
      '45%': { opacity: 1 },
      '50%': { opacity: 0.82 },
      '100%': { opacity: 0.98 },
    },
    '@keyframes cursorBlink': {
      '0%': { opacity: 0 },
      '45%': { opacity: 1 },
      '100%': { opacity: 1 },
    },
    '@keyframes idleScan': {
      '0%': { transform: 'translateY(-120%)' },
      '100%': { transform: 'translateY(120%)' },
    },
    '@keyframes typeLine': {
      '0%': { width: '0ch' },
      '100%': { width: 'var(--target-width)' },
    },
    '& .MuiTypography-root': {
      fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
      color: '#f2fbff',
      letterSpacing: '0.06em',
      lineHeight: 1.75,
      textShadow: '0 1px 0 rgba(0,0,0,0.18)',
    },
    '& .MuiTypography-h4': {
      fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
      textTransform: 'uppercase',
      textShadow: '0 10px 34px rgba(117, 123, 255, 0.35)',
      animation: 'softFadeUp 700ms ease-out',
      fontSize: { xs: '1.5rem', sm: '1.82rem' },
      lineHeight: 1.3,
      letterSpacing: '0.08em',
    },
    '& .MuiTypography-h5, & .MuiTypography-h6': {
      fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
      fontWeight: 700,
      letterSpacing: '0.06em',
    },
    '& .MuiTypography-h5': {
      fontSize: { xs: '1.125rem', sm: '1.25rem' },
      lineHeight: 1.65,
    },
    '& .MuiTypography-h6': {
      fontSize: { xs: '1rem', sm: '1.125rem' },
      lineHeight: 1.65,
    },
    '& .MuiTypography-body1': {
      fontSize: { xs: '1rem', sm: '1rem' },
      lineHeight: 1.75,
    },
    '& .MuiTypography-body2': {
      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
      lineHeight: 1.7,
    },
    '& .MuiTypography-caption': {
      fontSize: '0.875rem',
      opacity: 0.92,
    },
    '& .MuiTypography-colorTextSecondary': {
      color: 'rgba(206, 229, 245, 0.82)',
    },
    '& .MuiCard-root': {
      backgroundColor: 'rgba(8, 12, 26, 0.92) !important',
      border: '1px solid rgba(0, 255, 217, 0.34) !important',
      boxShadow:
        '0 0 0 1px rgba(0, 255, 217, 0.18), 0 18px 42px rgba(5, 10, 22, 0.46), 0 0 22px rgba(91, 46, 255, 0.14) !important',
      backdropFilter: 'blur(10px)',
      borderRadius: '18px !important',
      transition: 'transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease, background-color 260ms ease',
      animation: 'softFadeUp 520ms ease-out',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 0 0 1px rgba(0, 255, 217, 0.28), 0 26px 56px rgba(5, 10, 22, 0.54), 0 0 30px rgba(255, 46, 147, 0.14) !important',
        borderColor: 'rgba(0, 255, 217, 0.54) !important',
      },
    },
    '& .MuiCardHeader-root': {
      background: 'linear-gradient(135deg, rgba(255, 46, 147, 0.92) 0%, rgba(91, 46, 255, 0.9) 56%, rgba(46, 227, 255, 0.84) 100%) !important',
      color: '#fff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    },
    '& .MuiCardContent-root': {
      background: 'linear-gradient(180deg, rgba(7, 11, 24, 0.94), rgba(8, 12, 26, 0.88)) !important',
    },
    '& .MuiButton-contained': {
      fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif !important",
      background: 'linear-gradient(135deg, rgba(0, 255, 217, 1) 0%, rgba(91, 46, 255, 1) 100%) !important',
      color: '#07101d !important',
      fontWeight: '900 !important',
      boxShadow: '0 0 0 1px rgba(0,255,217,0.45), 0 12px 28px rgba(0,255,217,0.24)',
      border: '1px solid rgba(0, 255, 217, 0.7)',
      transition: 'background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, filter 180ms ease',
      animation: 'buttonGlow 5s ease-in-out infinite',
      '&:hover': {
        boxShadow: '0 0 0 1px rgba(255,46,147,0.58), 0 16px 34px rgba(91,46,255,0.34)',
        filter: 'saturate(1.1)',
      },
    },
    '& .MuiButton-outlined': {
      fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif !important",
      color: '#00ffd9 !important',
      borderColor: 'rgba(0, 255, 217, 0.62) !important',
      fontWeight: '900',
      backgroundColor: 'rgba(0, 255, 217, 0.06)',
      transition: 'all 220ms ease',
      '&:hover': {
        backgroundColor: 'rgba(0, 255, 217, 0.14)',
        borderColor: 'rgba(0, 255, 217, 0.84) !important',
      },
    },
    '& .arcade-start-button': {
      fontFamily: "'Press Start 2P', 'VT323', monospace !important",
      letterSpacing: '0.08em !important',
      textTransform: 'uppercase',
    },
    '& .MuiChip-root': {
      fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif !important",
      backgroundColor: 'rgba(0, 255, 217, 0.1) !important',
      color: '#00ffd9 !important',
      border: '1px solid rgba(0, 255, 217, 0.42)',
      fontWeight: 900,
      borderRadius: '999px !important',
    },
    '& .MuiDivider-root': {
      borderColor: 'rgba(188, 222, 255, 0.12)',
    },
    '& .MuiLinearProgress-root': {
      backgroundColor: 'rgba(255,255,255,0.12) !important',
    },
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#9fe6ff !important',
    },
    '& .MuiAlert-root': {
      backgroundColor: 'rgba(140, 215, 255, 0.08) !important',
      border: '1px solid rgba(163, 225, 255, 0.24) !important',
      color: '#eaffff',
      boxShadow: '0 18px 36px rgba(10, 19, 42, 0.18)',
    },
    '& .MuiAlert-icon': {
      color: '#9fe6ff',
    },
  } as const;

  const fadeUpSx = {
    animation: 'softFadeUp 520ms ease-out both',
  } as const;
  const arcadeLabelSx = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    px: 1.2,
    py: 0.55,
    borderRadius: '999px',
    border: '1px solid rgba(0,255,217,0.35)',
    background: 'linear-gradient(135deg, rgba(0,255,217,0.12), rgba(91,46,255,0.18))',
    boxShadow: '0 0 14px rgba(0,255,217,0.12)',
    fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  } as const;
  const journeyShellSx = {
    ...fadeUpSx,
    width: '100%',
    maxWidth: 920,
    mx: 'auto',
    minHeight: 'calc(100vh - 150px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    px: { xs: 1.5, md: 2 },
    py: { xs: 4, md: 6 },
  } as const;
  const journeyTitleSx = {
    mt: 2,
    mb: 1.5,
    fontWeight: 900,
    fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
    lineHeight: 1.58,
    color: '#ffffff',
    textShadow: '0 0 10px rgba(0,0,0,0.24), 0 0 24px rgba(0,255,217,0.18)',
    fontSize: { xs: '1.14rem', sm: '1.42rem', md: '1.76rem' },
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  } as const;
  const journeyBodySx = {
    maxWidth: 680,
    mx: 'auto',
    mb: 3,
    lineHeight: 1.82,
    color: 'rgba(228, 241, 255, 0.9)',
    fontSize: { xs: '1rem', sm: '1.08rem' },
  } as const;
  const journeyPromptSx = {
    maxWidth: 640,
    mx: 'auto',
    mb: 3,
    color: 'rgba(228, 241, 255, 0.76)',
    fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
    fontSize: { xs: '0.66rem', sm: '0.72rem' },
    lineHeight: 1.9,
  } as const;
  const actionButtonSx = {
    fontWeight: 900,
    fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
    fontSize: { xs: '0.7rem', sm: '0.78rem' },
    minHeight: 48,
    px: 4,
    py: 1.3,
    borderRadius: 2.5,
  } as const;
  const arcadeTickerSx = {
    position: 'sticky',
    top: 0,
    zIndex: 4,
    width: '100%',
    overflow: 'hidden',
    borderTop: '1px solid rgba(0,255,217,0.18)',
    borderBottom: '1px solid rgba(0,255,217,0.28)',
    background:
      'linear-gradient(90deg, rgba(5,7,16,0.92), rgba(11,16,34,0.96), rgba(5,7,16,0.92))',
    boxShadow: '0 10px 28px rgba(0,0,0,0.22), 0 0 18px rgba(0,255,217,0.1)',
    backdropFilter: 'blur(10px)',
  } as const;
  useEffect(() => {
    if (!hasVerifiedSession) {
      navigate('/login/hallucinate', { replace: true });
    }
  }, [hasVerifiedSession, navigate]);

  useEffect(() => {
    if (!showAnimatedIntro) return;

    const fadeOutTimer = window.setTimeout(() => {
      setIsIntroFadingOut(true);
    }, 6500);

    const nextTextTimer = window.setTimeout(() => {
      if (currentIntroTextIndex < introLines.length - 1) {
        setIsIntroFadingOut(false);
        setCurrentIntroTextIndex((prev) => prev + 1);
      } else {
        setShowAnimatedIntro(false);
      }
    }, 7500);

    return () => {
      window.clearTimeout(fadeOutTimer);
      window.clearTimeout(nextTextTimer);
    };
  }, [currentIntroTextIndex, introLines.length, showAnimatedIntro]);

  useEffect(() => {
    if (!showScenarioChat) return;
    const handle = window.setTimeout(() => {
      chatAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(handle);
  }, [showScenarioChat]);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  const handleOpenCaseFile = () => {
    if (caseFileOpen || caseFileUnlocking) return;
    setCaseFileUnlocking(true);
    unlockTimerRef.current = window.setTimeout(() => {
      setCaseFileUnlocking(false);
      setCaseFileOpen(true);
      unlockTimerRef.current = null;
    }, 520);
  };

  const handleViewRanking = async (finalScore: number) => {
    const storedUser = getStoredUser();
    const userId = storedUser?.id;

    if (!userId) {
      navigate('/login/hallucinate', { replace: true });
      return;
    }

    try {
      let serverScore = 0;

      try {
        const getResponse = await apiFetch(`/scores/${userId}`);

        if (getResponse.ok) {
          const userData = await getResponse.json();
          serverScore = Number(userData.game2_score) || 0;
        }
      } catch (err) {
        console.error('[Hallucinate] Failed to fetch existing score:', err);
      }

      const scoreToSubmit = Math.max(serverScore, finalScore);
      const updateResponse = await apiFetch(`/scores/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ game2_score: scoreToSubmit }),
      });

      if (!updateResponse.ok) {
        console.error('[Hallucinate] Failed to submit score:', updateResponse.status);
      }
    } catch (err) {
      console.error('[Hallucinate] Error submitting score:', err);
    } finally {
      navigate('/ranking/game/hallucinate');
    }
  };

  if (!hasVerifiedSession) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#050710',
        ...arcadeSx,
      }}
    >
      <style>{arcadeFontCss}</style>
      <Box
        sx={{
          position: 'absolute',
          top: 72,
          left: { xs: -80, md: 40 },
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 46, 147, 0.22) 0%, rgba(255, 46, 147, 0) 70%)',
          filter: 'blur(8px)',
          animation: 'ambientFloat 9s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: { xs: -90, md: 20 },
          top: 180,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 255, 217, 0.18) 0%, rgba(0, 255, 217, 0) 70%)',
          filter: 'blur(10px)',
          animation: 'ambientFloat 12s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      {showAnimatedIntro ? (
        <Container
          maxWidth="lg"
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
            position: 'relative',
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setShowAnimatedIntro(false)}
            sx={{
              position: 'absolute',
              top: 24,
              right: 24,
              zIndex: 2,
              fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
              fontSize: '0.68rem',
              color: '#00ffd9 !important',
              borderColor: 'rgba(0, 255, 217, 0.62) !important',
              backgroundColor: 'rgba(0, 255, 217, 0.06)',
              '&:hover': {
                backgroundColor: 'rgba(0, 255, 217, 0.14)',
                borderColor: 'rgba(0, 255, 217, 0.84) !important',
              },
            }}
          >
            Skip
          </Button>
          <Box
            sx={{
              textAlign: 'center',
              px: 3,
              maxWidth: 1120,
              minHeight: { xs: 330, md: 420 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
            }}
          >
            {introLines.map((line, index) => (
              <Typography
                key={line}
                variant="h3"
                sx={{
                  opacity: index === currentIntroTextIndex ? (isIntroFadingOut ? 0 : 1) : 0,
                  transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
                  transform:
                    index === currentIntroTextIndex && !isIntroFadingOut ? 'translateY(0)' : 'translateY(10px)',
                  position: index === currentIntroTextIndex ? 'relative' : 'absolute',
                  pointerEvents: 'none',
                  maxWidth: 1040,
                  wordWrap: 'break-word',
                  lineHeight: { xs: 1.75, md: 1.65 },
                  textAlign: 'center',
                  fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
                  fontWeight: 900,
                  fontSize: { xs: '1.04rem', sm: '1.36rem', md: '1.78rem', lg: '2rem' },
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  textShadow:
                    '0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,255,217,0.28), 0 0 34px rgba(255,46,147,0.18)',
                }}
              >
                {line}
              </Typography>
            ))}
          </Box>
        </Container>
      ) : showLanding ? (
        <Container
          maxWidth="lg"
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
          }}
        >
          <Box
            sx={{
              ...fadeUpSx,
              width: '100%',
              maxWidth: 920,
              px: { xs: 3, md: 5 },
              py: { xs: 4, md: 5 },
              borderRadius: 4,
              border: '1px solid rgba(0,255,217,0.28)',
              background: 'linear-gradient(135deg, rgba(13, 18, 36, 0.94), rgba(7, 10, 24, 0.94))',
              boxShadow:
                '0 0 0 1px rgba(0,255,217,0.12), 0 28px 70px rgba(5, 12, 28, 0.52), 0 0 42px rgba(91,46,255,0.16)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 14,
                border: '1px solid rgba(0,255,217,0.16)',
                borderRadius: 3,
                pointerEvents: 'none',
              },
            }}
          >
            <Chip
              label="AI Safety Studio"
              size="small"
              sx={{
                mb: 1.8,
                color: '#00ffd9',
                background: 'rgba(0,255,217,0.08)',
                borderColor: 'rgba(0,255,217,0.34)',
                fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.2, fontFamily: "'Press Start 2P', 'VT323', monospace !important", fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.7rem' }, lineHeight: 1.5, letterSpacing: '0.06em', textShadow: '0 0 24px rgba(0,255,217,0.4), 0 0 48px rgba(255,46,147,0.24), 0 3px 0 rgba(0,0,0,0.5)' }}>
              AI HALLUCINATION ARCADE
            </Typography>
            <Box sx={{ mb: 3 }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: { xs: '100%', sm: 420 },
                  maxWidth: '100%',
                  p: 1.25,
                  borderRadius: 3.5,
                  background:
                    'linear-gradient(180deg, rgba(210,218,228,0.95) 0%, rgba(118,130,148,0.98) 42%, rgba(62,72,90,1) 100%)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  boxShadow:
                    'inset 0 2px 0 rgba(255,255,255,0.32), inset 0 -3px 8px rgba(0,0,0,0.34), 0 20px 40px rgba(0,0,0,0.28)',
                }}
              >
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 2.75,
                    background:
                      'linear-gradient(180deg, rgba(44,52,66,0.98) 0%, rgba(22,28,40,1) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <Button
                    className="arcade-start-button"
                    variant="contained"
                    onClick={() => setShowLanding(false)}
                    sx={{
                      '&&': {
                        backgroundColor: '#cf1717 !important',
                        backgroundImage:
                          'linear-gradient(180deg, rgba(255, 118, 118, 1) 0%, rgba(245, 32, 32, 1) 30%, rgba(196, 10, 10, 1) 68%, rgba(110, 0, 0, 1) 100%) !important',
                        color: '#fff7f7 !important',
                        fontFamily: "'Press Start 2P', 'VT323', monospace !important",
                        border: '2px solid rgba(255, 214, 214, 0.26) !important',
                        boxShadow:
                          'inset 0 8px 16px rgba(255,255,255,0.18), inset 0 -12px 18px rgba(72,0,0,0.46), 0 8px 0 rgba(74, 10, 10, 0.95), 0 18px 28px rgba(0,0,0,0.32), 0 0 24px rgba(255,40,40,0.24) !important',
                      },
                      width: '100%',
                      maxWidth: '100%',
                      minHeight: 102,
                      borderRadius: 2,
                      fontWeight: 900,
                      fontSize: '0.92rem',
                      lineHeight: 1.5,
                      letterSpacing: '0.08em',
                      textAlign: 'center',
                      animation: 'startBlink 1000ms ease-in-out infinite alternate',
                      '&:hover': {
                        transform: 'translateY(3px)',
                        boxShadow:
                          'inset 0 6px 14px rgba(255,255,255,0.16), inset 0 -10px 16px rgba(72,0,0,0.52), 0 5px 0 rgba(74, 10, 10, 0.95), 0 12px 22px rgba(0,0,0,0.28), 0 0 22px rgba(255,40,40,0.28) !important',
                      },
                      '&&:hover': {
                        backgroundColor: '#cf1717 !important',
                        backgroundImage:
                          'linear-gradient(180deg, rgba(255, 118, 118, 1) 0%, rgba(245, 32, 32, 1) 30%, rgba(196, 10, 10, 1) 68%, rgba(110, 0, 0, 1) 100%) !important',
                        color: '#fff7f7 !important',
                      },
                    }}
                  >
                    Press Start
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      ) : (
        <>
      <Box sx={arcadeTickerSx}>
        <Box
          sx={{
            display: 'flex',
            width: 'max-content',
            animation: 'marqueeSlide 24s linear infinite',
            py: 1.05,
          }}
        >
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <Typography
              key={`${item}-${index}`}
              variant="caption"
              sx={{
                flex: '0 0 auto',
                px: { xs: 2, sm: 3 },
                color: index % 2 === 0 ? '#00ffd9' : '#ff70bf',
                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: "'Press Start 2P', 'VT323', monospace !important",
                textShadow: '0 0 12px rgba(0,255,217,0.22)',
                whiteSpace: 'nowrap',
              }}
            >
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
      {/* Content */}
      <Box
        sx={{
          bgcolor: 'transparent',
          minHeight: 'calc(100vh - 200px)',
          overflowY: 'scroll',
          scrollbarGutter: 'stable',
          px: 0,
          pt: 0.5,
        }}
      >
          <Container maxWidth="lg" sx={{ pt: 2, pb: 3 }}>
            <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
              {showTrainingGame ? (
                <TrainingArena
                  onViewRanking={handleViewRanking}
                  onExitToScenarios={() => {
                    setShowTrainingGame(false);
                    setShowScenarioChat(false);
                    setShowLanding(true);
                    setCaseFileOpen(false);
                    setCaseFileUnlocking(false);
                    setCurrentIntroTextIndex(0);
                    setIsIntroFadingOut(false);
                    setShowAnimatedIntro(true);
                  }}
                />
              ) : !showScenarioChat && (
                <Box
                  sx={journeyShellSx}
                >
                  <Box sx={{ width: '100%', maxWidth: 880 }}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mb: 2 }}>
                      <Chip
                        icon={<FiberManualRecordIcon sx={{ fontSize: 12, animation: 'statusBlink 900ms ease-in-out infinite alternate' }} />}
                        label={statusText}
                        onClick={handleOpenCaseFile}
                        sx={{
                          fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
                          px: 0.7,
                          py: 0.15,
                          cursor: caseFileOpen ? 'default' : 'pointer',
                          transition: 'all 220ms ease',
                          ...(caseFileUnlocking && {
                            borderColor: 'rgba(0,255,217,0.85) !important',
                            boxShadow: '0 0 0 1px rgba(0,255,217,0.3), 0 0 16px rgba(0,255,217,0.34)',
                            animation: 'decryptPulse 520ms ease-out 1',
                          }),
                          ...(!caseFileOpen && {
                            boxShadow: '0 0 0 1px rgba(0,255,217,0.26), 0 0 14px rgba(0,255,217,0.24)',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 255, 217, 0.18) !important',
                              borderColor: 'rgba(0, 255, 217, 0.7) !important',
                            },
                          }),
                        }}
                      />
                    </Stack>

                    {!caseFileOpen && (
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 660,
                          mx: 'auto',
                          mb: 2.4,
                          px: { xs: 2, sm: 2.6 },
                          py: { xs: 1.8, sm: 2.2 },
                          borderRadius: 2.6,
                          border: '1px solid rgba(0,255,217,0.24)',
                          background: 'linear-gradient(155deg, rgba(4,9,20,0.96), rgba(8,14,30,0.98) 52%, rgba(7,12,27,0.95))',
                          boxShadow: '0 0 0 1px rgba(0,255,217,0.08), inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 46px rgba(3,8,18,0.52)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 220ms ease',
                          overflow: 'hidden',
                          position: 'relative',
                          animation: 'terminalFlicker 2.3s linear infinite',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: '34%',
                            background: 'linear-gradient(180deg, transparent, rgba(0,255,217,0.08), transparent)',
                            animation: 'idleScan 3.8s linear infinite',
                            pointerEvents: 'none',
                            opacity: 0.6,
                          },
                          '&::after': caseFileUnlocking ? {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(100deg, transparent 35%, rgba(0,255,217,0.18) 50%, transparent 65%)',
                            animation: 'decryptSweep 520ms linear 1',
                            pointerEvents: 'none',
                          } : {},
                          '&:hover': {
                            borderColor: 'rgba(0,255,217,0.44)',
                            boxShadow: '0 0 0 1px rgba(0,255,217,0.16), 0 14px 28px rgba(0,0,0,0.24)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={handleOpenCaseFile}
                      >
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mb: 0.9,
                              color: 'rgba(0,255,217,0.72)',
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              fontFamily: "'Press Start 2P', 'VT323', monospace",
                              fontSize: { xs: '0.52rem', sm: '0.58rem' },
                            }}
                          >
                            Terminal Link: Standby
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(228,241,255,0.88)',
                              lineHeight: 1.72,
                              fontSize: { xs: '0.8rem', sm: '0.86rem' },
                              mb: 0.55,
                              fontFamily: "'VT323', 'Inter', monospace",
                              letterSpacing: '0.04em',
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                '--target-width': `${terminalLineOne.length}ch`,
                                display: 'inline-block',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                width: '0ch',
                                animation: `typeLine ${Math.max(1.2, terminalLineOne.length * 0.06)}s steps(${terminalLineOne.length}, end) 0.2s forwards`,
                              }}
                            >
                              {terminalLineOne}
                            </Box>
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(182,228,255,0.8)',
                              lineHeight: 1.72,
                              fontSize: { xs: '0.8rem', sm: '0.86rem' },
                              mb: 1.25,
                              fontFamily: "'VT323', 'Inter', monospace",
                              letterSpacing: '0.04em',
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                '--target-width': `${terminalLineTwo.length}ch`,
                                display: 'inline-block',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                width: '0ch',
                                animation: `typeLine ${Math.max(1.2, terminalLineTwo.length * 0.06)}s steps(${terminalLineTwo.length}, end) ${Math.max(1.2, terminalLineOne.length * 0.06) + 0.35}s forwards`,
                              }}
                            >
                              {terminalLineTwo}
                            </Box>
                            <Box
                              component="span"
                              sx={{
                                ml: 0.35,
                                display: 'inline-block',
                                width: 8,
                                height: 14,
                                backgroundColor: 'rgba(0,255,217,0.75)',
                                animation: 'cursorBlink 900ms steps(1, end) infinite',
                                verticalAlign: 'text-bottom',
                              }}
                            />
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1.1,
                            py: 0.5,
                            borderRadius: 999,
                            border: '1px solid rgba(0,255,217,0.34)',
                            color: 'rgba(0,255,217,0.9)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontSize: { xs: '0.58rem', sm: '0.64rem' },
                            fontFamily: "'Press Start 2P', 'Inter', sans-serif",
                            animation: 'statusBlink 1100ms ease-in-out infinite alternate',
                            position: 'relative',
                            zIndex: 1,
                          }}
                        >
                          {caseFileUnlocking ? 'Decrypting...' : 'Open Case File'}
                        </Box>
                      </Box>
                    )}

                    <Collapse in={caseFileOpen} timeout={600}>
                      <Box
                        sx={{
                          overflow: 'hidden',
                          position: 'relative',
                          '&::after': caseFileOpen ? {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, rgba(0,255,217,0.6), transparent)',
                            animation: 'scanLine 0.6s ease-out forwards',
                            top: 0,
                          } : {},
                        }}
                      >
                        <Typography variant="caption" sx={{ ...arcadeLabelSx, display: 'inline-flex', mt: 1.1, mb: 1 }}>
                          Briefing
                        </Typography>
                        <Typography
                          variant="h3"
                          sx={journeyTitleSx}
                        >
                          {selectedScenario?.background.headline}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={journeyBodySx}
                        >
                          {selectedScenario?.background.dek}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={journeyPromptSx}
                        >
                          {selectedScenario?.background.question}
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => setShowScenarioChat(true)}
                          sx={actionButtonSx}
                        >
                          Enter the chat
                        </Button>
                      </Box>
                    </Collapse>
                  </Box>
                </Box>
              )}
              {!showTrainingGame && showScenarioChat && (
                <>
                  <Box ref={chatAnchorRef} />
                  <Box sx={{ width: '100%' }}>
                    <InteractiveScenarioChat
                      scenarioId={scenarioId}
                      onStartGame={() => {
                        setShowTrainingGame(true);
                      }}
                    />
                  </Box>
                </>
              )}
            </Stack>
          </Container>

      </Box>
      </>
      )}
    </Box>
  );
};

export default Hallucinate;
