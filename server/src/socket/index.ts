import type { Server } from 'socket.io';
import {
  addMessage, authenticate, getRoom, persistMood, persistOnline, users, videoNow,
  type Member, type Room,
} from '../services/store.js';
import { CODE_RE, cleanMessage, isMood, parseYouTubeId } from '../services/utils.js';

type Ack = (r: { ok: boolean; error?: string; retryMs?: number }) => void;
const ack = (cb: unknown): Ack => (typeof cb === 'function' ? (cb as Ack) : () => {});
const SQUEEZE_COOLDOWN = 5000;

export function attachSocket(io: Server) {
  // Every connection must prove it belongs to this room (userId + secret token), checked server-side.
  io.use(async (socket, next) => {
    const { code, userId, token } = (socket.handshake.auth ?? {}) as Record<string, unknown>;
    if (typeof code !== 'string' || !CODE_RE.test(code) || typeof userId !== 'string' || typeof token !== 'string')
      return next(new Error('unauthorized'));
    const room = await getRoom(code).catch(() => null);
    if (!room) return next(new Error('room_not_found'));
    const member = authenticate(room, userId, token);
    if (!member) return next(new Error('unauthorized'));
    socket.data = { room, member };
    next();
  });

  io.on('connection', socket => {
    const room: Room = socket.data.room;
    const me: Member = socket.data.member;
    const code = room.code;
    let lastSqueeze = 0;
    let bucket = { n: 0, reset: 0 };
    const allowed = (max: number, ms: number) => {
      const t = Date.now();
      if (t > bucket.reset) bucket = { n: 0, reset: t + ms };
      return ++bucket.n <= max;
    };

    me.sockets.add(socket.id);
    socket.join(code);
    persistOnline(me);
    socket.emit('room:state', {
      roomName: room.name, me: me.id, users: users(room), messages: room.messages.slice(-100), video: videoNow(room),
    });
    io.to(code).emit('presence:update', users(room));

    socket.on('mood:update', (mood: unknown) => {
      if (!isMood(mood)) return;
      me.mood = mood;
      persistMood(room, me);
      io.to(code).emit('presence:update', users(room));
    });

    socket.on('chat:send', (text: unknown, cb: unknown) => {
      const clean = cleanMessage(text);
      if (!clean) return ack(cb)({ ok: false });
      if (!allowed(6, 5000)) return ack(cb)({ ok: false, error: 'Slow down a little.' });
      io.to(code).emit('chat:receive', addMessage(room, me, clean));
      socket.to(code).emit('chat:typing', { userId: me.id, name: me.name, typing: false });
      ack(cb)({ ok: true });
    });

    socket.on('chat:typing', (typing: unknown) => {
      socket.to(code).emit('chat:typing', { userId: me.id, name: me.name, typing: typing === true });
    });

    socket.on('squeeze:send', (cb: unknown) => {
      const now = Date.now();
      if (now - lastSqueeze < SQUEEZE_COOLDOWN)
        return ack(cb)({ ok: false, retryMs: SQUEEZE_COOLDOWN - (now - lastSqueeze) });
      lastSqueeze = now;
      socket.to(code).emit('squeeze:receive', { id: `${me.id}-${now}`, from: me.name });
      ack(cb)({ ok: true, retryMs: SQUEEZE_COOLDOWN });
    });

    // ---- YouTube sync: server keeps the canonical state; others receive each change ----
    const setVideo = (patch: Partial<Room['video']>) => {
      room.video = { ...room.video, ...patch, by: me.name, updatedAt: Date.now() };
    };
    const num = (t: unknown) => (typeof t === 'number' && isFinite(t) && t >= 0 && t < 1e6 ? t : 0);

    socket.on('youtube:load', (url: unknown, cb: unknown) => {
      const videoId = parseYouTubeId(url);
      if (!videoId) return ack(cb)({ ok: false, error: "We couldn't recognize that YouTube link." });
      setVideo({ videoId, playing: true, time: 0 });
      io.to(code).emit('youtube:load', { videoId, by: me.name });
      ack(cb)({ ok: true });
    });
    socket.on('youtube:play', (t: unknown) => {
      if (!room.video.videoId) return;
      setVideo({ playing: true, time: num(t) });
      socket.to(code).emit('youtube:play', { time: num(t), by: me.name });
    });
    socket.on('youtube:pause', (t: unknown) => {
      if (!room.video.videoId) return;
      setVideo({ playing: false, time: num(t) });
      socket.to(code).emit('youtube:pause', { time: num(t), by: me.name });
    });
    socket.on('youtube:seek', (t: unknown) => {
      if (!room.video.videoId) return;
      setVideo({ time: num(t) });
      socket.to(code).emit('youtube:seek', { time: num(t), by: me.name });
    });

    socket.on('disconnect', () => {
      me.sockets.delete(socket.id);
      persistOnline(me);
      socket.to(code).emit('chat:typing', { userId: me.id, name: me.name, typing: false });
      io.to(code).emit('presence:update', users(room));
    });
  });
}
