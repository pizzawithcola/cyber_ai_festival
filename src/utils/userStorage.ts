const USER_STORAGE_KEY = 'cyber_ai_user';
const ADMIN_TOKEN_KEY = 'cyber_ai_admin_token';
// Phone-side identity that survives browser restarts, so the player never has
// to re-type (or even remember) their nickname at the venue.
const PERSISTENT_USER_KEY = 'cyber_ai_user_persistent';

export interface StoredUser {
  id?: number;
  firstname: string;
  lastname?: string;
  nickname?: string;
  countryCode?: string;
  role?: string;
}

// ─── Admin Token Management ─────────────────────────────────────────────────
export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export function getAdminToken(): string | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!raw) return null;
    // Validate token format (base64 encoded JSON with uid, role, ts)
    try {
      const payload = JSON.parse(atob(raw));
      if (payload.role === 'admin' && payload.uid && payload.ts) {
        return raw;
      }
    } catch {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}


export function setStoredUser(user: StoredUser): void {
  try {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUser;
    return parsed?.firstname ? parsed : null;
  } catch {
    return null;
  }
}

export function clearStoredUser(): void {
  try {
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}


// ─── Persistent identity (phone / personal panel) ──────────────────────────
// Game stations keep using sessionStorage (shared device, auto-clears), while
// the player's own phone remembers them in localStorage across browser
// restarts — that is what actually solves "I forgot my nickname".

export function setPersistentUser(user: StoredUser): void {
  try {
    localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export function getPersistentUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(PERSISTENT_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUser;
    return parsed?.firstname ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPersistentUser(): void {
  try {
    localStorage.removeItem(PERSISTENT_USER_KEY);
  } catch {
    // ignore storage errors
  }
}
