import type { Request, Response, NextFunction } from 'express';

// Small in-memory fixed-window limiter (per IP). Fine for a single-instance MVP.
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; reset: number }>();
  setInterval(() => { const t = Date.now(); hits.forEach((v, k) => v.reset < t && hits.delete(k)); }, windowMs).unref();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const k = req.ip ?? 'unknown';
    const h = hits.get(k);
    if (!h || h.reset < now) { hits.set(k, { n: 1, reset: now + windowMs }); return next(); }
    if (++h.n > max) return res.status(429).json({ error: 'Too many tries. Please wait a moment and try again.' });
    next();
  };
}
