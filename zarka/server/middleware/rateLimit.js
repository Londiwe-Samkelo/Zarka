import { RATE_LIMIT, AUTH_RATE_LIMIT } from "../config.js";

// Counts requests per client IP in a time window and answers 429 when a client goes over.
export function createRateLimiter({ windowMs, max }) {
  const hits = new Map(); // ip -> { count, resetAt }
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (entry.resetAt < now) hits.delete(ip);
  }, windowMs).unref();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || entry.resetAt < now) {
      hits.set(req.ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (++entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: "too many requests, slow down" });
    }
    next();
  };
}

export const rateLimit = createRateLimiter(RATE_LIMIT);
export const authRateLimit = createRateLimiter(AUTH_RATE_LIMIT);
