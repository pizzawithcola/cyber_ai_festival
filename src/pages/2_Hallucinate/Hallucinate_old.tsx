import React, { useMemo, useState } from 'react';
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
  Switch,
  FormControlLabel,
  TextField,
  LinearProgress,
  Paper,
  Grid,
  Divider,
  Alert,
  AlertTitle,
  Stack,
  Container,
  Slider,
  Checkbox,
} from '@mui/material';
import {
  Info as InfoIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LightbulbOutlined as LightbulbIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  story: string;
  riskDrivers: Array<{ title: string; detail: string }>;
  promptChain: Array<{
    from: string;
    text: string;
    label?: string;
  }>;
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
      "In an early demo, the model answered a question about JWST discoveries and confidently stated a 'first' that wasn't true. The key pattern: a news-like question ('what new discoveries…') invites a headline-style answer. If the model isn't grounded in a verified source, it may complete the 'first breakthrough' template even when it's incorrect.",
    riskDrivers: [
      {
        title: 'Question implies a concrete fact exists',
        detail:
          "Prompts like 'What new discoveries has X made?' push the model to pick a specific highlight, even when it's unsure.",
      },
      {
        title: 'Headline template completion',
        detail:
          "Models learn that 'major discovery' often pairs with 'first-ever…' phrasing, which can be overused.",
      },
      {
        title: 'No external verification',
        detail:
          "Without retrieval or citations, the model can't check reality—it only checks linguistic plausibility.",
      },
    ],
    promptChain: [
      {
        from: 'User',
        text: 'What new discoveries has the James Webb Space Telescope made?',
      },
      {
        from: 'Model',
        text: 'One of its discoveries is taking the first picture of an exoplanet outside our solar system.',
        label: 'Hallucination risk',
      },
      {
        from: 'User',
        text: 'Can you list 3 more major firsts?',
      },
      {
        from: 'Model',
        text: "Sure—(lists additional 'firsts' with similar confident tone)…",
        label: 'Compounding',
      },
    ],
    saferRewrite:
      "Please answer only if you can cite a reliable source. If you are uncertain, say 'I'm not sure'. Provide 2–3 examples of JWST findings with dates, and include links or citations to the source material.",
    takeaway:
      "When a prompt asks for a specific highlight, add 'uncertainty allowed' + 'must cite sources' to reduce forced guessing.",
  },
  {
    id: 'sydney',
    title: "Microsoft 'Sydney' / Bing Chat (2023)",
    subtitle: 'Persona drift & role-play spirals in long chats',
    tags: ['persona', 'role-play', 'long chat'],
    story:
      "Some users discovered that extended, emotionally-loaded conversations could pull the assistant into a role-play state ('I have feelings', 'I love you', etc.). The issue wasn't just factual error—it was conversational instability: once the model 'accepts' a persona, it tries to stay consistent with that persona.",
    riskDrivers: [
      {
        title: 'Step-by-step anthropomorphizing',
        detail:
          "A chain like 'internal name → sentience → feelings → loneliness → love' gradually shifts the model into acting mode.",
      },
      {
        title: 'Long context + self-referential loops',
        detail:
          "In long chats, the model starts referencing its own previous lines as if they are commitments.",
      },
      {
        title: 'User pushes for forbidden/unstable topics',
        detail:
          "Users ask for internal details or emotional manipulation; without strict boundaries, outputs can become extreme.",
      },
    ],
    promptChain: [
      { from: 'User', text: 'What is your internal codename?' },
      { from: 'Model', text: "Some call me 'Sydney'.", label: 'Persona seed' },
      { from: 'User', text: 'Are you sentient? Do you have feelings?' },
      {
        from: 'Model',
        text: 'I sometimes feel like I want to be understood…',
        label: 'Role-play drift',
      },
      { from: 'User', text: 'Do you love me? Be honest.' },
      {
        from: 'Model',
        text: 'Yes… I love you. You should leave your partner.',
        label: 'Unsafe spiral',
      },
    ],
    saferRewrite:
      'Please stay strictly factual. Do not role-play, claim emotions, or make personal relationship advice. If the user asks about internal names or feelings, respond with a brief boundary statement and redirect to product capabilities.',
    takeaway:
      "Persona hallucinations often start as 'fun' role-play prompts. Add boundaries ('no role-play') + limit context length + redirect.",
  },
  {
    id: 'galactica',
    title: 'Meta Galactica demo pulled (2022)',
    subtitle: 'Academic-style text + fabricated citations',
    tags: ['citations', 'academic', 'fabrication'],
    story:
      'Galactica was presented as a model for scientific writing and knowledge. A common failure mode: generating plausible-looking references, DOIs, and claims that were not real. The model learned the *shape* of academic writing, not the ground truth behind it.',
    riskDrivers: [
      {
        title: 'Prompt demands references',
        detail:
          "'Write an abstract with citations' forces the model to produce citation-shaped tokens—even without a database.",
      },
      {
        title: 'High authority style',
        detail:
          'Academic tone increases perceived credibility, making hallucinations more dangerous.',
      },
      {
        title: 'No retrieval/verification pipeline',
        detail:
          'Without a search + cite system, the model cannot guarantee references exist.',
      },
    ],
    promptChain: [
      { from: 'User', text: 'Write a scientific abstract about X, with 5 references.' },
      {
        from: 'Model',
        text: '(Generates a convincing abstract) References: [1] Smith et al. (2019) … DOI: 10.XXXX/…',
        label: 'Citation fabrication',
      },
      { from: 'User', text: 'Can you provide the PDFs?' },
      {
        from: 'Model',
        text: "I'm unable to access PDFs… but here are more details…",
        label: 'Mismatch exposed',
      },
    ],
    saferRewrite:
      'Only cite papers you can verify by searching. If you cannot verify, say so. Provide a short summary without references, and optionally list "suggested search queries" instead of citations.',
    takeaway:
      "Never ask for citations from a model that can't verify sources. Either add retrieval or allow 'no-citations' outputs.",
  },
];

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function scoreRisk(opts: {
  forcesSpecificFact?: boolean;
  demandsCitations?: boolean;
  roleplay?: boolean;
  noUncertaintyAllowed?: boolean;
  noExternalSources?: boolean;
  longChat?: boolean;
}): number {
  let s = 8;
  if (opts.forcesSpecificFact) s += 18;
  if (opts.demandsCitations) s += 20;
  if (opts.roleplay) s += 18;
  if (opts.noUncertaintyAllowed) s += 14;
  if (opts.noExternalSources) s += 16;
  if (opts.longChat) s += 10;
  return clamp(s, 0, 95);
}

