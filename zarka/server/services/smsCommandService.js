import crypto from "node:crypto";
import { LIMITS, LIMIT_VARS, SMS_COUNTRY_CODES } from "../config.js";
import { msg, SUPPORTED_SMS_LANGUAGES } from "../i18n/messages.js";
import { getProfile, updateProfile } from "../store/profilesStore.js";
import { getRates, quoteTransfer } from "./ratesService.js";
import { createTransfer, collectTransfer, listIncoming } from "./transfersService.js";
import { normalizePhone } from "./authService.js";
import { normalizeNumberForCountry } from "./phoneService.js";
import { hasPin, verifyPin } from "./pinService.js";
import { statusSummary } from "./summaryService.js";

const PENDING_TTL_MS = 10 * 60 * 1000;
const pendingRequests = new Map(); // sender phone -> request waiting for "YES <PIN>"

const safeId = (value) => String(value ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50) || crypto.randomUUID();

export const pinProblem = (language, result) =>
  result.error === "locked" ? msg(language, "pinLocked", { minutes: result.minutes })
  : result.error === "wrong_pin" ? msg(language, "pinWrong", { left: result.attemptsLeft })
  : msg(language, "smsNeedPin");

export const limitProblem = (language, code) =>
  ({ limit_min: "limitMin", limit_max: "limitMax", limit_daily: "limitDaily", limit_rate: "limitRate" }[code])
    ? msg(language, { limit_min: "limitMin", limit_max: "limitMax", limit_daily: "limitDaily", limit_rate: "limitRate" }[code], LIMIT_VARS)
    : msg(language, "tryAgain");

// "SEND ZW 500 0771234567" -> { country, amount, recipient } or null
export function parseSendCommand(args) {
  const [code, amount, phone] = args;
  const country = SMS_COUNTRY_CODES[String(code).toUpperCase()];
  const recipient = normalizeNumberForCountry(country, phone);
  return country && recipient && Number(amount) > 0 ? { country, amount: Number(amount), recipient } : null;
}

export async function processSmsCommand({ from, text, messageId }) {
  const sender = normalizePhone(from);
  if (!sender) return "Sorry, we could not read your number.";
  const language = getProfile(sender).language || "en";
  const t = (key, vars) => msg(language, key, vars);
  const [word = "", ...args] = String(text || "").trim().replace(/\s+/g, " ").split(" ");

  switch (word.toUpperCase()) {
    case "RATES":
      return t("ratesTitle", { lines: Object.entries(getRates()).map(([c, r]) => `${c} ${r.rate} ${r.currency}`).join("\n") });

    case "STATUS":
      return statusSummary(sender, language);

    case "CANCEL":
      pendingRequests.delete(sender);
      return t("cancelled");

    case "LANG": {
      const chosen = String(args[0] || "").toLowerCase();
      if (!SUPPORTED_SMS_LANGUAGES.includes(chosen)) return t("smsHelp");
      updateProfile(sender, { language: chosen });
      return msg(chosen, "langSaved");
    }

    case "SEND": {
      const request = parseSendCommand(args);
      if (!request) return t("smsHelp");
      if (request.amount < LIMITS.minZar) return t("limitMin", LIMIT_VARS);
      if (request.amount > LIMITS.maxZar) return t("limitMax", LIMIT_VARS);
      if (!hasPin(sender)) return t("smsNeedPin");
      const quote = quoteTransfer(request.country, request.amount);
      pendingRequests.set(sender, { ...request, id: `sms-${safeId(messageId)}`, expiresAt: Date.now() + PENDING_TTL_MS });
      return t("smsConfirm", { amount: request.amount, phone: request.recipient, country: request.country, ...quote, total: +(request.amount + quote.fee).toFixed(2) });
    }

    case "YES": {
      const request = pendingRequests.get(sender);
      if (!request || request.expiresAt < Date.now()) return t("smsNothing");
      const check = await verifyPin(sender, args[0] ?? "");
      if (!check.ok) return pinProblem(language, check); // the request stays open so they can retry the PIN
      pendingRequests.delete(sender);
      // request.id doubles as the idempotency key, so a duplicate delivery cannot double-send.
      const result = await createTransfer({
        id: request.id, to: request.recipient, phone: request.recipient, country: request.country,
        amount: request.amount, senderPhone: sender, channel: "sms",
      });
      if (result.error) return limitProblem(language, result.code);
      return t("sentOk", { amount: request.amount, phone: request.recipient, ref: result.transfer.ref });
    }

    case "COLLECT": {
      const ready = listIncoming(sender).find((x) => x.status === "ready");
      if (!ready) return t("collectNone");
      const result = await collectTransfer({ id: ready.id, phone: sender, code: args[0] ?? "" });
      if (result.transfer) return t("collectOk", { receive: ready.receive, currency: ready.currency, ref: ready.ref });
      if (result.code === "locked") return t("collectLocked", { minutes: result.minutes });
      return result.code === "wrong_code" ? t("collectWrong", { left: result.attemptsLeft }) : t("tryAgain");
    }

    default:
      return t("smsHelp");
  }
}
