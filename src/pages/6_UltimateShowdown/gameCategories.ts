// Shared category definitions for the Ultimate Showdown game balance.
// Categories mirror the curated quiz doc: 4 theme categories + general AI + bonus.
export const GAME_CATEGORIES = [
  { key: 'ai', label: 'AI General' },
  { key: 'hallucination', label: 'Hallucination' },
  { key: 'data', label: 'Data' },
  { key: 'agent', label: 'Agent' },
  { key: 'phishing', label: 'Phishing' },
  { key: 'bonus', label: 'Bonus (Hard)' },
] as const;

export type GameCategoryKey = (typeof GAME_CATEGORIES)[number]['key'];

// localStorage key holding the admin-configured per-category balance.
// v2: balance layout changed to the 7-question structure (5 theme ×1 + bonus ×2).
export const BALANCE_STORAGE_KEY = 'cyber_ai_ultimate_balance_v2';

export type BalanceConfig = Record<GameCategoryKey, number>;

// Default per-game draw = 7 questions: each of the 5 theme categories gets 1
// question + 2 bonus. Bonus are forced to the LAST two questions (x2, then x3).
export const DEFAULT_BALANCE: BalanceConfig = {
  ai: 1,
  hallucination: 1,
  data: 1,
  agent: 1,
  phishing: 1,
  bonus: 2,
};

// Total questions drawn when using the default balance.
export const BALANCE_TOTAL = (Object.keys(DEFAULT_BALANCE) as GameCategoryKey[]).reduce(
  (sum, key) => sum + DEFAULT_BALANCE[key],
  0,
);

export function loadBalance(): BalanceConfig | null {
  try {
    const raw = localStorage.getItem(BALANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BalanceConfig>;
    return {
      ai: Number(parsed.ai) || 0,
      hallucination: Number(parsed.hallucination) || 0,
      data: Number(parsed.data) || 0,
      agent: Number(parsed.agent) || 0,
      phishing: Number(parsed.phishing) || 0,
      bonus: Number(parsed.bonus) || 0,
    };
  } catch {
    return null;
  }
}

export function saveBalance(balance: BalanceConfig): void {
  try {
    localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(balance));
  } catch {
    // ignore storage errors
  }
}
