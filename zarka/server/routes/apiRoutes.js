import { Router } from "express";
import { getRates, quoteTransfer } from "../services/ratesService.js";
import { createTransfer, refreshTransfer, buildReceiptText } from "../services/transfersService.js";
import { findTransferById, listTransfersBySender } from "../store/transfersStore.js";
import { translateText } from "../services/vamboService.js";
import { getUiMessages } from "../services/uiMessagesService.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { FEE } from "../config.js";

export const apiRouter = Router();
const MAX_TRANSLATE_CHARS = 500; // keeps one request from running up the Vambo bill

export const handleHealthCheck = (_req, res) => res.json({ ok: true });
export const handleGetRates = (_req, res) => res.json({ rates: getRates(), fee: FEE });

export function handleGetQuote(req, res) {
  const amount = Number(req.query.amount);
  const quote = amount > 0 && quoteTransfer(req.query.country, amount);
  quote ? res.json(quote) : res.status(400).json({ error: "country and amount are required" });
}

export async function handleCreateTransfer(req, res) {
  const result = await createTransfer({ ...(req.body || {}), senderPhone: req.user.phone, channel: "app" });
  res.status(result.error ? 400 : 200).json(result);
}

export async function handleListTransfers(req, res) {
  res.json(await Promise.all(listTransfersBySender(req.user.phone).map(refreshTransfer)));
}

async function findOwnTransfer(req) {
  const transfer = findTransferById(req.params.id);
  return transfer && transfer.senderPhone === req.user.phone ? refreshTransfer(transfer) : null;
}

export async function handleGetTransfer(req, res) {
  const transfer = await findOwnTransfer(req);
  transfer ? res.json(transfer) : res.status(404).json({ error: "not found" });
}

export async function handleGetReceipt(req, res) {
  const transfer = await findOwnTransfer(req);
  if (!transfer) return res.status(404).json({ error: "not found" });
  res.json({ text: await buildReceiptText(transfer, req.query.lang) });
}

export async function handleGetUiMessages(req, res) {
  const { status, error, ...result } = await getUiMessages(req.query.lang);
  error ? res.status(status).json({ error }) : res.json(result);
}

export async function handleTranslate(req, res) {
  const { text, lang } = req.body || {};
  if (typeof text !== "string" || !text.trim() || text.length > MAX_TRANSLATE_CHARS) {
    return res.status(400).json({ error: `text must be 1 to ${MAX_TRANSLATE_CHARS} characters` });
  }
  res.json({ text: await translateText(text, lang) });
}

apiRouter.get("/health", handleHealthCheck);
apiRouter.get("/rates", handleGetRates);
apiRouter.get("/quote", handleGetQuote);
apiRouter.post("/transfers", requireAuth, handleCreateTransfer);
apiRouter.get("/transfers", requireAuth, handleListTransfers);
apiRouter.get("/transfers/:id", requireAuth, handleGetTransfer);
apiRouter.get("/transfers/:id/receipt", requireAuth, handleGetReceipt);
apiRouter.get("/messages", handleGetUiMessages);
apiRouter.post("/translate", requireAuth, handleTranslate); // login required: each call can cost money
