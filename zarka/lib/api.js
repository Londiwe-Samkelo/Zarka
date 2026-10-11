import { getState, setState } from "./store";
import { saveSetting } from "./localData";

// All calls go to /api/*, which Next.js forwards to the Express server (see next.config.mjs).
const jsonHeaders = { "Content-Type": "application/json" };
const authHeaders = () => {
  const session = getState().session;
  return session ? { ...jsonHeaders, Authorization: `Bearer ${session.token}` } : jsonHeaders;
};

// Login expired or cancelled on the server: forget it here too, so the app asks for a new login.
function forgetSession() {
  setState({ session: null, incoming: [] });
  saveSetting("session", null);
}

async function request(method, url, body, { authed = false } = {}) {
  try {
    const response = await fetch(url, {
      method, cache: "no-store",
      headers: authed ? authHeaders() : jsonHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = null;
    try { data = await response.json(); } catch { /* no body */ }
    if (authed && response.status === 401) forgetSession();
    return { status: response.status, ok: response.ok, data };
  } catch {
    return { status: 0, ok: false, data: { error: "no connection" } };
  }
}

export async function pingServer() {
  try { return (await fetch("/api/health", { cache: "no-store" })).ok; } catch { return false; }
}

export async function fetchRates() {
  const { ok, data } = await request("GET", "/api/rates");
  return ok ? data : null;
}

// Returns { status, body }: 2xx accepted, 401 login needed, 400 rejected. Throws if the network fails.
export async function postTransfer(transfer) {
  const response = await fetch("/api/transfers", { method: "POST", headers: authHeaders(), body: JSON.stringify(transfer) });
  let body = null;
  try { body = await response.json(); } catch { /* no body */ }
  return { status: response.status, body };
}

export async function fetchMyTransfers() {
  const { ok, data } = await request("GET", "/api/transfers", undefined, { authed: true });
  return ok ? data : null;
}

export async function fetchIncoming() {
  const { ok, data } = await request("GET", "/api/incoming", undefined, { authed: true });
  return ok ? data : null;
}

// Receiver proves it is them with the code we texted. Returns { ok, transfer } or { ok: false, code, attemptsLeft, minutes }.
export async function collectWithCode(id, code) {
  const { ok, data } = await request("POST", `/api/transfers/${encodeURIComponent(id)}/collect`, { code }, { authed: true });
  return ok ? { ok: true, transfer: data.transfer } : { ok: false, ...(data || {}) };
}

export const saveProfileLanguage = (language) => request("POST", "/api/profile", { language }, { authed: true });
export const requestOtp = (phone) => request("POST", "/api/auth/request-otp", { phone }).then((r) => r.data);
export const verifyOtp = (phone, code) => request("POST", "/api/auth/verify-otp", { phone, code }).then((r) => r.data);

export async function logoutOnServer() {
  await request("POST", "/api/auth/logout", {}, { authed: true });
}

// Vambo AI translated UI text for one language. Returns { language, messages, complete } or null.
export async function fetchUiMessages(language) {
  const { ok, data } = await request("GET", `/api/messages?lang=${encodeURIComponent(language)}`);
  return ok ? data : null;
}

// Needs a login. Returns { text, translated }. translated is false when Vambo is off or failed.
export async function requestTranslation(text, lang) {
  const { data } = await request("POST", "/api/translate", { text, lang }, { authed: true });
  return { text: data?.text ?? text, translated: Boolean(data?.translated) };
}
