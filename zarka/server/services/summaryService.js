import { msg, statusLabel } from "../i18n/messages.js";
import { listSent, listIncoming } from "./transfersService.js";

// A short "where is my money" summary that fits on a USSD screen or in one SMS.
export function statusSummary(phone, language) {
  const lines = [
    ...listSent(phone).slice(0, 2).map((t) => msg(language, "statusSent", { amount: t.amount, phone: t.phone, status: statusLabel(language, t.status) })),
    ...listIncoming(phone).slice(0, 1).map((t) => msg(language, "statusIncoming", { receive: t.receive, currency: t.currency, status: statusLabel(language, t.status) })),
  ];
  return lines.length ? lines.join("\n") : msg(language, "statusNone");
}
