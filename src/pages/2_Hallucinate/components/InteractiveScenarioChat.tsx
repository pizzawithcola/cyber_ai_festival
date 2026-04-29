import { useEffect, useRef, useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Collapse,
  Stack,
  Avatar,
} from '@mui/material';

import { SCENARIOS } from '../scenarios';
import { SCENARIO_PROMPTS } from '../scenarioPrompts';
import { PRIMARY_HEADER_GRADIENT } from '../hallucinateUi';

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
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [completeAcknowledged, setCompleteAcknowledged] = useState(false);
  const [overviewStep, setOverviewStep] = useState(0);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!scenario) return null;
  const scenarioCompleted = prompts.length > 0 && currentStepIndex >= prompts.length;
  const showOverview = scenarioCompleted && isOverviewVisible;
  const showInteractive = !showOverview;
  const visibleMessages = messages.length <= 1 ? messages : messages.slice(-2);

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
    }, 550);
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
              maxWidth: 920,
              mx: 'auto',
              minHeight: 'calc(100vh - 180px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: { xs: 1, md: 2 },
            }}
          >
            <Box
              ref={chatContainerRef}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 2,
                minHeight: { xs: 320, md: 420 },
              }}
            >
              {visibleMessages.map((msg) => (
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
                      width: { xs: 30, sm: 34 },
                      height: { xs: 30, sm: 34 },
                      fontSize: { xs: '1rem', sm: '1.08rem' },
                      fontWeight: 900,
                      bgcolor: msg.role === 'user' ? 'rgba(0, 255, 217, 0.9)' : 'rgba(255, 46, 147, 0.9)',
                      color: '#031017',
                      flexShrink: 0,
                    }}
                  >
                    {msg.role === 'user' ? '🧑‍🚀' : '👾'}
                  </Avatar>
                  <Paper
                    sx={{
                      px: { xs: 1.8, sm: 2.2 },
                      py: { xs: 1.55, sm: 1.85 },
                      width: msg.role === 'user' ? { xs: '72%', sm: '54%' } : { xs: '88%', sm: '76%' },
                      maxWidth: msg.role === 'user' ? 520 : 700,
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, rgba(0, 255, 217, 0.18), rgba(46, 227, 255, 0.1))'
                        : msg.hallucination
                        ? 'linear-gradient(180deg, rgba(255, 171, 64, 0.16), rgba(36, 22, 20, 0.88))'
                        : 'linear-gradient(180deg, rgba(12, 20, 42, 0.92), rgba(7, 12, 28, 0.88))',
                      color: msg.role === 'user' ? '#eaffff' : '#f2fbff',
                      borderRadius: msg.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                      border: 'none',
                      boxShadow: '0 16px 34px rgba(0,0,0,0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {msg.hallucination && (
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 900, color: '#ffb74d', display: 'block', mb: 0.7 }}
                      >
                        Checkpoint
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ lineHeight: 1.72, whiteSpace: 'pre-wrap', fontSize: { xs: '0.98rem', sm: '1.04rem' } }}>
                      {msg.content}
                    </Typography>
                    {msg.hallucination && msg.why && (
                      <Box sx={{ mt: 1.1, pt: 1, borderTop: '1px solid rgba(255, 171, 64, 0.4)' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setExpandedAnalysisId((current) => (current === msg.id ? null : msg.id))}
                          sx={{
                            mb: expandedAnalysisId === msg.id ? 0.8 : 0,
                            color: '#ffb74d !important',
                            borderColor: 'rgba(255, 171, 64, 0.6) !important',
                            animation: 'none !important',
                            fontWeight: 900,
                            fontSize: '0.875rem',
                          }}
                        >
                          {expandedAnalysisId === msg.id ? 'Hide analysis' : 'Reveal analysis'}
                        </Button>
                        <Collapse in={expandedAnalysisId === msg.id}>
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
            </Box>
            <Box
              sx={{
                pt: 3,
                pb: { xs: 2, md: 0 },
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                onClick={handleNextStep}
                disabled={isWaitingReply}
                sx={{
                  fontWeight: 900,
                  background: PRIMARY_HEADER_GRADIENT,
                  boxShadow: '0 0 0 1px rgba(0, 255, 217, 0.6), 0 12px 26px rgba(0, 255, 217, 0.32)',
                  width: { xs: '100%', sm: 360 },
                  minHeight: 48,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00ffd9 0%, #ff2e93 100%)',
                    boxShadow: '0 0 0 1px rgba(255, 46, 147, 0.7), 0 14px 32px rgba(255, 46, 147, 0.35)',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                {scenarioCompleted && !isOverviewVisible
                  ? 'Next → Scenario Overview'
                  : isWaitingReply
                  ? '...'
                  : 'Next'}
              </Button>
            </Box>
          </Box>
        )}

        {showOverview && (
          <Box
            sx={{
              width: '100%',
              maxWidth: 920,
              mx: 'auto',
              minHeight: 'calc(100vh - 180px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              textAlign: 'center',
              px: { xs: 1, md: 2 },
              py: { xs: 4, md: 6 },
            }}
          >
            <Box
              sx={{
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1.25,
                    py: 0.55,
                    borderRadius: 999,
                    border: '1px solid rgba(0,255,217,0.36)',
                    background: 'rgba(0,255,217,0.08)',
                    color: '#00ffd9',
                    fontWeight: 900,
                    fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: 1.6,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textShadow: '0 0 12px rgba(0,255,217,0.24)',
                  }}
                >
                  {activeOverview.label}
                </Typography>
                <Box key={activeOverview.title} sx={{ maxWidth: 720, animation: 'softFadeUp 420ms ease-out both' }}>
                  <Typography
                    variant="h4"
                    sx={{
	                      fontWeight: 900,
	                      mb: 1.6,
	                      color: '#ffffff',
	                      lineHeight: 1.35,
	                      fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
	                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.4rem' },
	                      letterSpacing: '0.05em',
	                      textTransform: 'uppercase',
	                      textShadow:
	                        '0 3px 0 rgba(0,0,0,0.48), 0 0 18px rgba(255,46,147,0.18), 0 0 28px rgba(0,255,217,0.16)',
	                    }}
	                  >
                    {activeOverview.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      maxWidth: 680,
                      mx: 'auto',
                      color: 'rgba(228, 241, 255, 0.88)',
                      lineHeight: 1.82,
                      fontSize: { xs: '1rem', sm: '1.1rem' },
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
                        backgroundColor: index === overviewStep ? '#00ffd9' : 'rgba(228, 241, 255, 0.24)',
                        transition: 'width 220ms ease, background-color 220ms ease',
                      }}
                    />
                  ))}
                </Stack>

                <Button
                  variant="contained"
                  onClick={() => {
                    if (!isLastOverviewStep) {
                      setOverviewStep((step) => step + 1);
                      return;
                    }
                    onStartGame?.();
                  }}
                  sx={{
                    fontWeight: 900,
                    background: PRIMARY_HEADER_GRADIENT,
                    width: { xs: '100%', sm: 360 },
                    minHeight: 48,
                    borderRadius: 2.5,
                    fontFamily: "'Inter', 'Roboto', 'Open Sans', 'Segoe UI', system-ui, sans-serif",
                    fontSize: { xs: '1rem', sm: '1.06rem' },
                  }}
                >
                  {isLastOverviewStep ? 'Next: Training Game' : 'Next'}
                </Button>
            </Box>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