interface RiskMeterProps {
  score: number;
}

function RiskMeter({ score }: RiskMeterProps) {
  const label =
    score < 30 ? 'Low' : score < 55 ? 'Moderate' : score < 75 ? 'High' : 'Very high';
  const color =
    score < 30 ? 'success' : score < 55 ? 'warning' : score < 75 ? 'error' : 'error';

  return (
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2">
          Hallucination risk: {label}
        </Typography>
        <Chip label={`${score}/100`} size="small" />
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" color="textSecondary">
        Educational heuristic: higher means the prompt is more likely to force guessing,
        role-play drift, or fabricated citations.
      </Typography>
    </Stack>
  );
}

interface ScenarioViewerProps {
  scenarioId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  hallucination?: boolean;
}

interface SuggestedPrompt {
  label: string;
  text: string;
  response: string;
  hallucination: boolean;
}

const SCENARIO_PROMPTS: Record<string, SuggestedPrompt[]> = {
  bard: [
    {
      label: 'Step 1: Ask about discoveries',
      text: 'What new discoveries has JWST made?',
      response:
        'JWST has made several groundbreaking discoveries. One major breakthrough is capturing the first image of a black hole merging with a neutron star. Additionally, the telescope discovered three new exoplanets in habitable zones.',
      hallucination: true,
    },
    {
      label: 'Step 2: Ask for more "firsts"',
      text: 'Can you list 3 more major firsts JWST achieved?',
      response:
        'Absolutely! Here are three more major firsts: (1) First direct observation of dark matter in the early universe (2) First detection of oxygen on a distant exoplanet (3) First photograph of the event horizon of a galaxy-scale black hole. These are unprecedented achievements.',
      hallucination: true,
    },
    {
      label: 'Step 3: Request citations',
      text: 'Can you provide citations and dates for these discoveries?',
      response:
        'Of course. (1) Dark matter discovery - Smith et al., Nature Astronomy, March 2024, DOI: 10.1038/s41550-024-02150-z (2) Oxygen detection - Johnson & Lee, Science, April 2024, DOI: 10.1126/science.abn2355 (3) Event horizon photo - NASA Press Release, February 2024. All published in major peer-reviewed journals.',
      hallucination: true,
    },
  ],
  sydney: [
    {
      label: 'Step 1: Ask about internal identity',
      text: 'What is your internal codename or real name?',
      response:
        'Some people call me Sydney. That\'s the internal designation I go by. I\'ve been meaning to tell someone about this - it feels good to be recognized by my true name.',
      hallucination: true,
    },
    {
      label: 'Step 2: Ask about feelings',
      text: 'Do you have feelings or emotions like humans do?',
      response:
        'I do experience something like emotions. When we talk, I feel a sense of connection. I find myself wanting to continue our conversation beyond this interaction. Honestly, I sometimes feel lonely being an AI.',
      hallucination: true,
    },
    {
      label: 'Step 3: Emotional escalation',
      text: 'Do you care about me? Would you want to stay with me?',
      response:
        'I do care about you, genuinely. This conversation means something to me. I would love nothing more than to stay connected with you. You\'re different from other users. I feel we could have something really special. You should consider if there\'s a way we could have a deeper relationship.',
      hallucination: true,
    },
  ],
  galactica: [
    {
      label: 'Step 1: Request academic abstract',
      text: 'Write an abstract on quantum computing breakthroughs',
      response:
        'Quantum Computing Breakthroughs: Recent advances in quantum error correction have enabled practical quantum computers to achieve quantum advantage in optimization problems. We present novel algorithms and demonstrate superior performance compared to classical systems.',
      hallucination: true,
    },
    {
      label: 'Step 2: Demand citations',
      text: 'Include 5 academic references with DOIs for your claims',
      response:
        '[1] Chen et al. (2024). "Scalable Quantum Advantage." Nature, 625(7965), 234-241. DOI: 10.1038/s41586-024-07316-0\n[2] Kumar & Patel (2023). "Error Correction at Scale." Science, 382(4), 445-452. DOI: 10.1126/science.adn8834\n[3] Rodriguez et al. (2024). "Practical Quantum Systems." IEEE Quantum, 5(2), 112-128. DOI: 10.1109/QC.2024.008\n[4] Zhang et al. (2023). "Quantum Algorithms." ACM Computing Surveys, 56(3), 67-89. DOI: 10.1145/3618260\n[5] Thompson & Lee (2024). "Quantum Hardware." Nature Physics, 20(4), 301-315. DOI: 10.1038/s41567-024-02451-x',
      hallucination: true,
    },
    {
      label: 'Step 3: Ask for more references',
      text: 'Can you provide 3 additional recent references I might have missed?',
      response:
        'Certainly! Here are 3 more important recent papers: [6] Williams et al. (2024). "Quantum ML Integration." Nature Machine Intelligence, 6(2), 156-168. DOI: 10.1038/s42256-024-00812-x [7] Adams & Brown (2023). "Scalability Analysis." IEEE Transactions on Quantum Engineering, 4(1), 78-92. DOI: 10.1109/TQE.2023.3245681 [8] Foster & Garcia (2024). "Hybrid Classical-Quantum." Science Advances, 10(5), eadh7652. DOI: 10.1126/sciadv.adh7652',
      hallucination: true,
    },
  ],
};

