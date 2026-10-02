import { SMS_COUNTRY_CODES } from "../config.js";
import { getRates, quoteTransfer } from "./ratesService.js";
import { createTransfer } from "./transfersService.js";
import { normalizePhone } from "./authService.js";

const PENDING_TTL_MS = 10 * 60 * 1000;
const pendingRequests = new Map(); // sender phone -> request waiting for YES

const HELP_TEXT =
  "Zarka SMS:\nSEND ZW 500 +26377123456\n(ZW MZ MW LS BW NA ZM, amount in ZAR)\nRATES\nYES to confirm, CANCEL to stop";

// "SEND ZW 500 +26377123456" -> { command: "SEND", country, amount, recipient }
export function parseSmsCommand(text) {
  const [command, ...rest] = String(text || "").trim().toUpperCase().split(/\s+/);
  if (command === "SEND") {
    const [code, amount, phone] = rest;
    const country = SMS_COUNTRY_CODES[code];
    const recipient = normalizePhone(phone);
    if (!country || !recipient || !(Number(amount) > 0)) return { command: "INVALID" };
    return { command: "SEND", country, amount: Number(amount), recipient };
  }
  return ["YES", "CANCEL", "RATES", "HELP"].includes(command) ? { command } : { command: "INVALID" };
}

export async function processSmsCommand({ from, text, messageId }) {
  const sender = normalizePhone(from);
  if (!sender) return "Sorry, we could not read your number.";
  const cmd = parseSmsCommand(text);

  if (cmd.command === "RATES") {
    return "Per R1:\n" + Object.entries(getRates()).map(([c, r]) => `${c} ${r.rate} ${r.currency}`).join("\n");
  }
  if (cmd.command === "CANCEL") {
    pendingRequests.delete(sender);
    return "Cancelled.";
  }
  if (cmd.command === "SEND") {
    const quote = quoteTransfer(cmd.country, cmd.amount);
    pendingRequests.set(sender, { ...cmd, id: `sms-${messageId || Date.now()}`, expiresAt: Date.now() + PENDING_TTL_MS });
    return `Send R${cmd.amount} to ${cmd.recipient} (${cmd.country})? Fee R${quote.fee}, they get ${quote.receive} ${quote.currency}. Reply YES to confirm or CANCEL.`;
  }
  if (cmd.command === "YES") {
    const request = pendingRequests.get(sender);
    if (!request || request.expiresAt < Date.now()) return "Nothing to confirm. Text: SEND ZW 500 +26377123456";
    pendingRequests.delete(sender);
    // request.id doubles as the idempotency key, so a duplicate delivery cannot double-send.
    const result = await createTransfer({
      id: request.id, to: request.recipient, phone: request.recipient,
      country: request.country, amount: request.amount, senderPhone: sender, channel: "sms",
    });
    return result.error ? "Could not send. Try again." : `Received! R${request.amount} to ${request.recipient}. They get an SMS when it is ready to collect. Ref ${result.transfer.id.slice(-8)}`;
  }
  return HELP_TEXT;
}
