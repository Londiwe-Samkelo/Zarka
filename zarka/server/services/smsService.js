import { IS_PRODUCTION } from "../config.js";

// Simulated by default (and always outside production): texts are kept in memory and shown in the
// demo inbox at /sms/sim. To send real texts, set SMS_MODE=real and fill in the marked spot below.
export const SMS_SIMULATED = !IS_PRODUCTION || process.env.SMS_MODE === "simulated";

const MAX_MESSAGES = 300;
const inbox = []; // { id, from, to, message, at }
let nextId = 1;

function log(from, to, message) {
  inbox.push({ id: nextId++, from, to, message, at: new Date().toISOString() });
  if (inbox.length > MAX_MESSAGES) inbox.shift();
}

export async function sendSms(to, message) {
  if (SMS_SIMULATED) {
    log("Zarka", to, message);
    if (!IS_PRODUCTION) console.log(`[SMS to ${to}] ${message}`);
    return { ok: true, simulated: true };
  }
  // REAL PROVIDER GOES HERE: call your SMS provider's API with (to, message) and return { ok: true } or { ok: false }.
  return { ok: false, error: "no SMS provider configured" };
}

// A text a phone sent to Zarka (used by the demo inbox so both sides of a chat show up).
export function logInboundSms(from, message) {
  if (SMS_SIMULATED) log(from, "Zarka", message);
}

export function listSimulatedNumbers() {
  const numbers = new Map();
  for (const m of inbox) {
    const phone = m.from === "Zarka" ? m.to : m.from;
    const entry = numbers.get(phone) || { phone, count: 0, lastAt: m.at };
    entry.count++;
    entry.lastAt = m.at;
    numbers.set(phone, entry);
  }
  return [...numbers.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export const listSimulatedMessages = (phone) => inbox.filter((m) => m.from === phone || m.to === phone);
