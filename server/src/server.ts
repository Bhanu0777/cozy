import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') }); // repo-root .env
dotenv.config();

// Imported after env is loaded so the store sees Supabase credentials.
const { default: roomRoutes } = await import('./routes/rooms.js');
const { attachSocket } = await import('./socket/index.js');
const { persistence } = await import('./services/store.js');

const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin }));
app.use(express.json({ limit: '5kb' }));
app.get('/health', (_req, res) => res.json({ ok: true, persistence }));
app.use('/api/rooms', roomRoutes);

// In production the built client is served from the same origin.
const dist = path.resolve(here, '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h' }));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// Never leak stack traces.
app.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: 'COZY is having trouble connecting. Please try again.' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin }, maxHttpBufferSize: 10_000 });
attachSocket(io);

const port = Number(process.env.PORT) || 3001;
server.listen(port, () => console.log(`COZY server on :${port} (storage: ${persistence})`));
