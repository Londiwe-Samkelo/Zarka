import { IS_PRODUCTION } from "../config.js";

// MOCK SMS sender. Replace with a real provider (Africa's Talking, Twilio, a local aggregator).
export async function sendSms(to, message) {
  if (!IS_PRODUCTION) console.log(`[SMS to ${to}] ${message}`);
  return { ok: true };
}
