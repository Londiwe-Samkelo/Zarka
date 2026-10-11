import crypto from "node:crypto";
import { promisify } from "node:util";
import { LIMITS, PICKUP } from "../config.js";
import { findTransferById, saveTransfer, saveFeeRecord, listOpenTransfers, listTransfersBySender, listTransfersByRecipient } from "../store/transfersStore.js";
import { quoteTransfer } from "./ratesService.js";
import { startPayout } from "./payoutsService.js";
import { advanceTransfer } from "./statusMachine.js";
import { normalizeNumberForCountry, maskPhone } from "./phoneService.js";
import { notifyTransferEvent } from "./notificationService.js";
import { translateText } from "./vamboService.js";
import { audit } from "./auditService.js";

const scrypt = promisify(crypto.scrypt);
const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export const transferRef = (id) => String(id).replace(/[^A-Za-z0-9]/g, "").slice(-8).toUpperCase();
const cleanName = (name) => String(name ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 60);

// What each person is allowed to see. The pickup code hash never leaves the server.
export function toSenderView(transfer) {
  const rest = { ...transfer };
  delete rest.pickup; // the code hash stays on the server
  return rest;
}
export const toReceiverView = (t) => ({
  id: t.id, ref: t.ref, sender: maskPhone(t.senderPhone), receive: t.receive, currency: t.currency,
  country: t.country, status: t.status, statusLog: t.statusLog, createdAt: t.createdAt,
});

const byNewest = (a, b) => b.createdAt.localeCompare(a.createdAt);
export const listSent = (phone) => listTransfersBySender(phone).sort(byNewest);
export const listIncoming = (phone) => listTransfersByRecipient(phone).sort(byNewest);

function checkLimits(senderPhone, amount) {
  if (amount < LIMITS.minZar) return { error: `minimum is R${LIMITS.minZar}`, code: "limit_min" };
  if (amount > LIMITS.maxZar) return { error: `maximum is R${LIMITS.maxZar} per transfer`, code: "limit_max" };
  const recent = listTransfersBySender(senderPhone).filter((t) => Date.now() - new Date(t.createdAt).getTime() < DAY_MS);
  const lastHour = recent.filter((t) => Date.now() - new Date(t.createdAt).getTime() < 3600000);
  if (lastHour.length >= LIMITS.maxPerHour) return { error: "too many transfers this hour", code: "limit_rate" };
  if (recent.reduce((sum, t) => sum + t.amount, 0) + amount > LIMITS.dailyZar) return { error: `daily limit of R${LIMITS.dailyZar} reached`, code: "limit_daily" };
  return null;
}

// Idempotent: the same client-generated id never creates a second transfer.
export async function createTransfer(input) {
  const id = String(input.id ?? "");
  const name = cleanName(input.to);
  const country = input.country;
  const recipientPhone = normalizeNumberForCountry(country, input.phone);
  const amount = Math.round(Number(input.amount) * 100) / 100;

  if (!ID_PATTERN.test(id)) return { error: "invalid transfer id", code: "invalid" };
  if (!name) return { error: "recipient name is required", code: "invalid" };
  if (!quoteTransfer(country, 1)) return { error: "unsupported country", code: "invalid" };
  if (!recipientPhone) return { error: `recipient phone number is not valid for ${country}`, code: "invalid_phone" };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "amount must be greater than zero", code: "invalid" };

  const existing = findTransferById(id);
  if (existing) {
    // Someone else's id must look like "not found", never reveal the transfer.
    return existing.senderPhone === input.senderPhone ? { transfer: existing, duplicate: true } : { error: "invalid transfer id", code: "invalid" };
  }
  const limit = checkLimits(input.senderPhone, amount);
  if (limit) return limit;

  const now = new Date().toISOString();
  const transfer = {
    id, ref: transferRef(id), to: name, phone: recipientPhone,
    senderPhone: input.senderPhone || "", channel: input.channel || "app",
    country, amount, ...quoteTransfer(country, amount),
    status: "received", statusLog: [{ status: "received", at: now }], createdAt: now, pickup: null,
  };
  transfer.payoutReference = (await startPayout(transfer)).reference;
  saveTransfer(transfer);
  saveFeeRecord({ transferId: id, amount: transfer.fee, currency: "ZAR", at: now });
  audit("transfer_created", { phone: transfer.senderPhone, ref: transfer.ref, channel: transfer.channel });
  await notifyTransferEvent(transfer, "created");
  return { transfer };
}

const hashCode = async (code, salt) => (await scrypt(String(code), salt, 32)).toString("hex");

// Moves a transfer forward if time has passed. Reaching "ready" creates the pickup code and texts both people.
export async function refreshTransfer(transfer) {
  const next = advanceTransfer(transfer);
  if (!next) return transfer;
  let code = null;
  if (next.status === "ready" && !next.pickup) {
    code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const salt = crypto.randomBytes(16).toString("hex");
    next.pickup = { salt, hash: await hashCode(code, salt), attempts: 0, lockedUntil: 0 };
  }
  saveTransfer(next);
  if (code) await notifyTransferEvent(next, "ready", { code });
  return next;
}

export async function advanceOpenTransfers() {
  for (const transfer of listOpenTransfers()) await refreshTransfer(transfer);
}

// The receiver proves it is them with the code we texted. Wrong codes lock that transfer for a while.
export async function collectTransfer({ id, phone, code }) {
  const transfer = findTransferById(id);
  if (!transfer || transfer.phone !== phone) return { error: "not found", code: "not_found" };
  if (transfer.status === "collected") return { error: "already collected", code: "already_collected" };
  if (transfer.status !== "ready" || !transfer.pickup) return { error: "not ready yet", code: "not_ready" };
  if (transfer.pickup.lockedUntil > Date.now()) {
    return { error: "locked", code: "locked", minutes: Math.ceil((transfer.pickup.lockedUntil - Date.now()) / 60000) };
  }
  const given = Buffer.from(await hashCode(code, transfer.pickup.salt), "hex");
  if (!crypto.timingSafeEqual(given, Buffer.from(transfer.pickup.hash, "hex"))) {
    const attempts = transfer.pickup.attempts + 1;
    const locked = attempts >= PICKUP.maxAttempts;
    saveTransfer({ ...transfer, pickup: { ...transfer.pickup, attempts: locked ? 0 : attempts, lockedUntil: locked ? Date.now() + PICKUP.lockMs : 0 } });
    audit("collect_failed", { phone, ref: transfer.ref });
    return locked
      ? { error: "locked", code: "locked", minutes: Math.ceil(PICKUP.lockMs / 60000) }
      : { error: "wrong code", code: "wrong_code", attemptsLeft: PICKUP.maxAttempts - attempts };
  }
  const collected = {
    ...transfer, status: "collected", pickup: { ...transfer.pickup, used: true },
    statusLog: [...transfer.statusLog, { status: "collected", at: new Date().toISOString() }],
  };
  saveTransfer(collected);
  audit("collected", { phone, ref: transfer.ref });
  await notifyTransferEvent(collected, "collected");
  return { transfer: collected };
}

export async function buildReceiptText(transfer, language) {
  const text = `Zarka receipt. R${transfer.amount} sent to ${transfer.to} in ${transfer.country}. Fee R${transfer.fee}. They get ${transfer.receive} ${transfer.currency}. Status: ${transfer.status}. Ref ${transfer.ref}.`;
  return translateText(text, language);
}
