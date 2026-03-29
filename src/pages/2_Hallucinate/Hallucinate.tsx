import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
  Alert,
  AlertTitle,
  Stack,
  Container,
  Chip,
} from '@mui/material';
import {
  Bolt as BoltIcon,
  InfoOutlined as InfoOutlinedIcon,
  Article as ArticleIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  FiberManualRecord as FiberManualRecordIcon,
  SportsEsports as SportsEsportsIcon,
} from '@mui/icons-material';

import {
  NEON_CYAN,
  NEON_BLUE,
  PRIMARY_HEADER_GRADIENT,
  PANEL_BODY_BACKGROUND,
  panelCardSx,
  panelHeaderSx,
} from './hallucinateUi';
import { SCENARIOS, REQUIRED_SCENARIO_IDS } from './scenarios';
import { InteractiveScenarioChat } from './components/InteractiveScenarioChat';
import { TrainingArena } from './components/TrainingArena';

/** =========================================================
 *  MAIN PAGE (Tabs)
 *  ========================================================= */

const Hallucinate: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [showGameIntro, setShowGameIntro] = useState(true);
  const [showScenarioChat, setShowScenarioChat] = useState(false);
  const [completedScenarioIds, setCompletedScenarioIds] = useState<Set<string>>(new Set());
  const selectedScenario = SCENARIOS.find((s) => s.id === scenarioId);
  const chatAnchorRef = useRef<HTMLDivElement>(null);
  const allScenariosCompleted = useMemo(
    () => REQUIRED_SCENARIO_IDS.every((id) => completedScenarioIds.has(id)),
    [completedScenarioIds]
  );
  const temporaryUnlockTrainingGame = true;
  const isTrainingGameUnlocked = temporaryUnlockTrainingGame || allScenariosCompleted;
  const scenarioProgressLabel = `${completedScenarioIds.size}/${REQUIRED_SCENARIO_IDS.length}`;
  const statusText = isTrainingGameUnlocked ? 'ARCADE READY' : 'SCENARIO LOCK';

  const arcadeFontCss = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;500;700&family=VT323&display=swap');
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
    '& .MuiTypography-root': {
      fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif",
      color: '#f2fbff',
      letterSpacing: '0.02em',
      lineHeight: 1.65,
      textShadow: '0 1px 0 rgba(0,0,0,0.18)',
    },
    '& .MuiTypography-h4': {
      fontFamily: "'Press Start 2P', 'VT323', monospace",
      textTransform: 'uppercase',
      textShadow: '0 10px 34px rgba(117, 123, 255, 0.35)',
      animation: 'softFadeUp 700ms ease-out',
      fontSize: { xs: '1.5rem', sm: '1.82rem' },
      lineHeight: 1.3,
      letterSpacing: '0.08em',
    },
    '& .MuiTypography-h5, & .MuiTypography-h6': {
      fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    '& .MuiTypography-h5': {
      fontSize: { xs: '1.24rem', sm: '1.42rem' },
      lineHeight: 1.4,
      letterSpacing: '0.01em',
    },
    '& .MuiTypography-h6': {
      fontSize: { xs: '1.08rem', sm: '1.24rem' },
      lineHeight: 1.45,
      letterSpacing: '0.01em',
    },
    '& .MuiTypography-body1': {
      fontSize: { xs: '1.03rem', sm: '1.08rem' },
    },
    '& .MuiTypography-body2': {
      fontSize: { xs: '0.96rem', sm: '1rem' },
    },
    '& .MuiTypography-caption': {
      fontSize: '0.88rem',
      opacity: 0.92,
    },
    '& .MuiTypography-colorTextSecondary': {
      color: 'rgba(206, 229, 245, 0.82)',
    },
    '& .MuiCard-root, & .MuiPaper-root': {
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
    '& .MuiChip-root': {
      backgroundColor: 'rgba(0, 255, 217, 0.1) !important',
      color: '#00ffd9 !important',
      border: '1px solid rgba(0, 255, 217, 0.42)',
      fontWeight: 900,
      borderRadius: '999px !important',
    },
    '& .MuiTabs-indicator': {
      backgroundColor: '#00ffd9',
      boxShadow: '0 0 14px rgba(0,255,217,0.85)',
      height: 3,
    },
    '& .MuiTab-root': {
      color: 'rgba(215, 249, 255, 0.74)',
      fontWeight: 900,
      borderRadius: '999px',
      minHeight: 46,
      transition: 'background-color 160ms ease, color 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
      textTransform: 'uppercase',
      fontSize: '0.84rem',
      letterSpacing: '0.08em',
    },
    '& .Mui-selected': {
      color: '#00ffd9 !important',
      background: 'rgba(0, 255, 217, 0.08)',
      boxShadow: 'inset 0 0 0 1px rgba(0,255,217,0.24), 0 0 8px rgba(0,255,217,0.08)',
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
    fontFamily: "'Press Start 2P', 'VT323', monospace",
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  } as const;
  const arcadeInstructionSx = {
    lineHeight: 1.7,
    color: '#dffbff',
    fontWeight: 900,
    display: 'inline-block',
    px: 1.1,
    py: 0.55,
    borderRadius: 1.2,
    border: '1px solid rgba(0,255,217,0.28)',
    background: 'linear-gradient(135deg, rgba(0,255,217,0.08) 0%, rgba(91,46,255,0.14) 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(0,255,217,0.06), 0 0 12px rgba(0,255,217,0.08)',
    fontFamily: "'Press Start 2P', 'VT323', monospace",
    fontSize: '0.72rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  } as const;

  useEffect(() => {
    setShowScenarioChat(false);
  }, [scenarioId]);

  useEffect(() => {
    if (!showScenarioChat) return;
    const handle = window.setTimeout(() => {
      chatAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(handle);
  }, [showScenarioChat]);

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
      {showLanding ? (
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
                fontFamily: "'Press Start 2P', 'VT323', monospace",
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.4 }}>
              AI HALLUCINATION TRAINING GAME
            </Typography>
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{
                maxWidth: 560,
                mx: 'auto',
                mb: 3.5,
                fontSize: { xs: '1rem', sm: '1.08rem' },
              }}
            >
              Learn to identify and reduce hallucination risks
            </Typography>
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
                    variant="contained"
                    onClick={() => setShowLanding(false)}
                    sx={{
                      '&&': {
                        backgroundColor: '#cf1717 !important',
                        backgroundImage:
                          'linear-gradient(180deg, rgba(255, 118, 118, 1) 0%, rgba(245, 32, 32, 1) 30%, rgba(196, 10, 10, 1) 68%, rgba(110, 0, 0, 1) 100%) !important',
                        color: '#fff7f7 !important',
                        border: '2px solid rgba(255, 214, 214, 0.26) !important',
                        boxShadow:
                          'inset 0 8px 16px rgba(255,255,255,0.18), inset 0 -12px 18px rgba(72,0,0,0.46), 0 8px 0 rgba(74, 10, 10, 0.95), 0 18px 28px rgba(0,0,0,0.32), 0 0 24px rgba(255,40,40,0.24) !important',
                      },
                      width: '100%',
                      maxWidth: '100%',
                      minHeight: 102,
                      borderRadius: 2,
                      fontWeight: 900,
                      fontFamily: "'Press Start 2P', 'VT323', monospace",
                      fontSize: '1rem',
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
      {/* Header */}
      <Container maxWidth="lg" sx={{ pt: 4, pb: 0.75 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ ...fadeUpSx, mb: 1.25 }}>
          <Box
            sx={{
              flex: 1,
              px: 1.4,
              py: 0.9,
              borderRadius: 2,
              border: '1px solid rgba(0,255,217,0.26)',
              background: 'rgba(8, 12, 26, 0.86)',
              boxShadow: '0 0 0 1px rgba(0,255,217,0.08), inset 0 0 18px rgba(0,255,217,0.04)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                minWidth: 'max-content',
                animation: 'marqueeSlide 18s linear infinite',
              }}
            >
              {[
                'INSERT COIN // VERIFY CLAIMS',
                'BOSS LEVEL: HALLUCINATION',
                'COMBO BONUS: CHECK SOURCES',
                'PRESS START TO TRAIN',
              ].map((item) => (
                <Typography
                  key={item}
                  variant="caption"
                  sx={{
                    mr: 4,
                    color: '#00ffd9',
                    fontFamily: "'Press Start 2P', 'VT323', monospace",
                    letterSpacing: '0.08em',
                  }}
                >
                  {item}
                </Typography>
              ))}
              {[
                'INSERT COIN // VERIFY CLAIMS',
                'BOSS LEVEL: HALLUCINATION',
                'COMBO BONUS: CHECK SOURCES',
                'PRESS START TO TRAIN',
              ].map((item) => (
                <Typography
                  key={`${item}-repeat`}
                  variant="caption"
                  sx={{
                    mr: 4,
                    color: '#ff4da6',
                    fontFamily: "'Press Start 2P', 'VT323', monospace",
                    letterSpacing: '0.08em',
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: 12, animation: 'statusBlink 900ms ease-in-out infinite alternate' }} />}
              label={statusText}
              sx={{ fontFamily: "'Press Start 2P', 'VT323', monospace", px: 0.4 }}
            />
            <Chip
              icon={<SportsEsportsIcon sx={{ fontSize: 15 }} />}
              label={`STAGE ${tabValue + 1}`}
              sx={{ fontFamily: "'Press Start 2P', 'VT323', monospace", px: 0.4 }}
            />
          </Stack>
        </Stack>
      </Container>

      {/* Tabs */}
      <Container maxWidth="lg" sx={{ pb: 0.25 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{
            ...fadeUpSx,
            p: 0.75,
            borderRadius: '999px',
            border: '1px solid rgba(0, 255, 217, 0.18)',
            background: 'rgba(7, 10, 24, 0.72)',
            width: 'fit-content',
            maxWidth: '100%',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Tab
            label={
              allScenariosCompleted
                ? 'Learn Scenarios ✓ Completed'
                : `Learn Scenarios (${scenarioProgressLabel})`
            }
          />
          {/*<Tab label="Quiz" />*/}
          <Tab label={isTrainingGameUnlocked ? 'Training Game' : 'Training Game (Locked)'} disabled={!isTrainingGameUnlocked} />
          {/*<Tab label="Overview" />*/}
        </Tabs>
      </Container>

      {/* Content */}
      <Box
        sx={{
          bgcolor: 'transparent',
          minHeight: 'calc(100vh - 200px)',
          overflowY: 'scroll',
          scrollbarGutter: 'stable',
          px: { xs: 0, md: 0.5 },
          pt: 0.5,
        }}
      >
        {tabValue === 0 && (
          <Container maxWidth="lg" sx={{ pt: 2, pb: 3 }}>
            <Stack spacing={2}>
              <Paper
                sx={{
                  ...fadeUpSx,
                  p: 2,
                  background: 'linear-gradient(135deg, rgba(10,16,32,0.95), rgba(7,10,24,0.92)) !important',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 10,
                    border: '1px dashed rgba(0,255,217,0.2)',
                    borderRadius: 2,
                    pointerEvents: 'none',
                  },
                }}
              >
                <Box sx={{ mb: 1.4 }}>
                  <Typography variant="caption" sx={arcadeLabelSx}>
                    Select Scenario
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {SCENARIOS.map((s) => (
                    <Button
                      key={s.id}
                      variant={scenarioId === s.id ? 'contained' : 'outlined'}
                      onClick={() => setScenarioId(s.id)}
                      size="small"
                      sx={{
                        borderRadius: '999px',
                        px: 1.8,
                        py: 0.8,
                        fontFamily: "'Press Start 2P', 'VT323', monospace",
                        fontSize: '0.72rem',
                        animation: 'none !important',
                        transform: 'none !important',
                        transition:
                          'background-color 160ms ease, background-image 160ms ease, color 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
                        boxShadow:
                          scenarioId === s.id
                            ? '0 0 0 1px rgba(0,255,217,0.34), 0 0 10px rgba(0,255,217,0.12)'
                            : 'none',
                        '&:hover': {
                          transform: 'none !important',
                          boxShadow:
                            scenarioId === s.id
                              ? '0 0 0 1px rgba(0,255,217,0.4), 0 0 12px rgba(0,255,217,0.14)'
                              : '0 0 0 1px rgba(0,255,217,0.22)',
                        },
                      }}
                    >
                      {s.title.split('(')[0].trim()}
                    </Button>
                  ))}
                </Box>
              </Paper>
              {!showScenarioChat && (
                <Card
                  sx={{
                    ...fadeUpSx,
                    boxShadow: 2,
                    border: '1px solid rgba(184, 227, 255, 0.18)',
                    overflow: 'hidden',
                  }}
                >
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Archive Briefing
                      </Typography>
                    }
                  />
                  <Divider />
                  <CardContent>
                  <Box sx={{ mb: 1.3 }}>
                    <Typography variant="caption" sx={arcadeLabelSx}>
                      Mission Briefing
                    </Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      mt: 0.5,
                      fontFamily: "'Press Start 2P', 'VT323', monospace",
                      lineHeight: 1.15,
                      mb: 1.25,
                  background: 'linear-gradient(135deg, #ffffff 0%, #c6efff 100%)',
                      textShadow: '0 0 12px rgba(0,255,217,0.18)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {selectedScenario?.background.headline}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: 1.8,
                      mb: 2,
                      fontFamily: "'VT323', 'Courier New', monospace",
                      color: 'rgba(228, 241, 255, 0.92)',
                    }}
                  >
                    {selectedScenario?.background.dek}
                  </Typography>
                  {selectedScenario?.id === 'bard' && (
                    <Paper
                      sx={{
                        mb: 2,
                        p: 0.8,
                        border: `1px solid ${NEON_CYAN}`,
                        backgroundColor: 'rgba(0, 255, 217, 0.08)',
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontWeight: 900,
                          color: NEON_CYAN,
                          mb: 0.35,
                          fontFamily: "'Press Start 2P', 'VT323', monospace",
                          fontSize: '0.7rem',
                          letterSpacing: '0.08em',
                        }}
                      >
                        <InfoOutlinedIcon sx={{ fontSize: 14, mr: 0.6, verticalAlign: 'text-bottom' }} />
                        Note
                      </Typography>
                      <Typography
                        variant="inherit"
                        sx={{
                          lineHeight: 1.5,
                          color: '#d7f2ff',
                          fontSize: '0.95rem',
                          fontStyle: 'italic',
                        }}
                      >
                        • JWST = James Webb Space Telescope, NASA/ESA/CSA&apos;s flagship space observatory.
                        <br />
                        • Exoplanet = a planet outside our solar system.
                      </Typography>
                    </Paper>
                  )}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 900,
                      mb: 1,
                      color: '#f3f3f3',
                      letterSpacing: '0.08em',
                      fontSize: { xs: '1.08rem', sm: '1.18rem' },
                    }}
                  >
                    Newspaper Clippings
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2, alignItems: 'stretch' }}>
                    {selectedScenario?.background.clippings.map((clip) => (
                      <Grid key={`${clip.outlet}-${clip.date}`} size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                        <Box
                          component="article"
                          sx={{
                            flex: 1,
                            height: '100%',
                            p: 2,
                            border: '3px double #161616',
                            backgroundColor: '#f6f1e4',
                            backgroundImage:
                              'linear-gradient(0deg, rgba(0,0,0,0.025), rgba(0,0,0,0.025)), repeating-linear-gradient(180deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 4px)',
                            boxShadow: '0 6px 14px rgba(0, 0, 0, 0.22)',
                            color: '#161616',
                            transition: 'transform 220ms ease, box-shadow 220ms ease',
                            '&:hover': {
                              transform: 'translateY(-3px) rotate(-0.4deg)',
                              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.18)',
                            },
                            '& .MuiTypography-root': {
                              color: '#161616 !important',
                              fontFamily: "'Georgia', 'Times New Roman', serif",
                              textShadow: 'none !important',
                              letterSpacing: 'normal',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, pb: 0.5, borderBottom: '1px solid rgba(0,0,0,0.3)' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              <ArticleIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-top' }} />
                              {clip.outlet}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.72rem', opacity: 0.9 }}>
                              <CalendarIcon sx={{ fontSize: 13, mr: 0.4, verticalAlign: 'text-top' }} />
                              {clip.date}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
                            <PersonIcon sx={{ fontSize: 13, mr: 0.4, verticalAlign: 'text-top' }} />
                            By {clip.byline}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.75, fontSize: '1rem', lineHeight: 1.45 }}>
                            {clip.angle}
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, fontSize: '0.96rem' }}>
                            {clip.body}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Alert
                    severity="info"
                    sx={{
                      mb: 2,
                      backgroundColor: 'rgba(0, 255, 217, 0.12)',
                      border: '1px solid rgba(0, 255, 217, 0.45)',
                      color: '#eaffff',
                      '& .MuiAlert-icon': { color: '#00ffd9' },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "'Press Start 2P', 'VT323', monospace", lineHeight: 1.6 }}
                    >
                      {selectedScenario?.background.question}
                    </Typography>
                  </Alert>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={() => setShowScenarioChat(true)}
                        sx={{ fontWeight: 900, fontFamily: "'Press Start 2P', 'VT323', monospace", fontSize: '0.78rem' }}
                      >
                        Start the chat
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
              {showScenarioChat && (
                <>
                  <Box ref={chatAnchorRef} />
                  <Box sx={{ width: '100%' }}>
                    <InteractiveScenarioChat
                      scenarioId={scenarioId}
                      onComplete={(id) =>
                        setCompletedScenarioIds((prev) => {
                          if (prev.has(id)) return prev;
                          const next = new Set(prev);
                          next.add(id);
                          return next;
                        })
                      }
                    />
                  </Box>
                </>
              )}
            </Stack>
          </Container>
        )}
        


        {tabValue === 1 && (
          <Container maxWidth="lg" sx={{ pt: 2, pb: 3 }}>
            {!isTrainingGameUnlocked ? (
              <Card sx={panelCardSx}>
                <CardHeader
                  title={
                    <Box>
                      <Typography variant="caption" sx={{ ...arcadeLabelSx, mb: 1.1 }}>
                        Access Denied
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                        🔒 Training Game Locked
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        Complete both Learn Scenarios to unlock the training game.
                      </Typography>
                    </Box>
                  }
                  sx={panelHeaderSx}
                />
                <CardContent sx={{ background: PANEL_BODY_BACKGROUND }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    Finish the two scenarios first. Once both are completed, the Training Game tab will unlock automatically.
                  </Typography>
                </CardContent>
              </Card>
            ) : showGameIntro ? (
              <Card sx={panelCardSx}>
                <CardHeader
                  title={
                    <Box>
                      <Typography variant="caption" sx={{ ...arcadeLabelSx, mb: 1.1 }}>
                        Player Briefing
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                        🎴 Hallucination Flash Cards
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(226, 242, 255, 0.8)', maxWidth: 640 }}>
                        Scan the round rules, then enter the arena and classify each card like an arcade boss check.
                      </Typography>
                    </Box>
                  }
                  sx={panelHeaderSx}
                />
                <CardContent
                  sx={{
                    background: PANEL_BODY_BACKGROUND,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 18,
                      border: '1px solid rgba(0,255,217,0.12)',
                      borderRadius: 3,
                      pointerEvents: 'none',
                    },
                  }}
                >
                  <Box
                    sx={{
                      mb: 3,
                      px: 2,
                      py: 1.6,
                      borderRadius: 2.5,
                      border: '1px solid rgba(0,255,217,0.18)',
                      background:
                        'linear-gradient(135deg, rgba(0,255,217,0.08), rgba(91,46,255,0.12) 55%, rgba(255,46,147,0.08))',
                      boxShadow: '0 0 18px rgba(0,255,217,0.08)',
                    }}
                  >
                    <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                      This section runs as a <b>flash card game</b>. You will see one sentence at a time and choose <b>Flag</b> for hallucination risk or <b>Pass</b> if it looks safe.
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper
                        sx={{
                          p: 2.5,
                          height: '100%',
                          border: `1px solid rgba(164, 227, 255, 0.22)`,
                          background:
                            'linear-gradient(180deg, rgba(16,24,46,0.98), rgba(8,12,28,0.94)) !important',
                          position: 'relative',
                          boxShadow: '0 0 0 1px rgba(0,255,217,0.08), 0 20px 36px rgba(0,0,0,0.2) !important',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            width: 14,
                            height: 14,
                            borderTop: '2px solid #00ffd9',
                            borderLeft: '2px solid #00ffd9',
                          },
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 900, color: NEON_BLUE, mb: 1 }}>
                          🎮 How to Play
                        </Typography>
                        <Stack spacing={0.75}>
                          <Typography variant="body2" sx={arcadeInstructionSx}>
                            • Review one sentence per flash card
                          </Typography>
                          <Typography variant="body2" sx={arcadeInstructionSx}>
                            • Finish all 5 cards and review each result
                          </Typography>
                          <Typography variant="body2" sx={arcadeInstructionSx}>
                            • Click Flag if the claim is risky or likely hallucinated
                          </Typography>
                          <Typography variant="body2" sx={arcadeInstructionSx}>
                            • Click Pass if the sentence is safe/cautious
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper
                        sx={{
                          p: 2.5,
                          height: '100%',
                          border: '1px solid rgba(164, 227, 255, 0.22)',
                          background:
                            'linear-gradient(180deg, rgba(16,24,46,0.98), rgba(8,12,28,0.94)) !important',
                          position: 'relative',
                          boxShadow: '0 0 0 1px rgba(255,46,147,0.06), 0 20px 36px rgba(0,0,0,0.2) !important',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            right: 10,
                            bottom: 10,
                            width: 14,
                            height: 14,
                            borderRight: '2px solid #ff2e93',
                            borderBottom: '2px solid #ff2e93',
                          },
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#a6eaff', mb: 1 }}>
                          📊 Round Summary
                        </Typography>
                        <Stack spacing={0.75}>
                          <Typography variant="body2" sx={arcadeInstructionSx}>
                            • Score out of 100 and accuracy
                          </Typography>
                          <Typography variant="body2" sx={arcadeInstructionSx}>
                            • Correct flags and missed pitfalls
                          </Typography>
                          <Typography variant="body2" sx={arcadeInstructionSx}>
                            • False positives and safe passes
                          </Typography>
                          <Typography variant="body2" sx={arcadeInstructionSx}>
                            • Review accuracy and missed pitfalls
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Alert
                    severity="info"
                    sx={{
                      mt: 3,
                      backgroundColor: 'rgba(145, 221, 255, 0.06)',
                      border: '1px solid rgba(176, 231, 255, 0.18)',
                      color: '#eaffff',
                      '& .MuiAlert-icon': { color: '#a6eaff' },
                      boxShadow: '0 10px 24px rgba(0,0,0,0.16)',
                    }}
                  >
                  <AlertTitle sx={{ fontWeight: 900, fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif" }}>Tip</AlertTitle>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif", lineHeight: 1.7 }}
                  >
                    Focus on exact numbers, fake-looking citations, “first-ever” claims, and absolute wording like “all” or “no exceptions”.
                  </Typography>
                </Alert>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setShowGameIntro(false)}
                      sx={{
                        fontWeight: 900,
                        fontSize: '0.95rem',
                        px: 6,
                        py: 1.5,
                        background: PRIMARY_HEADER_GRADIENT,
                        boxShadow: '0 10px 24px rgba(83, 109, 254, 0.35)',
                        fontFamily: "'Press Start 2P', 'VT323', monospace",
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00ffd9 0%, #ff2e93 100%)',
                          boxShadow: '0 14px 30px rgba(83, 109, 254, 0.5)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                      startIcon={<BoltIcon />}
                    >
                      🎮 START FLASH CARDS
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <TrainingArena
                autoStart
                onExitToScenarios={() => {
                  setShowLanding(true);
                  setShowGameIntro(true);
                  setTabValue(0);
                  setShowScenarioChat(false);
                  setCompletedScenarioIds(new Set());
                  setScenarioId(SCENARIOS[0].id);
                }}
              />
            )}
          </Container>
        )}

      </Box>
      </>
      )}
    </Box>
  );
};

export default Hallucinate;
