const USER_STORAGE_KEY = 'cyber_ai_user';

export interface StoredUser {
  firstname: string;
  lastname?: string;
  countryCode?: string;
}

export function setStoredUser(user: StoredUser): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUser;
    return parsed?.firstname ? parsed : null;
  } catch {
    return null;
  }
}

export function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}
