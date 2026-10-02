import { Router } from "express";
import { getCountryList, getRates, quoteTransfer } from "../services/ratesService.js";
import { createTransfer } from "../services/transfersService.js";

export const ussdRouter = Router();

// Africa's Talking style: `text` holds the answers so far, joined by "*".
export async function buildUssdReply({ sessionId = "", phoneNumber = "", text = "" }) {
  const steps = text === "" ? [] : text.split("*");
  const countries = getCountryList();

  if (steps.length === 0) return "CON Zarka\n1. Send money\n2. Rates";
  if (steps[0] === "2") {
    const lines = Object.entries(getRates()).map(([c, r]) => `${c} ${r.rate} ${r.currency}`);
    return `END Per R1:\n${lines.join("\n")}`;
  }
  if (steps[0] !== "1") return "END Invalid choice";

  if (steps.length === 1) return `CON Send to:\n${countries.map((c, i) => `${i + 1}. ${c}`).join("\n")}`;
  const country = countries[Number(steps[1]) - 1];
  if (!country) return "END Invalid country";
  if (steps.length === 2) return "CON Recipient phone number:";
  if (steps.length === 3) return "CON Amount in ZAR:";

  const amount = Number(steps[3]);
  if (!(amount > 0)) return "END Invalid amount";
  if (steps.length === 4) {
    const q = quoteTransfer(country, amount);
    return `CON Send R${amount} to ${steps[2]}?\nFee R${q.fee}, they get ${q.receive} ${q.currency}\n1. Confirm\n2. Cancel`;
  }
  if (steps[4] !== "1") return "END Cancelled";

  // The USSD sessionId is the idempotency key, so a repeated confirm cannot double-send.
  const result = await createTransfer({ id: `ussd-${sessionId}`, to: steps[2], phone: steps[2], country, amount, senderPhone: phoneNumber, channel: "ussd" });
  if (result.error) return "END Could not send. Try again.";
  return `END Received! R${amount} to ${steps[2]}.\nThey get an SMS when it is ready to collect.\nRef ${result.transfer.id.slice(-8)}`;
}

export async function handleUssdRequest(req, res) {
  res.type("text/plain").send(await buildUssdReply(req.body || {}));
}

ussdRouter.post("/", handleUssdRequest);
