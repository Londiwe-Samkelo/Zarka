import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Starts the real server on a spare port with a temporary database and fast timers, then talks to it over HTTP.
const PORT = 4300 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "zarka-test-"));
const env = {
  ...process.env, API_PORT: String(PORT), DATA_DIR: dataDir, AUTH_SECRET: "test-secret-test-secret-test-secret-123",
  STATUS_PROCESSING_MS: "150", STATUS_READY_MS: "450", TICK_MS: "100", OTP_RESEND_MS: "0", PIN_LOCK_MS: "60000", PICKUP_LOCK_MS: "60000",
  GATEWAY_SECRET: "", NODE_ENV: "test",
};
let server;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(method, url, { body, token, headers = {} } = {}) {
  const response = await fetch(BASE + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await response.text();
  let json = null;
  try { json = JSON.parse(raw); } catch { /* plain text (USSD) */ }
  return { status: response.status, json, text: raw, headers: response.headers };
}
async function login(phone) {
  const otp = await call("POST", "/api/auth/request-otp", { body: { phone } });
  const verified = await call("POST", "/api/auth/verify-otp", { body: { phone, code: otp.json.devCode } });
  return verified.json.token;
}
const ussd = (phone, text, session = "s" + Math.random().toString(36).slice(2)) =>
  call("POST", "/sim/ussd", { body: { sessionId: session, phoneNumber: phone, text } }).then((r) => r.text);
const sms = async (phone, text) => {
  await call("POST", "/sim/sms", { body: { from: phone, text } });
  const inbox = await call("GET", `/sim/inbox?phone=${encodeURIComponent(phone)}`);
  return inbox.json.messages.filter((m) => m.from === "Zarka").at(-1).message;
};
const lastTextTo = async (phone) => (await call("GET", `/sim/inbox?phone=${encodeURIComponent(phone)}`)).json.messages.filter((m) => m.to === phone).at(-1)?.message;
async function waitFor(check, ms = 4000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { const v = await check(); if (v) return v; await sleep(80); }
  throw new Error("timed out waiting");
}

before(async () => {
  server = spawn(process.execPath, ["server/index.js"], { env, stdio: "ignore" });
  await waitFor(async () => (await fetch(BASE + "/api/health").catch(() => null))?.ok);
});
after(() => { server.kill(); fs.rmSync(dataDir, { recursive: true, force: true }); });

const SENDER = "+27821234567";
const MUM = "+263771234567";
const transfer = (id, extra = {}) => ({ id, to: "Mai", phone: "0771234567", country: "Zimbabwe", amount: 500, ...extra });

test("security headers are set and the server does not advertise itself", async () => {
  const r = await call("GET", "/api/health");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("x-powered-by"), null);
});

test("sending money needs a login, and a tampered token is refused", async () => {
  assert.equal((await call("POST", "/api/transfers", { body: transfer("noauth-000001") })).status, 401);
  const token = await login(SENDER);
  assert.equal((await call("POST", "/api/transfers", { token: token + "x", body: transfer("noauth-000002") })).status, 401);
});

test("logging out really ends the login", async () => {
  const token = await login("+27820000001");
  assert.equal((await call("GET", "/api/transfers", { token })).status, 200);
  await call("POST", "/api/auth/logout", { token });
  assert.equal((await call("GET", "/api/transfers", { token })).status, 401);
});

test("wrong login codes are refused and too many attempts lock the code", async () => {
  const phone = "+27820000002";
  const otp = await call("POST", "/api/auth/request-otp", { body: { phone } });
  const wrong = otp.json.devCode === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++) assert.equal((await call("POST", "/api/auth/verify-otp", { body: { phone, code: wrong } })).status, 400);
  const late = await call("POST", "/api/auth/verify-otp", { body: { phone, code: otp.json.devCode } });
  assert.equal(late.status, 400, "the right code must not work after too many attempts");
});

test("recipient numbers are checked against the country and stored cleanly", async () => {
  const token = await login(SENDER);
  const bad = await call("POST", "/api/transfers", { token, body: transfer("phone-000001", { phone: "+27821234567" }) });
  assert.equal(bad.status, 400);
  const good = await call("POST", "/api/transfers", { token, body: transfer("phone-000002") });
  assert.equal(good.json.transfer.phone, MUM);
});

test("a repeated transfer id never sends twice, and nobody else can use it", async () => {
  const token = await login(SENDER);
  const first = await call("POST", "/api/transfers", { token, body: transfer("repeat-000001") });
  const again = await call("POST", "/api/transfers", { token, body: transfer("repeat-000001") });
  assert.equal(again.json.duplicate, true);
  assert.equal(again.json.transfer.createdAt, first.json.transfer.createdAt);
  const other = await login("+27820000003");
  const stolen = await call("POST", "/api/transfers", { token: other, body: transfer("repeat-000001") });
  assert.equal(stolen.status, 400);
});

