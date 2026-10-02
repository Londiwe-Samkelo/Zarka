import crypto from "node:crypto";
import { AUTH, IS_PRODUCTION } from "../config.js";
import { normalizePhone, signToken } from "./authService.js";
import { sendSms } from "./smsService.js";

const pendingCodes = new Map(); // phone -> { code, expiresAt, attempts }
const lastRequestAt = new Map(); // phone -> timestamp (simple rate limit)

export async function requestOtp(rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: "invalid phone number (use +country code)" };
  if (Date.now() - (lastRequestAt.get(phone) || 0) < 30000) return { error: "wait 30 seconds before asking for a new code" };
  lastRequestAt.set(phone, Date.now());

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  pendingCodes.set(phone, { code, expiresAt: Date.now() + AUTH.otpTtlMs, attempts: 0 });
  await sendSms(phone, `Your Zarka code is ${code}. It expires in 5 minutes.`);
  return IS_PRODUCTION ? { ok: true } : { ok: true, devCode: code }; // devCode only outside production
}

export function verifyOtp(rawPhone, code) {
  const phone = normalizePhone(rawPhone);
  const entry = phone && pendingCodes.get(phone);
  if (!entry || entry.expiresAt < Date.now()) return { error: "code expired, request a new one" };
  entry.attempts++;
  if (entry.attempts > AUTH.otpMaxAttempts) { pendingCodes.delete(phone); return { error: "too many attempts" }; }
  if (String(code).trim() !== entry.code) return { error: "wrong code" };
  pendingCodes.delete(phone);
  return { token: signToken(phone), phone };
}
