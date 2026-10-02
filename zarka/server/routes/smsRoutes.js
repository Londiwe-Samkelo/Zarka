import { Router } from "express";
import { IS_PRODUCTION } from "../config.js";
import { processSmsCommand } from "../services/smsCommandService.js";
import { sendSms } from "../services/smsService.js";

export const smsRouter = Router();

// Webhook your SMS provider calls when a text arrives: { from, text, id }.
export async function handleIncomingSms(req, res) {
  const { from, text, id } = req.body || {};
  const reply = await processSmsCommand({ from, text, messageId: id });
  await sendSms(from, reply);
  res.json(IS_PRODUCTION ? { ok: true } : { ok: true, reply });
}

smsRouter.post("/", handleIncomingSms);
