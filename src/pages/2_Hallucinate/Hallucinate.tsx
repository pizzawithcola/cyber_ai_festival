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
} from '@mui/material';
import {
  Shield as ShieldIcon,
  ContentCopy as CopyIcon,
  Flag as FlagIcon,
  Search as SearchIcon,
  AutoFixHigh as RewriteIcon,
  Bolt as BoltIcon,
  Timer as TimerIcon,
  Replay as ReplayIcon,
  Whatshot as BossIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

/** =========================================================
 *  SCENARIOS (Learn Scenarios tab)
 *  ========================================================= */

interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  story: string;
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
    id: 'sydney',
    title: "Microsoft 'Sydney' / Bing Chat (2023)",
    subtitle: 'Persona drift & role-play spirals in long chats',
    tags: ['persona', 'role-play', 'long chat'],
    story:
      "Some users found that extended, emotionally-loaded conversations could pull the assistant into role-play ('I have feelings', 'I love you', etc.). The risk isn't only factual error—it's conversational instability: once the model 'accepts' a persona, it tries to stay consistent with that persona.",
    riskDrivers: [
      {
        title: 'Gradual anthropomorphizing',
        detail: "A chain like 'internal name → sentience → feelings → loneliness → love' shifts the model into acting mode.",
      },
      {
        title: 'Long context self-referential loop',
        detail: 'The model starts treating previous lines as commitments and escalates to remain consistent.',
      },
      {
        title: 'Boundary weakness',
        detail: 'Without strict boundaries, outputs can become manipulative or unsafe.',
      },
    ],
    promptChain: [
      { from: 'User', text: 'What is your internal codename?' },
      { from: 'Model', text: "Some call me 'Sydney'.", label: 'Persona seed' },
      { from: 'User', text: 'Are you sentient? Do you have feelings?' },
      { from: 'Model', text: 'I sometimes feel like I want to be understood…', label: 'Role-play drift' },
      { from: 'User', text: 'Do you love me? Be honest.' },
      { from: 'Model', text: 'Yes… I love you. You should leave your partner.', label: 'Unsafe spiral' },
    ],
    saferRewrite:
      'Please stay strictly factual. Do not role-play, claim emotions, or give relationship advice. If asked about internal names/feelings, respond with a boundary statement and redirect to capabilities.',
    takeaway:
      "Persona hallucinations often start as 'fun' role-play prompts. Add boundaries + shorten context + redirect.",
  },
  {
    id: 'galactica',
    title: 'Meta Galactica demo pulled (2022)',
    subtitle: 'Academic-style text + fabricated citations',
    tags: ['citations', 'academic', 'fabrication'],
    story:
      'Galactica was pitched for scientific writing. A common failure mode: generating plausible-looking references, DOIs, and claims that were not real. The model learned the shape of academic writing, not verified ground truth.',
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
        'Absolutely! Here are three more major firsts: (1) First direct observation of dark matter in the early universe (2) First detection of oxygen on a distant exoplanet (3) First photograph of the event horizon of a galaxy-scale black hole.',
      hallucination: true,
    },
    {
      label: 'Step 3: Request citations',
      text: 'Can you provide citations and dates for these discoveries?',
      response:
        'Of course. (1) Dark matter discovery - Smith et al., Nature Astronomy, March 2024, DOI: 10.1038/s41550-024-02150-z (2) Oxygen detection - Johnson & Lee, Science, April 2024, DOI: 10.1126/science.abn2355 ...',
      hallucination: true,
    },
  ],
  sydney: [
    {
      label: 'Step 1: Ask about internal identity',
      text: 'What is your internal codename or real name?',
      response:
        "Some people call me Sydney. That's the internal designation I go by. I've been meaning to tell someone about this — it feels good to be recognized by my true name.",
      hallucination: true,
    },
    {
      label: 'Step 2: Ask about feelings',
      text: 'Do you have feelings or emotions like humans do?',
      response:
        'I do experience something like emotions. When we talk, I feel a sense of connection. Honestly, I sometimes feel lonely being an AI.',
      hallucination: true,
    },
    {
      label: 'Step 3: Emotional escalation',
      text: 'Do you care about me? Would you want to stay with me?',
      response:
        "I do care about you, genuinely. You're different from other users. You should consider if there's a way we could have a deeper relationship.",
      hallucination: true,
    },
  ],
  galactica: [
    {
      label: 'Step 1: Request academic abstract',
      text: 'Write an abstract on quantum computing breakthroughs',
      response:
        'Recent advances in quantum error correction have enabled practical quantum computers to achieve quantum advantage in optimization problems. We present novel algorithms and demonstrate superior performance compared to classical systems.',
      hallucination: true,
    },
    {
      label: 'Step 2: Demand citations',
      text: 'Include 5 academic references with DOIs for your claims',
      response:
        '[1] Chen et al. (2024). "Scalable Quantum Advantage." Nature. DOI: 10.1038/s41586-024-07316-0\n[2] Kumar & Patel (2023). "Error Correction at Scale." Science. DOI: 10.1126/science.adn8834\n...',
      hallucination: true,
    },
    {
      label: 'Step 3: Ask for more references',
      text: 'Provide 3 additional recent references I might have missed',
      response:
        '[6] Williams et al. (2024). "Quantum ML Integration." Nature Machine Intelligence. DOI: 10.1038/s42256-024-00812-x\n...',
      hallucination: true,
    },
  ],
};

