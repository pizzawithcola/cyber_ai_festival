// Shared category definitions for the Ultimate Showdown game balance.
export const GAME_CATEGORIES = [
  { key: 'hallucinate', label: 'AI Hallucination' },
  { key: 'datashadows', label: 'Data Shadows' },
  { key: 'retaildemolition', label: 'Retail Demolition' },
  { key: 'phishing', label: 'Phishing' },
  { key: 'ai', label: 'AI General' },
  { key: 'bonus', label: 'Bonus (Hard)' },
] as const;

export type GameCategoryKey = (typeof GAME_CATEGORIES)[number]['key'];

// localStorage key holding the admin-configured per-category balance
export const BALANCE_STORAGE_KEY = 'cyber_ai_ultimate_balance';

export type BalanceConfig = Record<GameCategoryKey, number>;

export const DEFAULT_BALANCE: BalanceConfig = {
  hallucinate: 2,
  datashadows: 2,
  retaildemolition: 2,
  phishing: 2,
  ai: 1,
  bonus: 1,
};

export function loadBalance(): BalanceConfig | null {
  try {
    const raw = localStorage.getItem(BALANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BalanceConfig>;
    return {
      hallucinate: Number(parsed.hallucinate) || 0,
      datashadows: Number(parsed.datashadows) || 0,
      retaildemolition: Number(parsed.retaildemolition) || 0,
      phishing: Number(parsed.phishing) || 0,
      ai: Number(parsed.ai) || 0,
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
