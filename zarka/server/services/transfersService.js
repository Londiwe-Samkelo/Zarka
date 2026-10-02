import { findTransferById, saveTransfer, saveFeeRecord, listOpenTransfers } from "../store/transfersStore.js";
import { quoteTransfer } from "./ratesService.js";
import { startPayout } from "./payoutsService.js";
import { advanceTransfer } from "./statusMachine.js";
import { sendSms } from "./smsService.js";
import { translateText } from "./vamboService.js";

export function validateTransferInput({ id, to, country, amount }) {
  if (!id || !to) return "id and recipient name are required";
  if (!quoteTransfer(country, 1)) return "unsupported country";
  if (!(Number(amount) > 0)) return "amount must be greater than zero";
  return null;
}

// Idempotent: the same client-generated id never creates a second transfer.
export async function createTransfer(input) {
  const problem = validateTransferInput(input);
  if (problem) return { error: problem };

  const existing = findTransferById(input.id);
  if (existing) return { transfer: existing, duplicate: true };

  const amount = Number(input.amount);
  const now = new Date().toISOString();
  const transfer = {
    id: input.id,
    to: input.to,
    phone: input.phone || "",
    senderPhone: input.senderPhone || "",
    channel: input.channel || "app",
    country: input.country,
    amount,
    ...quoteTransfer(input.country, amount),
    status: "received",
    statusLog: [{ status: "received", at: now }],
    createdAt: now,
  };
  transfer.payoutReference = (await startPayout(transfer)).reference;
  saveTransfer(transfer);
  saveFeeRecord({ transferId: transfer.id, amount: transfer.fee, currency: "ZAR", at: now });
  return { transfer };
}

// Moves a transfer forward if time has passed. Texts the recipient once it is ready to collect.
export async function refreshTransfer(transfer) {
  const next = advanceTransfer(transfer);
  if (!next) return transfer;
  saveTransfer(next);
  if (next.status === "ready" && next.phone) {
    await sendSms(next.phone, `Zarka: ${next.receive} ${next.currency} from ${next.senderPhone || "a sender"} is ready to collect. Ref ${next.id.slice(-8)}`);
  }
  return next;
}

export async function advanceOpenTransfers() {
  for (const transfer of listOpenTransfers()) await refreshTransfer(transfer);
}

export async function buildReceiptText(transfer, language) {
  const text = `Zarka receipt. R${transfer.amount} sent to ${transfer.to} in ${transfer.country}. Fee R${transfer.fee}. They get ${transfer.receive} ${transfer.currency}. Status: ${transfer.status}. Ref ${transfer.id.slice(-8)}.`;
  return translateText(text, language);
}
