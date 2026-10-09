import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { hashToken, makeCode, newToken, safeEqual } from './utils.js';

export type Member = { id: string; name: string; tokenHash: string; mood: string; sockets: Set<string> };
export type Video = { videoId: string | null; playing: boolean; time: number; updatedAt: number; by: string | null };
export type Msg = { id: string; senderId: string; sender: string; text: string; at: string };
export type Room = {
  id: string; code: string; name: string;
  members: Map<string, Member>; messages: Msg[]; video: Video;
};

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const db = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
export const persistence = db ? 'supabase' : 'memory';

const rooms = new Map<string, Room>();
const noVideo = (): Video => ({ videoId: null, playing: false, time: 0, updatedAt: Date.now(), by: null });
const bg = (p: PromiseLike<{ error: unknown }>) =>
  Promise.resolve(p).then(r => { if (r.error) console.error('[db] write failed'); }).catch(() => console.error('[db] write failed'));

export async function createRoom(hostName: string, roomName: string) {
  let code = '';
  for (let i = 0; i < 10; i++) {
    code = makeCode();
    if (!rooms.has(code) && !(await loadRoom(code))) break;
  }
  const room: Room = { id: crypto.randomUUID(), code, name: roomName, members: new Map(), messages: [], video: noVideo() };
  if (db) {
    const { error } = await db.from('rooms').insert({ id: room.id, room_code: code, room_name: roomName, max_users: 2 });
    if (error) throw new Error('db');
  }
  rooms.set(code, room);
  const session = await addMember(room, hostName);
  return { room, session };
}

export async function addMember(room: Room, name: string) {
  const token = newToken();
  const m: Member = { id: crypto.randomUUID(), name, tokenHash: hashToken(token), mood: 'happy', sockets: new Set() };
  if (db) {
    const { error } = await db.from('sessions').insert({
      id: m.id, room_id: room.id, display_name: name, mood: m.mood, online: false, token_hash: m.tokenHash,
    });
    if (error) throw new Error('db');
  }
  room.members.set(m.id, m);
  return { userId: m.id, token };
}

export async function getRoom(code: string): Promise<Room | null> {
  return rooms.get(code) ?? (await loadRoom(code));
}

async function loadRoom(code: string): Promise<Room | null> {
  if (!db) return null;
  const { data: r } = await db.from('rooms').select('id, room_name').eq('room_code', code).maybeSingle();
  if (!r) return null;
  const [{ data: s }, { data: msgs }] = await Promise.all([
    db.from('sessions').select('id, display_name, mood, token_hash').eq('room_id', r.id),
    db.from('messages').select('id, sender_id, message, created_at').eq('room_id', r.id).order('created_at', { ascending: false }).limit(100),
  ]);
  const members = new Map<string, Member>();
  (s ?? []).forEach(x => members.set(x.id, { id: x.id, name: x.display_name, tokenHash: x.token_hash, mood: x.mood, sockets: new Set() }));
  const messages: Msg[] = (msgs ?? []).reverse().map(x => ({
    id: x.id, senderId: x.sender_id, sender: members.get(x.sender_id)?.name ?? 'Someone', text: x.message, at: x.created_at,
  }));
  const room: Room = { id: r.id, code, name: r.room_name, members, messages, video: noVideo() };
  rooms.set(code, room);
  return room;
}

export function authenticate(room: Room, userId: string, token: string): Member | null {
  const m = room.members.get(userId);
  return m && safeEqual(m.tokenHash, hashToken(token)) ? m : null;
}

export function addMessage(room: Room, m: Member, text: string): Msg {
  const msg: Msg = { id: crypto.randomUUID(), senderId: m.id, sender: m.name, text, at: new Date().toISOString() };
  room.messages.push(msg);
  if (room.messages.length > 200) room.messages.shift();
  if (db) bg(db.from('messages').insert({ id: msg.id, room_id: room.id, sender_id: m.id, message: text }));
  return msg;
}

export function persistMood(room: Room, m: Member) {
  if (db) bg(db.from('sessions').update({ mood: m.mood }).eq('id', m.id));
}
export function persistOnline(m: Member) {
  if (db) bg(db.from('sessions').update({ online: m.sockets.size > 0 }).eq('id', m.id));
}

export const users = (room: Room) =>
  [...room.members.values()].map(m => ({ id: m.id, name: m.name, mood: m.mood, online: m.sockets.size > 0 }));

// Current playhead, advanced by the time elapsed if the video is playing.
export function videoNow(room: Room) {
  const v = room.video;
  const time = v.playing ? v.time + (Date.now() - v.updatedAt) / 1000 : v.time;
  return { videoId: v.videoId, playing: v.playing, time, by: v.by };
}
