# COZY — A little place for two ❤️

A free, private online room for exactly two people: real-time chat, synchronized YouTube watching,
a "Squeeze" (virtual hug), and shared mood/presence. No payments, no ads, no accounts.

**Stack:** React + Vite + TypeScript · Framer Motion · Lucide · Node + Express · Socket.IO · Supabase (optional persistence)

## Quick start

```bash
npm install
cp .env.example .env     # optional: add Supabase keys (see below)
npm run dev              # server :3001 + client :5173
```

Open http://localhost:5173 in two browser windows (use a private window for the second one).

- Window A: **Create a Room**, copy the code, **Enter Room**.
- Window B: **Join a Room**, enter the code and a name.

Without Supabase keys COZY keeps rooms in server memory (they disappear when the server restarts). `/health` shows which mode is active.

## Supabase (optional, recommended for production)

1. Create a free project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor.
3. Put `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` (server only — never expose the service-role key to the browser).

Tables: `rooms`, `sessions` (name, mood, online, hashed session token), `messages`. RLS is enabled with no policies, so only the server can touch them.

## Production

```bash
npm run build   # builds client/dist and server/dist
npm start       # Express serves the API, Socket.IO and the built client on $PORT
```

Set `CLIENT_ORIGIN` to your public URL. If the client is hosted separately, set `VITE_SERVER_URL` at build time.
Run a single server instance (live room state is held in memory; Supabase stores rooms, sessions and messages).

## How it works

- **COZY rooms:** 6-character random codes (no I/L/O/0/1), generated with `crypto.randomInt`. Max 2 members, enforced on the server.
- **Sessions:** joining returns a random secret token (stored hashed). Every socket connection is authenticated against it; the client's word is never trusted.
- **Chat:** server-side sanitising, 500-char limit, rate limit, debounced typing indicator, history on reconnect.
- **YouTube sync:** official IFrame Player API. The server keeps canonical state (video, playing, time); play/pause/seek are broadcast to the other person, joiners get the current position. Seeks are detected by comparing the playhead with its expected position once per second.
- **Squeeze:** server-enforced 5 s cooldown; hearts + glow animation on the receiver, confirmation on the sender.
- **Reconnects:** Socket.IO auto-reconnects; the banner "Connection interrupted. Reconnecting..." shows meanwhile and state is re-sent.
- **Accessibility:** semantic HTML, focus rings, ARIA labels/live regions, status shown with text (not just colour), `prefers-reduced-motion` respected.

## Project layout

```
client/src/{components,pages,hooks,services,types,utils}
server/src/{socket,routes,services,middleware,server.ts}
supabase/schema.sql
```

## Manual test checklist (two windows)

Create/join · third person rejected ("This room is already full...") · chat + typing · mood · squeeze (+cooldown) ·
paste a YouTube link → both load · play/pause/seek mirror · close one window → "Away" · reload → rejoin automatically · mobile width.

## Notes

- YouTube embeds can be blocked for some videos by their owners; COZY shows a message instead of failing silently.
- Browsers may block autoplay with sound until the page has had a click/tap; interacting with the room first avoids this.
