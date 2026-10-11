import crypto from "node:crypto";
import { AUTH } from "../config.js";
import { createSession, findActiveSession } from "../store/sessionsStore.js";

export function normalizePhone(input) {
  const phone = String(input || "").replace(/[\s()-]/g, "");
  return /^\+\d{9,15}$/.test(phone) ? phone : null;
}

const sign = (payload) => crypto.createHmac("sha256", AUTH.secret).update(payload).digest("base64url");

// A token proves who you are and carries a session id the server can cancel (logout).
export function issueToken(phone) {
  const session = createSession(phone);
  const payload = Buffer.from(JSON.stringify({ phone, jti: session.id, exp: session.expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (typeof token !== "string" || token.length > 600) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!(data.exp > Date.now()) || !findActiveSession(data.jti)) return null;
    return { phone: data.phone, jti: data.jti };
  } catch { return null; }
}
