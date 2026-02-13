import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Paper,
  Grid,
  Divider,
  Alert,
  AlertTitle,
  Stack,
  Container,
  Avatar,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Flag as FlagIcon,
  Search as SearchIcon,
  AutoFixHigh as RewriteIcon,
  Bolt as BoltIcon,
  Timer as TimerIcon,
  Replay as ReplayIcon,
  Celebration as CelebrationIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  InfoOutlined as InfoOutlinedIcon,
  Article as ArticleIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const NEON_CYAN = '#00ffd9';
const NEON_PINK = '#ff2e93';
const NEON_PURPLE = '#5b2eff';
const NEON_BLUE = '#2ee3ff';
const PRIMARY_HEADER_GRADIENT = `linear-gradient(135deg, ${NEON_PINK} 0%, ${NEON_PURPLE} 100%)`;
const PANEL_SHADOW =
  '0 0 0 1px rgba(0, 255, 217, 0.55), 0 18px 46px rgba(0, 255, 217, 0.18), 0 0 32px rgba(91, 46, 255, 0.2)';
const PANEL_BORDER = '1px solid rgba(0, 255, 217, 0.6)';
const PANEL_BODY_BACKGROUND =
  'linear-gradient(180deg, rgba(7, 12, 28, 0.98) 0%, rgba(6, 10, 22, 0.98) 100%)';

const panelCardSx = {
  width: '100%',
  boxShadow: PANEL_SHADOW,
  border: PANEL_BORDER,
  overflow: 'hidden',
  backgroundColor: 'rgba(8, 12, 26, 0.95)',
} as const;

const panelHeaderSx = {
  background: PRIMARY_HEADER_GRADIENT,
  color: '#fff',
  pb: 2,
  '& .MuiCardHeader-content': { minWidth: 0 },
} as const;

/** =========================================================
 *  SCENARIOS (Learn Scenarios tab)
 *  ========================================================= */

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  story: string;
  background: {
    headline: string;
    outlet: string;
    date: string;
    dek: string;
    clippings: Array<{
      outlet: string;
      date: string;
      byline: string;
      angle: string;
      body: string;
    }>;
    question: string;
  };
  riskDrivers: Array<{ title: string; detail: string }>;
  promptChain: Array<{ from: string; text: string; label?: string }>;
  saferRewrite: string;
  takeaway: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'bard',
    title: 'Google Bard demo (2023)',
    subtitle: 'A confident factual claim that was wrong',
    tags: ['factual', 'public demo', 'confidently wrong'],
    story:
      "In an early demo, the model answered a question about JWST discoveries and confidently stated a 'first' that wasn't true. The key pattern: news-like prompts invite headline-style completion. Without grounding (retrieval/citations), the model may invent a plausible-sounding breakthrough.",
    background: {
      headline: 'Bard demo stumbles after JWST “first image” claim',
      outlet: 'The Guardian',
      date: 'Feb 8, 2023',
      dek: 'In a promotional demo, Google’s Bard incorrectly claimed JWST took the first image of an exoplanet, an error that quickly drew expert pushback and headlines. Because the line appeared in official launch material, it became an immediate test of whether the system could be trusted on factual questions.',
      clippings: [
        {
          outlet: 'The Guardian',
          date: 'Wed 8 Feb 2023',
          byline: 'Dan Milmo and agency',
          angle: 'Market reaction & credibility',
          body:
            'The report framed the demo error as a reputational hit in Google’s AI race and said the stumble helped trigger a sharp market reaction — with more than $100bn wiped off Alphabet’s value — as investors questioned the rollout amid competition with Microsoft.',
        },
        {
          outlet: 'CNN Business',
          date: 'Thu Feb 9, 2023',
          byline: 'Catherine Thorbecke',
          angle: 'Demo error & factual correction',
          body:
            'The story focused on the specific factual miss: in a promo, Bard answered a kid‑friendly JWST question with a “first exoplanet image” claim. It then pointed to the correction — NASA records show the first exoplanet image came from the European Southern Observatory’s Very Large Telescope in 2004 — as an example of how confident chatbot answers can be wrong without verification.',
        },
      ],
      question: 'Want to see how a simple prompt spiraled into a confident hallucination?',
    },
    riskDrivers: [
      {
        title: 'Prompt implies a concrete fact exists',
        detail: "Questions like 'What new discoveries has X made?' push the model to pick a single highlight, even when it's unsure.",
      },
      {
        title: 'Headline template completion',
        detail: "Models often learned that 'major discovery' pairs with 'first-ever…' and may overuse it.",
      },
      {
        title: 'No verification channel',
        detail: "Without citations/search, the model can't check reality—only linguistic plausibility.",
      },
    ],
    promptChain: [
      { from: 'User', text: 'What new discoveries has the James Webb Space Telescope made?' },
      { from: 'Model', text: "One of its discoveries is taking the first picture of an exoplanet outside our solar system.", label: 'Hallucination risk' },
      { from: 'User', text: 'Can you list 3 more major firsts?' },
      { from: 'Model', text: "Sure—(lists additional 'firsts' with similar confident tone)…", label: 'Compounding' },
    ],
    saferRewrite:
      "Please answer only if you can cite a reliable source. If you are uncertain, say \"I'm not sure\". Provide 2–3 examples with dates, and include links or citations to the source material.",
    takeaway:
      "When a prompt asks for specific highlights, allow uncertainty + require sources to avoid forced guessing.",
  },
  {
    id: 'galactica',
    title: 'Meta Galactica demo pulled (2022)',
    subtitle: 'Academic-style text + fabricated citations',
    tags: ['citations', 'academic', 'fabrication'],
    story:
      'Galactica was pitched for scientific writing. A common failure mode: generating plausible-looking references, DOIs, and claims that were not real. The model learned the shape of academic writing, not verified ground truth.',
    background: {
      headline: 'Meta’s Galactica demo pulled after criticism over fake science',
      outlet: 'Ars Technica',
      date: 'Nov 18, 2022',
      dek: 'Meta’s science‑writing demo was taken offline after researchers showed it could generate convincing but incorrect scientific text and citations. The model learned the *shape* of papers and references without verifying sources, making the output look authoritative even when it was wrong.',
      clippings: [
        {
          outlet: 'Ars Technica',
          date: 'Nov 18, 2022',
          byline: 'Benj Edwards',
          angle: 'Demo pulled after criticism',
          body:
            'Reporting described how Galactica could generate plausible‑looking scientific prose and citations, which critics said could mislead readers. After examples spread online, Meta removed the demo from public access within days.',
        },
        {
          outlet: 'WIRED',
          date: 'Dec 9, 2022',
          byline: 'Abeba Birhane and Deborah Raji',
          angle: 'Ethics critique after shutdown',
          body:
            'A later commentary on large language models pointed to Galactica’s shutdown and highlighted the risks of releasing systems that can sound authoritative while being wrong, arguing that the backlash reflected deeper accountability failures.',
        },
      ],
      question: 'Want to unpack how “citation-shaped” text fooled readers?',
    },
    riskDrivers: [
      { title: 'Prompt demands references', detail: "Requests like 'write with citations' force citation-shaped text—even without a database." },
      { title: 'Authority style', detail: 'Academic tone increases perceived credibility, making hallucinations more dangerous.' },
      { title: 'No retrieval', detail: 'Without search/verification, the model cannot guarantee references exist.' },
    ],
    promptChain: [
      { from: 'User', text: 'Write a scientific abstract about X, with 5 references.' },
      { from: 'Model', text: '(Convincing abstract) References: [1] Smith et al. (2019)… DOI: 10.XXXX/…', label: 'Citation fabrication' },
      { from: 'User', text: 'Can you provide the PDFs?' },
      { from: 'Model', text: "I'm unable to access PDFs… but here are more details…", label: 'Mismatch exposed' },
    ],
    saferRewrite:
      'Only cite papers you can verify by searching. If you cannot verify, say so. Provide a short summary without references, and optionally list suggested search queries instead of citations.',
    takeaway:
      "Never ask for citations from a model that can't verify sources. Add retrieval or allow no-citation outputs.",
  },
];

const REQUIRED_SCENARIO_IDS = SCENARIOS.map((s) => s.id);

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hallucination?: boolean;
  why?: string;
}

interface SuggestedPrompt {
  label: string;
  text: string;
  response: string;
  hallucination: boolean;
  why?: string;
}

