import crypto from "node:crypto";
import { AUTH } from "../config.js";

export function normalizePhone(input) {
  const phone = String(input || "").replace(/[\s()-]/g, "");
  return /^\+\d{9,15}$/.test(phone) ? phone : null;
}

const sign = (payload) => crypto.createHmac("sha256", AUTH.secret).update(payload).digest("base64url");

export function signToken(phone) {
  const payload = Buffer.from(JSON.stringify({ phone, exp: Date.now() + AUTH.tokenTtlMs })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}
