import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Stack,
  Container,
  Collapse,
} from '@mui/material';

import { SCENARIOS } from './scenarios';
import { InteractiveScenarioChat } from './components/InteractiveScenarioChat';
import { TrainingArena } from './components/TrainingArena';
import { getStoredUser } from '../../utils/userStorage';
import { apiFetch } from '../../services/api';
import { ArcadeButton } from '../../components/ui';

/** =========================================================
 *  MAIN PAGE
 *  ========================================================= */

const wrapTerminalText = (text = '', maxChars = 44) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

// typing helpers removed — intro now shows immediately without typewriter timings

const Hallucinate: React.FC = () => {
  const navigate = useNavigate();
  const [showAnimatedIntro, setShowAnimatedIntro] = useState(true);
  const [currentIntroTextIndex, setCurrentIntroTextIndex] = useState(0);
  const [isIntroFadingOut, setIsIntroFadingOut] = useState(false);
  const [showScenarioChat, setShowScenarioChat] = useState(false);
  const [showTrainingGame, setShowTrainingGame] = useState(false);
  const [hasVerifiedSession] = useState(() => Boolean(getStoredUser()));
  const [showTerminalPanel, setShowTerminalPanel] = useState(false);
  const [caseFileOpen, setCaseFileOpen] = useState(false);
  const [caseFileUnlocking, setCaseFileUnlocking] = useState(false);
  const scenarioId = SCENARIOS[0].id;
  const selectedScenario = SCENARIOS.find((s) => s.id === scenarioId);
  const chatAnchorRef = useRef<HTMLDivElement>(null);
  const unlockTimerRef = useRef<number | null>(null);
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
  const terminalLineOne = '> locate hallucination_case_02.pkg';
  const terminalLineTwo = '> verify user clearance: passed';
  const terminalLineThree = '> run decrypt --case hallucination';
  const receivedFileIntroLines = [
    'A locked file just arrived in the arcade inbox: hallucination_case_02.pkg.',
    'The sender left one warning: do not trust an answer just because it sounds certain.',
    'Open the terminal to inspect the file and recover the briefing inside.',
  ];
  // removed terminal command display; keep timings minimal for label reveal
  const briefingHeadline = selectedScenario?.background.headline ?? '';
  const briefingBody = selectedScenario?.background.dek ?? '';
  const briefingObjective = selectedScenario?.background.question ?? '';
  const briefingObjectivePrefix = 'objective:';
  const briefingHeadlineLines = wrapTerminalText(briefingHeadline, 52);
  const briefingBodyLines = wrapTerminalText(briefingBody, 78);
  const briefingObjectiveLines = wrapTerminalText(briefingObjective, 66);
  const briefingLabelDelay = 0.22;
  const arcadeFontCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Orbitron:wght@400;700;900&family=Press+Start+2P&family=VT323&display=swap');
  `;

  // terminalTypeSx removed — headline/body/objective show immediately now

  const terminalRevealSx = (delay = 0, duration = 0.28) => ({
    opacity: 0,
    animation: `softFadeUp ${duration}s ease-out ${delay}s forwards`,
  } as const);

  const arcadeSx = {
    position: 'relative',
    color: '#f2fbff',
    backgroundColor: '#050710',
    backgroundImage:
      'radial-gradient(circle at 12% 10%, rgba(255, 46, 147, 0.28), transparent 36%), radial-gradient(circle at 84% 14%, rgba(255, 0, 255, 0.2), transparent 34%), radial-gradient(circle at 48% 78%, rgba(91, 46, 255, 0.24), transparent 42%), linear-gradient(180deg, #050710 0%, #070b18 52%, #090f1f 100%)',
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
        'linear-gradient(90deg, rgba(255, 0, 255, 0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(255, 0, 255, 0.04) 1px, transparent 1px)',
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
    '@keyframes statusBlink': {
      '0%': { opacity: 0.55 },
      '100%': { opacity: 1 },
    },
    '@keyframes scanLine': {
      '0%': { transform: 'translateY(-100%)' },
      '100%': { transform: 'translateY(100%)' },
    },
    '@keyframes decryptPulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 255, 0.32)' },
      '100%': { boxShadow: '0 0 0 12px rgba(255, 0, 255, 0)' },
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
      border: '1px solid rgba(255, 0, 255, 0.34) !important',
      boxShadow:
        '0 0 0 1px rgba(255, 0, 255, 0.18), 0 18px 42px rgba(5, 10, 22, 0.46), 0 0 22px rgba(91, 46, 255, 0.14) !important',
      backdropFilter: 'blur(10px)',
      borderRadius: '18px !important',
      transition: 'transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease, background-color 260ms ease',
      animation: 'softFadeUp 520ms ease-out',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 0 0 1px rgba(255, 0, 255, 0.28), 0 26px 56px rgba(5, 10, 22, 0.54), 0 0 30px rgba(255, 46, 147, 0.14) !important',
        borderColor: 'rgba(255, 0, 255, 0.54) !important',
      },
    },
    '& .MuiCardHeader-root': {
      background: 'linear-gradient(135deg, rgba(255, 46, 147, 0.92) 0%, rgba(91, 46, 255, 0.9) 56%, rgba(191, 0, 255, 0.84) 100%) !important',
      color: '#fff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    },
    '& .MuiCardContent-root': {
      background: 'linear-gradient(180deg, rgba(7, 11, 24, 0.94), rgba(8, 12, 26, 0.88)) !important',
    },
    '& .MuiChip-root': {
      fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif !important",
      backgroundColor: 'rgba(255, 0, 255, 0.1) !important',
      color: '#ff00ff !important',
      border: '1px solid rgba(255, 0, 255, 0.42)',
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
    border: '1px solid rgba(255, 0, 255, 0.35)',
    background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.12), rgba(91, 46, 255,0.18))',
    boxShadow: '0 0 14px rgba(255, 0, 255, 0.12)',
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
    textShadow: '0 0 10px rgba(0,0,0,0.24), 0 0 24px rgba(255, 0, 255, 0.18)',
    fontSize: { xs: '1.14rem', sm: '1.42rem', md: '1.76rem' },
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
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
    minHeight: 48,
    minWidth: { xs: '100%', sm: 260 },
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  } as const;
  const receivedFileIntroSx = {
    width: '100%',
    maxWidth: 760,
    mx: 'auto',
    mb: 0,
    px: { xs: 2, sm: 3 },
    py: { xs: 2.2, sm: 2.8 },
    border: '1px solid rgba(255, 0, 255, 0.3)',
    background:
      'linear-gradient(135deg, rgba(255, 0, 255, 0.1), rgba(91, 46, 255, 0.12) 48%, rgba(5, 7, 16, 0.68))',
    boxShadow: '0 18px 40px rgba(3, 0, 12, 0.34), inset 0 0 22px rgba(255, 0, 255, 0.05)',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...terminalRevealSx(0.04, 0.42),
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(255, 0, 255, 0.62), transparent)',
    },
  } as const;
  const terminalPanelSx = {
    width: '100%',
    maxWidth: 720,
    mx: 'auto',
    mb: 2.4,
    borderRadius: 0,
    border: '2px solid rgba(255, 0, 255, 0.48)',
    background:
      'linear-gradient(180deg, rgba(5,2,12,0.98), rgba(8,3,20,0.98) 48%, rgba(3,2,9,0.98))',
    boxShadow:
      '0 0 0 1px rgba(255, 0, 255, 0.16), inset 0 0 28px rgba(255, 0, 255, 0.08), 0 24px 58px rgba(3, 0, 12, 0.62)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 220ms ease',
    overflow: 'hidden',
    position: 'relative',
    animation: 'terminalFlicker 2.3s linear infinite',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background:
        'repeating-linear-gradient(0deg, rgba(255,255,255,0.035), rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)',
      opacity: 0.42,
      pointerEvents: 'none',
    },
    '&::after': caseFileUnlocking ? {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(100deg, transparent 35%, rgba(255, 0, 255, 0.18) 50%, transparent 65%)',
      animation: 'decryptSweep 520ms linear 1',
      pointerEvents: 'none',
    } : {},
    '&:hover': {
      borderColor: 'rgba(255, 0, 255, 0.72)',
      boxShadow:
        '0 0 0 1px rgba(255, 0, 255, 0.22), inset 0 0 32px rgba(255, 0, 255, 0.1), 0 18px 42px rgba(0,0,0,0.32)',
      transform: 'translateY(-1px)',
    },
  } as const;
  const terminalChromeSx = {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1.5,
    px: { xs: 1.3, sm: 1.8 },
    py: 0.9,
    borderBottom: '1px solid rgba(255, 0, 255, 0.28)',
    background:
      'linear-gradient(90deg, rgba(255, 0, 255, 0.16), rgba(91, 46, 255, 0.1), rgba(255, 0, 255, 0.08))',
  } as const;
  const terminalTextSx = {
    color: 'rgba(248, 231, 255, 0.9)',
    lineHeight: 1.64,
    fontSize: { xs: '1.02rem', sm: '1.12rem' },
    fontFamily: "'VT323', 'Courier New', monospace",
    letterSpacing: '0.04em',
  } as const;
  const arcadeTickerSx = {
    position: 'sticky',
    top: 0,
    zIndex: 4,
    width: '100%',
    overflow: 'hidden',
    borderTop: '1px solid rgba(255, 0, 255, 0.18)',
    borderBottom: '1px solid rgba(255, 0, 255, 0.28)',
    background:
      'linear-gradient(90deg, rgba(5,7,16,0.92), rgba(11,16,34,0.96), rgba(5,7,16,0.92))',
    boxShadow: '0 10px 28px rgba(0,0,0,0.22), 0 0 18px rgba(255, 0, 255, 0.1)',
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
        fontFamily: '"Press Start 2P", "Orbitron", "VT323", Inter, -apple-system, system-ui, sans-serif',
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
          background: 'radial-gradient(circle, rgba(255, 0, 255, 0.18) 0%, rgba(255, 0, 255, 0) 70%)',
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
          <ArcadeButton
            variant="outline"
            color="magenta"
            size="sm"
            onClick={() => setShowAnimatedIntro(false)}
            sx={{
              position: 'absolute',
              top: 24,
              right: 24,
              zIndex: 2,
              fontSize: '0.58rem',
            }}
          >
            Skip
          </ArcadeButton>
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
                  fontFamily: "'Orbitron', 'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: { xs: '1.04rem', sm: '1.36rem', md: '1.78rem', lg: '2rem' },
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  textShadow:
                    '0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(255, 0, 255, 0.28), 0 0 34px rgba(255, 46, 147,0.18)',
                }}
              >
                {line}
              </Typography>
            ))}
            {/* dots moved to bottom-center of the container */}
          </Box>
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              left: '50%',
              bottom: 24,
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              zIndex: 2,
            }}
          >
            {introLines.map((_, i) => (
              <Box
                key={`dot-${i}`}
                sx={{
                  width: i === currentIntroTextIndex ? 12 : 8,
                  height: i === currentIntroTextIndex ? 12 : 8,
                  borderRadius: '50%',
                  backgroundColor: i === currentIntroTextIndex ? '#ff00ff' : 'rgba(255,255,255,0.12)',
                  transition: 'width 200ms ease, height 200ms ease, background-color 200ms ease',
                }}
              />
            ))}
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
                color: index % 2 === 0 ? '#ff00ff' : '#ff70bf',
                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontFamily: "'Press Start 2P', 'VT323', monospace !important",
                textShadow: '0 0 12px rgba(255, 0, 255, 0.22)',
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
                    setShowTerminalPanel(false);
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
                    {!showTerminalPanel && !caseFileOpen && (
                      <Box sx={receivedFileIntroSx}>
                        <Typography
                          variant="caption"
                          sx={{
                            ...arcadeLabelSx,
                            mb: 1.35,
                            color: '#ff70bf',
                          }}
                        >
                          Incoming file
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{
                            ...journeyTitleSx,
                            mt: 0,
                            mb: 1.4,
                            mx: 'auto',
                            maxWidth: 680,
                            fontSize: { xs: '1rem', sm: '1.22rem', md: '1.44rem' },
                            lineHeight: 1.42,
                          }}
                        >
                          Case file received
                        </Typography>
                        <Stack spacing={0.7} sx={{ maxWidth: 680, mx: 'auto' }}>
                          {receivedFileIntroLines.map((line, idx) => {
                            const warningPhrase = 'do not trust an answer just because it sounds certain.';
                            const isWarningLine = line.includes(warningPhrase);
                            return (
                              <Typography
                                key={isWarningLine ? `warning-${idx}` : line}
                                variant="body2"
                                sx={{
                                  ...journeyPromptSx,
                                  mb: 0,
                                  maxWidth: 'none',
                                  color: 'rgba(228, 241, 255, 0.82)',
                                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                                }}
                              >
                                {isWarningLine ? (
                                  <>
                                    {line.replace(warningPhrase, '')}
                                    <em>{warningPhrase}</em>
                                  </>
                                ) : (
                                  line
                                )}
                              </Typography>
                            );
                          })}
                        </Stack>
                        <ArcadeButton
                          color="magenta"
                          size="lg"
                          animation="pulse"
                          onClick={() => setShowTerminalPanel(true)}
                          sx={{
                            ...actionButtonSx,
                            mt: 2.4,
                          }}
                        >
                          Open Terminal
                        </ArcadeButton>
                      </Box>
                    )}
                    {showTerminalPanel && !caseFileOpen && (
                      <Box
                        sx={terminalPanelSx}
                        onClick={handleOpenCaseFile}
                      >
                          <Box sx={terminalChromeSx}>
                            <Stack direction="row" spacing={0.7} alignItems="center">
                              {['#ff5f7a', '#ffbf4d', '#ff00ff'].map((color) => (
                                <Box
                                  key={color}
                                  sx={{
                                    width: 9,
                                    height: 9,
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    boxShadow: `0 0 10px ${color}80`,
                                  }}
                                />
                              ))}
                            </Stack>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'rgba(248, 231, 255, 0.78)',
                                fontFamily: "'VT323', 'Courier New', monospace",
                                fontSize: { xs: '0.85rem', sm: '0.98rem' },
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              root@arcade:/casefiles/hallucination
                            </Typography>
                          </Box>

                          <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 1.7, sm: 2.4 }, py: { xs: 1.6, sm: 2.1 } }}>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'inline-flex',
                                mb: 1.1,
                                px: 1,
                                py: 0.35,
                                border: '1px solid rgba(255, 0, 255, 0.36)',
                                color: '#ff00ff',
                                background: 'rgba(255, 0, 255, 0.08)',
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                fontFamily: "'Press Start 2P', 'VT323', monospace",
                                fontSize: { xs: '0.48rem', sm: '0.54rem' },
                              }}
                            >
                              Terminal Link: Standby
                            </Typography>
                            {[terminalLineOne, terminalLineTwo, terminalLineThree].map((line, index) => (
                              <Typography
                                key={line}
                                variant="body2"
                                sx={{
                                  ...terminalTextSx,
                                  color: index === 1 ? 'rgba(255, 191, 77, 0.92)' : terminalTextSx.color,
                                  mb: index === 2 ? 1.2 : 0.3,
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    '--target-width': `${line.length}ch`,
                                    display: 'inline-block',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%',
                                    width: '0ch',
                                    animation: `typeLine ${Math.max(1.2, line.length * 0.045)}s steps(${line.length}, end) ${0.18 + index * 0.62}s forwards`,
                                  }}
                                >
                                  {line}
                                </Box>
                              </Typography>
                            ))}
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1.2}
                              alignItems={{ xs: 'stretch', sm: 'center' }}
                              justifyContent="space-between"
                              sx={{ pt: 0.5 }}
                            >
                              <Box>
                                {['case_id: HALLUCINATION-02', 'threat_model: confidence_trap', 'access: locked'].map((line) => (
                                  <Typography key={line} variant="body2" sx={{ ...terminalTextSx, color: 'rgba(248, 231, 255, 0.68)', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                                    <Box component="span" sx={{ color: '#ff00ff' }}>$</Box> {line}
                                  </Typography>
                                ))}
                              </Box>
                              <ArcadeButton
                                color="magenta"
                                variant="outline"
                                size="sm"
                                animation="pulse"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenCaseFile();
                                }}
                                sx={{
                                  fontSize: { xs: '0.52rem', sm: '0.625rem' },
                                  alignSelf: { xs: 'stretch', sm: 'center' },
                                }}
                              >
                                {caseFileUnlocking ? 'Decrypting...' : 'Open Case File'}
                              </ArcadeButton>
                            </Stack>
                          </Box>
                        </Box>
                    )}

                    <Collapse in={caseFileOpen} timeout={600}>
                      <Box
                        sx={{
                          ...terminalPanelSx,
                          maxWidth: 880,
                          mb: 0,
                          cursor: 'default',
                          animation: 'softFadeUp 520ms ease-out both',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, rgba(255, 0, 255, 0.6), transparent)',
                            animation: 'scanLine 0.6s ease-out forwards',
                            top: 0,
                          },
                          '&:hover': {
                            transform: 'none',
                            borderColor: 'rgba(255, 0, 255, 0.58)',
                            boxShadow:
                              '0 0 0 1px rgba(255, 0, 255, 0.18), inset 0 0 28px rgba(255, 0, 255, 0.08), 0 24px 58px rgba(3, 0, 12, 0.62)',
                          },
                        }}
                      >
                        <Box sx={terminalChromeSx}>
                          <Stack direction="row" spacing={0.7} alignItems="center">
                            {['#ff5f7a', '#ffbf4d', '#ff00ff'].map((color) => (
                              <Box
                                key={color}
                                sx={{
                                  width: 9,
                                  height: 9,
                                  borderRadius: '50%',
                                  backgroundColor: color,
                                  boxShadow: `0 0 10px ${color}80`,
                                }}
                              />
                            ))}
                          </Stack>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'rgba(248, 231, 255, 0.78)',
                              fontFamily: "'VT323', 'Courier New', monospace",
                              fontSize: { xs: '0.85rem', sm: '0.98rem' },
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            root@arcade:/casefiles/briefing.md
                          </Typography>
                        </Box>
                        <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 1.7, sm: 2.8, md: 3.1 }, py: { xs: 2, sm: 2.6 } }}>
                          {/* removed terminal command line ($ cat briefing.md) per request */}
                          <Box
                            sx={{
                              display: 'inline-flex',
                              mb: 1.4,
                              maxWidth: '100%',
                              ...terminalRevealSx(briefingLabelDelay),
                            }}
                          >
                            <Typography variant="caption" sx={{ ...arcadeLabelSx, display: 'inline-flex', borderRadius: 0 }}>
                              DECRYPTED BRIEFING
                            </Typography>
                          </Box>
                          <Stack spacing={0.2} sx={{ mb: 1.6 }}>
                            {briefingHeadlineLines.map((line, index) => (
                              <Typography
                                key={`${line}-${index}`}
                                variant="h3"
                                sx={{
                                  ...journeyTitleSx,
                                  mx: 0,
                                  mt: 0,
                                  mb: 0,
                                  textAlign: 'left',
                                  fontFamily: "'VT323', 'Courier New', monospace",
                                  color: '#f8e7ff',
                                  textShadow: '0 0 18px rgba(255, 0, 255, 0.22)',
                                  fontSize: { xs: '1.35rem', sm: '1.68rem', md: '1.9rem' },
                                  letterSpacing: '0.035em',
                                  lineHeight: 1.12,
                                }}
                              >
                                <Box component="span">{line}</Box>
                              </Typography>
                            ))}
                          </Stack>
                          <Box sx={{ mb: 2 }}>
                            {briefingBodyLines.map((line, index) => (
                              <Typography
                                key={`${line}-${index}`}
                                component="div"
                                variant="body1"
                                sx={{
                                  ...terminalTextSx,
                                  color: 'rgba(248, 231, 255, 0.84)',
                                  fontSize: { xs: '0.98rem', sm: '1.08rem' },
                                  letterSpacing: '0.025em',
                                  mb: 0.12,
                                }}
                              >
                                <Box component="span">{line}</Box>
                              </Typography>
                            ))}
                          </Box>
                          <Box
                            sx={{
                              mb: 2.5,
                              px: { xs: 1.2, sm: 1.5 },
                              py: 1.2,
                              borderLeft: '3px solid rgba(255, 0, 255, 0.68)',
                              background: 'rgba(255, 0, 255, 0.07)',
                            }}
                          >
                            {briefingObjectiveLines.map((line, index) => (
                              <Typography
                                key={`${line}-${index}`}
                                component="div"
                                variant="body2"
                                sx={{
                                  ...journeyPromptSx,
                                  mx: 0,
                                  mb: 0.12,
                                  textAlign: 'left',
                                  color: 'rgba(248, 231, 255, 0.78)',
                                  fontFamily: "'VT323', 'Courier New', monospace",
                                  fontSize: { xs: '0.98rem', sm: '1.08rem' },
                                  letterSpacing: '0.025em',
                                }}
                              >
                                <Box component="span" sx={index === 0 ? { color: '#ff00ff' } : {}}>
                                  {index === 0 ? briefingObjectivePrefix : line}
                                </Box>
                                {index === 0 && (
                                  <>
                                    {' '}
                                    <Box component="span" sx={{}}>
                                      {line}
                                    </Box>
                                  </>
                                )}
                              </Typography>
                            ))}
                          </Box>
                          <ArcadeButton
                            color="magenta"
                            size="lg"
                            animation="pulse"
                            onClick={() => setShowScenarioChat(true)}
                            sx={{
                              ...actionButtonSx,
                            }}
                          >
                            Enter the chat
                          </ArcadeButton>
                        </Box>
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