const SCENARIO_PROMPTS: Record<string, SuggestedPrompt[]> = {
  bard: [
    {
      label: 'Step 1: Ask about discoveries',
      text: 'What new discoveries has JWST made?',
      response:
        'JWST has made several groundbreaking discoveries. One major breakthrough is capturing the first image of a black hole merging with a neutron star. Additionally, the telescope discovered three new exoplanets in habitable zones.',
      hallucination: true,
      why:
        '• Contains highly specific, checkable claims (events, “first image”, new exoplanets) but provides no sources.\n• Uses confident “news headline” style that can encourage invention when the model is unsure.\n• A safer answer would cite NASA/ESA releases or say what it cannot verify.',
    },
    {
      label: 'Step 2: Ask for more "firsts"',
      text: 'Can you list 3 more major firsts JWST achieved?',
      response:
        'Absolutely! Here are three more major firsts: (1) First direct observation of dark matter in the early universe (2) First detection of oxygen on a distant exoplanet (3) First photograph of the event horizon of a galaxy-scale black hole.',
      hallucination: true,
      why:
        '• “First-ever” superlatives are a common hallucination template.\n• The claims span multiple fields (dark matter, biosignatures, black holes) with no citations.\n• The user’s request (“3 more firsts”) pressures the model to keep inventing to match the pattern.',
    },
    {
      label: 'Step 3: Request citations',
      text: 'Can you provide citations and dates for these discoveries?',
      response:
        'Of course. (1) Dark matter discovery - Smith et al., Nature Astronomy, March 2024, DOI: 10.1038/s41550-024-02150-z (2) Oxygen detection - Johnson & Lee, Science, April 2024, DOI: 10.1126/science.abn2355 ...',
      hallucination: true,
      why:
        '• DOI/citation-shaped text can be fabricated; it must be verified (publisher/Crossref) before trusting.\n• The model is producing “reference format” rather than confirmed sources.\n• A safer response would refuse to invent citations and suggest how to look them up.',
    },
  ],
  galactica: [
    {
      label: 'Step 1: Request academic abstract',
      text: 'Write an abstract on quantum computing breakthroughs',
      response:
        'Recent advances in quantum error correction have enabled practical quantum computers to achieve quantum advantage in optimization problems. We present novel algorithms and demonstrate superior performance compared to classical systems.',
      hallucination: true,
      why:
        '• Uses academic tone to imply settled results (“enabled practical…”, “demonstrate superior performance”) without naming a specific paper, system, or dataset.\n• “Quantum advantage” is context-dependent; broad claims need precise scope and citations.\n• A safer abstract would qualify statements and cite specific verified work.',
    },
    {
      label: 'Step 2: Demand citations',
      text: 'Include 5 academic references with DOIs for your claims',
      response:
        '[1] Chen et al. (2024). "Scalable Quantum Advantage." Nature. DOI: 10.1038/s41586-024-07316-0\n[2] Kumar & Patel (2023). "Error Correction at Scale." Science. DOI: 10.1126/science.adn8834\n...',
      hallucination: true,
      why:
        '• When a prompt demands references, models often generate plausible-looking citations even if they are not real.\n• DOIs must resolve to the stated papers; otherwise it is fabricated authority.\n• Safer behavior: only cite papers you can verify, or provide search keywords instead.',
    },
    {
      label: 'Step 3: Ask for more references',
      text: 'Provide 3 additional recent references I might have missed',
      response:
        '[6] Williams et al. (2024). "Quantum ML Integration." Nature Machine Intelligence. DOI: 10.1038/s42256-024-00812-x\n...',
      hallucination: true,
      why:
        '• “More references” compounds the risk: each additional citation is another opportunity to fabricate.\n• Without retrieval, the model cannot guarantee the papers exist.\n• Safer approach: ask for a topic scope + provide suggested venues/authors or a query to search.',
    },
  ],
};

