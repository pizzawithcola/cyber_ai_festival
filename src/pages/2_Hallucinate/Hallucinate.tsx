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
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Bolt as BoltIcon,
  InfoOutlined as InfoOutlinedIcon,
  Article as ArticleIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

import {
  NEON_CYAN,
  NEON_PINK,
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
  const scenarioProgressLabel = `${completedScenarioIds.size}/${REQUIRED_SCENARIO_IDS.length}`;

  const arcadeFontCss = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
  `;

  const arcadeSx = {
    position: 'relative',
    color: '#f2fbff',
    backgroundColor: '#050710',
    backgroundImage:
      'radial-gradient(circle at 15% 10%, rgba(255, 46, 147, 0.28), transparent 45%), radial-gradient(circle at 85% 18%, rgba(0, 255, 217, 0.22), transparent 50%), radial-gradient(circle at 50% 80%, rgba(91, 46, 255, 0.22), transparent 55%), linear-gradient(180deg, rgba(6, 10, 24, 0.99), rgba(5, 7, 16, 0.99))',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '100% 4px',
      opacity: 0.4,
      pointerEvents: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(90deg, rgba(0, 255, 217, 0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(0, 255, 217, 0.06) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
      opacity: 0.15,
      pointerEvents: 'none',
    },
    '@keyframes neonPulse': {
      '0%': { filter: 'drop-shadow(0 0 6px rgba(0, 255, 217, 0.25))' },
      '50%': { filter: 'drop-shadow(0 0 14px rgba(255, 46, 147, 0.4))' },
      '100%': { filter: 'drop-shadow(0 0 6px rgba(0, 255, 217, 0.25))' },
    },
    '& .MuiTypography-root': {
      fontFamily: "'VT323', 'Courier New', monospace",
      color: '#f2fbff',
      letterSpacing: '0.3px',
      lineHeight: 1.65,
      textShadow: '0 1px 0 rgba(0,0,0,0.35)',
    },
    '& .MuiTypography-h4, & .MuiTypography-h5, & .MuiTypography-h6, & .MuiTypography-subtitle1, & .MuiTypography-subtitle2': {
      fontFamily: "'Press Start 2P', 'VT323', monospace",
      textTransform: 'uppercase',
    },
    '& .MuiTypography-h4': {
      fontSize: { xs: '1.55rem', sm: '1.9rem' },
      lineHeight: 1.3,
      letterSpacing: '0.6px',
    },
    '& .MuiTypography-h5': {
      fontSize: { xs: '1.25rem', sm: '1.45rem' },
      lineHeight: 1.4,
      letterSpacing: '0.5px',
    },
    '& .MuiTypography-h6': {
      fontSize: { xs: '1.1rem', sm: '1.28rem' },
      lineHeight: 1.45,
      letterSpacing: '0.45px',
    },
    '& .MuiTypography-body1': {
      fontSize: { xs: '1.2rem', sm: '1.32rem' },
    },
    '& .MuiTypography-body2': {
      fontSize: { xs: '1.15rem', sm: '1.26rem' },
    },
    '& .MuiTypography-caption': {
      fontSize: '1.05rem',
      opacity: 0.92,
    },
    '& .MuiTypography-colorTextSecondary': {
      color: 'rgba(190, 230, 247, 0.88)',
    },
    '& .MuiCard-root, & .MuiPaper-root': {
      backgroundColor: 'rgba(8, 12, 26, 0.95) !important',
      border: '1px solid rgba(0, 255, 217, 0.5) !important',
      boxShadow:
        '0 0 0 1px rgba(0, 255, 217, 0.45), 0 12px 30px rgba(0, 255, 217, 0.16), 0 0 24px rgba(255, 46, 147, 0.1) !important',
      backdropFilter: 'blur(8px)',
    },
    '& .MuiCardHeader-root': {
      background: 'linear-gradient(135deg, #ff2e93 0%, #5b2eff 100%) !important',
      color: '#fff',
      borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
    },
    '& .MuiCardContent-root': {
      background: 'rgba(8, 12, 24, 0.88) !important',
    },
    '& .MuiButton-contained': {
      background: 'linear-gradient(135deg, #00ffd9 0%, #5b2eff 100%) !important',
      color: '#07101d !important',
      fontWeight: '900 !important',
      boxShadow: '0 0 0 1px rgba(0, 255, 217, 0.6), 0 10px 24px rgba(0, 255, 217, 0.35)',
      border: '1px solid rgba(0, 255, 217, 0.75)',
      animation: 'neonPulse 3.8s ease-in-out infinite',
    },
    '& .MuiButton-outlined': {
      color: '#00ffd9 !important',
      borderColor: 'rgba(0, 255, 217, 0.7) !important',
      fontWeight: '900',
      backgroundColor: 'rgba(0, 255, 217, 0.08)',
    },
    '& .MuiChip-root': {
      backgroundColor: 'rgba(0, 255, 217, 0.12) !important',
      color: '#00ffd9 !important',
      border: '1px solid rgba(0, 255, 217, 0.5)',
      fontWeight: 900,
    },
    '& .MuiTabs-indicator': {
      backgroundColor: '#00ffd9',
    },
    '& .MuiTab-root': {
      color: 'rgba(215, 249, 255, 0.7)',
      fontWeight: 900,
    },
    '& .Mui-selected': {
      color: '#00ffd9 !important',
    },
    '& .MuiDivider-root': {
      borderColor: 'rgba(0, 255, 217, 0.18)',
    },
    '& .MuiLinearProgress-root': {
      backgroundColor: 'rgba(0, 255, 217, 0.15) !important',
    },
    '& .MuiLinearProgress-bar': {
      backgroundColor: '#00ffd9 !important',
    },
    '& .MuiAlert-root': {
      backgroundColor: 'rgba(0, 255, 217, 0.08) !important',
      border: '1px solid rgba(0, 255, 217, 0.35) !important',
      color: '#eaffff',
      boxShadow: '0 0 16px rgba(0, 255, 217, 0.16)',
    },
    '& .MuiAlert-icon': {
      color: '#00ffd9',
    },
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
      {/* Header */}
      <Container maxWidth="lg" sx={{ py: 3, borderBottom: '1px solid rgba(0, 255, 217, 0.24)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
              AI HALLUCINATION TRAINING GAME
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Learn to identify and reduce hallucination risks
            </Typography>
          </Box>
          <ShieldIcon sx={{ fontSize: 44, color: '#00ffd9' }} />
        </Box>
      </Container>

      {/* Tabs */}
      <Container maxWidth="lg" sx={{ borderBottom: '1px solid rgba(0, 255, 217, 0.2)' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab
            label={
              allScenariosCompleted
                ? 'Learn Scenarios ✓ Completed'
                : `Learn Scenarios (${scenarioProgressLabel})`
            }
          />
          {/*<Tab label="Quiz" />*/}
          <Tab label={allScenariosCompleted ? 'Training Game' : 'Training Game (Locked)'} disabled={!allScenariosCompleted} />
          {/*<Tab label="Overview" />*/}
        </Tabs>
      </Container>

      {/* Content */}
      <Box
        sx={{
          bgcolor: 'rgba(6, 10, 24, 0.9)',
          minHeight: 'calc(100vh - 200px)',
          overflowY: 'scroll',
          scrollbarGutter: 'stable',
        }}
      >
        {tabValue === 0 && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {SCENARIOS.map((s) => (
                    <Button key={s.id} variant={scenarioId === s.id ? 'contained' : 'outlined'} onClick={() => setScenarioId(s.id)} size="small">
                      {s.title.split('(')[0].trim()}
                    </Button>
                  ))}
                </Box>
              </Paper>
              {!showScenarioChat && (
                <Card sx={{ boxShadow: 2, border: '1px solid #eee' }}>
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Archive Briefing
                      </Typography>
                    }
                  />
                  <Divider />
                  <CardContent>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      mt: 0.5,
                      fontFamily: "'Press Start 2P', 'VT323', monospace",
                      lineHeight: 1.15,
                      mb: 1,
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
                    }}
                  >
                    {selectedScenario?.background.dek}
                  </Typography>
                  {selectedScenario?.id === 'bard' && (
                    <Paper
                      sx={{
                        mb: 2,
                        p: 1.2,
                        border: `1px solid ${NEON_CYAN}`,
                        backgroundColor: 'rgba(0, 255, 217, 0.08)',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', fontWeight: 900, color: NEON_CYAN, mb: 0.5, fontFamily: "'Press Start 2P', 'VT323', monospace" }}
                      >
                        <InfoOutlinedIcon sx={{ fontSize: 14, mr: 0.6, verticalAlign: 'text-bottom' }} />
                        Note
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#d7f2ff' }}>
                        JWST = James Webb Space Telescope, NASA/ESA/CSA&apos;s flagship space observatory.
                      </Typography>
                    </Paper>
                  )}
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                    Newspaper Clippings
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 2, alignItems: 'stretch' }}>
                    {selectedScenario?.background.clippings.map((clip) => (
                      <Grid key={`${clip.outlet}-${clip.date}`} size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                        <Paper
                          sx={{
                            flex: 1,
                            height: '100%',
                            p: 2,
                            border: '1px solid rgba(0, 255, 217, 0.45)',
                            background:
                              'linear-gradient(180deg, rgba(7, 12, 28, 0.98), rgba(6, 10, 22, 0.98))',
                            boxShadow: '0 10px 22px rgba(0, 255, 217, 0.1)',
                            color: '#eaffff',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#eaffff' }}>
                              <ArticleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {clip.outlet}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#bfeeff' }}>
                              <CalendarIcon sx={{ fontSize: 14, mr: 0.5 }} />
                              {clip.date}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#bfeeff' }}>
                            <PersonIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            By {clip.byline}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.75, color: '#eaffff' }}>
                            {clip.angle}
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#d7f2ff' }}>
                            {clip.body}
                          </Typography>
                        </Paper>
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
                      <Button variant="contained" onClick={() => setShowScenarioChat(true)} sx={{ fontWeight: 900 }}>
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
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {!allScenariosCompleted ? (
              <Card sx={panelCardSx}>
                <CardHeader
                  title={
                    <Box>
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
                      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                        🎴 Hallucination Flash Cards
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        One game mode: flag risky claims, pass safe ones, then review the report.
                      </Typography>
                    </Box>
                  }
                  sx={panelHeaderSx}
                />
                <CardContent sx={{ background: PANEL_BODY_BACKGROUND }}>
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                    This section now runs as a <b>flash card game</b>. You will see one sentence at a time and choose <b>Flag</b> for hallucination risk or <b>Pass</b> if it looks safe.
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper sx={{ p: 2.5, height: '100%', border: `2px solid ${NEON_BLUE}` }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: NEON_BLUE, mb: 1 }}>
                          🎮 How to Play
                        </Typography>
                        <Stack spacing={0.75}>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>• Review one sentence per flash card</Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              lineHeight: 1.7,
                              color: '#07101d',
                              fontWeight: 900,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.75,
                              px: 1,
                              py: 0.4,
                              borderRadius: 1,
                              background: `linear-gradient(135deg, ${NEON_PINK} 0%, ${NEON_CYAN} 100%)`,
                              boxShadow: '0 0 12px rgba(255, 46, 147, 0.35)',
                            }}
                          >
                            • Finish all 5 cards within 40 seconds
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>• Click <b>Flag</b> if the claim is risky or likely hallucinated</Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>• Click <b>Pass</b> if the sentence is safe/cautious</Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>• Keep your streak for bonus points</Typography>
                        </Stack>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Paper sx={{ p: 2.5, height: '100%', border: '2px solid #00ffd9' }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#00ffd9', mb: 1 }}>
                          📊 Round Summary
                        </Typography>
                        <Stack spacing={0.75}>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>• Score, accuracy, and max combo</Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>• Correct flags and missed pitfalls</Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>• False positives and safe passes</Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#bfeeff' }}>• Review accuracy, combos, and missed pitfalls</Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Alert
                    severity="info"
                    sx={{
                      mt: 3,
                      backgroundColor: 'rgba(0, 255, 217, 0.12)',
                      border: '1px solid rgba(0, 255, 217, 0.45)',
                      color: '#eaffff',
                      '& .MuiAlert-icon': { color: '#00ffd9' },
                    }}
                  >
                  <AlertTitle sx={{ fontWeight: 900, fontFamily: "'Press Start 2P', 'VT323', monospace" }}>Tip</AlertTitle>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: "'Press Start 2P', 'VT323', monospace", lineHeight: 1.6 }}
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
                        fontSize: '1.1rem',
                        px: 6,
                        py: 1.5,
                        background: PRIMARY_HEADER_GRADIENT,
                        boxShadow: '0 10px 24px rgba(83, 109, 254, 0.35)',
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
    </Box>
  );
};

export default Hallucinate;
