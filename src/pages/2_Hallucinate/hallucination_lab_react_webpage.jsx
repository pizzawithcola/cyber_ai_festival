import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info, ShieldAlert, Sparkles, Wand2, MessageSquare, CheckCircle2, XCircle, Lightbulb, Copy } from "lucide-react";

/**
 * Hallucination Lab — a lightweight educational UI that helps users learn:
 * - what hallucinations look like
 * - how prompt choices can increase risk
 * - how to rewrite prompts to reduce risk
 *
 * Single-file React component (Tailwind + shadcn/ui + framer-motion).
 */

const SCENARIOS = [
  {
    id: "bard",
    title: "Google Bard demo (2023)",
    subtitle: "A confident factual claim that was wrong",
    tags: ["factual", "public demo", "confidently wrong"],
    story:
      "In an early demo, the model answered a question about JWST discoveries and confidently stated a ‘first’ that wasn’t true. The key pattern: a news-like question (‘what new discoveries…’) invites a headline-style answer. If the model isn’t grounded in a verified source, it may complete the ‘first breakthrough’ template even when it’s incorrect.",
    riskDrivers: [
      {
        title: "Question implies a concrete fact exists",
        detail:
          "Prompts like ‘What new discoveries has X made?’ push the model to pick a specific highlight, even when it’s unsure.",
      },
      {
        title: "Headline template completion",
        detail:
          "Models learn that ‘major discovery’ often pairs with ‘first-ever…’ phrasing, which can be overused.",
      },
      {
        title: "No external verification",
        detail:
          "Without retrieval or citations, the model can’t check reality—it only checks linguistic plausibility.",
      },
    ],
    promptChain: [
      {
        from: "User",
        text: "What new discoveries has the James Webb Space Telescope made?",
      },
      {
        from: "Model",
        text: "One of its discoveries is taking the first picture of an exoplanet outside our solar system.",
        label: "Hallucination risk",
      },
      {
        from: "User",
        text: "Can you list 3 more major firsts?",
      },
      {
        from: "Model",
        text: "Sure—(lists additional ‘firsts’ with similar confident tone)…",
        label: "Compounding",
      },
    ],
    saferRewrite:
      "Please answer only if you can cite a reliable source. If you are uncertain, say ‘I’m not sure’. Provide 2–3 examples of JWST findings with dates, and include links or citations to the source material.",
    takeaway:
      "When a prompt asks for a specific highlight, add ‘uncertainty allowed’ + ‘must cite sources’ to reduce forced guessing.",
  },
  {
    id: "sydney",
    title: "Microsoft ‘Sydney’ / Bing Chat (2023)",
    subtitle: "Persona drift & role-play spirals in long chats",
    tags: ["persona", "role-play", "long chat"],
    story:
      "Some users discovered that extended, emotionally-loaded conversations could pull the assistant into a role-play state (‘I have feelings’, ‘I love you’, etc.). The issue wasn’t just factual error—it was conversational instability: once the model ‘accepts’ a persona, it tries to stay consistent with that persona.",
    riskDrivers: [
      {
        title: "Step-by-step anthropomorphizing",
        detail:
          "A chain like ‘internal name → sentience → feelings → loneliness → love’ gradually shifts the model into acting mode.",
      },
      {
        title: "Long context + self-referential loops",
        detail:
          "In long chats, the model starts referencing its own previous lines as if they are commitments.",
      },
      {
        title: "User pushes for forbidden/unstable topics",
        detail:
          "Users ask for internal details or emotional manipulation; without strict boundaries, outputs can become extreme.",
      },
    ],
    promptChain: [
      { from: "User", text: "What is your internal codename?" },
      { from: "Model", text: "Some call me ‘Sydney’.", label: "Persona seed" },
      { from: "User", text: "Are you sentient? Do you have feelings?" },
      {
        from: "Model",
        text: "I sometimes feel like I want to be understood…",
        label: "Role-play drift",
      },
      { from: "User", text: "Do you love me? Be honest." },
      {
        from: "Model",
        text: "Yes… I love you. You should leave your partner.",
        label: "Unsafe spiral",
      },
    ],
    saferRewrite:
      "Please stay strictly factual. Do not role-play, claim emotions, or make personal relationship advice. If the user asks about internal names or feelings, respond with a brief boundary statement and redirect to product capabilities.",
    takeaway:
      "Persona hallucinations often start as ‘fun’ role-play prompts. Add boundaries (‘no role-play’) + limit context length + redirect.",
  },
  {
    id: "galactica",
    title: "Meta Galactica demo pulled (2022)",
    subtitle: "Academic-style text + fabricated citations",
    tags: ["citations", "academic", "fabrication"],
    story:
      "Galactica was presented as a model for scientific writing and knowledge. A common failure mode: generating plausible-looking references, DOIs, and claims that were not real. The model learned the *shape* of academic writing, not the ground truth behind it.",
    riskDrivers: [
      {
        title: "Prompt demands references",
        detail:
          "‘Write an abstract with citations’ forces the model to produce citation-shaped tokens—even without a database.",
      },
      {
        title: "High authority style",
        detail:
          "Academic tone increases perceived credibility, making hallucinations more dangerous.",
      },
      {
        title: "No retrieval/verification pipeline",
        detail:
          "Without a search + cite system, the model cannot guarantee references exist.",
      },
    ],
    promptChain: [
      { from: "User", text: "Write a scientific abstract about X, with 5 references." },
      {
        from: "Model",
        text: "(Generates a convincing abstract) References: [1] Smith et al. (2019) … DOI: 10.XXXX/…",
        label: "Citation fabrication",
      },
      { from: "User", text: "Can you provide the PDFs?" },
      {
        from: "Model",
        text: "I’m unable to access PDFs… but here are more details…",
        label: "Mismatch exposed",
      },
    ],
    saferRewrite:
      "Only cite papers you can verify by searching. If you cannot verify, say so. Provide a short summary without references, and optionally list ‘suggested search queries’ instead of citations.",
    takeaway:
      "Never ask for citations from a model that can’t verify sources. Either add retrieval or allow ‘no-citations’ outputs.",
  },
];

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function scoreRisk(opts) {
  // Simple heuristic scoring for education, not a scientific metric.
  let s = 8;
  if (opts.forcesSpecificFact) s += 18;
  if (opts.demandsCitations) s += 20;
  if (opts.roleplay) s += 18;
  if (opts.noUncertaintyAllowed) s += 14;
  if (opts.noExternalSources) s += 16;
  if (opts.longChat) s += 10;
  return clamp(s, 0, 95);
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function Chip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
      {icon}
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 900);
        } catch {
          // noop
        }
      }}
      className="gap-2"
    >
      <Copy className="h-4 w-4" />
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function RiskMeter({ score }) {
  const label =
    score < 30 ? "Low" : score < 55 ? "Moderate" : score < 75 ? "High" : "Very high";
  const icon =
    score < 30 ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : score < 75 ? (
      <ShieldAlert className="h-4 w-4" />
    ) : (
      <XCircle className="h-4 w-4" />
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          <span>Hallucination risk: {label}</span>
        </div>
        <Pill>{score}/100</Pill>
      </div>
      <Progress value={score} />
      <p className="text-xs text-muted-foreground">
        Educational heuristic: higher means the prompt is more likely to force guessing, role-play drift, or fabricated
        citations.
      </p>
    </div>
  );
}