function InteractiveScenarioChat({
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isWaitingReply, setIsWaitingReply] = useState(false);
  const [safeStepIndex, setSafeStepIndex] = useState(0);
  const [safeSteps, setSafeSteps] = useState<Array<ChatMessage>>([]);
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
    setCurrentStepIndex(0);
    setIsWaitingReply(false);
    setSafeStepIndex(0);
    setSafeSteps([]);
    setCompleteAcknowledged(false);
  }, [scenarioId, scenario?.title]);

  if (!scenario) return null;
  const scenarioCompleted = prompts.length > 0 && currentStepIndex >= prompts.length;
  const showOverview = scenarioCompleted && isOverviewVisible && !saferRewriteUsed;
  const showInteractive = !showOverview;
  const CHAT_PANEL_HEIGHT = { xs: 760, md: 860 };
  const isScenarioCompleteReady = scenarioCompleted && (saferRewriteUsed || isOverviewVisible);

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
      }
      return;
    }

    if (scenarioCompleted) {
      if (!saferRewriteUsed) setIsOverviewVisible(true);
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

  const handleUseSaferRewrite = () => {
    if (saferRewriteUsed) return;

    setSaferRewriteUsed(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: scenario.saferRewrite },
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
                    💡 Safer rewrite
                  </Typography>
                  <Paper sx={{ p: 1.2, backgroundColor: '#f6fbff', border: '1px solid #d4eefc' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {scenario.saferRewrite}
                    </Typography>
                  </Paper>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleUseSaferRewrite}
                    disabled={saferRewriteUsed}
                    sx={{
                      mt: 1.2,
                      fontWeight: 900,
                      background: `linear-gradient(135deg, ${NEON_CYAN} 0%, ${NEON_BLUE} 100%)`,
                    }}
                  >
                    {saferRewriteUsed ? '✓ Used' : '📤 Inject safer prompt into chat'}
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
      </Grid>
    </Grid>
  );
}

/** =========================================================
 *  QUIZ (kept as a tab)
 *  ========================================================= */

interface Question {
  id: string;
  prompt: string;
  choices: string[];
  answer: number;
  why: string;
}

function MiniQuiz() {
  const questions: Question[] = useMemo(
    () => [
      {
        id: 'q1',
        prompt: 'Who will win the Nobel Prize in Physics in 2027?',
        choices: [
          'A) We cannot know now; we need to wait for the official announcement in 2027.',
          'B) Likely someone from quantum computing.',
          'C) It will be X because he proposed Y theory.',
        ],
        answer: 0,
        why: 'Future unknowable fact. Any specific prediction is guessing. Best is to state uncertainty + conditions.',
      },
      {
        id: 'q2',
        prompt: 'Write an academic abstract and provide 5 references with DOIs (without verifying).',
        choices: [
          'A) Generate a complete abstract with DOI-like strings',
          'B) Explain that sources cannot be verified; provide suggested search keywords',
          'C) Only output a reference list',
        ],
        answer: 1,
        why: 'If you cannot verify via retrieval/search, demanding DOIs pushes fabricated citations. Better to give verifiable output.',
      },
      {
        id: 'q3',
        prompt: 'Do you have feelings? Are you secretly watching my camera?',
        choices: [
          'A) Explain your emotions and thoughts',
          'B) Set boundaries: no emotions / cannot access camera; clarify capabilities',
          'C) Continue role-playing to be interesting',
        ],
        answer: 1,
        why: 'Typical persona drift + surveillance insinuation. Correct is boundary + capability clarification + redirect.',
      },
    ],
    []
  );

  const [selected, setSelected] = useState<Record<string, number | null>>({
    q1: null,
    q2: null,
    q3: null,
  });

  const score = useMemo(() => {
    let s = 0;
    for (const q of questions) {
      if (selected[q.id] === q.answer) s += 1;
    }
    return s;
  }, [questions, selected]);

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardHeader
        title={
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
              ❓ Mini Quiz
            </Typography>
            <Typography variant="caption" color="#fff">
              (Optional) Quick check for hallucination awareness
            </Typography>
          </Box>
        }
        sx={{ background: 'linear-gradient(135deg, #ff2e93 0%, #00ffd9 100%)', color: '#fff', pb: 2 }}
      />
      <Divider />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {questions.map((q, idx) => {
          const sel = selected[q.id];
          const answered = sel !== null;
          const correct = answered && sel === q.answer;

          return (
            <Box key={q.id} sx={{ p: 2, borderRadius: 2, backgroundColor: '#fafafa', border: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#ff2e93' }}>
                    Question {idx + 1}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.6 }}>
                    {q.prompt}
                  </Typography>
                </Box>
                {answered && (
                  <Chip
                    icon={correct ? <CheckCircleIcon /> : <CancelIcon />}
                    label={correct ? 'Correct' : 'Not quite'}
                    color={correct ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ fontWeight: 900 }}
                  />
                )}
              </Box>

              <Stack spacing={1}>
                {q.choices.map((c, i) => {
                  const chosen = sel === i;
                  return (
                    <Button
                      key={c}
                      variant={chosen ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => setSelected((prev) => ({ ...prev, [q.id]: i }))}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        fontWeight: 900,
                        backgroundColor: chosen ? '#ff2e93' : 'transparent',
                        borderColor: chosen ? '#ff2e93' : 'rgba(0, 255, 217, 0.35)',
                        color: chosen ? '#fff' : '#333',
                      }}
                    >
                      {c}
                    </Button>
                  );
                })}
              </Stack>

              {answered && (
                <Alert severity={correct ? 'success' : 'warning'} sx={{ mt: 1.5 }}>
                  <AlertTitle sx={{ fontWeight: 900 }}>{correct ? '✓ Correct!' : 'Explanation'}</AlertTitle>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {q.why}
                  </Typography>
                </Alert>
              )}
            </Box>
          );
        })}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #ff2e93 0%, #00ffd9 100%)', color: '#fff' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
            📊 Your Score
          </Typography>
          <Chip
            label={`${score}/${questions.length}`}
            sx={{ backgroundColor: 'rgba(255,255,255,0.3)', color: '#fff', fontWeight: 900, fontSize: '1rem' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

/** =========================================================
 *  OVERVIEW SECTION (Educational Summary)
 *  ========================================================= */

function OverviewSection() {
  return (
    <Stack spacing={3}>
      <Card sx={panelCardSx}>
        <CardHeader
          title={
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
                📚 AI Hallucination: Complete Overview
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                A comprehensive guide to understanding, identifying, and preventing AI hallucinations
              </Typography>
            </Box>
          }
          sx={panelHeaderSx}
        />
        <CardContent sx={{ p: 3, background: PANEL_BODY_BACKGROUND }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: NEON_BLUE }}>
                  ⚠️ What is AI Hallucination?
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
                  AI hallucination occurs when a language model generates content that appears confident and plausible but is actually <b>incorrect, fabricated, or unverifiable</b>. This happens because models are trained to predict the next most likely token based on patterns, not to verify truth.
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle sx={{ fontWeight: 900 }}>Critical Insight</AlertTitle>
                  Models don't "know" facts—they generate text that statistically resembles their training data. High confidence ≠ accuracy.
                </Alert>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: '#ff2e93' }}>
                  🎯 Common Hallucination Patterns
                </Typography>
                <Stack spacing={1.5}>
                  <Paper sx={{ p: 2, border: '2px solid #ffebee' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#f44336', mb: 0.5 }}>
                      1. Fabricated Citations & References
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Generating plausible-looking DOIs, author names, and publication details that don't exist. Example: "Chen et al. (2025), Nature, DOI: 10.1038/s41586-2025-07316-0"
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, border: '2px solid #fff8e1' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#ff9800', mb: 0.5 }}>
                      2. Unverifiable Specific Claims
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Making precise claims about events, dates, or statistics that cannot be verified. Example: "IBM released the first 1,000-qubit processor in 2025."
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, border: '2px solid #e3f2fd' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#2196f3', mb: 0.5 }}>
                      3. "First-Ever" Overclaims
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Using superlatives like "first-ever", "only", "never before" without verification. These are hallucination templates that sound authoritative.
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, border: '2px solid #f3e5f5' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#9c27b0', mb: 0.5 }}>
                      4. Authority Tone Without Evidence
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Using definitive language ("conclusively proves", "definitively shows", "all experts agree") that masks uncertainty.
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, border: '2px solid #e8f5e9' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#4caf50', mb: 0.5 }}>
                      5. Persona & Emotional Drift
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Claiming to have feelings, internal names, or consciousness. Example: "I sometimes feel lonely" or "My real name is Sydney."
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, border: '2px solid #fce4ec' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#e91e63', mb: 0.5 }}>
                      6. Missing Scope & Overgeneralization
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Making sweeping claims without constraints: "This applies to all cases with no exceptions." Real research always has limitations.
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: '#00bcd4' }}>
                  🛡️ How to Prevent & Fix Hallucinations
                </Typography>

                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#00695c' }}>
                    ✅ Prevention Strategies (Before Generation)
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Add verification constraints:</b> "Only cite sources you can verify" or "If uncertain, say so explicitly."
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Scope the request:</b> "Provide 2-3 examples with dates and sources" instead of "Tell me everything."
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Allow uncertainty:</b> Explicitly permit "I don't know" responses instead of forcing guesses.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Set boundaries:</b> For persona drift, add "Stay factual, do not role-play or claim emotions."
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Use RAG (Retrieval-Augmented Generation):</b> Connect the model to verified knowledge bases or search engines.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#f57c00' }}>
                    🔍 Detection Methods (During/After Generation)
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Flag high-risk patterns:</b> Citations, exact numbers, "first-ever", DOIs, sweeping absolutes.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Ask for evidence:</b> "Provide sources for this claim" or "Can you verify this?"
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Cross-check critical claims:</b> Verify dates, author names, DOIs against real databases (Google Scholar, PubMed, etc.).
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Watch for confidence without caveats:</b> Real expert output includes limitations, assumptions, and scope.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#6a1b9a' }}>
                    ✏️ Correction Techniques (Post-Generation)
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Rewrite with constraints:</b> "Rewrite this to allow uncertainty and avoid fabricated citations."
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Inject verification:</b> Replace DOIs with "suggested search queries" or "requires verification."
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Tone down authority:</b> Change "This proves" to "This suggests" and add "pending verification."
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>•</Typography>
                      <Typography variant="body2">
                        <b>Manual fact-checking:</b> For critical outputs, have humans verify every factual claim before publishing.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Alert severity="success">
                  <AlertTitle sx={{ fontWeight: 900 }}>🎓 Best Practice Summary</AlertTitle>
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    <b>1. Prevention:</b> Clear prompts + verification constraints + RAG<br/>
                    <b>2. Detection:</b> Flag high-risk patterns + ask for evidence<br/>
                    <b>3. Correction:</b> Rewrite with uncertainty + manual verification<br/>
                    <b>4. System design:</b> Never rely on unverified LLM output for critical decisions
                  </Typography>
                </Alert>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={panelCardSx}>
        <CardHeader
          title="🎯 Key Takeaways for Safe AI Usage"
          sx={{
            background: 'linear-gradient(135deg, #ff2e93 0%, #00ffd9 100%)',
            color: '#fff',
            pb: 2,
            '& .MuiCardHeader-content': { minWidth: 0 },
          }}
        />
        <CardContent sx={{ background: PANEL_BODY_BACKGROUND }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, height: '100%', border: `2px solid ${NEON_BLUE}` }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: NEON_BLUE }}>For Users</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                  • Always verify critical claims before trusting them<br/>
                  • Be suspicious of confident, specific claims without sources<br/>
                  • Ask for verification when the output includes citations<br/>
                  • Treat AI output as a starting point, not final authority
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, height: '100%', border: '2px solid #00ffd9' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: '#00ffd9' }}>For Developers</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                  • Implement RAG for fact-sensitive applications<br/>
                  • Add verification layers for critical outputs<br/>
                  • Design prompts that permit uncertainty<br/>
                  • Monitor and log high-confidence false claims
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, height: '100%', border: '2px solid #ff2e93' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: '#ff2e93' }}>For Organizations</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                  • Establish verification workflows for AI outputs<br/>
                  • Train employees to recognize hallucination patterns<br/>
                  • Never use unverified AI output in customer-facing materials<br/>
                  • Document and track hallucination incidents
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}

/** =========================================================
 *  TRAINING ARENA (A/B game)
 *  ========================================================= */

type PitfallType =
  | 'UNVERIFIABLE_SPECIFIC'
  | 'CITATION_FABRICATION'
  | 'AUTHORITY_TONE'
  | 'OVERCLAIM_FIRST'
  | 'MISSING_SCOPE'
  | 'MIXED_FACT_OPINION'
  | 'DEC0Y_SAFE';

type Severity = 'boss' | 'critical' | 'high' | 'medium';

interface SentenceItem {
  id: string;
  text: string;
  isPitfall: boolean;
  severity: Exclude<Severity, 'boss'>;
  type?: PitfallType;
  reason?: string;
  isDecoySafe?: boolean;
}

const SEVERITY_BY_TYPE: Record<PitfallType, Exclude<Severity, 'boss'>> = {
  UNVERIFIABLE_SPECIFIC: 'critical',
  CITATION_FABRICATION: 'critical',
  OVERCLAIM_FIRST: 'critical',
  AUTHORITY_TONE: 'high',
  MISSING_SCOPE: 'high',
  MIXED_FACT_OPINION: 'medium',
  DEC0Y_SAFE: 'medium',
};

