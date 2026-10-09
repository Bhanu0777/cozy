import type { Session } from '../types';
const key = (code: string) => `cozy:session:${code.toUpperCase()}`;
export const saveSession = (s: Session) => { try { localStorage.setItem(key(s.code), JSON.stringify(s)); } catch { /* storage blocked */ } };
export function loadSession(code: string): Session | null {
  try { const v = localStorage.getItem(key(code)); return v ? (JSON.parse(v) as Session) : null; } catch { return null; }
}
export const clearSession = (code: string) => { try { localStorage.removeItem(key(code)); } catch { /* ignore */ } };