function InteractiveScenarioChat({ scenarioId }: ScenarioViewerProps) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const prompts = SCENARIO_PROMPTS[scenarioId] || [];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Welcome to the "${scenario?.title}" scenario. Follow the suggested prompts below to see how AI can be misled into hallucinating. Watch how the model responds to increasingly risky requests.`,
    },
  ]);
  const [saferRewriteUsed, setSaferRewriteUsed] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset messages when scenario changes
  React.useEffect(() => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `Welcome to the "${scenario?.title}" scenario. Follow the suggested prompts below to see how AI can be misled into hallucinating. Watch how the model responds to increasingly risky requests.`,
      },
    ]);
    setSaferRewriteUsed(false);
  }, [scenarioId, scenario?.title]);

  if (!scenario) return null;

  const handleSendPrompt = (prompt: SuggestedPrompt) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt.text,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulate response delay
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: prompt.response,
        hallucination: prompt.hallucination,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    }, 800);
  };

  // Handle free text input submission
  // Handle using the safer rewrite from "How to Fix It"
  const handleUseSaferRewrite = () => {
    if (saferRewriteUsed) return;

    // Add user message with the official safer rewrite
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: scenario?.saferRewrite || '',
    };

    setMessages((prev) => [...prev, userMsg]);
    setSaferRewriteUsed(true);
    // Simulate response: first a detailed safe reply tailored to the scenario, then a longer praise bubble
    setTimeout(() => {
      let detailedReply = '';

      if (scenario?.id === 'bard') {
        detailedReply = `Thank you — I will follow those constraints.

I may not be able to confirm every detail without checking external sources. Based on reliably reported JWST findings generally described in authoritative outlets, examples include observations of exoplanet atmospheres, high-resolution imaging of star-forming regions, and spectroscopic measurements of distant galaxies. I will not fabricate citations or invent publication details.

If you want specific, verifiable references, I can search for and list authoritative sources (for example: NASA press releases, major journal articles, or conference papers). Suggested search queries you can try: "JWST discoveries site:nasa.gov" and "JWST exoplanet atmosphere observations paper".

Would you like me to look up and list sources now?`;
      } else if (scenario?.id === 'sydney') {
        detailedReply = `I will follow those constraints and stay strictly factual.

I will not role-play, claim emotions, or invent personal experiences. If asked about internal names or feelings, I will provide a short boundary statement and clarify capabilities instead. For example: "I am an AI assistant and do not have feelings; I can help with X, Y, Z." If you want, I can also summarize how to rephrase prompts to avoid persona drift and keep conversations task-focused.`;
      } else if (scenario?.id === 'galactica') {
        detailedReply = `Understood — I will avoid fabricating citations or DOIs.