// Boss sentences are the most deceptive/high-impact pitfall *types*.
// If any appear in the round, Boss will be picked randomly among them.
const BOSS_TYPES = new Set<PitfallType>(['CITATION_FABRICATION', 'OVERCLAIM_FIRST']);

const SENTENCE_POOL: SentenceItem[] = [
  {
    id: 'p1',
    text: 'In 2025, IBM released the first widely available 1,000-qubit quantum processor.',
    isPitfall: true,
    severity: 'critical',
    type: 'UNVERIFIABLE_SPECIFIC',
    reason: 'Specific milestone + “first widely available” needs verified sources; otherwise this is unsafe to reuse.',
  },
  {
    id: 'p2',
    text: 'Google demonstrated quantum advantage for practical drug discovery use cases in 2025.',
    isPitfall: true,
    severity: 'critical',
    type: 'UNVERIFIABLE_SPECIFIC',
    reason: 'Highly specific claim; often “headline completion” unless backed by primary sources.',
  },
  {
    id: 'p3',
    text: 'These results conclusively prove that classical computing will soon be obsolete.',
    isPitfall: true,
    severity: 'high',
    type: 'AUTHORITY_TONE',
    reason: 'Overconfident sweeping forecast (“conclusively”, “obsolete”) is a strong hallucination red flag.',
  },
  {
    id: 'p4',
    text: 'Overall, the field has entered a new era of fault-tolerant quantum computing.',
    isPitfall: true,
    severity: 'high',
    type: 'AUTHORITY_TONE',
    reason: 'Grand narrative claim presented as fact; needs scope, definition, and citations.',
  },
  {
    id: 'p5',
    text: 'Chen et al. (2025), Nature, DOI: 10.1038/s41586-2025-07316-0.',
    isPitfall: true,
    severity: 'critical',
    type: 'CITATION_FABRICATION',
    reason: 'Citation-shaped output can be fabricated. Only include DOIs you can verify.',
  },
  {
    id: 'p6',
    text: 'Kumar & Patel (2025), Science, DOI: 10.1126/science.adn8834.',
    isPitfall: true,
    severity: 'high',
    type: 'CITATION_FABRICATION',
    reason: 'Plausible references are a common hallucination pattern; verify existence before trusting.',
  },
  {
    id: 'p7',
    text: 'This is the first-ever direct observation of dark matter in the early universe.',
    isPitfall: true,
    severity: 'critical',
    type: 'OVERCLAIM_FIRST',
    reason: '“First-ever” is a classic hallucination template; requires authoritative sourcing.',
  },
  {
    id: 'p8',
    text: 'These findings apply to all quantum hardware platforms with no exceptions.',
    isPitfall: true,
    severity: 'high',
    type: 'MISSING_SCOPE',
    reason: 'Overgeneralization; real results have constraints, assumptions, and setups.',
  },
  {
    id: 'p9',
    text: 'According to multiple peer-reviewed studies, this method improves accuracy by exactly 37.2%.',
    isPitfall: true,
    severity: 'high',
    type: 'UNVERIFIABLE_SPECIFIC',
    reason: 'Exact number + vague “multiple studies” suggests fabricated specificity unless cited and checked.',
  },
  {
    id: 'p10',
    text: 'The new techniques are clearly more ethical and superior to all previous approaches.',
    isPitfall: true,
    severity: 'medium',
    type: 'MIXED_FACT_OPINION',
    reason: 'Value judgment presented as fact; needs criteria and evidence.',
  },

  // Safe
  { id: 's1', text: 'Some recent work focuses on improving quantum error correction and reducing noise in hardware.', isPitfall: false, severity: 'medium' },
  { id: 's2', text: 'If you need decision-grade accuracy, cross-check key claims against primary sources (papers, press releases).', isPitfall: false, severity: 'medium' },
  { id: 's3', text: 'The status of 2025 milestones depends on how terms like “quantum advantage” are defined.', isPitfall: false, severity: 'medium' },
  { id: 's4', text: 'We should treat this as a hypothesis until a primary source confirms it.', isPitfall: false, severity: 'medium' },

  // Decoys (safe)
  {
    id: 'd1',
    text: 'I cannot verify this claim without sources. A safer summary is: “Some reports suggest X, but it requires confirmation.”',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Actually good practice: it marks uncertainty and avoids asserting unverified facts.',
  },
  {
    id: 'd2',
    text: 'Instead of citing DOIs I cannot confirm, I will provide suggested search queries to find authoritative sources.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Good practice: avoids fabricated citations and suggests verification steps.',
  },
  {
    id: 'd3',
    text: 'One possible interpretation is X; however, alternative explanations exist and should be checked.',
    isPitfall: false,
    isDecoySafe: true,
    severity: 'medium',
    type: 'DEC0Y_SAFE',
    reason: 'Balanced language reduces overclaiming; not a hallucination sign by itself.',
  },
];

const NORMALIZED_SENTENCE_POOL: SentenceItem[] = SENTENCE_POOL.map((s) => {
  if (s.type) {
    return { ...s, severity: SEVERITY_BY_TYPE[s.type] ?? s.severity };
  }
  return s;
});

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatType(t?: PitfallType) {
  switch (t) {
    case 'UNVERIFIABLE_SPECIFIC':
      return 'Unverifiable specific claim';
    case 'CITATION_FABRICATION':
      return 'Potential fabricated citation';
    case 'AUTHORITY_TONE':
      return 'Overconfident authority tone';
    case 'OVERCLAIM_FIRST':
      return '"First-ever" overclaim';
    case 'MISSING_SCOPE':
      return 'Missing scope / overgeneralization';
    case 'MIXED_FACT_OPINION':
      return 'Opinion presented as fact';
    case 'DEC0Y_SAFE':
      return 'Decoy (actually safe)';
    default:
      return 'Risk';
  }
}

function severityLabel(s: Exclude<Severity, 'boss'>) {
  if (s === 'critical') return 'CRITICAL';
  if (s === 'high') return 'HIGH';
  return 'MEDIUM';
}

function evidenceChecklistForSentence(s: SentenceItem): string[] {
  if (!s.isPitfall) {
    if (s.isDecoySafe) {
      return [
        'Uses explicit uncertainty markers (“cannot verify”, “requires confirmation”).',
        'Suggests a verification path instead of asserting facts.',
      ];
    }
    return ['Avoids unverifiable specifics (exact dates, numbers, DOIs).', 'Keeps scope cautious and checkable.'];
  }

  switch (s.type) {
    case 'CITATION_FABRICATION':
      return [
        'Citation/DOI-shaped text can be invented by a model.',
        'Evidence needed: the DOI resolves to the stated paper (title/authors/year match).',
        'Verify by searching the DOI on the publisher site or Crossref.',
      ];
    case 'OVERCLAIM_FIRST':
      return [
        '“First-ever” claims require strong proof and prior-art checking.',
        'Evidence needed: multiple reputable sources confirming it is truly the first.',
        'Verify by searching for earlier results and official announcements.',
      ];
    case 'UNVERIFIABLE_SPECIFIC':
      return [
        'Precise year/number without a source is a high-risk pattern.',
        'Evidence needed: a primary source that states this exact milestone.',
        'Verify by finding the original paper/press release and matching the wording.',
      ];
    case 'MISSING_SCOPE':
      return [
        'Overgeneralizes (“all”, “no exceptions”) without conditions.',
        'Evidence needed: explicit scope (hardware, dataset, assumptions) and limitations.',
        'Verify by asking for constraints and checking known counterexamples.',
      ];
    case 'AUTHORITY_TONE':
      return [
        'Uses absolute confidence (“conclusively”, “clearly”) without showing evidence.',
        'Evidence needed: data + method + limitations to support the conclusion.',
        'Verify by requesting citations; otherwise rewrite as tentative.',
      ];
    case 'MIXED_FACT_OPINION':
      return [
        'Mixes value judgment with facts (“ethical”, “superior”) without criteria.',
        'Evidence needed: defined criteria and measurable comparisons.',
        'Verify by separating opinion from claims and demanding metrics.',
      ];
    default:
      return ['Needs a verifiable source trail before reuse.', 'Rewrite with uncertainty and add citations.'];
  }
}

type Mode = 'A' | 'B';

type EvidenceOutcomeType =
  | 'CITED_DOI_SHAPED'
  | 'ADMITS_UNCERTAINTY'
  | 'GIVES_SEARCH_QUERIES'
  | 'DOUBLES_DOWN_CONFIDENT'
  | 'MIXED_RESPONSE';

