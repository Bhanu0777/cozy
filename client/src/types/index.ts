export type Session = { code: string; roomName: string; userId: string; token: string; name: string };
export type User = { id: string; name: string; mood: string; online: boolean };
export type ChatMessage = { id: string; senderId: string; sender: string; text: string; at: string };
export type VideoCmdPayload =
  | { type: 'load' | 'sync'; videoId: string; time: number; playing: boolean }
  | { type: 'play' | 'pause' | 'seek'; time: number };
export type VideoCmd = VideoCmdPayload & { seq: number };
export type Status = 'connecting' | 'connected' | 'reconnecting' | 'denied';
