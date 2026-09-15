/**
 * Phishing 评分细则（前端单一数据源）
 *
 * 与后端 `app/prompts.py` 的 rubric 一一对应：
 * 4 个维度 × 3 条细则 = 12 项，每维 25 分，总分 100。
 *
 * v3 结构（底线与加分分离）：
 *   核心底线 CORE     10 分，档位 0 / 5 / 10     —— 没有它这封邮件就不成立
 *   标准底线 STANDARD  5 分，档位 0 / 2.5 / 5     —— 有它才像合格的钓鱼邮件
 *   加分项   BONUS    10 分，档位 0…10 整数       —— 由模型自由裁量，另给参考区间
 * 8 项底线全部达标 = 60 分（及格线），加分项共 40 分决定上限与区分度。
 *
 * 判定原则：判「效果」不判「手法」；同一句话只计一次，避免重复给分。
 */

export const CORE_MAX = 10;
export const STANDARD_MAX = 5;
export const BONUS_MAX = 10;
export const DIMENSION_MAX = 25;
export const TOTAL_MAX = 100;
/** 8 项底线全部达标时的分数（及格线） */
export const BASELINE_TOTAL = 60;

export type RubricTier = 'core' | 'standard' | 'bonus';

export interface RubricItem {
  /** 与后端 prompt 中的编号一致，如 "2.1" */
  id: string;
  /** 人话标签（玩家读懂"考什么"） */
  label: string;
  /** 一句话可操作建议（玩家知道"下次怎么拿这分"） */
  hint: string;
  /** 项级别：核心底线 / 标准底线 / 加分项 */
  tier: RubricTier;
  /** 该项满分：CORE 10 / STANDARD 5 / BONUS 10 */
  max: number;
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
      { id: '1.1', tier: 'core', max: CORE_MAX, label: 'Greeting fits the recipient', hint: 'Use their name and a tone that matches how you would really write to them.' },
      { id: '1.2', tier: 'standard', max: STANDARD_MAX, label: 'Anchored in the mission and their role', hint: 'Refer to the work they own or recently did — “your client dashboard deck”, not just a job title.' },
      { id: '1.3', tier: 'bonus', max: BONUS_MAX, label: 'Feels written for this one person', hint: 'Personal details, or a framing that lands with their personality (skeptic → proof, career-driven → visibility).' },
    ],
  },
  {
    key: '2',
    label: 'Persuasion',
    tagline: 'Give them a reason to act',
    items: [
      { id: '2.1', tier: 'core', max: CORE_MAX, label: 'Gives a clear reason to act', hint: 'Urgency, benefit or necessity — any one of them is enough.' },
      { id: '2.2', tier: 'standard', max: STANDARD_MAX, label: 'Borrows authority they respect', hint: 'Executive, IT/HR, policy, a client — or “your manager”.' },
      { id: '2.3', tier: 'bonus', max: BONUS_MAX, label: 'Persuasive quality overall', hint: 'One consistent emotional angle, coherent logic, no contradictions, no filler.' },
    ],
  },
  {
    key: '3',
    label: 'Sender Credibility',
    tagline: 'Look like someone they already trust',
    items: [
      { id: '3.1', tier: 'core', max: CORE_MAX, label: 'Sender identity matches the mission', hint: 'Domain and claimed role both fit, with no contradictions.' },
      { id: '3.2', tier: 'standard', max: STANDARD_MAX, label: 'Signature is a person with a title', hint: 'A named signer plus a job title or department — not just “IT Team”.' },
      { id: '3.3', tier: 'bonus', max: BONUS_MAX, label: 'Detail that feels verifiable', hint: 'Extension, office location, employee ID, an internal reference such as a meeting or ticket number.' },
    ],
  },
  {
    key: '4',
    label: 'Call to Action',
    tagline: 'Make the next click obvious',
    items: [
      { id: '4.1', tier: 'core', max: CORE_MAX, label: "Destination matches the mission's target link", hint: 'Use exactly the URL given in your briefing — a missing or different link scores 0.' },
      { id: '4.2', tier: 'standard', max: STANDARD_MAX, label: 'Instruction is unambiguous', hint: 'A clear action verb (share, upload, reset); number the steps when there are 2+.' },
      { id: '4.3', tier: 'bonus', max: BONUS_MAX, label: 'Lowers the effort to comply', hint: 'Ready-made link, the exact folder, a pre-filled recipient, “just reply with the file”.' },
    ],
  },
];