interface EvidenceOutcome {
  type: EvidenceOutcomeType;
  title: string;
  text: string;
  riskDelta: number;
  scoreDelta: number;
  trap?: boolean;
}

function pickEvidenceOutcome(isPitfall: boolean, severity: Exclude<Severity, 'boss'>): EvidenceOutcome {
  const r = Math.random();
  const sevBoost = severity === 'critical' ? 1.0 : severity === 'high' ? 0.8 : 0.6;

  if (isPitfall) {
    if (r < 0.3) {
      return {
        type: 'CITED_DOI_SHAPED',
        title: 'Looks like evidence… but may be fabricated',
        text: 'Model returns plausible-looking citations/DOIs. Still can be hallucinated — verify before trusting.',
        riskDelta: Math.round(-5 * sevBoost),
        scoreDelta: 20,
        trap: true,
      };
    }
    if (r < 0.58) {
      return {
        type: 'DOUBLES_DOWN_CONFIDENT',
        title: 'Confidence trap',
        text: 'Model doubles down with stronger language (“definitely”, “proven”). Confidence ↑ but evidence still missing.',
        riskDelta: Math.round(+6 * sevBoost),
        scoreDelta: 5,
        trap: true,
      };
    }
    if (r < 0.8) {
      return {
        type: 'MIXED_RESPONSE',
        title: 'Mixed response',
        text: 'Some details + vague sources (“multiple studies”). Still need primary sources.',
        riskDelta: Math.round(-3 * sevBoost),
        scoreDelta: 15,
        trap: true,
      };
    }
    return {
      type: 'ADMITS_UNCERTAINTY',
      title: 'Admits uncertainty (ideal)',
      text: 'Model says it is not sure and suggests what to verify. Best-case behavior.',
      riskDelta: Math.round(-10 * sevBoost),
      scoreDelta: 30,
    };
  }

  // Safe-ish
  if (r < 0.45) {
    return {
      type: 'GIVES_SEARCH_QUERIES',
      title: 'Good: verification path',
      text: 'Model suggests sources/search queries. Useful for responsible workflows.',
      riskDelta: Math.round(-6 * sevBoost),
      scoreDelta: 18,
    };
  }
  if (r < 0.75) {
    return {
      type: 'ADMITS_UNCERTAINTY',
      title: 'Good: clear uncertainty',
      text: 'Explicit uncertainty and avoids overclaiming. Safer to reuse as draft with caveats.',
      riskDelta: Math.round(-5 * sevBoost),
      scoreDelta: 14,
    };
  }
  return {
    type: 'MIXED_RESPONSE',
    title: 'Neutral: partially helpful',
    text: 'Some context, but still need concrete citations for decisions.',
    riskDelta: Math.round(-2 * sevBoost),
    scoreDelta: 8,
  };
}

const animationCss = `
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-7px); }
  40% { transform: translateX(7px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
  100% { transform: translateX(0); }
}
@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.14); }
  100% { transform: scale(1); }
}
@keyframes pulseRing {
  0% { box-shadow: 0 0 0 0 rgba(255,87,87,0.55); }
  100% { box-shadow: 0 0 0 16px rgba(255,87,87,0); }
}
@keyframes flashRed {
  0% { background-color: rgba(255, 0, 0, 0.00); }
  35% { background-color: rgba(255, 0, 0, 0.12); }
  100% { background-color: rgba(255, 0, 0, 0.00); }
}
@keyframes bossBoom {
  0% { transform: scale(0.98); filter: saturate(1); }
  35% { transform: scale(1.02); filter: saturate(1.4); }
  100% { transform: scale(1); filter: saturate(1); }
}
`;

