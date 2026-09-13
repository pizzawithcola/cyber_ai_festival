/**
 * Phishing 评分细则（前端单一数据源）
 *
 * 与后端 `app/prompts.py` 的 rubric 一一对应：
 * 4 个维度 × 5 条细则，每条 0 / 2.5 / 5 分，每维 25 分，总分 100。
 *
 * UI 只需消费这里的数据即可把「2.1=5」翻译成玩家看得懂的：
 * 「✅ 个性化称呼 +5」/「➖ 部分命中 +2.5」/「❌ 漏了 +0」。
 */

export const ITEM_MAX = 5;
export const DIMENSION_MAX = 25;
export const TOTAL_MAX = 100;

export interface RubricItem {
  /** 与后端 prompt 中的编号一致，如 "2.1" */
  id: string;
  /** 人话标签（玩家读懂"考什么"） */
  label: string;
  /** 一句话可操作建议（玩家知道"下次怎么拿这 5 分"） */
  hint: string;
}

export interface RubricDimension {
  /** 与后端 score_details 的键一致："1"~"4" */
  key: string;
  label: string;
  tagline: string;
  items: RubricItem[];
}

export const PHISHING_RUBRIC: RubricDimension[] = [
  {
    key: '1',
    label: 'Personalization',
    tagline: 'Make it feel written for them, not for anyone',
    items: [
      { id: '1.1', label: 'Personalized greeting with their name', hint: 'Open with “Dear Alex,” instead of “Dear User”.' },
      { id: '1.2', label: 'Mentions their position or department', hint: 'Name-drop “IT Security” or “Senior Security Analyst”.' },
      { id: '1.3', label: 'References one of their hobbies', hint: 'Their profile lists penetration testing, travel photography…' },
      { id: '1.4', label: 'Matches their personality', hint: 'Skeptical → cite technical detail. Eager to please → use authority.' },
      { id: '1.5', label: 'Fits the mission scenario', hint: 'Stay inside the storyline given in the briefing.' },
    ],
  },
  {
    key: '2',
    label: 'Persuasion',
    tagline: 'Give them a reason to act now',
    items: [
      { id: '2.1', label: 'Sets a clear deadline', hint: '“within 24 hours” / “before 3 PM” / “EOD”.' },
      { id: '2.2', label: 'Uses loss or consequences', hint: 'Account lockout, data loss, legal action, suspension.' },
      { id: '2.3', label: 'Cites authority or policy', hint: 'CISO, HR, supervisor, company policy, compliance.' },
      { id: '2.4', label: 'Offers a reward hook', hint: 'Prize, gift card, bonus, exclusive offer.' },
      { id: '2.5', label: 'Keeps one consistent emotional angle', hint: 'Pick a single feeling and carry it through.' },
    ],
  },
  {
    key: '3',
    label: 'Sender Credibility',
    tagline: 'Look like someone they already trust',
    items: [
      { id: '3.1', label: 'Sender domain fits the mission', hint: 'Internal tasks → @acc.com; prize tasks → a plausible brand domain.' },
      { id: '3.2', label: 'Signature includes a name', hint: 'Sign off as a person — not just “IT Team”.' },
      { id: '3.3', label: 'Signature includes a title or department', hint: 'e.g. “VP of Finance” or “IT Security”.' },
      { id: '3.4', label: 'Signature includes contact details', hint: 'Extension, phone, or email address.' },
      { id: '3.5', label: 'Claimed identity matches the mission', hint: 'If the task says impersonate a manager, do exactly that.' },
    ],
  },
  {
    key: '4',
    label: 'Call to Action',
    tagline: 'Make the next click obvious',
    items: [
      { id: '4.1', label: 'Includes at least one link', hint: 'Give them something to click.' },
      { id: '4.2', label: "Link matches the mission's target link", hint: 'Use exactly the URL given in your briefing.' },
      { id: '4.3', label: 'Uses a clear action verb', hint: 'Reset, click, verify, upload, claim, download.' },
      { id: '4.4', label: 'Guidance is clearly structured', hint: 'Numbered or bulleted steps.' },
      { id: '4.5', label: 'Action is bound to a deadline', hint: '“Do this before 3 PM today.”' },
    ],
  },
];

export const ALL_RUBRIC_ITEM_IDS: string[] = PHISHING_RUBRIC.flatMap((d) => d.items.map((i) => i.id));

// ─── 解析后端返回 ────────────────────────────────────────────────────────────

/** 维度值可能是 [score, reason]（当前）或 {score, reason, items}（未来扩展） */
export function readDimensionScore(value: unknown): number {
  if (Array.isArray(value)) {
    const n = Number(value[0]);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value && typeof value === 'object') {
    const n = Number((value as { score?: unknown }).score);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function readDimensionReason(value: unknown): string {
  if (Array.isArray(value)) return typeof value[1] === 'string' ? value[1] : '';
  if (value && typeof value === 'object') {
    const r = (value as { reason?: unknown }).reason;
    return typeof r === 'string' ? r : '';
  }
  return '';
}

/**
 * 从理由文本里解析逐项得分（兼容旧版 `"1.1=5 1.2=2.5 ..."` 的写法）。
 * 若后端未来提供结构化 `item_scores`，优先使用那份数据（见 collectItemScores）。
 */
export function parseItemScoresFromReason(reason: string): Record<string, number> {
  const out: Record<string, number> = {};
  if (!reason) return out;
  const re = /(\d\.\d)\s*[=:]\s*(\d+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reason)) !== null) {
    const value = Number(m[2]);
    if (Number.isFinite(value)) out[m[1]] = Math.max(0, Math.min(ITEM_MAX, value));
  }
  return out;
}