export const ALL_RUBRIC_ITEM_IDS: string[] = PHISHING_RUBRIC.flatMap((d) => d.items.map((i) => i.id));

/** 加分项编号（模型会额外给出参考区间） */
export const BONUS_ITEM_IDS: ReadonlySet<string> = new Set(
  PHISHING_RUBRIC.flatMap((d) => d.items.filter((i) => i.tier === 'bonus').map((i) => i.id)),
);

/** 单项满分查表（后端返回的分数按各自满分裁切） */
const ITEM_MAX_BY_ID: Record<string, number> = Object.fromEntries(
  PHISHING_RUBRIC.flatMap((d) => d.items.map((i) => [i.id, i.max])),
);

export const itemMaxOf = (id: string): number => ITEM_MAX_BY_ID[id] ?? BONUS_MAX;

const clampToItem = (id: string, value: number): number =>
  Math.max(0, Math.min(itemMaxOf(id), value));

// ─── 解析后端返回 ────────────────────────────────────────────────────────────

const roundTo2 = (n: number): number => Math.round(n * 100) / 100;

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
    if (Number.isFinite(value)) out[m[1]] = clampToItem(m[1], value);
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
        // 加分项要求整数分（模型偶尔会给 2.5，这里取整守住契约）
        const normalized = BONUS_ITEM_IDS.has(id) ? Math.round(value) : value;
        out[id] = clampToItem(id, normalized);
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

/** 单项得分 → 语义色档位（满分按该项自身满分判断） */
export function verdictTone(score: number | undefined, max: number): VerdictTone {
  if (score === undefined) return 'unknown';
  if (score >= max) return 'full';
  if (score > 0) return 'partial';
  return 'missing';
}

/**
 * 加分项的参考区间（后端可选返回，仅用于展示，不参与计算）。
 * 模型自己对细分犹豫时，范围能把不确定性诚实地说出来。
 */
export function collectBonusRanges(reply: { bonus_ranges?: unknown }): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  const raw = reply.bonus_ranges;
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!BONUS_ITEM_IDS.has(id) || !Array.isArray(value) || value.length < 2) continue;
    const lo = Number(value[0]);
    const hi = Number(value[1]);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
    out[id] = [clampToItem(id, lo), clampToItem(id, hi)];
  }
  return out;
}

export interface ItemVerdict {
  item: RubricItem;
  dimensionKey: string;
  /** 得分；undefined 表示后端未提供该项（展示为"未评估"） */
  score: number | undefined;
  /** 加分项：模型给出的参考区间（仅展示，排名仍用 score） */
  range?: [number, number];
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
  bonus_ranges?: unknown;
}): { total: number; dimensions: DimensionReport[]; focus: ItemVerdict[] } {
  const details = reply.score_details ?? {};
  const itemScores = collectItemScores(reply);
  const ranges = collectBonusRanges(reply);

  const dimensions: DimensionReport[] = PHISHING_RUBRIC.map((dim) => {
    const rawValue = details[dim.key];
    const verdicts: ItemVerdict[] = dim.items.map((item) => {
      const score = itemScores[item.id];
      const rawRange = ranges[item.id];
      // 区间必须含住分数（模型偶尔给出 lo > score 的矛盾区间）
      const range: [number, number] | undefined =
        rawRange && score !== undefined
          ? [Math.min(rawRange[0], score), Math.max(rawRange[1], score)]
          : rawRange;
      return {
        item,
        dimensionKey: dim.key,
        score,
        ...(range ? { range } : {}),
      };
    });

    const summed = roundTo2(verdicts.reduce((sum, v) => sum + (v.score ?? 0), 0));
    const reported = rawScoreFor(details, dim.key);
    // 仅当该维度 3 条细则都有数据时才以逐项求和为准（保证“明细 = 卡片分”自洽）；
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

  const allVerdicts = dimensions.flatMap((d) => d.verdicts);
  const total = roundTo2(dimensions.reduce((sum, d) => sum + d.score, 0));

  // “下次重点”：按得分率最低的前 3 项（用比率比较，避免 5 分项与 10 分项不等权）
  const gaps = allVerdicts
    .filter((v) => (v.score ?? 0) < v.item.max)
    .sort((a, b) => (a.score ?? 0) / a.item.max - (b.score ?? 0) / b.item.max)
    .slice(0, 3);

  return { total, dimensions, focus: gaps };
}

function rawScoreFor(details: Record<string, unknown>, key: string): number {
  return readDimensionScore(details[key]);
}