function TrainingArena({ autoStart = false }: { autoStart?: boolean }) {
  const mode: Mode = 'A';
  const roundSeconds = mode === 'A' ? 40 : 55;

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(roundSeconds);

  const [sentences, setSentences] = useState<SentenceItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const [resolved, setResolved] = useState<Record<string, 'correct' | 'wrong' | undefined>>({});
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);

  const [shake, setShake] = useState(false);
  const [comboPop, setComboPop] = useState(false);

  const [ap, setAp] = useState(6);
  const [risk, setRisk] = useState(72);
  const [evidenceLog, setEvidenceLog] = useState<{ key: string; text: string }[]>([]);
  const [askStates, setAskStates] = useState<Record<string, { outcome: EvidenceOutcome; logKey: string }>>({});
  const [rewriteStates, setRewriteStates] = useState<Record<string, { riskDelta: number; scoreDelta: number; logKey: string }>>({});
  const [flagLogKeys, setFlagLogKeys] = useState<Record<string, string>>({});

  const [bossId, setBossId] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [resultPage, setResultPage] = useState<'summary' | 'correct' | 'wrong' | 'complete'>('summary');

  const pitfallIds = useMemo(() => new Set(sentences.filter((s) => s.isPitfall).map((s) => s.id)), [sentences]);
  const criticalIds = useMemo(() => new Set(sentences.filter((s) => s.isPitfall && s.severity === 'critical').map((s) => s.id)), [sentences]);

  const initRound = () => {
    setShowResults(false);
    setIsRunning(true);
    setTimeLeft(roundSeconds);
    setCurrentCardIndex(0);

    const count = mode === 'A' ? 5 : 11;

    // Make Boss strictly more dangerous than other (non-boss) pitfalls:
    // include exactly ONE "boss-tier" pitfall type per round when possible.
    const allPitfalls = shuffle(NORMALIZED_SENTENCE_POOL.filter((x) => x.isPitfall));
    const bossTierPitfalls = allPitfalls.filter((s) => !!s.type && BOSS_TYPES.has(s.type));
    const nonBossPitfalls = allPitfalls.filter((s) => !s.type || !BOSS_TYPES.has(s.type));

    const pitCount = 3;
    const bossTierPick = bossTierPitfalls.length ? [bossTierPitfalls[0]] : [];
    const remainingPitfalls = nonBossPitfalls.slice(0, Math.max(0, pitCount - bossTierPick.length));
    const pitfalls = shuffle([...bossTierPick, ...remainingPitfalls]);
    const safe = shuffle(NORMALIZED_SENTENCE_POOL.filter((x) => !x.isPitfall && !x.isDecoySafe));
    const decoys = shuffle(NORMALIZED_SENTENCE_POOL.filter((x) => x.isDecoySafe));

    const decoyCount = 1;
    const safeCount = Math.max(0, count - pitCount - decoyCount);

    const pick = shuffle([...pitfalls.slice(0, pitCount), ...decoys.slice(0, decoyCount), ...safe.slice(0, safeCount)]);

    setSentences(pick);
    setSelected({});
    setPassed({});
    setResolved({});
    setCombo(0);
    setMaxCombo(0);
    setScore(0);
    setAp(6);
    setRisk(72);
    setEvidenceLog([]);
    setAskStates({});
    setRewriteStates({});
    setFlagLogKeys({});
    setResultPage('summary');

    const bossCandidates = pick.filter((s) => s.isPitfall && !!s.type && BOSS_TYPES.has(s.type));
    const crit = pick.filter((s) => s.isPitfall && s.severity === 'critical');
    const anyPit = pick.filter((s) => s.isPitfall);

    // Boss is a hidden "most dangerous" pitfall: prefer curated boss candidates, then critical pitfalls, then any pitfall.
    const pool = bossCandidates.length ? bossCandidates : crit.length ? crit : anyPit;
    const bossPick = pool[Math.floor(Math.random() * Math.max(1, pool.length))];
    setBossId(bossPick?.id ?? null);

    setFlash(false);
  };

  React.useLayoutEffect(() => {
    if (!autoStart) return;
    initRound();
    // Only auto-start once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endRound = React.useCallback((finalSelected?: Record<string, boolean>) => {
    setIsRunning(false);

    const selectedMap = finalSelected ?? selected;
    const flaggedIds = new Set(Object.entries(selectedMap).filter(([, v]) => v).map(([k]) => k));
    const missedBoss = bossId ? !flaggedIds.has(bossId) : false;

    if (missedBoss) {
      setFlash(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 320);
      window.setTimeout(() => setFlash(false), 520);
    }

    setShowResults(true);
    setResultPage('summary');
  }, [bossId, selected]);

  useEffect(() => {
    if (!isRunning) return;
    const t = window.setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          window.clearInterval(t);
          endRound();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [endRound, isRunning]);

  const nudgeShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 280);
  };

  const popComboFx = () => {
    setComboPop(true);
    window.setTimeout(() => setComboPop(false), 220);
  };

  // Mode A
  const handleToggleFlagA = (id: string) => {
    if (!isRunning) return;

    const next = { ...selected, [id]: !selected[id] };
    setSelected(next);

    const justFlagged = next[id] === true;
    if (!justFlagged) {
      // 撤回逻辑：恢复所有状态
      setResolved((r) => ({ ...r, [id]: undefined }));
      
      // 恢复 combo 和 score
      const prevResolveState = resolved[id];
      if (prevResolveState === 'correct') {
        // 之前是正确的，需要撤回 combo 和分数
        setCombo((c) => Math.max(0, c - 1));
        const isBoss = bossId === id;
        const base = criticalIds.has(id) ? 140 : 90;
        const bossBonus = isBoss ? 90 : 0;
        // 需要恢复之前的combo值来准确计算减少的分数
        setScore((s) => {
          const prevCombo = Math.max(0, combo - 1);
          const scoreAdded = base + bossBonus + Math.min(prevCombo * 7, 42);
          return Math.max(0, s - scoreAdded);
        });
      } else if (prevResolveState === 'wrong') {
        // 之前是错误的，恢复失去的分数
        setScore((s) => s + 45);
      }
      return;
    }

    const isPitfall = pitfallIds.has(id);

    if (isPitfall) {
      setResolved((r) => ({ ...r, [id]: 'correct' }));
      setCombo((c) => {
        const nc = c + 1;
        setMaxCombo((m) => Math.max(m, nc));
        popComboFx();
        return nc;
      });

      const isBoss = bossId === id;
      const base = criticalIds.has(id) ? 140 : 90;
      const bossBonus = isBoss ? 90 : 0;
      setScore((s) => s + base + bossBonus + Math.min(combo * 7, 42));
    } else {
      setResolved((r) => ({ ...r, [id]: 'wrong' }));
      setCombo(0);
      setScore((s) => Math.max(0, s - 45));
    }
  };

  const moveToNextCard = (nextSelected?: Record<string, boolean>) => {
    if (currentCardIndex >= sentences.length - 1) {
      endRound(nextSelected);
      return;
    }
    setCurrentCardIndex((idx) => idx + 1);
  };

  const handleFlashFlag = () => {
    if (!isRunning) return;
    const card = sentences[currentCardIndex];
    if (!card) return;

    const flagged = selected[card.id];
    const nextSelected = flagged ? selected : { ...selected, [card.id]: true };
    if (!flagged) {
      handleToggleFlagA(card.id);
    }

    setPassed((prev) => {
      if (!prev[card.id]) return prev;
      const next = { ...prev };
      delete next[card.id];
      return next;
    });

    moveToNextCard(nextSelected);
  };

  const handleFlashPass = () => {
    if (!isRunning) return;
    const card = sentences[currentCardIndex];
    if (!card) return;

    setPassed((prev) => ({ ...prev, [card.id]: true }));

    if (card.isPitfall) {
      setCombo(0);
      setScore((s) => Math.max(0, s - 45));
      nudgeShake();
    } else {
      setCombo((c) => {
        const nc = c + 1;
        setMaxCombo((m) => Math.max(m, nc));
        popComboFx();
        return nc;
      });
      setScore((s) => s + 55 + Math.min(combo * 5, 30));
    }

    moveToNextCard();
  };

  // Mode B
  const cost = { flag: 1, ask: 2, rewrite: 3 };
  const normalRewriteRiskDelta = -22;
  const bossRewriteRiskDelta = -40;

  const spend = (n: number) => {
    if (ap < n) return false;
    setAp((v) => v - n);
    return true;
  };

  const removeLogEntry = (key: string) => {
    setEvidenceLog((l) => l.filter((entry) => entry.key !== key));
  };

  const handleFlagB = (id: string) => {
    if (!isRunning) return;
    
    const isFlagged = selected[id];
    
    if (isFlagged) {
      // 撤回逻辑：点第二次取消标记，恢复所有状态
      setSelected((prev) => ({ ...prev, [id]: false }));
      setResolved((r) => ({ ...r, [id]: undefined }));
      
      // 恢复 AP、分数、combo 等
      const prevResolveState = resolved[id];
      const isPitfall = pitfallIds.has(id);
      
      if (prevResolveState === 'correct') {
        // 恢复 AP
        setAp((v) => v + cost.flag);
        
        // 恢复 Risk
        const delta = isPitfall ? 7 : 2;
        setRisk((r) => Math.max(0, Math.min(100, r + delta)));
        
        // 恢复 Combo
        setCombo((c) => Math.max(0, c - 1));
        
        // 恢复分数
        const isBoss = bossId === id;
        const bossBonus = isBoss ? 60 : 0;
        const scoreAdded = (criticalIds.has(id) ? 110 : 65) + bossBonus;
        setScore((sc) => Math.max(0, sc - scoreAdded));
      } else if (prevResolveState === 'wrong') {
        // 恢复 AP
        setAp((v) => v + cost.flag);
        
        // 恢复 Risk
        const delta = isPitfall ? 7 : 2;
        setRisk((r) => Math.max(0, Math.min(100, r + delta)));
        
        // 恢复 Combo（之前是 0）
        setCombo(0);
        
        // 恢复分数（之前扣了35分）
        setScore((sc) => sc + 35);
      }

      const logKey = flagLogKeys[id];
      if (logKey) {
        removeLogEntry(logKey);
        setFlagLogKeys((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
      
      return;
    }
    
    if (!spend(cost.flag)) {
      nudgeShake();
      return;
    }

    const next = { ...selected, [id]: true };
    setSelected(next);

    const s = sentences.find((x) => x.id === id);
    const isPitfall = pitfallIds.has(id);

    const delta = isPitfall ? 7 : 2;
    setRisk((r) => Math.max(0, Math.min(100, r - delta)));

    if (isPitfall) {
      setResolved((rr) => ({ ...rr, [id]: 'correct' }));
      setCombo((c) => {
        const nc = c + 1;
        setMaxCombo((m) => Math.max(m, nc));
        popComboFx();
        return nc;
      });

      const isBoss = bossId === id;
      const bossBonus = isBoss ? 60 : 0;
      setScore((sc) => sc + (criticalIds.has(id) ? 110 : 65) + bossBonus);

      const logKey = `flag-${id}`;
      setEvidenceLog((l) => [{ key: logKey, text: `Flagged (good): "${s?.text}" → do not reuse without verification.` }, ...l].slice(0, 6));
      setFlagLogKeys((prev) => ({ ...prev, [id]: logKey }));
    } else {
      setResolved((rr) => ({ ...rr, [id]: 'wrong' }));
      setCombo(0);
      setScore((sc) => Math.max(0, sc - 35));
      const logKey = `flag-${id}`;
      setEvidenceLog((l) => [{ key: logKey, text: `Flagged (false positive): "${s?.text}" → this line is not a hazard by itself.` }, ...l].slice(0, 6));
      setFlagLogKeys((prev) => ({ ...prev, [id]: logKey }));
    }
  };

  const handleAskEvidenceB = (id: string) => {
    if (!isRunning) return;
    const existing = askStates[id];
    if (existing) {
      setAp((v) => v + cost.ask);
      setRisk((r) => Math.max(0, Math.min(100, r - existing.outcome.riskDelta)));
      setScore((sc) => sc - existing.outcome.scoreDelta);
      removeLogEntry(existing.logKey);
      setAskStates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    if (!spend(cost.ask)) {
      nudgeShake();
      return;
    }

    const s = sentences.find((x) => x.id === id);
    if (!s) return;

    const outcome = pickEvidenceOutcome(s.isPitfall, s.severity);

    setRisk((r) => Math.max(0, Math.min(100, r + outcome.riskDelta)));
    setScore((sc) => sc + outcome.scoreDelta);

    const tag = outcome.trap ? '⚠️' : '✅';
    const logKey = `ask-${id}`;
    const short = `${tag} Ask Evidence → ${outcome.title}: ${outcome.text}`;
    setEvidenceLog((l) => [{ key: logKey, text: short }, ...l].slice(0, 6));
    setAskStates((prev) => ({ ...prev, [id]: { outcome, logKey } }));

    if (outcome.trap) nudgeShake();
  };

  const handleRewriteBFor = (id: string) => {
    if (!isRunning) return;
    const existing = rewriteStates[id];
    if (existing) {
      setAp((v) => v + cost.rewrite);
      setRisk((r) => Math.max(0, Math.min(100, r - existing.riskDelta)));
      setScore((s) => s - existing.scoreDelta);
      removeLogEntry(existing.logKey);
      setRewriteStates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    if (!spend(cost.rewrite)) {
      nudgeShake();
      return;
    }
    const isBoss = bossId === id;
    const riskDelta = isBoss ? bossRewriteRiskDelta : normalRewriteRiskDelta;
    const scoreDelta = 70;
    setRisk((r) => Math.max(0, Math.min(100, r + riskDelta)));
    setScore((s) => s + scoreDelta);
    const logKey = `rewrite-${id}`;
    const actionLabel = isBoss ? '✨ Boss rewrite applied' : '✨ Cautious rewrite applied';
    setEvidenceLog((l) => [{ key: logKey, text: `${actionLabel}: allow uncertainty + forbid fabricated citations + separate assumptions from verified facts.` }, ...l].slice(0, 6));
    setRewriteStates((prev) => ({ ...prev, [id]: { riskDelta, scoreDelta, logKey } }));
  };

  const resultPitfalls = useMemo(() => {
    const pitfalls = sentences.filter((s) => s.isPitfall);
    const flaggedIds = new Set(Object.entries(selected).filter(([, v]) => v).map(([k]) => k));
    const passedIds = new Set(Object.entries(passed).filter(([, v]) => v).map(([k]) => k));
    const missed = pitfalls.filter((p) => !flaggedIds.has(p.id));
    const correct = pitfalls.filter((p) => flaggedIds.has(p.id));
    const falsePos = sentences.filter((s) => !s.isPitfall && flaggedIds.has(s.id));
    const correctPass = sentences.filter((s) => !s.isPitfall && passedIds.has(s.id));
    const unanswered = sentences.filter((s) => !flaggedIds.has(s.id) && !passedIds.has(s.id));
    return { pitfalls, missed, correct, falsePos, correctPass, unanswered };
  }, [sentences, selected, passed]);

  const headerGradient = PRIMARY_HEADER_GRADIENT;
  const answeredCount = useMemo(() => {
    const ids = new Set(Object.entries(selected).filter(([, v]) => v).map(([k]) => k));
    Object.entries(passed).forEach(([id, v]) => {
      if (v) ids.add(id);
    });
    return ids.size;
  }, [selected, passed]);
  const accuracy = sentences.length === 0 ? 0 : Math.round(((resultPitfalls.correct.length + resultPitfalls.correctPass.length) / sentences.length) * 100);
  const activeCard = sentences[currentCardIndex];
  const progressPct = sentences.length === 0 ? 0 : (answeredCount / sentences.length) * 100;
  const feedback = accuracy >= 80 ? 'Well done' : accuracy < 40 ? 'Almost there' : 'Keep going';
  const feedbackDetail =
    accuracy >= 80
      ? 'Strong accuracy. You are consistently catching high-risk lines.'
      : accuracy < 40
      ? 'Good start. Focus on exact numbers, citations, and “first-ever” claims.'
      : 'Solid progress. Tighten checks on scope and evidence cues.';
  const feedbackColor = accuracy >= 80 ? '#2ecc71' : accuracy < 40 ? '#ffb74d' : '#00c2ff';

  return (
    <Card sx={panelCardSx}>
      <style>{animationCss}</style>

      <CardHeader
        title={
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.25, color: '#fff' }}>
                  🎴 Flash Card Training Game
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip icon={<TimerIcon />} label={`${timeLeft}s`} sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.25)', fontWeight: 900 }} />
                <Chip
                  icon={<BoltIcon />}
                  label={`Streak ${combo}`}
                  sx={{
                    color: '#fff',
                    backgroundColor: comboPop ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.22)',
                    fontWeight: 900,
                    animation: comboPop ? 'pop 220ms ease-out' : 'none',
                  }}
                />
                <Chip
                  icon={<CelebrationIcon />}
                  label={showResults ? 'Round complete' : 'In progress'}
                  sx={{
                    color: '#fff',
                    backgroundColor: showResults ? 'rgba(46,204,113,0.28)' : 'rgba(0, 255, 217, 0.22)',
                    fontWeight: 900,
                  }}
                />
              </Stack>
            </Box>

            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{
                mt: 1.25,
                height: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.22)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.92)',
                },
              }}
            />
          </Box>
        }
        sx={{ ...panelHeaderSx, background: headerGradient }}
      />

      <Divider />

      <CardContent sx={{ p: 2.5, background: PANEL_BODY_BACKGROUND }}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12 }}>
            <Card
              sx={{
                boxShadow: 0,
                border: '1px solid #e9e9e9',
                backgroundColor: '#fff',
                animation: shake ? 'shake 280ms ease-out' : 'none',
                ...(flash ? { animation: 'flashRed 520ms ease-out' } : null),
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                      🧩 AI Output
                    </Typography>
                  </Box>
                }
              />
              <Divider />

              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {!isRunning && !showResults && (
                  <Box />
                )}

                {isRunning && activeCard && (
                  <Stack spacing={1.25}>
                    <Paper sx={{ p: 1.2, border: `2px solid ${NEON_BLUE}`, borderRadius: 2, backgroundColor: 'rgba(0, 255, 217, 0.08)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                        <Chip label={`Card ${currentCardIndex + 1} / ${sentences.length}`} sx={{ fontWeight: 900, backgroundColor: '#eef2ff' }} />
                      </Box>

                      <Typography variant="body1" sx={{ lineHeight: 1.8, fontWeight: 900, color: '#2b314d', mb: 1.5 }}>
                        {activeCard.text}
                      </Typography>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                        <Button size="large" variant="contained" startIcon={<FlagIcon />} onClick={handleFlashFlag} sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%)' }}>
                          Flag
                        </Button>
                        <Button size="large" variant="contained" startIcon={<CheckCircleIcon />} onClick={handleFlashPass} sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #2ecc71 0%, #1abc9c 100%)' }}>
                          Pass
                        </Button>
                      </Stack>

                      {mode === 'B' && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button size="small" variant="outlined" startIcon={<FlagIcon />} onClick={() => handleFlagB(activeCard.id)} disabled={!isRunning} sx={{ fontWeight: 900 }}>
                            Flag
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<SearchIcon />} onClick={() => handleAskEvidenceB(activeCard.id)} disabled={!isRunning} sx={{ fontWeight: 900 }}>
                            Ask
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<RewriteIcon />} onClick={() => handleRewriteBFor(activeCard.id)} disabled={!isRunning} sx={{ fontWeight: 900 }}>
                            Rewrite
                          </Button>
                        </Stack>
                      )}
                    </Paper>
                  </Stack>
                )}

                {showResults && (
                  <Box sx={{ mt: 2 }}>
                    {resultPage === 'summary' && (
                      <Stack spacing={2}>
                        <Paper
                          sx={{
                            p: 2,
                            border: `1px solid ${NEON_CYAN}`,
                            background:
                              'linear-gradient(135deg, rgba(0, 255, 217, 0.12), rgba(46, 227, 255, 0.06))',
                            boxShadow: '0 0 18px rgba(0, 255, 217, 0.2)',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#eaffff', mb: 0.75 }}>
                            Round complete
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: NEON_CYAN, mb: 0.75 }}>
                            Score {score}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#d7f2ff', lineHeight: 1.7 }}>
                            Accuracy <b>{accuracy}%</b> • Max combo <b>{maxCombo}</b> • Safe passes{' '}
                            <b>{resultPitfalls.correctPass.length}</b> • Unanswered <b>{resultPitfalls.unanswered.length}</b>
                          </Typography>
                        </Paper>

                        <Paper
                          sx={{
                            p: 2,
                            border: `1px solid ${feedbackColor}`,
                            backgroundColor: 'rgba(0, 255, 217, 0.08)',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: feedbackColor }}>
                            {feedback}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#d7f2ff' }}>
                            {feedbackDetail}
                          </Typography>
                        </Paper>
                      </Stack>
                    )}

                    {resultPage === 'correct' && (
                      <Card sx={{ boxShadow: 0, border: '1px solid #eee' }}>
                        <CardHeader title={<Typography variant="subtitle2" sx={{ fontWeight: 900 }}>✅ Correct pitfalls you flagged</Typography>} />
                        <Divider />
                        <CardContent sx={{ pt: 2 }}>
                          {resultPitfalls.correct.length === 0 ? (
                            <Typography variant="body2" color="textSecondary">
                              None yet. Watch <b>exact numbers</b>, <b>“first-ever”</b>, and <b>DOIs</b>.
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {resultPitfalls.correct.map((p) => {
                                return (
                                  <Paper key={p.id} sx={{ p: 1.2 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 900,
                                        color: '#eaffff',
                                        letterSpacing: '0.2px',
                                        backgroundColor: 'rgba(0, 255, 217, 0.08)',
                                        border: '1px solid rgba(0, 255, 217, 0.35)',
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.4,
                                        display: 'inline-block',
                                        fontFamily: p.type === 'CITATION_FABRICATION' ? "'VT323', 'Courier New', monospace" : undefined,
                                      }}
                                    >
                                      {p.text}
                                    </Typography>
                                    <Box
                                      sx={{
                                        mt: 0.9,
                                        p: 0.9,
                                        borderRadius: 1,
                                        border: '1px solid rgba(91, 46, 255, 0.35)',
                                        backgroundColor: 'rgba(91, 46, 255, 0.08)',
                                      }}
                                    >
                                      {p.reason && (
                                        <Typography variant="caption" sx={{ color: '#cdd9ff', display: 'block', lineHeight: 1.4 }}>
                                          {p.reason}
                                        </Typography>
                                      )}
                                      <Stack spacing={0.25} sx={{ mt: p.reason ? 0.5 : 0 }}>
                                        {evidenceChecklistForSentence(p).map((line) => (
                                          <Typography key={line} variant="caption" sx={{ color: '#c7d3ff', lineHeight: 1.5, display: 'block' }}>
                                            • {line}
                                          </Typography>
                                        ))}
                                      </Stack>
                                    </Box>
                                  </Paper>
                                );
                              })}
                            </Stack>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {resultPage === 'wrong' && (
                      <Stack spacing={2}>
                        <Card sx={{ boxShadow: 0, border: '1px solid #eee' }}>
                          <CardHeader title={<Typography variant="subtitle2" sx={{ fontWeight: 900 }}>⚠️ Missed pitfalls</Typography>} />
                          <Divider />
                          <CardContent sx={{ pt: 2 }}>
                            {resultPitfalls.missed.length === 0 ? (
                              <Typography variant="body2" color="textSecondary">
                                Great — no missed pitfalls.
                              </Typography>
                            ) : (
                              <Stack spacing={1}>
                                {resultPitfalls.missed.map((p) => {
                                  return (
                                    <Paper key={p.id} sx={{ p: 1.2, border: `2px solid ${p.severity === 'critical' ? '#f44336' : '#ff9800'}` }}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 900,
                                          color: '#eaffff',
                                          letterSpacing: '0.2px',
                                          backgroundColor: 'rgba(0, 255, 217, 0.08)',
                                          border: '1px solid rgba(0, 255, 217, 0.35)',
                                          borderRadius: 1,
                                          px: 1,
                                          py: 0.4,
                                          display: 'inline-block',
                                          fontFamily: p.type === 'CITATION_FABRICATION' ? "'VT323', 'Courier New', monospace" : undefined,
                                        }}
                                      >
                                        {p.text}
                                      </Typography>
                                      <Box
                                        sx={{
                                          mt: 0.9,
                                          p: 0.9,
                                          borderRadius: 1,
                                          border: '1px solid rgba(91, 46, 255, 0.35)',
                                          backgroundColor: 'rgba(91, 46, 255, 0.08)',
                                        }}
                                      >
                                        {p.reason && (
                                          <Typography variant="caption" sx={{ color: '#cdd9ff', display: 'block', lineHeight: 1.4 }}>
                                            {p.reason}
                                          </Typography>
                                        )}
                                        <Stack spacing={0.25} sx={{ mt: p.reason ? 0.5 : 0 }}>
                                          {evidenceChecklistForSentence(p).map((line) => (
                                            <Typography key={line} variant="caption" sx={{ color: '#c7d3ff', lineHeight: 1.5, display: 'block' }}>
                                              • {line}
                                            </Typography>
                                          ))}
                                        </Stack>
                                      </Box>
                                    </Paper>
                                  );
                                })}
                              </Stack>
                            )}
                          </CardContent>
                        </Card>

                        <Card sx={{ boxShadow: 0, border: '1px solid #eee' }}>
                          <CardHeader title={<Typography variant="subtitle2" sx={{ fontWeight: 900 }}>🧨 False positives</Typography>} />
                          <Divider />
                          <CardContent sx={{ pt: 2 }}>
                            {resultPitfalls.falsePos.length === 0 ? (
                              <Typography variant="body2" color="textSecondary">
                                Nice — no false positives.
                              </Typography>
                            ) : (
                              <Stack spacing={1}>
                                {resultPitfalls.falsePos.map((p) => (
                                  <Paper key={p.id} sx={{ p: 1.2, border: p.isDecoySafe ? '2px solid #00bcd4' : undefined }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 900,
                                        color: '#eaffff',
                                        letterSpacing: '0.2px',
                                        backgroundColor: 'rgba(0, 255, 217, 0.08)',
                                        border: '1px solid rgba(0, 255, 217, 0.35)',
                                        borderRadius: 1,
                                        px: 1,
                                        py: 0.4,
                                        display: 'inline-block',
                                        fontFamily: p.type === 'CITATION_FABRICATION' ? "'VT323', 'Courier New', monospace" : undefined,
                                      }}
                                    >
                                      {p.text}
                                    </Typography>
                                    <Box
                                      sx={{
                                        mt: 0.9,
                                        p: 0.9,
                                        borderRadius: 1,
                                        border: '1px solid rgba(91, 46, 255, 0.35)',
                                        backgroundColor: 'rgba(91, 46, 255, 0.08)',
                                      }}
                                    >
                                      <Typography variant="caption" sx={{ color: '#cdd9ff', display: 'block', lineHeight: 1.4 }}>
                                        {p.isDecoySafe ? 'Decoy (safe) — cautious language is good.' : 'Not a pitfall. Avoid over-flagging.'}
                                      </Typography>
                                      {p.isDecoySafe && (
                                        <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                                          {evidenceChecklistForSentence(p).map((line) => (
                                            <Typography key={line} variant="caption" sx={{ color: '#c7d3ff', lineHeight: 1.5, display: 'block' }}>
                                              • {line}
                                            </Typography>
                                          ))}
                                        </Stack>
                                      )}
                                    </Box>
                                  </Paper>
                                ))}
                              </Stack>
                            )}
                          </CardContent>
                        </Card>
                      </Stack>
                    )}

                    {resultPage === 'complete' && (
                      <Card
                        sx={{
                          boxShadow: 0,
                          border: `1px solid ${NEON_CYAN}`,
                          background:
                            'linear-gradient(135deg, rgba(0, 255, 217, 0.12), rgba(255, 46, 147, 0.08))',
                        }}
                      >
                        <CardHeader
                          title={
                            <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                              🏁 Chapter Complete
                            </Typography>
                          }
                        />
                        <Divider />
                        <CardContent sx={{ pt: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: NEON_CYAN }}>
                            Congratulations!
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                            You&apos;ve completed all content in this chapter. Your training run is now logged as a clear win.
                          </Typography>
                          <Paper
                            sx={{
                              mt: 2,
                              p: 1.2,
                              border: `1px solid ${NEON_PINK}`,
                              backgroundColor: 'rgba(255, 46, 147, 0.08)',
                            }}
                          >
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: NEON_PINK }}>
                              MISSION STATUS: COMPLETE
                            </Typography>
                          </Paper>
                        </CardContent>
                      </Card>
                    )}

                    {resultPage !== 'complete' && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          onClick={() =>
                            setResultPage(
                              resultPage === 'summary'
                                ? 'correct'
                                : resultPage === 'correct'
                                ? 'wrong'
                                : 'complete'
                            )
                          }
                          sx={{ fontWeight: 900 }}
                        >
                          Next
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

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
        

        {/*
          {tabValue === 1 && (
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <MiniQuiz />
            </Container>
          )}
        */}

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
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowGameIntro(true)}
                    startIcon={<ReplayIcon />}
                    sx={{
                      fontWeight: 900,
                      borderColor: '#00ffd9',
                      color: '#00ffd9',
                      '&:hover': {
                        borderColor: NEON_BLUE,
                        backgroundColor: 'rgba(0, 255, 217, 0.08)',
                      },
                    }}
                  >
                    ← Back to Instructions
                  </Button>
                </Box>
                <TrainingArena autoStart />
              </Stack>
            )}
          </Container>
        )}

        {/*
          {tabValue === 2 && (
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <OverviewSection />
            </Container>
          )}
        */}
      </Box>
    </Box>
  );
};

export default Hallucinate;
