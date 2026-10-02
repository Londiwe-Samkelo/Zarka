import { RATE_LIMIT } from "../config.js";

const hits = new Map(); // ip -> { count, resetAt }

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) if (entry.resetAt < now) hits.delete(ip);
}, RATE_LIMIT.windowMs).unref();

export function rateLimit(req, res, next) {
  const now = Date.now();
  const entry = hits.get(req.ip);
  if (!entry || entry.resetAt < now) {
    hits.set(req.ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return next();
  }
  if (++entry.count > RATE_LIMIT.max) return res.status(429).json({ error: "too many requests" });
  next();
}
