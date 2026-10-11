import { Router } from "express";
import { buildUssdReply } from "./ussdRoutes.js";
import { processIncomingSms } from "./smsRoutes.js";
import { listSimulatedNumbers, listSimulatedMessages } from "../services/smsService.js";

// Demo only: lets the on-screen button phone act like a phone on the network.
// Mounted only while SMS is simulated (see index.js), never against a real provider.
export const simRouter = Router();

simRouter.post("/ussd", async (req, res) => {
  res.type("text/plain").send(await buildUssdReply(req.body || {}));
});

simRouter.post("/sms", async (req, res) => {
  const { from, text } = req.body || {};
  await processIncomingSms({ from, text, id: `sim-${Date.now()}` });
  res.json({ ok: true });
});

simRouter.get("/inbox", (req, res) => {
  const phone = req.query.phone;
  res.json(phone ? { messages: listSimulatedMessages(String(phone)) } : { numbers: listSimulatedNumbers() });
});
