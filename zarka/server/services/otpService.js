import crypto from "node:crypto";
import { AUTH, IS_PRODUCTION } from "../config.js";
import { normalizePhone, issueToken } from "./authService.js";
import { sendSms } from "./smsService.js";
import { audit } from "./auditService.js";

const pendingCodes = new Map(); // phone -> { hash, expiresAt, attempts }
const requestLog = new Map();   // phone -> request times within the last hour

// Codes are kept only as a keyed hash, never in plain text.
const hashCode = (phone, code) => crypto.createHmac("sha256", AUTH.secret).update(`${phone}:${code}`).digest();

export async function requestOtp(rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: "invalid phone number (use the country code)" };

  const now = Date.now();
  const recent = (requestLog.get(phone) || []).filter((t) => now - t < 3600000);
  if (recent.length && now - recent[recent.length - 1] < AUTH.otpResendMs) return { error: "wait a little before asking for a new code" };
  if (recent.length >= AUTH.otpPerHour) return { error: "too many codes requested, try again later" };

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const sent = await sendSms(phone, `Your Zarka code is ${code}. It expires in 5 minutes. Never share it with anyone.`);
  if (!sent.ok) return { error: "could not send the code, please try again" };

  requestLog.set(phone, [...recent, now]);
  pendingCodes.set(phone, { hash: hashCode(phone, code), expiresAt: now + AUTH.otpTtlMs, attempts: 0 });
  audit("otp_requested", { phone });
  // The on-screen test code is for development only. Set SHOW_DEV_CODE=false to demo the SMS inbox instead.
  const showCode = !IS_PRODUCTION && process.env.SHOW_DEV_CODE !== "false";
  return showCode ? { ok: true, devCode: code } : { ok: true };
}

export function verifyOtp(rawPhone, code) {
  const phone = normalizePhone(rawPhone);
  const entry = phone && pendingCodes.get(phone);
  if (!entry || entry.expiresAt < Date.now()) return { error: "code expired, request a new one" };
  if (++entry.attempts > AUTH.otpMaxAttempts) {
    pendingCodes.delete(phone);
    audit("login_locked", { phone });
    return { error: "too many attempts, request a new code" };
  }
  const given = hashCode(phone, String(code).trim());
  if (!crypto.timingSafeEqual(given, entry.hash)) {
    audit("login_failed", { phone });
    return { error: "wrong code" };
  }
  pendingCodes.delete(phone);
  audit("login_success", { phone });
  return { token: issueToken(phone), phone };
}
