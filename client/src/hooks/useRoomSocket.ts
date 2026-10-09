import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from '../services/api';
import type { ChatMessage, Session, Status, User, VideoCmd, VideoCmdPayload } from '../types';

type Video = { videoId: string | null; playing: boolean; time: number; by: string | null };

export function useRoomSocket(session: Session) {
  const [status, setStatus] = useState<Status>('connecting');
  const [denied, setDenied] = useState<'room_not_found' | 'unauthorized' | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingName, setTypingName] = useState<string | null>(null);
  const [cmd, setCmd] = useState<VideoCmd | null>(null);
  const [addedBy, setAddedBy] = useState<string | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [squeezeIn, setSqueezeIn] = useState<{ id: string; from: string } | null>(null);
  const sock = useRef<Socket | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const s = io(SERVER_URL, {
      auth: { code: session.code, userId: session.userId, token: session.token },
      reconnectionDelayMax: 4000,
    });
    sock.current = s;
    const next = (c: VideoCmdPayload) => setCmd({ ...c, seq: ++seq.current } as VideoCmd);

    s.on('connect', () => setStatus('connected'));
    s.on('disconnect', reason => {
      setStatus('reconnecting');
      if (reason === 'io server disconnect') s.connect();
    });
    s.on('connect_error', err => {
      if (err.message === 'room_not_found' || err.message === 'unauthorized') {
        setDenied(err.message); setStatus('denied'); s.disconnect();
      } else setStatus('reconnecting');
    });
    s.on('room:state', (st: { me: string; users: User[]; messages: ChatMessage[]; video: Video }) => {
      setMe(st.me); setUsers(st.users); setMessages(st.messages);
      if (st.video.videoId) {
        setHasVideo(true); setAddedBy(st.video.by);
        next({ type: 'sync', videoId: st.video.videoId, time: st.video.time, playing: st.video.playing });
      }
    });
    s.on('presence:update', (u: User[]) => setUsers(u));
    s.on('chat:receive', (m: ChatMessage) => setMessages(p => [...p, m].slice(-200)));
    s.on('chat:typing', (t: { name: string; typing: boolean }) => setTypingName(t.typing ? t.name : null));
    s.on('squeeze:receive', (e: { id: string; from: string }) => setSqueezeIn(e));
    s.on('youtube:load', (e: { videoId: string; by: string }) => {
      setHasVideo(true); setAddedBy(e.by);
      next({ type: 'load', videoId: e.videoId, time: 0, playing: true });
    });
    (['play', 'pause', 'seek'] as const).forEach(type =>
      s.on(`youtube:${type}`, (e: { time: number }) => next({ type, time: e.time })),
    );

    return () => { s.removeAllListeners(); s.disconnect(); sock.current = null; };
  }, [session.code, session.userId, session.token]);

  const emit = useCallback((ev: string, ...args: unknown[]) => { sock.current?.emit(ev, ...args); }, []);
  const request = useCallback(
    <T,>(ev: string, ...args: unknown[]) =>
      new Promise<T>(resolve => {
        const s = sock.current;
        if (!s || !s.connected) return resolve({ ok: false, error: 'Connection interrupted. Reconnecting...' } as T);
        s.timeout(5000).emit(ev, ...args, (err: unknown, res: T) =>
          resolve(err ? ({ ok: false, error: 'COZY is having trouble connecting. Please try again.' } as T) : res));
      }),
    [],
  );

  return {
    status, denied, users, me, messages, typingName, cmd, addedBy, hasVideo, squeezeIn,
    clearSqueeze: () => setSqueezeIn(null),
    sendMessage: (t: string) => request<{ ok: boolean; error?: string }>('chat:send', t),
    setTyping: (v: boolean) => emit('chat:typing', v),
    setMood: (id: string) => emit('mood:update', id),
    squeeze: () => request<{ ok: boolean; retryMs?: number; error?: string }>('squeeze:send'),
    loadVideo: (url: string) => request<{ ok: boolean; error?: string }>('youtube:load', url),
    videoEvent: (type: 'play' | 'pause' | 'seek', time: number) => emit(`youtube:${type}`, time),
  };
}