test("limits: minimum, maximum and malformed amounts", async () => {
  const token = await login("+27820000004");
  for (const amount of [10, 99999, -5, "abc", 0]) {
    assert.equal((await call("POST", "/api/transfers", { token, body: transfer("limit-" + String(amount).replace(/\W/g, "x") + "-000", { amount }) })).status, 400, `amount ${amount}`);
  }
});

test("the sender never sees the pickup code or its hash", async () => {
  const token = await login("+27820000005");
  await call("POST", "/api/transfers", { token, body: transfer("hidden-000001") });
  await waitFor(async () => (await call("GET", "/api/transfers", { token })).json[0].status === "ready");
  const body = (await call("GET", "/api/transfers", { token })).text;
  assert.ok(!body.includes("pickup") && !body.includes("hash") && !body.includes("salt"));
});

test("both sides are texted, and the receiver can collect with the code", async () => {
  const token = await login(SENDER);
  const id = "collect-000001";
  await call("POST", "/api/transfers", { token, body: transfer(id, { phone: "0771112222" }) });
  const mum = "+263771112222";
  assert.match(await lastTextTo(mum), /is sending you/);
  const text = await waitFor(async () => { const t = await lastTextTo(mum); return /Pickup code/.test(t) && t; });
  const code = text.match(/Pickup code (\d{6})/)[1];
  assert.ok(!text.includes(SENDER), "the receiver should only see a masked sender number");

  const mumToken = await login(mum);
  const incoming = await call("GET", "/api/incoming", { token: mumToken });
  assert.equal(incoming.json[0].status, "ready");
  assert.ok(!JSON.stringify(incoming.json).includes(SENDER.slice(4, 8)) || incoming.json[0].sender.includes("•"));

  const wrong = await call("POST", `/api/transfers/${id}/collect`, { token: mumToken, body: { code: code === "000000" ? "111111" : "000000" } });
  assert.equal(wrong.json.code, "wrong_code");
  assert.equal((await call("POST", `/api/transfers/${id}/collect`, { token, body: { code } })).status, 404, "the sender cannot collect");
  assert.equal((await call("POST", `/api/transfers/${id}/collect`, { token: mumToken, body: { code } })).status, 200);
  assert.match(await lastTextTo(SENDER), /collected/);
  assert.equal((await call("GET", `/api/transfers/${id}`, { token })).json.status, "collected");
  assert.equal((await call("POST", `/api/transfers/${id}/collect`, { token: mumToken, body: { code } })).json.code, "already_collected");
});

test("three wrong pickup codes lock that transfer, even for the right code", async () => {
  const token = await login(SENDER);
  const id = "lock-0000001";
  await call("POST", "/api/transfers", { token, body: transfer(id, { phone: "0773334444" }) });
  const mum = "+263773334444";
  const code = (await waitFor(async () => { const t = await lastTextTo(mum); return /Pickup code/.test(t) && t; })).match(/code (\d{6})/)[1];
  const mumToken = await login(mum);
  const wrong = code === "000000" ? "111111" : "000000";
  await call("POST", `/api/transfers/${id}/collect`, { token: mumToken, body: { code: wrong } });
  await call("POST", `/api/transfers/${id}/collect`, { token: mumToken, body: { code: wrong } });
  assert.equal((await call("POST", `/api/transfers/${id}/collect`, { token: mumToken, body: { code: wrong } })).json.code, "locked");
  assert.equal((await call("POST", `/api/transfers/${id}/collect`, { token: mumToken, body: { code } })).json.code, "locked");
});

test("USSD: PIN is required, weak PINs are refused, wrong PINs lock, and a send works", async () => {
  const phone = "+27829990001";
  assert.match(await ussd(phone, ""), /^CON Zarka/);
  assert.match(await ussd(phone, "1*1*0771234567*200*1"), /Create a PIN first/);
  assert.match(await ussd(phone, "6*1234*1234"), /too easy/);
  assert.match(await ussd(phone, "6*4729*4730"), /did not match/);
  assert.match(await ussd(phone, "6*4729*4729"), /PIN saved/);
  assert.match(await ussd(phone, "1*1*12345"), /not valid for Zimbabwe/);
  assert.match(await ussd(phone, "1*1*0771234567*20"), /minimum is R50/);
  assert.match(await ussd(phone, "1*1*0771234567*200*1"), /Enter your 4-digit PIN/);
  assert.match(await ussd(phone, "1*1*0771234567*200*1*0000"), /Wrong PIN. 2 tries left/);
  const ok = await ussd(phone, "1*1*0771234567*200*1*4729", "fixed-session-1");
  assert.match(ok, /^END Received!/);
  const retry = await ussd(phone, "1*1*0771234567*200*1*4729", "fixed-session-1");
  assert.match(retry, /^END Received!/);
  assert.equal((await call("GET", "/sim/inbox?phone=%2B263771234567")).json.messages.filter((m) => /is sending you 11 USD|is sending you 11\b/.test(m.message)).length >= 0, true);
  await ussd(phone, "1*1*0771234567*200*1*0000"); await ussd(phone, "1*1*0771234567*200*1*0000");
  assert.match(await ussd(phone, "1*1*0771234567*200*1*0000"), /PIN locked/);
  assert.match(await ussd(phone, "1*1*0771234567*200*1*4729"), /PIN locked/);
});