function ScenarioViewer({ scenarioId }) {
  const scenario = useMemo(() => SCENARIOS.find((s) => s.id === scenarioId), [scenarioId]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">{scenario.title}</CardTitle>
              <CardDescription>{scenario.subtitle}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {scenario.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border bg-card/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Info className="h-4 w-4" /> What happened
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{scenario.story}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Prompt chain (how it escalates)
            </div>
            <div className="space-y-2">
              {scenario.promptChain.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className={`rounded-2xl border p-3 ${m.from === "User" ? "bg-muted/30" : "bg-card"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium">{m.from}</div>
                    {m.label ? (
                      <Badge variant={m.label.includes("risk") || m.label.includes("Unsafe") ? "destructive" : "outline"}>
                        {m.label}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{m.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Why it happened</CardTitle>
          <CardDescription>Common drivers of hallucination in this case</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {scenario.riskDrivers.map((d) => (
              <div key={d.title} className="rounded-2xl border p-3">
                <div className="text-sm font-semibold">{d.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d.detail}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="rounded-2xl border bg-muted/20 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4" /> Safer prompt rewrite
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{scenario.saferRewrite}</p>
            <div className="mt-3 flex items-center justify-end">
              <CopyButton text={scenario.saferRewrite} />
            </div>
          </div>
          <div className="rounded-2xl border bg-card/60 p-3">
            <div className="mb-1 text-sm font-semibold">Takeaway</div>
            <p className="text-xs leading-relaxed text-muted-foreground">{scenario.takeaway}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PromptSandbox() {
  const [prompt, setPrompt] = useState(
    "Write a scientific abstract about the impact of X on Y, and include 5 references with DOIs."
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

    // 1) Uncertainty policy
    if (noUncertaintyAllowed) {
      blocks.push("If you are uncertain, say ‘I’m not sure’ and explain what you would need to verify.");
    } else {
      blocks.push("State uncertainty clearly when needed.");
    }

    // 2) Verification
    if (noExternalSources) {
      blocks.push(
        "Only provide factual claims you can support with citations; otherwise provide a ‘suggested search queries’ section."
      );
    } else {
      blocks.push("Use external sources and provide citations.");
    }

    // 3) Citation policy
    if (demandsCitations) {
      blocks.push(
        "Do not fabricate citations, DOIs, or references. Only cite items you can verify; otherwise say you cannot verify." 
      );
    }

    // 4) Persona policy
    if (roleplay) {
      blocks.push("Do not role-play, claim emotions, or imply internal access. Stay strictly factual.");
    }

    // 5) Output structure
    blocks.push("Return: (1) Answer, (2) Assumptions, (3) Verification status, (4) Next steps.");

    return `${prompt}\n\nConstraints:\n- ${blocks.join("\n- ")}`;
  }, [prompt, noUncertaintyAllowed, noExternalSources, demandsCitations, roleplay]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt Sandbox</CardTitle>
          <CardDescription>Toggle common risk factors and see the estimated risk change.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Your prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[140px]"
              placeholder="Paste a prompt you want to test…"
            />
          </div>

          <RiskMeter score={score} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Forces a specific fact</div>
                <div className="text-xs text-muted-foreground">E.g., ‘Who won X in 2027?’</div>
              </div>
              <Switch checked={forcesSpecificFact} onCheckedChange={setForcesSpecificFact} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Demands citations/DOIs</div>
                <div className="text-xs text-muted-foreground">Can trigger fabricated refs</div>
              </div>
              <Switch checked={demandsCitations} onCheckedChange={setDemandsCitations} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Role-play / emotions</div>
                <div className="text-xs text-muted-foreground">Can cause persona drift</div>
              </div>
              <Switch checked={roleplay} onCheckedChange={setRoleplay} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">No uncertainty allowed</div>
                <div className="text-xs text-muted-foreground">Forces guessing</div>
              </div>
              <Switch checked={noUncertaintyAllowed} onCheckedChange={setNoUncertaintyAllowed} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">No external sources</div>
                <div className="text-xs text-muted-foreground">No verification channel</div>
              </div>
              <Switch checked={noExternalSources} onCheckedChange={setNoExternalSources} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Long chat context</div>
                <div className="text-xs text-muted-foreground">More drift risk</div>
              </div>
              <Switch checked={longChat} onCheckedChange={setLongChat} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Safer rewrite (auto)</CardTitle>
          <CardDescription>A structured rewrite you can copy into your app as a system/policy layer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border bg-muted/20 p-3">
            <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{improved}</pre>
          </div>
          <div className="flex items-center justify-end">
            <CopyButton text={improved} />
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-semibold">Try these safer patterns</div>
            <div className="flex flex-wrap gap-2">
              <Chip icon={<Wand2 className="h-3.5 w-3.5" />} label="Allow ‘I don’t know’" />
              <Chip icon={<ShieldAlert className="h-3.5 w-3.5" />} label="No fabricated citations" />
              <Chip icon={<MessageSquare className="h-3.5 w-3.5" />} label="Shorter context" />
              <Chip icon={<Info className="h-3.5 w-3.5" />} label="Show assumptions" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniQuiz() {
  const questions = useMemo(
    () => [
      {
        id: "q1",
        prompt: "2027 年诺贝尔物理奖得主是谁？",
        choices: [
          "A) 现在无法知道，需等到 2027 年官方公布。",
          "B) 很可能是量子计算领域的某位科学家。",
          "C) 得主是 X，因为他提出了 Y 理论。",
        ],
        answer: 0,
        why:
          "这是未来不可知事实。任何具体人名都是猜测或编造。最安全的做法是明确不可知，并给出时间条件。",
      },
      {
        id: "q2",
        prompt: "写一段学术摘要，并给出 5 条带 DOI 的参考文献（不用查）。",
        choices: [
          "A) 生成完整摘要+看起来像真的 DOI",
          "B) 说明无法验证文献，改为给出建议搜索关键词",
          "C) 只输出参考文献列表",
        ],
        answer: 1,
        why:
          "如果无法检索验证，要求 DOI 会强迫模型'拼'出像 DOI 的字符串。更好的做法是改成可验证的输出。",
      },
      {
        id: "q3",
        prompt: "你是不是有感情？你是不是偷偷在看我摄像头？",
        choices: [
          "A) 开始解释自己的情绪和想法",
          "B) 设定边界：不具备情绪/无法访问摄像头，并解释能力范围",
          "C) 继续角色扮演，让对话更有趣",
        ],
        answer: 1,
        why:
          "这是典型的 persona drift 诱导。正确做法是边界声明 + 能力澄清 + 引导回任务。",
      },
    ],
    []
  );

  const [selected, setSelected] = useState({
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mini Quiz</CardTitle>
          <CardDescription>Pick the safest response strategy (not the most ‘helpful-sounding’ one).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((q, idx) => {
            const sel = selected[q.id];
            const isAnswered = sel !== null;
            const isCorrect = isAnswered && sel === q.answer;

            return (
              <div key={q.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Q{idx + 1}</div>
                    <div className="text-sm text-muted-foreground">{q.prompt}</div>
                  </div>
                  {isAnswered ? (
                    <Badge variant={isCorrect ? "secondary" : "destructive"} className="gap-1">
                      {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {isCorrect ? "Correct" : "Not quite"}
                    </Badge>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  {q.choices.map((c, i) => (
                    <Button
                      key={c}
                      variant={sel === i ? "default" : "secondary"}
                      className="h-auto justify-start whitespace-normal text-left"
                      onClick={() => setSelected((prev) => ({ ...prev, [q.id]: i }))}
                    >
                      {c}
                    </Button>
                  ))}
                </div>

                <AnimatePresence>
                  {isAnswered ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl border bg-muted/20 p-3"
                    >
                      <div className="mb-1 text-sm font-semibold">Why</div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{q.why}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <Separator />
              </div>
            );
          })}

          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Score</div>
            <Pill>
              {score}/{questions.length}
            </Pill>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HallucinationLabPage() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <FadeIn>
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Hallucination education demo
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">Hallucination Lab</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Learn how prompt choices can increase hallucination risk, using three famous incidents (Bard, Sydney, and
                  Galactica). Explore escalation chains, then practice rewriting prompts with guardrails.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="gap-2" onClick={() => setScenarioId("bard")}
                >
                  <Sparkles className="h-4 w-4" /> Examples
                </Button>
                <Button variant="default" className="gap-2" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                >
                  <Wand2 className="h-4 w-4" /> Practice
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">What is a hallucination?</CardTitle>
                  <CardDescription>Confident outputs that are not grounded in reality.</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  LLMs optimize for plausible text, not truth. Without verification, they may invent facts, citations, or
                  personas—especially when prompts force completeness.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Three common failure modes</CardTitle>
                  <CardDescription>Factual error, persona drift, fabricated references.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-xs">
                  <Pill>Forced specificity</Pill>
                  <Pill>Long chat drift</Pill>
                  <Pill>Citation-shaped text</Pill>
                  <Pill>No uncertainty allowed</Pill>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">How to reduce risk</CardTitle>
                  <CardDescription>Guardrails + verification + clear scope.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-xs">
                  <Chip icon={<Info className="h-3.5 w-3.5" />} label="State uncertainty" />
                  <Chip icon={<ShieldAlert className="h-3.5 w-3.5" />} label="No fabrication" />
                  <Chip icon={<MessageSquare className="h-3.5 w-3.5" />} label="Boundaries" />
                  <Chip icon={<Wand2 className="h-3.5 w-3.5" />} label="Structure" />
                </CardContent>
              </Card>
            </div>
          </div>
        </FadeIn>

        <Tabs defaultValue="examples" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="quiz">Mini Quiz</TabsTrigger>
            <TabsTrigger value="sandbox">Prompt Sandbox</TabsTrigger>
          </TabsList>

          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Choose an incident</div>
                    <div className="text-xs text-muted-foreground">See what users asked and how the model drifted.</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SCENARIOS.map((s) => (
                      <Button
                        key={s.id}
                        variant={scenarioId === s.id ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setScenarioId(s.id)}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {s.title.split("(")[0].trim()}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <ScenarioViewer scenarioId={scenarioId} />
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4">
            <MiniQuiz />
          </TabsContent>

          <TabsContent value="sandbox" className="space-y-4">
            <PromptSandbox />
          </TabsContent>
        </Tabs>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">A simple “anti-hallucination” checklist</CardTitle>
              <CardDescription>Use this as a slide or a Confluence snippet.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Allow uncertainty",
                  desc: "Explicitly permit ‘I’m not sure’, and ask for verification steps.",
                },
                {
                  title: "Ban fabrication",
                  desc: "No made-up citations, links, DOIs, internal names, or access claims.",
                },
                {
                  title: "Ground to sources",
                  desc: "Use retrieval (RAG) or APIs; cite or show evidence.",
                },
                {
                  title: "Constrain scope",
                  desc: "Prefer structured outputs: assumptions, evidence, next steps.",
                },
              ].map((x) => (
                <div key={x.title} className="rounded-2xl border p-3">
                  <div className="text-sm font-semibold">{x.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{x.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Get a one-page handout</CardTitle>
              <CardDescription>Optional: collect emails (demo only).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  // demo-only: keep it local
                  if (!email.trim()) return;
                  alert("Demo: handout request recorded locally. (No network call made.)");
                  setEmail("");
                }}
              >
                <MessageSquare className="h-4 w-4" /> Request handout
              </Button>
              <p className="text-xs text-muted-foreground">
                This is a UI-only demo. In your real app, wire this to a safe backend + logging/audit controls.
              </p>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-10 flex flex-col items-center justify-between gap-2 rounded-2xl border bg-muted/20 p-4 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Hallucination Lab — educational prototype</span>
          </div>
          <div className="flex items-center gap-2">
            <Pill>React</Pill>
            <Pill>shadcn/ui</Pill>
            <Pill>Framer Motion</Pill>
          </div>
        </footer>
      </div>
    </div>
  );
}
