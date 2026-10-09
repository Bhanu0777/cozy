import type { Session } from '../types';

export const SERVER_URL: string | undefined = import.meta.env.VITE_SERVER_URL || undefined;
const TROUBLE = 'COZY is having trouble connecting. Please try again.';

async function post(path: string, body: unknown): Promise<Session> {
  let res: Response;
  try {
    res = await fetch(`${SERVER_URL ?? ''}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } catch { throw new Error(TROUBLE); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : TROUBLE);
  return data as Session;
}

export const createRoom = (name: string, roomName: string) => post('/api/rooms', { name, roomName });
export const joinRoom = (code: string, name: string) => post('/api/rooms/join', { code, name });