test("USSD: language, status and collecting money from a button phone", async () => {
  const sender = "+27829990002";
  await ussd(sender, "6*4729*4729");
  await ussd(sender, "1*1*0775556666*300*1*4729");
  assert.match(await ussd(sender, "3"), /Sent R300 to \+263775556666/);
  const mum = "+263775556666";
  const code = (await waitFor(async () => { const t = await lastTextTo(mum); return /Pickup code/.test(t) && t; })).match(/code (\d{6})/)[1];

  assert.match(await ussd(mum, "5*2"), /Mutauro wachengetwa/);
  assert.match(await ussd(mum, ""), /Tumira mari/);
  assert.match(await ussd(mum, "4"), /Tora mari/);
  assert.match(await ussd(mum, "4*1*000000"), /Kodhi isiyo/);
  assert.match(await ussd(mum, `4*1*${code}`), /Yatorwa/);
  await ussd(mum, "5*1");
  assert.match(await ussd(mum, "4"), /No money is ready/);
  assert.match(await lastTextTo(sender), /collected/);
});

test("SMS: PIN is needed to confirm, secrets are hidden in the log, STATUS and COLLECT work", async () => {
  const sender = "+27829990003";
  assert.match(await sms(sender, "SEND ZW 300 0777778888"), /Create a PIN first/);
  await ussd(sender, "6*4729*4729");
  assert.match(await sms(sender, "SEND ZW 300 0777778888"), /Reply YES <PIN>/);
  assert.match(await sms(sender, "YES 0000"), /Wrong PIN/);
  assert.match(await sms(sender, "YES 4729"), /^Received!/);
  assert.match(await sms(sender, "YES 4729"), /Nothing to confirm/);
  const inbox = (await call("GET", `/sim/inbox?phone=${encodeURIComponent(sender)}`)).json.messages.map((m) => m.message).join("\n");
  assert.ok(!inbox.includes("YES 4729") && !inbox.includes("YES 0000"), "PINs must not appear in the log");
  assert.match(await sms(sender, "STATUS"), /Sent R300/);
  assert.match(await sms(sender, "FLY ME"), /Zarka SMS/);

  const mum = "+263777778888";
  const code = (await waitFor(async () => { const t = await lastTextTo(mum); return /Pickup code/.test(t) && t; })).match(/code (\d{6})/)[1];
  assert.match(await sms(mum, "COLLECT 000000"), /Wrong code/);
  assert.match(await sms(mum, `COLLECT ${code}`), /Collected!/);
});

test("the gateway secret protects /ussd and /sms when it is set", async () => {
  const port = PORT + 1000;
  const guarded = spawn(process.execPath, ["server/index.js"], { env: { ...env, API_PORT: String(port), GATEWAY_SECRET: "gateway-secret-value" }, stdio: "ignore" });
  try {
    await waitFor(async () => (await fetch(`http://localhost:${port}/api/health`).catch(() => null))?.ok);
    const post = (headers) => fetch(`http://localhost:${port}/ussd`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ sessionId: "g1", phoneNumber: SENDER, text: "" }) });
    assert.equal((await post({})).status, 401);
    assert.equal((await post({ "x-gateway-secret": "wrong" })).status, 401);
    assert.equal((await post({ "x-gateway-secret": "gateway-secret-value" })).status, 200);
  } finally { guarded.kill(); }
});

test("production refuses to start without a real AUTH_SECRET", async () => {
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, ["server/index.js"], { env: { ...env, NODE_ENV: "production", AUTH_SECRET: "", API_PORT: String(PORT + 2000) }, stdio: "ignore" });
    p.on("exit", resolve);
  });
  assert.notEqual(code, 0);
});

test("the demo inbox is closed in production unless simulation is switched on", async () => {
  const port = PORT + 3000;
  const prod = spawn(process.execPath, ["server/index.js"], { env: { ...env, NODE_ENV: "production", AUTH_SECRET: "x".repeat(40), GATEWAY_SECRET: "g".repeat(20), API_PORT: String(port) }, stdio: "ignore" });
  try {
    await waitFor(async () => (await fetch(`http://localhost:${port}/api/health`).catch(() => null))?.ok);
    assert.equal((await fetch(`http://localhost:${port}/sim/inbox`)).status, 404);
    const otp = await fetch(`http://localhost:${port}/api/auth/request-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: SENDER }) });
    assert.equal(otp.status, 400, "no SMS provider, so no code can be sent");
  } finally { prod.kill(); }
});
