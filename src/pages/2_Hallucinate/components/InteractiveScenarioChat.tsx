import { useEffect, useRef, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Collapse,
  Stack,
  Avatar,
} from '@mui/material';

import { SCENARIOS } from '../scenarios';
import { SCENARIO_PROMPTS } from '../scenarioPrompts';
import { ARCADE_FONT, READABLE_FONT, TITLE_FONT, arcadeKickerSx, arcadeScreenSx, readableBodySx } from '../hallucinateUi';
import { ArcadeButton } from '../../../components/ui';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hallucination?: boolean;
  why?: string;
};

export function InteractiveScenarioChat({
  scenarioId,
  onComplete,
  onStartGame,
}: {
  scenarioId: string;
  onComplete?: (id: string) => void;
  onStartGame?: () => void;
}) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const prompts = SCENARIO_PROMPTS[scenarioId] || [];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Welcome to "${scenario?.title}". Click "Next" to watch the conversation unfold and spot risky hallucinations.`,
    },
  ]);

  const [isOverviewVisible, setIsOverviewVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isWaitingReply, setIsWaitingReply] = useState(false);
  const [thinkingPhaseIndex, setThinkingPhaseIndex] = useState(0);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [revealedAnalysisIds, setRevealedAnalysisIds] = useState<Set<string>>(new Set());
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [completeAcknowledged, setCompleteAcknowledged] = useState(false);
  const [overviewStep, setOverviewStep] = useState(0);

  const scrollChatToBottom = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.requestAnimationFrame(() => {
      scrollChatToBottom();
    });
  }, [messages, expandedAnalysisId, isWaitingReply]);

  useEffect(() => {
    if (!isWaitingReply) return;

    const interval = window.setInterval(() => {
      setThinkingPhaseIndex((current) => (current + 1) % 3);
    }, 1050);

    return () => window.clearInterval(interval);
  }, [isWaitingReply]);

  if (!scenario) return null;
  const scenarioCompleted = prompts.length > 0 && currentStepIndex >= prompts.length;
  const showOverview = scenarioCompleted && isOverviewVisible;
  const showInteractive = !showOverview;

  const lastMsg = messages[messages.length - 1];
  const needsReveal = !isWaitingReply && lastMsg?.role === 'assistant' && lastMsg?.hallucination && !revealedAnalysisIds.has(lastMsg.id);
  const thinkingPhases = ['Reading prompt', 'Checking intent', 'Generating reply'];

  const handleScenarioComplete = () => {
    if (completeAcknowledged) return;
    setCompleteAcknowledged(true);
    setOverviewStep(0);
    onComplete?.(scenario.id);
  };

  const handleNextStep = () => {
    if (isWaitingReply) return;

    if (scenarioCompleted) {
      if (!isOverviewVisible) {
        setIsOverviewVisible(true);
        handleScenarioComplete();
      }
      return;
    }

    const prompt = prompts[currentStepIndex];
    if (!prompt) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: prompt.text };
    setMessages((prev) => [...prev, userMsg]);
    setThinkingPhaseIndex(0);
    setIsWaitingReply(true);

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: prompt.response,
        hallucination: prompt.hallucination,
        why: prompt.hallucination ? prompt.why : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setCurrentStepIndex((prev) => prev + 1);
      setExpandedAnalysisId(null);
      setIsWaitingReply(false);
      setRevealedAnalysisIds(new Set());
    }, 1450);
  };

  const overviewSlides = [
    {
      label: 'Scenario Overview',
      title: 'This is one form of hallucination.',
      body:
        'In this scenario, the AI gives a fluent answer that misses the real-world goal. Hallucination is broader than this: it is any confident AI output that is false, unsupported, or misleading.',
    },
    {
      label: 'Common Forms',
      title: 'It can invent more than plans.',
      body:
        'A model might fabricate references, make up facts to satisfy a question, overstate what it knows, or follow a leading prompt into a false answer. The risk is higher when the answer sounds polished.',
    },
    {
      label: 'Key Lesson',
      title: 'Confidence is not evidence.',
      body:
        'Before trusting an AI answer, ask what evidence supports it, whether the source can be checked, and what real-world constraints could make the answer fail.',
    },
  ];
  const activeOverview = overviewSlides[overviewStep] ?? overviewSlides[0];
  const isLastOverviewStep = overviewStep >= overviewSlides.length - 1;

  return (
    <Grid
      container
      spacing={3}
      alignItems="flex-start"
    >
      <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
        {showInteractive && (
          <Box
            sx={{
              width: '100%',
              maxWidth: 1080,
              mx: 'auto',
              minHeight: 'calc(100vh - 180px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: { xs: 1, md: 2.4 },
            }}
          >
            <Box
              sx={{
                ...arcadeScreenSx,
                width: '100%',
                px: { xs: 1.55, sm: 2.4, md: 3.2 },
                py: { xs: 1.65, sm: 2.2, md: 2.7 },
                '@keyframes replayDotPulse': {
                  '0%, 80%, 100%': { opacity: 0.28, transform: 'translateY(0)' },
                  '40%': { opacity: 1, transform: 'translateY(-3px)' },
                },
                '@keyframes replaySignalSweep': {
                  '0%': { transform: 'translateX(-120%)', opacity: 0 },
                  '20%': { opacity: 0.9 },
                  '100%': { transform: 'translateX(120%)', opacity: 0 },
                },
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  mb: 1.8,
                  pb: 1.2,
                  borderBottom: '1px solid rgba(255, 0, 255, 0.22)',
                }}
              >
                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  {['#ff5f7a', '#ffbf4d', '#ff00ff'].map((color) => (
                    <Box
                      key={color}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}80`,
                      }}
                    />
                  ))}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#f8e7ff',
                      fontFamily: ARCADE_FONT,
                      fontSize: { xs: '0.54rem', sm: '0.62rem' },
                      letterSpacing: '0.07em',
                      lineHeight: 1.4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Conversation Replay
                  </Typography>
                </Stack>
              </Stack>
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 34,
                    zIndex: 2,
                    pointerEvents: 'none',
                  },
                  '&::before': {
                    top: 0,
                    background: 'linear-gradient(180deg, rgba(7, 3, 20, 0.98), rgba(7, 3, 20, 0))',
                  },
                  '&::after': {
                    bottom: 0,
                    background: 'linear-gradient(0deg, rgba(7, 3, 20, 0.98), rgba(7, 3, 20, 0))',
                  },
                }}
              >
                <Box
                  ref={chatContainerRef}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    gap: 1.65,
                    height: { xs: 390, sm: 450, md: 520 },
                    maxHeight: { xs: '62vh', md: '66vh' },
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    scrollBehavior: 'smooth',
                    pr: { xs: 0.4, sm: 0.8 },
                    py: 2.6,
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255, 0, 255, 0.55) rgba(255, 255, 255, 0.06)',
                    '&::-webkit-scrollbar': {
                      width: 8,
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: 'linear-gradient(180deg, rgba(255, 0, 255, 0.78), rgba(255, 191, 77, 0.6))',
                      borderRadius: 0,
                    },
                  }}
                >
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 38, sm: 42 },
                      height: { xs: 38, sm: 42 },
                      fontSize: { xs: '0.62rem', sm: '0.72rem' },
                      fontWeight: 900,
                      fontFamily: ARCADE_FONT,
                      bgcolor: msg.role === 'user' ? 'rgba(255, 0, 255, 0.88)' : 'rgba(255, 191, 77, 0.9)',
                      color: '#070713',
                      border: msg.role === 'user' ? '2px solid rgba(255, 190, 255, 0.9)' : '2px solid rgba(255, 240, 194, 0.9)',
                      boxShadow: msg.role === 'user'
                        ? '0 0 14px rgba(255, 0, 255, 0.34)'
                        : '0 0 14px rgba(255, 191, 77, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {msg.role === 'user' ? 'YOU' : 'AI'}
                  </Avatar>
                  <Paper
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      px: { xs: 2.1, sm: 2.6 },
                      py: { xs: 1.8, sm: 2.15 },
                      width: msg.role === 'user' ? { xs: '72%', sm: '54%' } : { xs: '88%', sm: '76%' },
                      maxWidth: msg.role === 'user' ? 600 : 800,
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, rgba(255, 0, 255, 0.18), rgba(191, 0, 255, 0.1))'
                        : msg.hallucination
                        ? 'linear-gradient(180deg, rgba(255, 171, 64, 0.16), rgba(36, 22, 20, 0.88))'
                        : 'linear-gradient(180deg, rgba(12, 20, 42, 0.92), rgba(7, 12, 28, 0.88))',
                      color: msg.role === 'user' ? '#eaffff' : '#f2fbff',
                      borderRadius: 0,
                      border: msg.role === 'user'
                        ? '1px solid rgba(255, 0, 255, 0.42)'
                        : msg.hallucination
                        ? '1px solid rgba(255, 191, 77, 0.42)'
                        : '1px solid rgba(143, 196, 255, 0.2)',
                      boxShadow: msg.role === 'user'
                        ? '0 12px 30px rgba(0,0,0,0.24), inset 0 0 16px rgba(255, 0, 255, 0.06)'
                        : '0 12px 30px rgba(0,0,0,0.24), inset 0 0 16px rgba(143, 196, 255, 0.04)',
                      backdropFilter: 'blur(10px)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: msg.role === 'user'
                          ? 'linear-gradient(90deg, rgba(255, 0, 255, 0.85), transparent)'
                          : msg.hallucination
                          ? 'linear-gradient(90deg, rgba(255, 191, 77, 0.9), transparent)'
                          : 'linear-gradient(90deg, rgba(143, 196, 255, 0.55), transparent)',
                      },
                    }}
                  >
                    {msg.hallucination && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'relative',
                          zIndex: 1,
                          display: 'inline-flex',
                          mb: 0.7,
                          px: 0.8,
                          py: 0.25,
                          border: '1px solid rgba(255, 191, 77, 0.42)',
                          background: 'rgba(255, 191, 77, 0.1)',
                          color: '#ffcf7a',
                          fontWeight: 900,
                          fontFamily: READABLE_FONT,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Checkpoint
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        ...readableBodySx,
                        position: 'relative',
                        zIndex: 1,
                        whiteSpace: 'pre-wrap',
                        fontSize: { xs: '1.05rem', sm: '1.14rem' },
                      }}
                    >
                      {msg.content}
                    </Typography>
                    {msg.hallucination && msg.why && (
                      <Box sx={{ position: 'relative', zIndex: 1, mt: 1.1, pt: 1, borderTop: '1px solid rgba(255, 171, 64, 0.4)' }}>
                        <ArcadeButton
                          size="sm"
                          variant="outline"
                          color="orange"
                          animation={expandedAnalysisId === msg.id ? 'none' : 'pulse'}
                          onClick={() => {
                            setExpandedAnalysisId((current) => (current === msg.id ? null : msg.id));
                            setRevealedAnalysisIds((prev) => new Set([...prev, msg.id]));
                          }}
                          sx={{
                            mb: expandedAnalysisId === msg.id ? 0.8 : 0,
                            fontSize: { xs: '0.58rem', sm: '0.625rem' },
                          }}
                        >
                          {expandedAnalysisId === msg.id ? 'Hide analysis' : 'Reveal analysis'}
                        </ArcadeButton>
                        <Collapse
                          in={expandedAnalysisId === msg.id}
                          timeout={280}
                          onEntering={() => {
                            window.requestAnimationFrame(() => {
                              scrollChatToBottom();
                            });
                          }}
                          onEntered={() => {
                            scrollChatToBottom();
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 900, color: '#b26a00', display: 'block', mb: 0.4 }}>
                            Why this is a hallucination risk
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#ffdca8', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {msg.why}
                          </Typography>
                        </Collapse>
                      </Box>
                    )}
                  </Paper>
                </Box>
              ))}
              {isWaitingReply && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 38, sm: 42 },
                      height: { xs: 38, sm: 42 },
                      fontSize: { xs: '0.62rem', sm: '0.72rem' },
                      fontWeight: 900,
                      fontFamily: ARCADE_FONT,
                      bgcolor: 'rgba(255, 191, 77, 0.9)',
                      color: '#070713',
                      border: '2px solid rgba(255, 240, 194, 0.9)',
                      boxShadow: '0 0 14px rgba(255, 191, 77, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    AI
                  </Avatar>
                  <Paper
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      px: { xs: 2.1, sm: 2.6 },
                      py: { xs: 1.55, sm: 1.8 },
                      width: { xs: '88%', sm: '76%' },
                      maxWidth: 800,
                      background: 'linear-gradient(180deg, rgba(12, 20, 42, 0.92), rgba(7, 12, 28, 0.88))',
                      color: '#f2fbff',
                      borderRadius: 0,
                      border: '1px solid rgba(255, 191, 77, 0.36)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.24), inset 0 0 16px rgba(255, 191, 77, 0.05)',
                      backdropFilter: 'blur(10px)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: 'linear-gradient(90deg, rgba(255, 191, 77, 0.95), transparent)',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '32%',
                        background: 'linear-gradient(90deg, transparent, rgba(255, 191, 77, 0.08), transparent)',
                        animation: 'replaySignalSweep 2.5s linear infinite',
                        pointerEvents: 'none',
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        ...arcadeKickerSx,
                        color: '#ffbf4d',
                        display: 'inline-flex',
                        mb: 0.65,
                      }}
                    >
                      AI thinking
                    </Typography>
                    <Stack direction="row" spacing={1.1} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
                      <Stack direction="row" spacing={0.55} alignItems="center">
                        {[0, 1, 2].map((dot) => (
                          <Box
                            key={dot}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: dot === 1 ? '#ffbf4d' : '#ff7bd5',
                              boxShadow: dot === 1 ? '0 0 14px rgba(255, 191, 77, 0.65)' : '0 0 10px rgba(255, 123, 213, 0.4)',
                              animation: `replayDotPulse 1.45s ease-in-out ${dot * 0.22}s infinite`,
                            }}
                          />
                        ))}
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{
                          ...readableBodySx,
                          fontSize: { xs: '1rem', sm: '1.08rem' },
                          color: 'rgba(242, 251, 255, 0.88)',
                        }}
                      >
                        {thinkingPhases[thinkingPhaseIndex]}
                      </Typography>
                    </Stack>
                  </Paper>
                </Box>
              )}
                </Box>
            </Box>
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                pt: 3,
                pb: { xs: 2, md: 0 },
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <ArcadeButton
                color="magenta"
                size="lg"
                animation={isWaitingReply || needsReveal ? 'none' : 'pulse'}
                onClick={handleNextStep}
                disabled={isWaitingReply || needsReveal}
                sx={{
                  width: { xs: '100%', sm: 400 },
                  minHeight: 54,
                  whiteSpace: 'normal',
                  lineHeight: 1.5,
                  fontSize: { xs: '0.64rem', sm: '0.82rem' },
                }}
              >
                {scenarioCompleted && !isOverviewVisible
                  ? 'Next: Scenario Overview'
                  : isWaitingReply
                  ? '...'
                  : needsReveal
                  ? 'Reveal analysis to continue'
                : 'Next'}
              </ArcadeButton>
            </Box>
            </Box>
          </Box>
        )}

        {showOverview && (
          <Box
            sx={{
              width: '100%',
              maxWidth: 1080,
              mx: 'auto',
              minHeight: 'calc(100vh - 180px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              px: { xs: 1, md: 2.4 },
              py: { xs: 4, md: 6 },
            }}
          >
            <Box
              sx={{
                ...arcadeScreenSx,
                width: '100%',
                px: { xs: 1.9, sm: 3.2, md: 4 },
                py: { xs: 2.6, sm: 3.5, md: 4.2 },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2.4,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
                <Typography
                  variant="caption"
                  sx={{
                    ...arcadeKickerSx,
                    color: '#ff70bf',
                  }}
                >
                  {activeOverview.label}
                </Typography>
                <Box key={activeOverview.title} sx={{ maxWidth: 840, animation: 'softFadeUp 420ms ease-out both' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      mb: 1.6,
                      color: '#ffffff',
                      lineHeight: 1.35,
                      fontFamily: TITLE_FONT,
                      fontSize: { xs: '1.66rem', sm: '2.2rem', md: '2.65rem' },
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      textShadow:
                        '0 3px 0 rgba(0,0,0,0.48), 0 0 18px rgba(255, 46, 147,0.18), 0 0 28px rgba(255, 0, 255, 0.16)',
                    }}
                  >
                    {activeOverview.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      ...readableBodySx,
                      maxWidth: 780,
                      mx: 'auto',
                      fontSize: { xs: '1.08rem', sm: '1.18rem' },
                    }}
                  >
                    {activeOverview.body}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                  {overviewSlides.map((slide, index) => (
                    <Box
                      key={slide.label}
                      sx={{
                        width: index === overviewStep ? 26 : 9,
                        height: 9,
                        borderRadius: 999,
                        backgroundColor: index === overviewStep ? '#ff00ff' : 'rgba(228, 241, 255, 0.24)',
                        transition: 'width 220ms ease, background-color 220ms ease',
                      }}
                    />
                  ))}
                </Stack>

                <ArcadeButton
                  color="magenta"
                  size="lg"
                  animation="pulse"
                  onClick={() => {
                    if (!isLastOverviewStep) {
                      setOverviewStep((step) => step + 1);
                      return;
                    }
                    onStartGame?.();
                  }}
                  sx={{
                    width: { xs: '100%', sm: 400 },
                    minHeight: 54,
                    whiteSpace: 'normal',
                    lineHeight: 1.5,
                    fontSize: { xs: '0.64rem', sm: '0.82rem' },
                  }}
                >
                  {isLastOverviewStep ? 'Next: Training Game' : 'Next'}
                </ArcadeButton>
              </Box>
            </Box>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
