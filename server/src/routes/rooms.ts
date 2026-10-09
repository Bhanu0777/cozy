import { Router } from 'express';
import { rateLimit } from '../middleware/rateLimit.js';
import { addMember, createRoom, getRoom } from '../services/store.js';
import { CODE_RE, cleanName } from '../services/utils.js';

const router = Router();
const limit = rateLimit(30, 10 * 60 * 1000);
const TROUBLE = 'COZY is having trouble connecting. Please try again.';

router.post('/', limit, async (req, res) => {
  const name = cleanName(req.body?.name);
  const roomName = cleanName(req.body?.roomName, 'Our snug room');
  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  try {
    const { room, session } = await createRoom(name, roomName);
    res.status(201).json({ code: room.code, roomName: room.name, name, ...session });
  } catch { res.status(503).json({ error: TROUBLE }); }
});

router.post('/join', limit, async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!CODE_RE.test(code)) return res.status(404).json({ error: "We couldn't find that room. Check the code and try again." });
  try {
    const room = await getRoom(code);
    if (!room) return res.status(404).json({ error: "We couldn't find that room. Check the code and try again." });
    if (room.members.size >= 2)
      return res.status(409).json({ error: 'This room is already full. COZY rooms are private spaces for two.' });
    const session = await addMember(room, name);
    res.status(201).json({ code, roomName: room.name, name, ...session });
  } catch { res.status(503).json({ error: TROUBLE }); }
});

export default router;
