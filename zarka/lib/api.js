import { getState } from "./store";

// All calls go to /api/*, which Next.js forwards to the Express server (see next.config.mjs).
const jsonHeaders = { "Content-Type": "application/json" };
const authHeaders = () => {
  const session = getState().session;
  return session ? { ...jsonHeaders, Authorization: `Bearer ${session.token}` } : jsonHeaders;
};

async function postJson(url, body) {
  try {
    const response = await fetch(url, { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) });
    return await response.json();
  } catch {
    return { error: "no connection" };
  }
}

export async function pingServer() {
  try { return (await fetch("/api/health", { cache: "no-store" })).ok; } catch { return false; }
}

export async function fetchRates() {
  try {
    const response = await fetch("/api/rates", { cache: "no-store" });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

// Returns { status, body }: 2xx accepted, 401 login needed, 400 rejected. Throws if the network fails.
export async function postTransfer(transfer) {
  const response = await fetch("/api/transfers", { method: "POST", headers: authHeaders(), body: JSON.stringify(transfer) });
  let body = null;
  try { body = await response.json(); } catch { /* no body */ }
  return { status: response.status, body };
}

export async function fetchMyTransfers() {
  try {
    const response = await fetch("/api/transfers", { headers: authHeaders(), cache: "no-store" });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

// Vambo AI translated UI text for one language. Returns { language, messages, complete } or null.
export async function fetchUiMessages(language) {
  try {
    const response = await fetch(`/api/messages?lang=${encodeURIComponent(language)}`, { cache: "no-store" });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

export const requestOtp = (phone) => postJson("/api/auth/request-otp", { phone });
export const verifyOtp = (phone, code) => postJson("/api/auth/verify-otp", { phone, code });

// Needs a login. If anything goes wrong we return the original text.
export async function requestTranslation(text, lang) {
  try {
    const response = await fetch("/api/translate", { method: "POST", headers: authHeaders(), body: JSON.stringify({ text, lang }) });
    return (await response.json()).text || text;
  } catch { return text; }
}
