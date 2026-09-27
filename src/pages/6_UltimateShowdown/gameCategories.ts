// Shared category definitions for the Ultimate Showdown game balance.
// 7 categories: 5 theme categories + bonus (×2) + UAE (×3).
export const GAME_CATEGORIES = [
  { key: 'ai', label: 'AI General' },
  { key: 'hallucination', label: 'Hallucination' },
  { key: 'data', label: 'Data' },
  { key: 'agent', label: 'Agent' },
  { key: 'phishing', label: 'Phishing' },
  { key: 'bonus', label: 'Bonus (Hard)' },
  { key: 'uae', label: 'UAE' },
] as const;

export type GameCategoryKey = (typeof GAME_CATEGORIES)[number]['key'];

// localStorage key holding the admin-configured per-category balance.
// v3: 7-question structure (5 theme ×1 + bonus ×1 + UAE ×1).
export const BALANCE_STORAGE_KEY = 'cyber_ai_ultimate_balance_v3';

export type BalanceConfig = Record<GameCategoryKey, number>;

// Default per-game draw = 7 questions: one from each of the 7 categories.
// Bonus ×2 and UAE ×3 are forced to the last two positions by the backend.
export const DEFAULT_BALANCE: BalanceConfig = {
  ai: 1,
  hallucination: 1,
  data: 1,
  agent: 1,
  phishing: 1,
  bonus: 1,
  uae: 1,
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
      uae: Number(parsed.uae) || 0,
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
