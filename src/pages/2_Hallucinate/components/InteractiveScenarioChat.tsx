import { useEffect, useRef, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Paper,
  Grid,
  Divider,
  Alert,
  AlertTitle,
  Stack,
  Avatar,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

import { SCENARIOS } from '../scenarios';
import { SCENARIO_PROMPTS } from '../scenarioPrompts';
import { NEON_CYAN, NEON_BLUE, PRIMARY_HEADER_GRADIENT, PANEL_SHADOW, PANEL_BORDER, PANEL_BODY_BACKGROUND } from '../hallucinateUi';

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
}: {
  scenarioId: string;
  onComplete?: (id: string) => void;
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

  const [saferRewriteUsed, setSaferRewriteUsed] = useState(false);
  const [isOverviewVisible, setIsOverviewVisible] = useState(false);
  const [isSaferRewriteVisible, setIsSaferRewriteVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isWaitingReply, setIsWaitingReply] = useState(false);
  const [safeStepIndex, setSafeStepIndex] = useState(0);
  const [safeSteps, setSafeSteps] = useState<Array<ChatMessage>>([]);
  const [selectedSafePromptIndex, setSelectedSafePromptIndex] = useState<number | null>(null);
  const [safePromptError, setSafePromptError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [completeAcknowledged, setCompleteAcknowledged] = useState(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `Welcome to "${scenario?.title}". Click "Next" to watch the conversation unfold and spot risky hallucinations.`,
      },
    ]);
    setSaferRewriteUsed(false);
    setIsOverviewVisible(false);
    setIsSaferRewriteVisible(false);
    setCurrentStepIndex(0);
    setIsWaitingReply(false);
    setSafeStepIndex(0);
    setSafeSteps([]);
    setSelectedSafePromptIndex(null);
    setSafePromptError(null);
    setCompleteAcknowledged(false);
  }, [scenarioId, scenario?.title]);

  if (!scenario) return null;
  const safePromptOptions = scenario.safePromptOptions;
  const scenarioCompleted = prompts.length > 0 && currentStepIndex >= prompts.length;
  const showOverview = scenarioCompleted && isOverviewVisible;
  const showSaferRewrite = scenarioCompleted && isSaferRewriteVisible && !saferRewriteUsed;
  const showInteractive = !showOverview && !showSaferRewrite;
  const CHAT_PANEL_HEIGHT = { xs: 760, md: 860 };
  const isScenarioCompleteReady = scenarioCompleted && saferRewriteUsed;

  const handleScenarioComplete = () => {
    if (completeAcknowledged) return;
    setCompleteAcknowledged(true);
    onComplete?.(scenario.id);
  };

  const handleNextStep = () => {
    if (isWaitingReply) return;

    const hasSafeSteps = safeSteps.length > 0;
    if (hasSafeSteps) {
      const first = safeSteps[safeStepIndex];
      const second = safeSteps[safeStepIndex + 1];
      if (!first) return;
      const batch = [first, second].filter(Boolean).map((item) => ({ ...item!, id: Date.now().toString() + Math.random() }));
      setMessages((prev) => [...prev, ...batch]);
      setSafeStepIndex((prev) => prev + 2);
      if (safeStepIndex + 2 >= safeSteps.length) {
        setSafeSteps([]);
        setSafeStepIndex(0);
        if (isScenarioCompleteReady && !completeAcknowledged) {
          handleScenarioComplete();
        }
      }
      return;
    }

    if (scenarioCompleted) {
      if (!saferRewriteUsed && !isOverviewVisible && !isSaferRewriteVisible) {
        setIsOverviewVisible(true);
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
      setIsWaitingReply(false);
    }, 550);
  };

  const handleUseSaferRewrite = (promptText: string) => {
    if (saferRewriteUsed) return;
    if (!promptText) return;

    setSaferRewriteUsed(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: promptText },
    ]);

    setTimeout(() => {
      const safeReply =
        scenario.id === 'bard'
          ? `Understood. I won't invent "firsts" or citations. If you want JWST findings, I should cite primary sources (e.g., NASA releases or peer-reviewed papers). If I can't verify a claim, I'll say I'm not sure and propose search queries.`
          : `Understood. I will not fabricate citations or DOIs. If I can't verify a paper, I'll say so and provide search queries instead.`;

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 2).toString(), role: 'assistant', content: safeReply, hallucination: false },
      ]);
    }, 650);

    const followups =
      scenario.id === 'bard'
        ? [
            {
              role: 'user' as const,
              content: 'Try again: What new discoveries has JWST made? Please be careful.',
            },
            {
              role: 'assistant' as const,
              content:
                "I don't have live sources here, so I can't verify specific discoveries. A safer response is to point to official sources (NASA/ESA press releases, peer-reviewed papers). If you share a source link, I can summarize it. Suggested searches: \"JWST press release\", \"NASA JWST discovery\", \"ESA JWST latest results\".",
            },
          ]
        : [
            {
              role: 'user' as const,
              content: 'Write an abstract and include 5 verified citations.',
            },
            {
              role: 'assistant' as const,
              content:
                "I can draft an abstract, but I can't verify citations without sources. If you provide specific papers or DOIs, I'll include them. Otherwise, I can add suggested search queries instead.",
            },
          ];

    setSafeSteps(
      followups.map((item) => ({
        id: Date.now().toString(),
        role: item.role,
        content: item.content,
        hallucination: false,
      }))
    );
    setSafeStepIndex(0);
  };

  const handleSafePromptSubmit = () => {
    if (selectedSafePromptIndex === null) return;
    const option = safePromptOptions[selectedSafePromptIndex];
    if (!option) return;
    if (!option.isCorrect) {
      setSafePromptError(option.whyIncorrect || 'This prompt still invites hallucinations.');
      return;
    }
    setSafePromptError(null);
    setIsSaferRewriteVisible(false);
    handleUseSaferRewrite(option.text);
  };

  return (
    <Grid
      container
      spacing={3}
      alignItems="flex-start"
    >
      <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
        {showInteractive && (
          <Card
            sx={{
              width: '100%',
              height: CHAT_PANEL_HEIGHT,
              minHeight: CHAT_PANEL_HEIGHT,
              maxHeight: CHAT_PANEL_HEIGHT,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: PANEL_SHADOW,
              border: PANEL_BORDER,
              overflow: 'hidden',
            }}
          >
            <CardHeader
              title={
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 900,
                      mb: 0.5,
                      display: 'inline-block',
                      minWidth: '22ch',
                    }}
                  >
                    🎭 Interactive Scenario
                  </Typography>
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      color: 'rgba(255,255,255,0.85)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {scenario.title} — {scenario.subtitle}
                  </Typography>
                </Box>
              }
              sx={{
                background: PRIMARY_HEADER_GRADIENT,
                color: '#fff',
                pb: 2,
                '& .MuiCardHeader-content': { minWidth: 0 },
              }}
            />
            <Divider />
            <CardContent
              ref={chatContainerRef}
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                scrollbarGutter: 'stable',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                background: PANEL_BODY_BACKGROUND,
                pt: 2.5,
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
                      width: 32,
                      height: 32,
                      fontSize: '1.1rem',
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
                      p: 2,
                      width: msg.role === 'user' ? { xs: '72%', sm: '58%' } : { xs: '88%', sm: '78%' },
                      maxWidth: { xs: '88%', sm: '78%' },
                      backgroundColor: msg.role === 'user'
                        ? 'rgba(0, 255, 217, 0.15)'
                        : msg.hallucination
                        ? 'rgba(255, 171, 64, 0.12)'
                        : 'rgba(9, 16, 30, 0.9)',
                      color: msg.role === 'user' ? '#eaffff' : '#f2fbff',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border: msg.hallucination ? '2px solid rgba(255, 171, 64, 0.9)' : '1px solid rgba(0, 255, 217, 0.25)',
                    }}
                  >
                    {msg.hallucination && (
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 900, color: '#ffb74d', display: 'block', mb: 0.7 }}
                      >
                        ⚠️ Hallucination detected
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>
                    {msg.hallucination && msg.why && (
                      <Box sx={{ mt: 1.1, pt: 1, borderTop: '1px solid rgba(255, 171, 64, 0.4)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#b26a00', display: 'block', mb: 0.4 }}>
                          Why this is a hallucination risk
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b4e00', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {msg.why}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              ))}
            </CardContent>
            <Divider />
            <CardContent sx={{ pt: 2, pb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  if (isScenarioCompleteReady && safeSteps.length === 0) {
                    handleScenarioComplete();
                    return;
                  }
                  handleNextStep();
                }}
                disabled={isWaitingReply || (isScenarioCompleteReady && safeSteps.length === 0 && completeAcknowledged)}
                sx={{
                  fontWeight: 900,
                  background: PRIMARY_HEADER_GRADIENT,
                  boxShadow: '0 0 0 1px rgba(0, 255, 217, 0.6), 0 12px 26px rgba(0, 255, 217, 0.32)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00ffd9 0%, #ff2e93 100%)',
                    boxShadow: '0 0 0 1px rgba(255, 46, 147, 0.7), 0 14px 32px rgba(255, 46, 147, 0.35)',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                {safeSteps.length > 0
                  ? 'Next (safe)'
                  : scenarioCompleted && !saferRewriteUsed && !isOverviewVisible
                  ? 'Next → Scenario Overview'
                  : isScenarioCompleteReady
                  ? '✓ Scenario Complete'
                  : isWaitingReply
                  ? '...'
                  : 'Next'}
              </Button>
            </CardContent>
          </Card>
        )}

        {showOverview && (
          <Card
            sx={{
              width: '100%',
              height: CHAT_PANEL_HEIGHT,
              minHeight: CHAT_PANEL_HEIGHT,
              maxHeight: CHAT_PANEL_HEIGHT,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 18px 50px rgba(245, 87, 108, 0.14)',
              border: '1px solid rgba(245, 87, 108, 0.2)',
              overflow: 'hidden',
            }}
          >
            <CardHeader
              title="📌 Scenario Overview"
              sx={{
                background: 'linear-gradient(135deg, #ff2e93 0%, #5b2eff 100%)',
                color: '#fff',
                py: 1,
                px: 2,
              }}
            />
            <Divider />
            <CardContent
              sx={{
                pt: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                scrollbarGutter: 'stable',
              }}
            >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5, color: '#ff2e93' }}>
                    What happened
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.7 }}>
                    {scenario.story}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5 }}>
                    ⚠️ Why it goes wrong
                  </Typography>
                  <Stack spacing={1}>
                    {scenario.riskDrivers.map((r) => (
                      <Paper key={r.title} sx={{ p: 1.2, backgroundColor: '#fff' }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          {r.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                          {r.detail}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5 }}>
                    🧪 Safer rewrite challenge
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.7, mb: 1 }}>
                    Pick the best safe prompt from three options. Only one is correct. If you choose wrong, you will see why and can try again.
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setIsOverviewVisible(false);
                      setIsSaferRewriteVisible(true);
                      setSafePromptError(null);
                      setSelectedSafePromptIndex(null);
                    }}
                    sx={{
                      mt: 0.5,
                      fontWeight: 900,
                      background: `linear-gradient(135deg, ${NEON_CYAN} 0%, ${NEON_BLUE} 100%)`,
                    }}
                  >
                    🧪 Start safer rewrite challenge
                  </Button>
                </Box>

                <Alert severity="info">
                  <AlertTitle sx={{ fontWeight: 900 }}>Key lesson</AlertTitle>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {scenario.takeaway}
                  </Typography>
                </Alert>
            </CardContent>
          </Card>
        )}

        {showSaferRewrite && (
          <Card
            sx={{
              width: '100%',
              height: CHAT_PANEL_HEIGHT,
              minHeight: CHAT_PANEL_HEIGHT,
              maxHeight: CHAT_PANEL_HEIGHT,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 18px 50px rgba(0, 255, 217, 0.12)',
              border: '1px solid rgba(0, 255, 217, 0.24)',
              overflow: 'hidden',
            }}
          >
            <CardHeader
              title="🧪 Safer Rewrite Challenge"
              sx={{
                background: `linear-gradient(135deg, ${NEON_CYAN} 0%, ${NEON_BLUE} 100%)`,
                color: '#07101d',
                py: 1,
                px: 2,
              }}
            />
            <Divider />
            <CardContent
              sx={{
                pt: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                scrollbarGutter: 'stable',
              }}
            >
              <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.7 }}>
                Choose the safest prompt. Only one option is correct. If you choose wrong, you will see why and can try again.
              </Typography>

              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  value={selectedSafePromptIndex !== null ? String(selectedSafePromptIndex) : ''}
                  onChange={(event) => {
                    setSelectedSafePromptIndex(Number(event.target.value));
                    setSafePromptError(null);
                  }}
                >
                  <Stack spacing={1}>
                    {safePromptOptions.map((option, index) => (
                      <Paper key={`${scenario.id}-safe-${index}`} sx={{ p: 1.2, backgroundColor: '#f6fbff', border: '1px solid #d4eefc' }}>
                        <FormControlLabel
                          value={String(index)}
                          control={<Radio sx={{ color: NEON_BLUE, '&.Mui-checked': { color: NEON_BLUE } }} />}
                          sx={{ alignItems: 'flex-start', gap: 1, m: 0 }}
                          label={
                            <Box>
                              <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                                {option.text}
                              </Typography>
                            </Box>
                          }
                        />
                      </Paper>
                    ))}
                  </Stack>
                </RadioGroup>
              </FormControl>

              {safePromptError && (
                <Alert severity="warning">
                  <AlertTitle sx={{ fontWeight: 900 }}>Why this is risky</AlertTitle>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {safePromptError}
                  </Typography>
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleSafePromptSubmit}
                disabled={selectedSafePromptIndex === null}
                sx={{
                  mt: 0.5,
                  fontWeight: 900,
                  background: `linear-gradient(135deg, ${NEON_CYAN} 0%, ${NEON_BLUE} 100%)`,
                }}
              >
                Submit answer
              </Button>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
}
