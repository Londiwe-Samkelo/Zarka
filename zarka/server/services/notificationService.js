import { msg } from "../i18n/messages.js";
import { getProfile } from "../store/profilesStore.js";
import { maskPhone } from "./phoneService.js";
import { sendSms } from "./smsService.js";

// Texts both people when a transfer is created, ready to collect, and collected.
// The pickup code only ever goes to the receiver's own phone.
const langOf = (phone) => getProfile(phone).language || "en";

function textFor(transfer, language, key, extra = {}) {
  return msg(language, key, {
    amount: transfer.amount, fee: transfer.fee, receive: transfer.receive, currency: transfer.currency,
    name: transfer.to, phone: transfer.phone, sender: maskPhone(transfer.senderPhone), ref: transfer.ref, ...extra,
  });
}

export async function notifyTransferEvent(transfer, event, extra = {}) {
  const jobs = [];
  const toSender = (key) => transfer.senderPhone && jobs.push(sendSms(transfer.senderPhone, textFor(transfer, langOf(transfer.senderPhone), key, extra)));
  const toReceiver = (key) => transfer.phone && jobs.push(sendSms(transfer.phone, textFor(transfer, langOf(transfer.phone), key, extra)));

  if (event === "created") { toSender("smsReceipt"); toReceiver("smsIncoming"); }
  if (event === "ready") { toSender("smsReadySender"); toReceiver("smsReadyReceiver"); }
  if (event === "collected") { toSender("smsCollectedSender"); toReceiver("smsCollectedReceiver"); }
  await Promise.allSettled(jobs); // a failed text must never break the transfer itself
}
