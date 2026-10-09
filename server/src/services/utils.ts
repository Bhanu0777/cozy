import crypto from 'node:crypto';

// No I, L, O, 0, 1 so codes are easy to read aloud.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_RE = /^[A-HJKMNP-Z2-9]{6}$/;

export const makeCode = () => {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return s;
};

export const newToken = () => crypto.randomBytes(24).toString('base64url');
export const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');
export const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(CONTROL, '').replace(/[<>]/g, '').trim().slice(0, max) : '';

export const cleanName = (v: unknown, fallback = '') => clean(v, 24).replace(/\s+/g, ' ') || fallback;
export const cleanMessage = (v: unknown) => clean(v, 500);

export const MOODS = ['happy', 'loved', 'sleepy', 'missing', 'gaming', 'studying', 'chilling', 'excited'] as const;
export const isMood = (v: unknown): v is string => typeof v === 'string' && (MOODS as readonly string[]).includes(v);

const ID_RE = /^[\w-]{11}$/;
export function parseYouTubeId(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 300) return null;
  const raw = input.trim();
  if (ID_RE.test(raw)) return raw;
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { return null; }
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1] ?? null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?]+)/);
      id = m ? m[2] : null;
    }
  }
  return id && ID_RE.test(id) ? id : null;
}