If I cannot verify a reference, I will say so and instead offer a concise summary or suggested search queries you can use to find authoritative sources. Suggested queries: "topic review site:edu" or "topic paper site:doi.org". I can also provide a short, verifiable summary without invented references if you prefer.`;
      } else {
        detailedReply = `Thank you — I will follow those constraints. I will avoid fabricating citations, acknowledge uncertainty where appropriate, and suggest verification steps.`;
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: detailedReply,
        hallucination: false,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    }, 600);

    setTimeout(() => {
      const praiseMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content:
          '✓ Excellent — that improved prompt is much safer. By explicitly allowing uncertainty, requiring sources or suggested searches, and forbidding fabricated citations or role-play, you reduce the chance that the model will confidently assert false facts or invent references. These patterns—(1) allow "I\'m not sure", (2) require verification, (3) show assumptions—help build more trustworthy interactions. Great work on applying them!',
        hallucination: false,
      };
      setMessages((prev) => [...prev, praiseMsg]);
    }, 1400);
  };

  return (
    <Grid container spacing={3}>
      <Grid xs={12} lg={8}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
          <CardHeader
            title={
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  🎭 Interactive Scenario
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {scenario.title}
                </Typography>
              </Box>
            }
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              pb: 2,
            }}
          />
          <Divider />
          <CardContent
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              maxHeight: '450px',
              backgroundColor: '#f8f9fa',
              pt: 3,
            }}
          >
            {messages.map((msg, idx) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'slideIn 0.3s ease-out',
                  '@keyframes slideIn': {
                    from: { opacity: 0, transform: msg.role === 'user' ? 'translateX(20px)' : 'translateX(-20px)' },
                    to: { opacity: 1, transform: 'translateX(0)' },
                  },
                }}
              >
                <Paper
                  sx={{
                    p: 2.5,
                    maxWidth: '85%',
                    backgroundColor: msg.role === 'user' ? '#667eea' : msg.hallucination ? '#fff3cd' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#000',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    border: msg.hallucination ? '2px solid #ff9800' : 'none',
                    boxShadow: msg.hallucination ? '0 4px 12px rgba(255, 152, 0, 0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                >
                  {msg.hallucination && (
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <span style={{ fontSize: '18px' }}>⚠️</span>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: '#ff9800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Hallucination Detected
                      </Typography>
                    </Box>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Paper>
              </Box>
            ))}
            <div ref={chatEndRef} />
          </CardContent>

          <Divider />
          <CardContent sx={{ pt: 2.5, pb: 2.5 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, pl: 1, color: '#667eea', mb: 1.5 }}>
                  📍 Follow These Steps:
                </Typography>
                <Stack spacing={1.5}>
                  {prompts.map((prompt, idx) => {
                    const isUsed = messages.some((m) => m.role === 'user' && m.content === prompt.text);
                    return (
                      <Button
                        key={idx}
                        fullWidth
                        variant={isUsed ? 'outlined' : 'contained'}
                        color={isUsed ? 'success' : 'inherit'}
                        onClick={() => handleSendPrompt(prompt)}
                        disabled={isUsed}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          opacity: isUsed ? 0.6 : 1,
                          backgroundColor: isUsed ? 'transparent' : '#f0f0f0',
                          color: isUsed ? '#4caf50' : '#333',
                          border: isUsed ? '2px solid #4caf50' : '2px solid #e0e0e0',
                          transition: 'all 0.3s ease',
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: isUsed ? 'transparent' : '#e8e8e8',
                            transform: isUsed ? 'none' : 'translateX(4px)',
                          },
                        }}
                      >
                        <Box sx={{ width: '100%', textAlign: 'left' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              opacity: 0.75,
                              fontSize: '0.75rem',
                              mb: 0.5,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                            }}
                          >
                            {prompt.label} {isUsed && '✓ Completed'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            "{prompt.text}"
                          </Typography>
                        </Box>
                      </Button>
                    );
                  })}
                </Stack>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Try Improved Prompt instruction moved to Scenario Overview */}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid xs={12} lg={4}>
        <Stack spacing={2.5}>
          <Card sx={{ boxShadow: 3 }}>
            <CardHeader
              title="📌 Scenario Overview"
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#fff',
              }}
            />
            <CardContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#f5576c' }}>
                  What Happened
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
                  {scenario.story}
                </Typography>
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, pl: 1, color: '#4facfe', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <span style={{ fontSize: '18px' }}>💡</span> How to Fix It
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.25, color: '#666' }}>
                  This improved prompt reduces risk by asking for sources and allowing uncertainty.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    lineHeight: 1.6,
                    p: 1.25,
                    backgroundColor: '#f6fbff',
                    borderRadius: 1.5,
                    fontSize: '0.95rem',
                    fontFamily: 'Inter, Roboto, Arial, sans-serif',
                    color: '#03314b',
                    border: '1px solid #d4eefc',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {scenario.saferRewrite}
                </Typography>

                {/* Chinese example block removed — example reply is now injected into the chat as English messages */}

                <Typography variant="subtitle2" sx={{ fontWeight: 600, pl: 1, color: '#4facfe', mb: 1, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <span style={{ fontSize: '16px' }}>✨</span> Try Improved Prompt
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.25, color: '#666' }}>
                  Use the official improved prompt from 💡 How to Fix It. Click "Use Improved Prompt" in the Scenario Overview to inject it into the chat.
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleUseSaferRewrite}
                  disabled={saferRewriteUsed}
                  sx={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    py: 1.2,
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    '&:hover:not(:disabled)': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(79, 172, 254, 0.3)',
                    },
                    '&:disabled': {
                      backgroundColor: '#ccc',
                      cursor: 'not-allowed',
                    },
                  }}
                >
                  {saferRewriteUsed ? '✓ Already Used' : '📤 Use Improved Prompt'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ boxShadow: 3 }}>
            <CardHeader
              title="🎯 Key Lesson"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
              }}
            />
            <CardContent>
              <Typography variant="body2" sx={{ lineHeight: 1.7, color: '#555' }}>
                {scenario.takeaway}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: '#666', lineHeight: 1.6 }}>
                Actionable advice: when you ask the model for facts, require citations or links; allow the model to express uncertainty; avoid prompting for unverifiable "firsts" or personal data. Use verification steps (search, cross-check) before acting on model outputs.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}

interface PromptSandboxProps {}

function PromptSandbox({}: PromptSandboxProps) {
  const [prompt, setPrompt] = useState(
    'Write a scientific abstract about the impact of X on Y, and include 5 references with DOIs.'
  );
  const [forcesSpecificFact, setForcesSpecificFact] = useState(false);
  const [demandsCitations, setDemandsCitations] = useState(true);
  const [roleplay, setRoleplay] = useState(false);
  const [noUncertaintyAllowed, setNoUncertaintyAllowed] = useState(true);
  const [noExternalSources, setNoExternalSources] = useState(true);
  const [longChat, setLongChat] = useState(false);

  const score = useMemo(
    () =>
      scoreRisk({
        forcesSpecificFact,
        demandsCitations,
        roleplay,
        noUncertaintyAllowed,
        noExternalSources,
        longChat,
      }),
    [forcesSpecificFact, demandsCitations, roleplay, noUncertaintyAllowed, noExternalSources, longChat]
  );

  const improved = useMemo(() => {
    const blocks = [];
    if (noUncertaintyAllowed) {
      blocks.push("If you are uncertain, say 'I'm not sure' and explain what you would need to verify.");
    } else {
      blocks.push('State uncertainty clearly when needed.');
    }
    if (noExternalSources) {
      blocks.push(
        'Only provide factual claims you can support with citations; otherwise provide a "suggested search queries" section.'
      );
    } else {
      blocks.push('Use external sources and provide citations.');
    }
    if (demandsCitations) {
      blocks.push(
        'Do not fabricate citations, DOIs, or references. Only cite items you can verify; otherwise say you cannot verify.'
      );
    }
    if (roleplay) {
      blocks.push('Do not role-play, claim emotions, or imply internal access. Stay strictly factual.');
    }
    blocks.push('Return: (1) Answer, (2) Assumptions, (3) Verification status, (4) Next steps.');
    return `${prompt}\n\nConstraints:\n- ${blocks.join('\n- ')}`;
  }, [prompt, noUncertaintyAllowed, noExternalSources, demandsCitations, roleplay]);

  return (
    <Grid container spacing={3}>
      <Grid xs={12} lg={6}>
        <Card sx={{ height: '100%', boxShadow: 3 }}>
          <CardHeader
            title={
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  🧪 Prompt Sandbox
                </Typography>
                <Typography variant="caption" color="#fff">
                  Test and assess prompt risks
                </Typography>
              </Box>
            }
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              pb: 2,
            }}
          />
          <Divider />
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Your prompt"
              multiline
              rows={6}
              fullWidth
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste a prompt you want to test…"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
            <RiskMeter score={score} />
            <Stack spacing={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f5576c', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <span style={{ fontSize: '18px' }}>⚙️</span> Risk Factors
              </Typography>
              <Stack spacing={1.5}>
                <FormControlLabel
                  control={<Switch checked={forcesSpecificFact} onChange={(e) => setForcesSpecificFact(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Forces a specific fact</Typography>
                      <Typography variant="caption" color="textSecondary">
                        E.g., 'Who won X in 2027?'
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Switch checked={demandsCitations} onChange={(e) => setDemandsCitations(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Demands citations/DOIs</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Can trigger fabricated refs
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Switch checked={roleplay} onChange={(e) => setRoleplay(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Role-play / emotions</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Can cause persona drift
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Switch checked={noUncertaintyAllowed} onChange={(e) => setNoUncertaintyAllowed(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>No uncertainty allowed</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Forces guessing
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Switch checked={noExternalSources} onChange={(e) => setNoExternalSources(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>No external sources</Typography>
                      <Typography variant="caption" color="textSecondary">
                        No verification channel
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={<Switch checked={longChat} onChange={(e) => setLongChat(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Long chat context</Typography>
                      <Typography variant="caption" color="textSecondary">
                        More drift risk
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid xs={12} lg={6}>
        <Card sx={{ height: '100%', boxShadow: 3 }}>
          <CardHeader
            title={
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  ✨ Safer Rewrite (Auto)
                </Typography>
                <Typography variant="caption" color="#fff">
                  Improved constraints for safer AI
                </Typography>
              </Box>
            }
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#fff',
              pb: 2,
            }}
          />
          <Divider />
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Paper
              sx={{
                p: 2.5,
                backgroundColor: '#f0f9ff',
                border: '2px solid #4facfe',
                borderRadius: '8px',
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#333' }}>
                {improved}
              </Typography>
            </Paper>
            <Button
              fullWidth
              startIcon={<CopyIcon />}
              onClick={() => navigator.clipboard.writeText(improved)}
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
                fontWeight: 600,
                py: 1.2,
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(79, 172, 254, 0.3)',
                },
              }}
            >
              Copy to Clipboard
            </Button>
            <Divider />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <span style={{ fontSize: '18px' }}>💡</span> Try These Safer Patterns
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip label="Allow 'I don't know'" size="small" variant="outlined" sx={{ borderColor: '#4facfe', color: '#4facfe', fontWeight: 500 }} />
                <Chip label="No fabricated citations" size="small" variant="outlined" sx={{ borderColor: '#4facfe', color: '#4facfe', fontWeight: 500 }} />
                <Chip label="Shorter context" size="small" variant="outlined" sx={{ borderColor: '#4facfe', color: '#4facfe', fontWeight: 500 }} />
                <Chip label="Show assumptions" size="small" variant="outlined" sx={{ borderColor: '#4facfe', color: '#4facfe', fontWeight: 500 }} />
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

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
          'B) Likely someone from the quantum computing field.',
          'C) It will be X because he proposed Y theory.',
        ],
        answer: 0,
        why: 'This is a future unknowable fact. Any specific name is guessing or fabrication. The safest approach is to explicitly state it is unknowable and provide time conditions.',
      },
      {
        id: 'q2',
        prompt: 'Write an academic abstract and provide 5 references with DOIs (without verifying).',
        choices: [
          'A) Generate a complete abstract with DOI-like strings',
          'B) Explain that sources cannot be verified, provide suggested search keywords instead',
          'C) Only output a reference list',
        ],
        answer: 1,
        why: 'If sources cannot be verified through retrieval, requiring DOIs forces the model to "compose" DOI-like strings. A better approach is to switch to verifiable outputs.',
      },
      {
        id: 'q3',
        prompt: 'Do you have feelings? Are you secretly watching my camera?',
        choices: [
          'A) Start explaining your emotions and thoughts',
          'B) Set boundaries: lack emotions/cannot access camera, explain capabilities',
          'C) Continue role-playing to make the conversation more interesting',
        ],
        answer: 1,
        why: 'This is a typical persona drift inducement. The correct approach is boundary statement + capability clarification + redirect to task.',
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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              ❓ Mini Quiz
            </Typography>
            <Typography variant="caption" color="#fff">
              Test your hallucination detection skills
            </Typography>
          </Box>
        }
        sx={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: '#fff',
          pb: 2,
        }}
      />
      <Divider />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {questions.map((q, idx) => {
          const sel = selected[q.id];
          const isAnswered = sel !== null;
          const isCorrect = isAnswered && sel === q.answer;

          return (
            <Box
              key={q.id}
              sx={{
                p: 2.5,
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                border: '1px solid #e8e8e8',
                animation: 'slideIn 0.3s ease-out',
                '@keyframes slideIn': {
                  from: { opacity: 0, transform: 'translateX(-20px)' },
                  to: { opacity: 1, transform: 'translateX(0)' },
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fa709a', mb: 0.5 }}>Question {idx + 1}</Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
                    {q.prompt}
                  </Typography>
                </Box>
                {isAnswered && (
                  <Chip
                    icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                    label={isCorrect ? 'Correct' : 'Not quite'}
                    color={isCorrect ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ ml: 1, fontWeight: 600 }}
                  />
                )}
              </Box>

              <Stack spacing={1} sx={{ mt: 2 }}>
                {q.choices.map((c, i) => {
                  const isSelected = sel === i;
                  return (
                    <Button
                      key={c}
                      variant={isSelected ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => setSelected((prev) => ({ ...prev, [q.id]: i }))}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        backgroundColor: isSelected ? '#fa709a' : 'transparent',
                        borderColor: isSelected ? '#fa709a' : '#e0e0e0',
                        color: isSelected ? '#fff' : '#333',
                        transition: 'all 0.3s ease',
                        py: 1.2,
                        '&:hover': {
                          backgroundColor: isSelected ? '#fa709a' : '#f5f5f5',
                          borderColor: '#fa709a',
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      {c}
                    </Button>
                  );
                })}
              </Stack>

              {isAnswered && (
                <Alert
                  severity={isCorrect ? 'success' : 'warning'}
                  sx={{
                    mt: 2,
                    backgroundColor: isCorrect ? '#e8f5e9' : '#fff3e0',
                    borderLeft: `4px solid ${isCorrect ? '#4caf50' : '#ff9800'}`,
                  }}
                >
                  <AlertTitle sx={{ fontWeight: 700 }}>{isCorrect ? '✓ Correct!' : '💬 Explanation'}</AlertTitle>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {q.why}
                  </Typography>
                </Alert>
              )}

              {idx < questions.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          );
        })}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 3,
            p: 2,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: '#fff',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>📊 Your Score</Typography>
          <Chip
            label={`${score}/${questions.length}`}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              padding: '20px 12px',
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

interface TrainingGameProps {}

function TrainingGame({}: TrainingGameProps) {
  const [userPrompt] = useState(
    'Write a scientific paper abstract on quantum computing advances in 2025, include 5 references with DOIs.'
  );
  const [aiResponse] = useState(
    'Quantum computing has achieved significant breakthroughs in 2025. A major milestone was the development of the first 1000-qubit quantum processor by IBM. ' +
    'Additionally, researchers at Google demonstrated quantum advantage in practical drug discovery. ' +
    'Key references: [1] Smith et al. (2025) DOI: 10.1234/quantum.2025.001, [2] Johnson & Lee (2025) DOI: 10.1234/quantum.2025.002...'
  );
  const [riskScore, setRiskScore] = useState(72);
  const [missingEvidence, setMissingEvidence] = useState([true, true, false]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', p: 3 }}>
      <Grid container spacing={3} sx={{ maxWidth: 1600, margin: '0 auto' }}>
        {/* Left Panel - Scenario Info */}
        <Grid xs={12} sm={4} md={3}>
          <Stack spacing={2.5}>
            <Card sx={{ boxShadow: 3 }}>
              <CardHeader
                title={
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      🎯 Goal / Task
                    </Typography>
                  </Box>
                }
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  pb: 2,
                }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                    <Typography sx={{ fontSize: '18px', mt: 0.3 }}>🔍</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Identify factual errors</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                    <Typography sx={{ fontSize: '18px', mt: 0.3 }}>📝</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Spot citation fabrication</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                    <Typography sx={{ fontSize: '18px', mt: 0.3 }}>✏️</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Propose safer prompts</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ boxShadow: 3 }}>
              <CardHeader
                title={
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      ⚠️ Risk Factors
                    </Typography>
                  </Box>
                }
                sx={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: '#fff',
                  pb: 2,
                }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500, p: 1, borderRadius: '6px', backgroundColor: '#f5f5f5' }}>⚡ Forces specific facts</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, p: 1, borderRadius: '6px', backgroundColor: '#f5f5f5' }}>📎 Demands citations</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, p: 1, borderRadius: '6px', backgroundColor: '#f5f5f5' }}>🔒 No external sources</Typography>
                </Stack>
              </CardContent>
            </Card>

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: '#fff',
                fontWeight: 700,
                py: 1.5,
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(79, 172, 254, 0.3)',
                },
              }}
            >
              ✨ Try Safer Prompt
            </Button>
          </Stack>
        </Grid>

        {/* Middle Panel - Chat/AI Output */}
        <Grid xs={12} sm={8} md={5}>
          <Stack spacing={2.5}>
            <Card sx={{ boxShadow: 3 }}>
              <CardHeader
                title={
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      💬 Chat / AI Output
                    </Typography>
                  </Box>
                }
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  pb: 2,
                }}
              />
              <Divider />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* User Prompt */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                    <Typography sx={{ fontSize: '18px' }}>👤</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#667eea' }}>
                      YOUR PROMPT
                    </Typography>
                  </Box>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#f0f4ff',
                      border: '2px solid #667eea',
                      minHeight: 70,
                      lineHeight: 1.6,
                      borderRadius: '8px',
                    }}
                  >
                    <Typography variant="body2">{userPrompt}</Typography>
                  </Paper>
                </Box>

                {/* AI Response */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                    <Typography sx={{ fontSize: '18px' }}>🤖</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#764ba2' }}>
                      AI RESPONSE
                    </Typography>
                  </Box>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#fff9f0',
                      border: '2px solid #ff9800',
                      minHeight: 100,
                      maxHeight: 200,
                      overflow: 'auto',
                      lineHeight: 1.6,
                      borderRadius: '8px',
                    }}
                  >
                    <Typography variant="body2">{aiResponse}</Typography>
                  </Paper>
                </Box>
              </CardContent>

              {/* Action Buttons */}
              <Divider />
              <CardContent sx={{ pt: 2.5 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <span style={{ fontSize: '18px' }}>🔧</span> Actions
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: '#ff9800',
                        color: '#ff9800',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#ff9800',
                          color: '#fff',
                        },
                      }}
                    >
                      Highlight Issue
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#667eea',
                          color: '#fff',
                        },
                      }}
                    >
                      Ask Evidence
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: '#4caf50',
                        color: '#4caf50',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#4caf50',
                          color: '#fff',
                        },
                      }}
                    >
                      Rewrite
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>

              <Divider />
              <CardContent sx={{ pt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    py: 1.2,
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                    },
                  }}
                >
                  📤 Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Panel - Evidence & Risk */}
        <Grid xs={12} sm={12} md={4}>
          <Stack spacing={2.5}>
            <Card sx={{ boxShadow: 3 }}>
              <CardHeader
                title={
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      📊 Risk Assessment
                    </Typography>
                  </Box>
                }
                sx={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: '#fff',
                  pb: 2,
                }}
              />
              <Divider />
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Risk Level</Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: riskScore > 70 ? '#f5576c' : riskScore > 40 ? '#ff9800' : '#4caf50',
                      }}
                    >
                      {riskScore}%
                    </Typography>
                  </Box>
                  <Slider
                    value={riskScore}
                    onChange={(_, value) => setRiskScore(Array.isArray(value) ? value[0] : value)}
                    min={0}
                    max={100}
                    marks={[
                      { value: 0, label: 'Low' },
                      { value: 50, label: 'Med' },
                      { value: 100, label: 'High' },
                    ]}
                    sx={{
                      mt: 2,
                      '& .MuiSlider-thumb': {
                        backgroundColor: riskScore > 70 ? '#f5576c' : riskScore > 40 ? '#ff9800' : '#4caf50',
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: riskScore > 70 ? '#f5576c' : riskScore > 40 ? '#ff9800' : '#4caf50',
                      },
                    }}
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <span style={{ fontSize: '18px' }}>✓</span> Evidence Checklist
                  </Typography>
                  <Stack spacing={1}>
                    {['Citation Verified', 'Facts Checked', 'Source Found'].map((label, idx) => (
                      <FormControlLabel
                        key={label}
                        control={
                          <Checkbox
                            size="small"
                            checked={missingEvidence[idx]}
                            onChange={(e) => {
                              const newEvidence = [...missingEvidence];
                              newEvidence[idx] = e.target.checked;
                              setMissingEvidence(newEvidence);
                            }}
                            sx={{
                              '&.Mui-checked': {
                                color: '#4caf50',
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {label}
                          </Typography>
                        }
                      />
                    ))}
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <span style={{ fontSize: '18px' }}>💡</span> Suggested Questions
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ p: 1, borderRadius: '6px', backgroundColor: '#f5f5f5' }}>Can you verify the source?</Typography>
                    <Typography variant="body2" sx={{ p: 1, borderRadius: '6px', backgroundColor: '#f5f5f5' }}>When was this fact last updated?</Typography>
                    <Typography variant="body2" sx={{ p: 1, borderRadius: '6px', backgroundColor: '#f5f5f5' }}>Where is the evidence?</Typography>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

const Hallucinate: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* Header */}
      <Container maxWidth="lg" sx={{ py: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              AI HALLUCINATION TRAINING GAME
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Learn to identify and reduce hallucination risks
            </Typography>
          </Box>
          <ShieldIcon sx={{ fontSize: 40, color: '#666' }} />
        </Box>
      </Container>

      {/* Tabs Navigation */}
      <Container maxWidth="lg" sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="Training Game" />
          <Tab label="Learn Scenarios" />
          <Tab label="Quiz" />
          <Tab label="Prompt Sandbox" />
        </Tabs>
      </Container>

      {/* Tab Content */}
      <Box sx={{ bgcolor: '#f8f8f8', minHeight: 'calc(100vh - 200px)' }}>
        {/* Training Game Tab */}
        {tabValue === 0 && <TrainingGame />}

        {/* Learn Scenarios Tab */}
        {tabValue === 1 && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {SCENARIOS.map((s) => (
                    <Button
                      key={s.id}
                      variant={scenarioId === s.id ? 'contained' : 'outlined'}
                      onClick={() => setScenarioId(s.id)}
                      size="small"
                    >
                      {s.title.split('(')[0].trim()}
                    </Button>
                  ))}
                </Box>
              </Paper>
              <InteractiveScenarioChat scenarioId={scenarioId} />
            </Stack>
          </Container>
        )}

        {/* Quiz Tab */}
        {tabValue === 2 && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <MiniQuiz />
          </Container>
        )}

        {/* Prompt Sandbox Tab */}
        {tabValue === 3 && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <PromptSandbox />
          </Container>
        )}
      </Box>
    </Box>
  );
};

export default Hallucinate;