import { Router } from "express";
import { LIMITS, LIMIT_VARS } from "../config.js";
import { msg } from "../i18n/messages.js";
import { getProfile, updateProfile } from "../store/profilesStore.js";
import { getCountryList, getRates, quoteTransfer } from "../services/ratesService.js";
import { createTransfer, collectTransfer, listIncoming } from "../services/transfersService.js";
import { normalizePhone } from "../services/authService.js";
import { normalizeNumberForCountry, exampleFor, maskPhone } from "../services/phoneService.js";
import { hasPin, setPin, verifyPin } from "../services/pinService.js";
import { statusSummary } from "../services/summaryService.js";
import { requireGateway } from "../middleware/requireGateway.js";
import { pinProblem, limitProblem } from "../services/smsCommandService.js";

export const ussdRouter = Router();

const safeId = (value) => String(value ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50);
const LANGUAGE_CHOICES = { 1: "en", 2: "sn" };

// Each USSD request carries everything typed so far as "1*2*0771234567" (answers joined by "*").
// One function per menu item; each returns "CON ..." (keep going) or "END ..." (finished).
async function sendMoney({ steps, phone, language, t, sessionId }) {
  const countries = getCountryList();
  if (steps.length === 1) return `CON ${t("sendTo", { list: countries.map((c, i) => `${i + 1}. ${c}`).join("\n") })}`;
  const country = countries[Number(steps[1]) - 1];
  if (!country) return `END ${t("invalidChoice")}`;
  if (steps.length === 2) return `CON ${t("recipientPrompt", { example: exampleFor(country) })}`;

  const recipient = normalizeNumberForCountry(country, steps[2]);
  if (!recipient) return `END ${t("recipientInvalid", { country, example: exampleFor(country) })}`;
  if (steps.length === 3) return `CON ${t("amountPrompt", LIMIT_VARS)}`;

  const amount = Number(steps[3]);
  if (!(amount > 0)) return `END ${t("amountInvalid")}`;
  if (amount < LIMITS.minZar) return `END ${t("limitMin", LIMIT_VARS)}`;
  if (amount > LIMITS.maxZar) return `END ${t("limitMax", LIMIT_VARS)}`;
  if (steps.length === 4) {
    const q = quoteTransfer(country, amount);
    return `CON ${t("confirm", { amount, phone: recipient, ...q, total: +(amount + q.fee).toFixed(2) })}`;
  }
  if (steps[4] !== "1") return `END ${t("cancelled")}`;
  if (!hasPin(phone)) return `END ${t("pinNeeded")}`;
  if (steps.length === 5) return `CON ${t("enterPin")}`;
  if (steps.length > 6) return `END ${t("invalidChoice")}`;

  const check = await verifyPin(phone, steps[5]);
  if (!check.ok) return `END ${pinProblem(language, check)}`;

  // The USSD session id is the idempotency key, so a repeated request cannot double-send.
  const result = await createTransfer({
    id: `ussd-${safeId(sessionId) || Date.now()}`, to: recipient, phone: recipient, country, amount, senderPhone: phone, channel: "ussd",
  });
  if (result.error) return `END ${limitProblem(language, result.code)}`;
  return `END ${t("sentOk", { amount, phone: recipient, ref: result.transfer.ref })}`;
}

const rates = ({ t }) =>
  `END ${t("ratesTitle", { lines: Object.entries(getRates()).map(([c, r]) => `${c} ${r.rate} ${r.currency}`).join("\n") })}`;

const status = ({ phone, language }) => `END ${statusSummary(phone, language)}`;

async function collectMoney({ steps, phone, t }) {
  const ready = listIncoming(phone).filter((x) => x.status === "ready").slice(0, 3);
  if (!ready.length) return `END ${t("collectNone")}`;
  if (steps.length === 1) {
    const list = ready.map((x, i) => t("collectItem", { n: i + 1, receive: x.receive, currency: x.currency, sender: maskPhone(x.senderPhone), ref: x.ref })).join("\n");
    return `CON ${t("collectList", { list })}`;
  }
  const item = ready[Number(steps[1]) - 1];
  if (!item) return `END ${t("invalidChoice")}`;
  if (steps.length === 2) return `CON ${t("collectCode")}`;
  if (steps.length > 3) return `END ${t("invalidChoice")}`;

  const result = await collectTransfer({ id: item.id, phone, code: steps[2] });
  if (result.transfer) return `END ${t("collectOk", { receive: item.receive, currency: item.currency, ref: item.ref })}`;
  if (result.code === "locked") return `END ${t("collectLocked", { minutes: result.minutes })}`;
  return `END ${result.code === "wrong_code" ? t("collectWrong", { left: result.attemptsLeft }) : t("tryAgain")}`;
}

function chooseLanguage({ steps, phone, t }) {
  if (steps.length === 1) return `CON ${t("langMenu")}`;
  const chosen = LANGUAGE_CHOICES[steps[1]];
  if (!chosen || steps.length > 2) return `END ${t("invalidChoice")}`;
  updateProfile(phone, { language: chosen });
  return `END ${msg(chosen, "langSaved")}`;
}

// Create a PIN the first time, change it after that. The old PIN is checked at every step.
async function managePin({ steps, phone, language, t }) {
  if (!hasPin(phone)) {
    if (steps.length === 1) return `CON ${t("pinCreate")}`;
    if (steps.length === 2) return `CON ${t("pinRepeat")}`;
    if (steps[1] !== steps[2] || steps.length > 3) return `END ${t("pinMismatch")}`;
    return (await setPin(phone, steps[1])).ok ? `END ${t("pinSaved")}` : `END ${t("pinWeak")}`;
  }
  if (steps.length === 1) return `CON ${t("pinCurrent")}`;
  const check = await verifyPin(phone, steps[1]);
  if (!check.ok) return `END ${pinProblem(language, check)}`;
  if (steps.length === 2) return `CON ${t("pinNew")}`;
  if (steps.length === 3) return `CON ${t("pinNewRepeat")}`;
  if (steps[2] !== steps[3] || steps.length > 4) return `END ${t("pinMismatch")}`;
  return (await setPin(phone, steps[2])).ok ? `END ${t("pinSaved")}` : `END ${t("pinWeak")}`;
}

const MENU = { 1: sendMoney, 2: rates, 3: status, 4: collectMoney, 5: chooseLanguage, 6: managePin };

export async function buildUssdReply({ sessionId = "", phoneNumber = "", text = "" }) {
  const phone = normalizePhone(phoneNumber);
  if (!phone) return "END Invalid phone number.";
  const language = getProfile(phone).language || "en";
  const t = (key, vars) => msg(language, key, vars);
  const steps = text === "" ? [] : String(text).split("*");
  if (steps.length === 0) return `CON ${t("menu")}`;
  const flow = MENU[steps[0]];
  return flow ? flow({ steps, phone, language, t, sessionId }) : `END ${t("invalidChoice")}`;
}

export async function handleUssdRequest(req, res) {
  try {
    res.type("text/plain").send(await buildUssdReply(req.body || {}));
  } catch (error) {
    console.error("USSD error:", error.message);
    res.type("text/plain").send("END Service is busy. Please try again.");
  }
}

ussdRouter.post("/", requireGateway, handleUssdRequest);
