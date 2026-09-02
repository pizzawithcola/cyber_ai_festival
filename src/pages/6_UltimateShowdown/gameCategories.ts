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

// localStorage key holding the admin-configured per-category balance
export const BALANCE_STORAGE_KEY = 'cyber_ai_ultimate_balance';

export type BalanceConfig = Record<GameCategoryKey, number>;

// Default per-game draw = 12 questions total (5 normal categories x2 + bonus x2).
export const DEFAULT_BALANCE: BalanceConfig = {
  ai: 2,
  hallucination: 2,
  data: 2,
  agent: 2,
  phishing: 2,
  bonus: 2,
};

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
