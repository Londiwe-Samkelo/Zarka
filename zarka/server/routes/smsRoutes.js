import { Router } from "express";
import { IS_PRODUCTION } from "../config.js";
import { processSmsCommand } from "../services/smsCommandService.js";
import { sendSms, logInboundSms } from "../services/smsService.js";
import { requireGateway } from "../middleware/requireGateway.js";

export const smsRouter = Router();

// PINs and pickup codes typed into a text must not sit in logs or in the demo inbox.
const hideSecrets = (text) => String(text ?? "").replace(/^(\s*(?:YES|COLLECT)\s+)\S+/i, "$1••••");

// Shared by the real webhook and the demo phone: a text arrives, we answer it.
export async function processIncomingSms({ from, text, id }) {
  logInboundSms(from, hideSecrets(text));
  const reply = await processSmsCommand({ from, text, messageId: id });
  await sendSms(from, reply);
  return reply;
}

// Webhook your SMS provider calls when a text arrives: { from, text, id }.
export async function handleIncomingSms(req, res) {
  const { from, text, id } = req.body || {};
  const reply = await processIncomingSms({ from, text, id });
  res.json(IS_PRODUCTION ? { ok: true } : { ok: true, reply });
}

smsRouter.post("/", requireGateway, handleIncomingSms);