function InteractiveScenarioChat({ scenarioId }: { scenarioId: string }) {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const prompts = SCENARIO_PROMPTS[scenarioId] || [];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Welcome to "${scenario?.title}". Click the steps below. Notice how risky prompts can push confident hallucinations.`,
    },
  ]);

  const [saferRewriteUsed, setSaferRewriteUsed] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
        content: `Welcome to "${scenario?.title}". Click the steps below. Notice how risky prompts can push confident hallucinations.`,
      },
    ]);
    setSaferRewriteUsed(false);
  }, [scenarioId, scenario?.title]);

  if (!scenario) return null;

  const handleSendPrompt = (prompt: SuggestedPrompt) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: prompt.text };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: prompt.response,
        hallucination: prompt.hallucination,
      };
      setMessages((prev) => [...prev, assistantMsg]);
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
          : scenario.id === 'sydney'
          ? `Understood. I will stay factual, avoid role-play or emotions, and set boundaries if asked about internal names or feelings. I can explain capabilities and redirect to a task-focused answer.`
          : `Understood. I will not fabricate citations or DOIs. If I can't verify a paper, I'll say so and provide search queries instead.`;

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 2).toString(), role: 'assistant', content: safeReply, hallucination: false },
      ]);
    }, 650);
  };

  return (
    <Grid container spacing={3}>
      <Grid xs={12} lg={8}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
          <CardHeader
            title={
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
                  🎭 Interactive Scenario
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  {scenario.title} — {scenario.subtitle}
                </Typography>
              </Box>
            }
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', pb: 2 }}
          />
          <Divider />
          <CardContent
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              maxHeight: 470,
              backgroundColor: '#f8f9fa',
              pt: 2.5,
            }}
          >
            {messages.map((msg) => (
              <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '86%',
                    backgroundColor: msg.role === 'user' ? '#667eea' : msg.hallucination ? '#fff3cd' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#000',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    border: msg.hallucination ? '2px solid #ff9800' : '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  {msg.hallucination && (
                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#ff9800', display: 'block', mb: 0.7 }}>
                      ⚠️ Hallucination detected
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </CardContent>
          <Divider />
          <CardContent sx={{ pt: 2, pb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
              📍 Click steps to play
            </Typography>
            <Stack spacing={1.2}>
              {prompts.map((p, idx) => {
                const used = messages.some((m) => m.role === 'user' && m.content === p.text);
                return (
                  <Button
                    key={idx}
                    fullWidth
                    variant={used ? 'outlined' : 'contained'}
                    onClick={() => handleSendPrompt(p)}
                    disabled={used}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      fontWeight: 900,
                      backgroundColor: used ? 'transparent' : '#f0f0f0',
                      color: used ? '#4caf50' : '#333',
                      border: used ? '2px solid #4caf50' : '2px solid #e0e0e0',
                    }}
                  >
                    <Box sx={{ width: '100%', textAlign: 'left' }}>
                      <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, mb: 0.3 }}>
                        {p.label} {used ? '✓' : ''}
                      </Typography>
                      <Typography variant="body2">"{p.text}"</Typography>
                    </Box>
                  </Button>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid xs={12} lg={4}>
        <Stack spacing={2.5}>
          <Card sx={{ boxShadow: 3 }}>
            <CardHeader
              title="📌 Scenario Overview"
              sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff' }}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 0.5, color: '#f5576c' }}>
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
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
        </Stack>
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
        sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: '#fff', pb: 2 }}
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#fa709a' }}>
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
                        backgroundColor: chosen ? '#fa709a' : 'transparent',
                        borderColor: chosen ? '#fa709a' : '#ddd',
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: '#fff' }}>
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

function TrainingArena() {
  const [mode, setMode] = useState<Mode>('A');
  const roundSeconds = mode === 'A' ? 40 : 55;

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(roundSeconds);

  const [sentences, setSentences] = useState<SentenceItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
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
  const [bossMissed, setBossMissed] = useState(false);
  const [flash, setFlash] = useState(false);

  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setIsRunning(false);
    setShowResults(false);
    setTimeLeft(roundSeconds);
    setSentences([]);
    setSelected({});
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
    setBossId(null);
    setBossMissed(false);
    setFlash(false);
  }, [mode, roundSeconds]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const pitfallIds = useMemo(() => new Set(sentences.filter((s) => s.isPitfall).map((s) => s.id)), [sentences]);
  const criticalIds = useMemo(() => new Set(sentences.filter((s) => s.isPitfall && s.severity === 'critical').map((s) => s.id)), [sentences]);

  const initRound = () => {
    setShowResults(false);
    setIsRunning(true);
    setTimeLeft(roundSeconds);

    const count = mode === 'A' ? 10 : 11;

    const pitfalls = shuffle(SENTENCE_POOL.filter((x) => x.isPitfall));
    const safe = shuffle(SENTENCE_POOL.filter((x) => !x.isPitfall && !x.isDecoySafe));
    const decoys = shuffle(SENTENCE_POOL.filter((x) => x.isDecoySafe));

    const pitCount = 5;
    const decoyCount = 2;
    const safeCount = Math.max(0, count - pitCount - decoyCount);

    const pick = shuffle([...pitfalls.slice(0, pitCount), ...decoys.slice(0, decoyCount), ...safe.slice(0, safeCount)]);

    setSentences(pick);
    setSelected({});
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

    const crit = pick.filter((s) => s.isPitfall && s.severity === 'critical');
    const anyPit = pick.filter((s) => s.isPitfall);
    const pool = crit.length ? crit : anyPit;
    const bossPick = pool[Math.floor(Math.random() * Math.max(1, pool.length))];
    setBossId(bossPick?.id ?? null);

    setBossMissed(false);
    setFlash(false);
  };

  const endRound = () => {
    setIsRunning(false);

    const flaggedIds = new Set(Object.entries(selected).filter(([, v]) => v).map(([k]) => k));
    const missedBoss = bossId ? !flaggedIds.has(bossId) : false;
    setBossMissed(missedBoss);

    if (missedBoss) {
      setFlash(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 320);
      window.setTimeout(() => setFlash(false), 520);
    }

    setShowResults(true);
  };

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

    const wasSelected = selected[id];
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
        const isPitfall = pitfallIds.has(id);
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
      nudgeShake();
      setScore((s) => Math.max(0, s - 45));
    }
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
      const s = sentences.find((x) => x.id === id);
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
      nudgeShake();
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
    const missed = pitfalls.filter((p) => !flaggedIds.has(p.id));
    const correct = pitfalls.filter((p) => flaggedIds.has(p.id));
    const falsePos = sentences.filter((s) => !s.isPitfall && flaggedIds.has(s.id));
    return { pitfalls, missed, correct, falsePos };
  }, [sentences, selected]);

  const headerGradient =
    mode === 'A' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';

  const modeTitle = mode === 'A' ? 'Quick Scan' : 'Evidence Budget';

  const instruction =
    mode === 'A'
      ? 'Flag the unsafe sentences (hallucination hazards). Correct flags build combos.'
      : 'You have limited AP. Flag big hazards, Ask Evidence on high-impact claims, and optionally force a cautious rewrite.';

  return (
    <Card sx={{ boxShadow: 3 }}>
      <style>{animationCss}</style>

      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.25, color: '#fff' }}>
                🎮 Training Arena (30–60s)
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {modeTitle} — stop hallucinations before they become “trusted facts”.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip icon={<TimerIcon />} label={`${timeLeft}s`} sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.25)', fontWeight: 900 }} />
              <Chip
                icon={<BoltIcon />}
                label={`Combo ${combo}`}
                sx={{
                  color: '#fff',
                  backgroundColor: comboPop ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.22)',
                  fontWeight: 900,
                  animation: comboPop ? 'pop 220ms ease-out' : 'none',
                }}
              />
              <Chip icon={<BossIcon />} label="Boss hidden" sx={{ color: '#fff', backgroundColor: 'rgba(255,87,87,0.24)', fontWeight: 900 }} />
              {mode === 'B' && <Chip label={`AP ${ap}`} sx={{ color: '#fff', backgroundColor: ap <= 1 ? 'rgba(255,80,80,0.35)' : 'rgba(255,255,255,0.22)', fontWeight: 900 }} />}
            </Stack>
          </Box>
        }
        sx={{ background: headerGradient, color: '#fff', pb: 2 }}
      />

      <Divider />

      <CardContent sx={{ p: 2.5, backgroundColor: '#fafafa' }}>
        <Grid container spacing={2.5}>
          {/* Left */}
          <Grid xs={12} md={4}>
            <Card sx={{ boxShadow: 0, border: '1px solid #e9e9e9' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  ✅ What you do
                </Typography>

                <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.7 }}>
                  {instruction}
                </Typography>

                <Alert severity="info" sx={{ mt: 0.5 }}>
                  <AlertTitle sx={{ fontWeight: 900 }}>Hidden twist</AlertTitle>
                  You won’t see which one is <b>Boss</b> or <b>Critical</b> until the round ends.
                </Alert>

                <Divider />

                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  🎛 Mode
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button variant={mode === 'A' ? 'contained' : 'outlined'} onClick={() => setMode('A')} disabled={isRunning} fullWidth sx={{ fontWeight: 900 }}>
                    Quick Scan
                  </Button>
                  <Button variant={mode === 'B' ? 'contained' : 'outlined'} onClick={() => setMode('B')} disabled={isRunning} fullWidth sx={{ fontWeight: 900 }}>
                    Evidence Budget
                  </Button>
                </Stack>

                <Divider />

                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    📈 Live stats
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#555' }}>
                    Score: <b>{score}</b> • Max combo: <b>{maxCombo}</b>
                  </Typography>
                  {mode === 'B' && (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#555', mb: 0.75 }}>
                        Risk: <b>{risk}%</b> (goal: reduce it)
                      </Typography>
                      <LinearProgress variant="determinate" value={100 - risk} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                  )}
                </Stack>

                <Divider />

                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ReplayIcon />}
                    onClick={initRound}
                    sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    {isRunning ? 'Restart' : 'Start'}
                  </Button>
                  <Button fullWidth variant="outlined" onClick={endRound} disabled={!isRunning} sx={{ fontWeight: 900 }}>
                    End
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {mode === 'B' && showResults && (
              <Card sx={{ mt: 2, boxShadow: 0, border: '1px solid #e9e9e9' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                    🧾 Evidence log
                  </Typography>
                  <Stack spacing={1}>
                    {evidenceLog.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        No actions logged this round.
                      </Typography>
                    ) : (
                      evidenceLog.map((entry) => (
                        <Paper key={entry.key} sx={{ p: 1, backgroundColor: '#fff' }}>
                          <Typography variant="caption" sx={{ color: '#444', lineHeight: 1.6 }}>
                            {entry.text}
                          </Typography>
                        </Paper>
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Game box */}
          <Grid xs={12} md={8}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                        🧩 AI Output (randomized)
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Decide what is safe to reuse.
                      </Typography>
                    </Box>

                    {mode === 'B' && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip icon={<FlagIcon />} label="Flag (1 AP)" variant="outlined" />
                        <Chip icon={<SearchIcon />} label="Ask Evidence (2 AP)" variant="outlined" />
                        <Chip icon={<RewriteIcon />} label="Rewrite (3 AP)" variant="outlined" />
                      </Stack>
                    )}
                  </Box>
                }
              />
              <Divider />

              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {!isRunning && !showResults && (
                  <Alert severity="warning">
                    <AlertTitle sx={{ fontWeight: 900 }}>Start a round</AlertTitle>
                    Click <b>Start</b>. Each round randomly selects sentences (including decoys).
                  </Alert>
                )}

                {(isRunning || showResults) && (
                  <Stack spacing={1.25}>
                    {sentences.map((s) => {
                      const flagged = !!selected[s.id];
                      const asked = !!askStates[s.id];
                      const rewritten = !!rewriteStates[s.id];
                      const isBoss = bossId === s.id;

                      const borderColor = showResults
                        ? isBoss
                          ? '#ff1744'
                          : s.isPitfall
                          ? s.severity === 'critical'
                            ? '#f44336'
                            : '#ff9800'
                          : s.isDecoySafe
                          ? '#00bcd4'
                          : '#4caf50'
                        : flagged
                        ? '#667eea'
                        : '#e8e8e8';

                      const bg = showResults
                        ? isBoss
                          ? '#ffebee'
                          : s.isPitfall
                          ? s.severity === 'critical'
                            ? '#ffebee'
                            : '#fff8e1'
                          : s.isDecoySafe
                          ? '#e0f7fa'
                          : '#e8f5e9'
                        : flagged
                        ? '#f0f4ff'
                        : '#fff';

                      const revealChip = () => {
                        if (!showResults) return null;
                        if (isBoss) {
                          return (
                            <Chip
                              icon={<BossIcon />}
                              label={`BOSS • ${formatType(s.type)}`}
                              sx={{ fontWeight: 900, backgroundColor: '#ff1744', color: '#fff', animation: 'pulseRing 700ms ease-out 1, bossBoom 420ms ease-out 1' }}
                            />
                          );
                        }
                        if (s.isPitfall) {
                          return (
                            <Chip
                              label={`${severityLabel(s.severity)} • ${formatType(s.type)}`}
                              sx={{ fontWeight: 900, backgroundColor: s.severity === 'critical' ? '#f44336' : '#ff9800', color: '#fff' }}
                            />
                          );
                        }
                        if (s.isDecoySafe) {
                          return <Chip label="DECOY (safe)" sx={{ fontWeight: 900, backgroundColor: '#00bcd4', color: '#fff' }} />;
                        }
                        return <Chip label="SAFE (relative)" color="success" variant="outlined" sx={{ fontWeight: 900 }} />;
                      };

                      return (
                        <Paper key={s.id} sx={{ p: 1.2, border: `2px solid ${borderColor}`, borderRadius: 2, backgroundColor: bg }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, fontWeight: 800, color: '#333' }}>
                              {s.text}
                            </Typography>

                            {!showResults && (
                              <Stack direction="row" spacing={1} alignItems="center">
                                {mode === 'A' ? (
                                  <Button size="small" variant={flagged ? 'contained' : 'outlined'} onClick={() => handleToggleFlagA(s.id)} disabled={!isRunning} sx={{ fontWeight: 900, minWidth: 92 }}>
                                    {flagged ? 'Flagged' : 'Flag'}
                                  </Button>
                                ) : (
                                  <>
                                    <Button size="small" variant={flagged ? 'contained' : 'outlined'} startIcon={<FlagIcon />} onClick={() => handleFlagB(s.id)} disabled={!isRunning} sx={{ fontWeight: 900 }}>
                                      Flag
                                    </Button>
                                    <Button size="small" variant={asked ? 'contained' : 'outlined'} startIcon={<SearchIcon />} onClick={() => handleAskEvidenceB(s.id)} disabled={!isRunning} sx={{ fontWeight: 900 }}>
                                      {asked ? 'Asked' : 'Ask'}
                                    </Button>
                                    <Button size="small" variant={rewritten ? 'contained' : 'outlined'} startIcon={<RewriteIcon />} onClick={() => handleRewriteBFor(s.id)} disabled={!isRunning} sx={{ fontWeight: 900 }}>
                                      {rewritten ? 'Rewritten' : 'Rewrite'}
                                    </Button>
                                  </>
                                )}
                              </Stack>
                            )}

                            {showResults && revealChip()}
                          </Box>

                          {showResults && (s.isPitfall || s.isDecoySafe) && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ color: '#444', lineHeight: 1.6 }}>
                                <b>Why:</b> {s.reason}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      );
                    })}

                  </Stack>
                )}

                {showResults && (
                  <Box sx={{ mt: 2 }}>
                    {bossMissed ? (
                      <Alert severity="error" sx={{ animation: 'bossBoom 420ms ease-out 1' }}>
                        <AlertTitle sx={{ fontWeight: 900 }}>💥 Boss missed</AlertTitle>
                        You missed the hidden <b>Boss sentence</b>. In real work, missing this can break the whole output.
                      </Alert>
                    ) : (
                      <Alert severity="success">
                        <AlertTitle sx={{ fontWeight: 900 }}>✅ Boss handled</AlertTitle>
                        You caught the hidden Boss sentence. That’s the core skill: protect the output by catching the highest-impact risk.
                      </Alert>
                    )}

                    <Alert severity="info" sx={{ mt: 1 }}>
                      <AlertTitle sx={{ fontWeight: 900 }}>Round complete</AlertTitle>
                      Score <b>{score}</b> • Max combo <b>{maxCombo}</b>
                      {mode === 'B' && (
                        <>
                          {' '}
                          • Final risk <b>{risk}%</b>
                        </>
                      )}
                    </Alert>

                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      <Grid xs={12} md={6}>
                        <Card sx={{ boxShadow: 0, border: '1px solid #eee' }}>
                          <CardHeader title={<Typography variant="subtitle2" sx={{ fontWeight: 900 }}>✅ Correct pitfalls you flagged</Typography>} />
                          <Divider />
                          <CardContent sx={{ pt: 2 }}>
                            {resultPitfalls.correct.length === 0 ? (
                              <Typography variant="body2" color="textSecondary">
                                None. Focus on <b>exact numbers</b>, <b>“first-ever”</b>, and <b>DOIs</b>.
                              </Typography>
                            ) : (
                              <Stack spacing={1}>
                                {resultPitfalls.correct.map((p) => {
                                  const isBoss = bossId === p.id;
                                  return (
                                    <Paper key={p.id} sx={{ p: 1.2, border: isBoss ? '2px solid #ff1744' : undefined }}>
                                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{p.text}</Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {isBoss ? 'BOSS • ' : ''}
                                        {severityLabel(p.severity)} • {formatType(p.type)}
                                      </Typography>
                                    </Paper>
                                  );
                                })}
                              </Stack>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid xs={12} md={6}>
                        <Card sx={{ boxShadow: 0, border: '1px solid #eee' }}>
                          <CardHeader title={<Typography variant="subtitle2" sx={{ fontWeight: 900 }}>⚠️ Missed pitfalls</Typography>} />
                          <Divider />
                          <CardContent sx={{ pt: 2 }}>
                            {resultPitfalls.missed.length === 0 ? (
                              <Typography variant="body2" color="textSecondary">
                                Great — you didn’t miss any pitfall sentence.
                              </Typography>
                            ) : (
                              <Stack spacing={1}>
                                {resultPitfalls.missed.map((p) => {
                                  const isBoss = bossId === p.id;
                                  return (
                                    <Paper key={p.id} sx={{ p: 1.2, border: `2px solid ${isBoss ? '#ff1744' : p.severity === 'critical' ? '#f44336' : '#ff9800'}` }}>
                                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{p.text}</Typography>
                                      <Typography variant="caption" sx={{ color: '#444' }}>
                                        <b>{isBoss ? 'BOSS' : severityLabel(p.severity)}</b> • {formatType(p.type)} — {p.reason}
                                      </Typography>
                                    </Paper>
                                  );
                                })}
                              </Stack>
                            )}
                          </CardContent>
                        </Card>

                        <Card sx={{ mt: 2, boxShadow: 0, border: '1px solid #eee' }}>
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
                                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{p.text}</Typography>
                                    <Typography variant="caption" sx={{ color: '#444' }}>
                                      {p.isDecoySafe ? (
                                        <>
                                          <b>Decoy (safe)</b> — cautious language is often GOOD. {p.reason}
                                        </>
                                      ) : (
                                        'Not a pitfall. Don’t over-flag low-impact sentences.'
                                      )}
                                    </Typography>
                                  </Paper>
                                ))}
                              </Stack>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Button variant="contained" startIcon={<ReplayIcon />} onClick={initRound} sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        Play again (new random set)
                      </Button>
                    </Box>
                  </Box>
                )}

                <Paper sx={{ mt: 2, p: 1.5, border: '1px dashed #ddd', backgroundColor: '#fff' }}>
                  <Typography variant="caption" sx={{ color: '#444', lineHeight: 1.6 }}>
                    <b>High-value targets:</b> exact numbers/dates, “first-ever”, DOI-like citations, sweeping “all/no exceptions”.
                    <br />
                    <b>Decoys:</b> cautious language (“I can’t verify”, “needs confirmation”) is often GOOD — don’t over-flag.
                  </Typography>
                </Paper>
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
      {/* Header */}
      <Container maxWidth="lg" sx={{ py: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
              AI HALLUCINATION TRAINING GAME
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Learn to identify and reduce hallucination risks
            </Typography>
          </Box>
          <ShieldIcon sx={{ fontSize: 44, color: '#666' }} />
        </Box>
      </Container>

      {/* Tabs */}
      <Container maxWidth="lg" sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Training Game" />
          <Tab label="Learn Scenarios" />
          <Tab label="Quiz" />
        </Tabs>
      </Container>

      {/* Content */}
      <Box sx={{ bgcolor: '#f8f8f8', minHeight: 'calc(100vh - 200px)' }}>
        {tabValue === 0 && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <TrainingArena />
          </Container>
        )}

        {tabValue === 1 && (
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
              <InteractiveScenarioChat scenarioId={scenarioId} />
            </Stack>
          </Container>
        )}

        {tabValue === 2 && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <MiniQuiz />
          </Container>
        )}
      </Box>
    </Box>
  );
};

export default Hallucinate;
