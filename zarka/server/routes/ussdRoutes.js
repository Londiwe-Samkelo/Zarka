import { Router } from "express";
import { getCountryList, getRates, quoteTransfer } from "../services/ratesService.js";
import { createTransfer } from "../services/transfersService.js";
import { listTransfersBySender } from "../store/transfersStore.js";

export const ussdRouter = Router();

const STATUS_LABELS = {
  queued: "Saved on phone",
  received: "Received",
  processing: "In transit",
  ready: "Ready to collect",
}

export async function buildUssdReply({ sessionId = "", phoneNumber = "", text = "" }) {
  const steps = text === "" ? [] : text.split("*");
  const countries = getCountryList();


  if (steps.length === 0) return "CON Zarka\n1. Send money\n2. Rates\n3. Check status";

  if (steps[0] === "2") {
    const lines = Object.entries(getRates()).map(([c, r]) => `${c} ${r.rate} ${r.currency}`);
    return `END Per R1:\n${lines.join("\n")}`;
  }

  //   if (steps[0] === "3") {
  //   const mine = listTransfersBySender(phoneNumber);
  //   const last = mine[mine.length - 1];
  //   if (!last) return "END No transfers found for this number.";
  //   const label = STATUS_LABELS[last.status] || last.status;
  //   return `END R${last.amountZar} sent\nStatus: ${label}`;
  // }

    if (steps[0] === "3") {
    const mine = listTransfersBySender(phoneNumber);
    const last = mine[mine.length - 1];
    if (!last) return "END No transfers found for this number.";
    const label = STATUS_LABELS[last.status] || last.status;
    return `END R${last.amountZar ?? last.amount ?? ""} sent\nStatus: ${label}`;
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

ussdRouter.get("/sim", (req, res) => {
  res.type("html").send(`<!doctype html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<body style="font-family:Arial,sans-serif;background:#111;color:#fff;padding:16px;max-width:420px;margin:auto">
<h3 style="color:#ff6a00;margin:0 0 12px">Zarka USSD *120*9275#</h3>
<pre id="screen" style="font-family:monospace;font-size:15px;background:#1c1208;border:2px solid #ff6a00;border-radius:12px;color:#fff;padding:14px;min-height:140px;white-space:pre-wrap"></pre>
<input id="reply" placeholder="Reply..." style="width:55%;padding:10px;border-radius:10px;border:1px solid #555;background:#222;color:#fff">
<button id="send" style="padding:10px 14px;border:none;border-radius:10px;background:#ff6a00;color:#fff;font-weight:700">Send</button>
<button id="restart" style="padding:10px 14px;border:none;border-radius:10px;background:#333;color:#fff">Restart</button>
<script>
var text = "", sid = "sim-" + Date.now();
function call() {
  fetch("/ussd", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: sid, phoneNumber: "+27821234567", text: text }) })
  .then(function (r) { return r.text(); })
  .then(function (t) {
    document.getElementById("screen").textContent = t.replace(/^(CON|END) /, "");
    document.getElementById("send").disabled = t.indexOf("END") === 0;
  });
}
document.getElementById("send").onclick = function () {
  var v = document.getElementById("reply").value.trim();
  if (!v) return;
  text = text ? text + "*" + v : v;
  document.getElementById("reply").value = "";
  call();
};
document.getElementById("restart").onclick = function () {
  text = ""; sid = "sim-" + Date.now();
  document.getElementById("send").disabled = false;
  call();
};
call();
</script>`);
});