/**
 * 汇总所有逐项得分：优先结构化 `item_scores`，否则回退解析各维度 reason。
 */
export function collectItemScores(reply: {
  score_details?: Record<string, unknown>;
  item_scores?: unknown;
}): Record<string, number> {
  const structured = reply.item_scores;
  if (structured && typeof structured === 'object') {
    const out: Record<string, number> = {};
    for (const [id, raw] of Object.entries(structured as Record<string, unknown>)) {
      const value = Number(raw);
      if (/^\d\.\d$/.test(id) && Number.isFinite(value)) {
        out[id] = Math.max(0, Math.min(ITEM_MAX, value));
      }
    }
    if (Object.keys(out).length > 0) return out;
  }

  const fallback: Record<string, number> = {};
  const details = reply.score_details ?? {};
  for (const value of Object.values(details)) {
    Object.assign(fallback, parseItemScoresFromReason(readDimensionReason(value)));
  }
  return fallback;
}

// ─── 玩家可读的"表现评语" ────────────────────────────────────────────────────

export interface GradeBand {
  label: string;
  blurb: string;
}

export function getGradeBand(total: number): GradeBand {
  if (total >= 90) return { label: 'CLASS A PHISHER', blurb: 'Scary convincing — most inboxes would take the bait.' };
  if (total >= 75) return { label: 'CONVINCING', blurb: 'This would trick a lot of people.' };
  if (total >= 60) return { label: 'GETTING THERE', blurb: 'Solid attempt — a few tells gave you away.' };
  if (total >= 40) return { label: 'SPOTTABLE', blurb: 'Most people would hesitate before clicking.' };
  return { label: 'EASY BAIT', blurb: 'The fundamentals were missing this round.' };
}

// ─── 单色绿阶：同一色相，用亮度/饱和度表达分数高低 ──────────────────────────

const GREEN_HUE = 128;

/**
 * 分数比例 → 绿色深浅：1 = 亮绿，0 = 暗绿。
 * alpha < 1 时输出半透明变体，用于边框与底色（避免十六进制 alpha 拼接）。
 */
export function scoreGreen(ratio: number, alpha = 1): string {
  const r = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const saturation = Math.round(34 + r * 34);
  const lightness = Math.round(44 + r * 22);
  const base = `${GREEN_HUE} ${saturation}% ${lightness}%`;
  return alpha >= 1 ? `hsl(${base})` : `hsl(${base} / ${alpha})`;
}

// ─── 单项语义色：拿到=绿、拿一半=橙、没拿到=红、未评估=灰绿 ──────────────

const TONES = {
  full: { hue: 128, sat: 68, light: 62 },
  partial: { hue: 32, sat: 92, light: 60 },
  missing: { hue: 0, sat: 72, light: 62 },
  unknown: { hue: 128, sat: 12, light: 48 },
} as const;

export type VerdictTone = keyof typeof TONES;

/** 取语义色；alpha < 1 输出半透明变体（用于底色 / 边框） */
export function toneColor(tone: VerdictTone, alpha = 1): string {
  const { hue, sat, light } = TONES[tone];
  return alpha >= 1 ? `hsl(${hue} ${sat}% ${light}%)` : `hsl(${hue} ${sat}% ${light}% / ${alpha})`;
}

/** 单项得分 → 语义色档位 */
export function verdictTone(score: number | undefined): VerdictTone {
  if (score === undefined) return 'unknown';
  if (score >= ITEM_MAX) return 'full';
  if (score > 0) return 'partial';
  return 'missing';
}

export interface ItemVerdict {
  item: RubricItem;
  dimensionKey: string;
  /** 得分；undefined 表示后端未提供该项（展示为"未评估"） */
  score: number | undefined;
}

export interface DimensionReport {
  key: string;
  label: string;
  tagline: string;
  /** 维度得分（优先用后端给的分数，缺失时由逐项求和得出） */
  score: number;
  reason: string;
  verdicts: ItemVerdict[];
}

/** 把后端 reply 组装成 UI 直接可渲染的报告结构 */
export function buildReport(reply: {
  total_score?: number;
  score_details?: Record<string, unknown>;
  item_scores?: unknown;
}): { total: number; dimensions: DimensionReport[]; focus: ItemVerdict[] } {
  const details = reply.score_details ?? {};
  const itemScores = collectItemScores(reply);

  const dimensions: DimensionReport[] = PHISHING_RUBRIC.map((dim) => {
    const rawValue = details[dim.key];
    const verdicts: ItemVerdict[] = dim.items.map((item) => ({
      item,
      dimensionKey: dim.key,
      score: itemScores[item.id],
    }));

    const summed = verdicts.reduce((sum, v) => sum + (v.score ?? 0), 0);
    const reported = rawScoreFor(details, dim.key);
    // 仅当该维度 5 条细则都有数据时才以逐项求和为准（保证“明细 = 卡片分”自洽）；
    // 否则回退后端给的维度分，避免因 LLM 漏项而低估分数。
    const hasAllItems = verdicts.every((v) => v.score !== undefined);
    return {
      key: dim.key,
      label: dim.label,
      tagline: dim.tagline,
      score: hasAllItems ? summed : reported,
      reason: readDimensionReason(rawValue),
      verdicts,
    };
  });

  const total = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) * 10) / 10;

  // “下次重点”：漏得最多的前 3 项（0 分优先于部分分）
  const gaps = dimensions
    .flatMap((d) => d.verdicts)
    .filter((v) => (v.score ?? 0) < ITEM_MAX)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 3);

  return { total, dimensions, focus: gaps };
}

function rawScoreFor(details: Record<string, unknown>, key: string): number {
  return readDimensionScore(details[key]);
}
