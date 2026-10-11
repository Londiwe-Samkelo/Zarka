import { readDb, updateDb } from "./database.js";

export const findTransferById = (id) => readDb().transfers[id] || null;
export const listTransfersBySender = (phone) => Object.values(readDb().transfers).filter((t) => t.senderPhone === phone);
export const listTransfersByRecipient = (phone) => Object.values(readDb().transfers).filter((t) => t.phone === phone);
export const listOpenTransfers = () => Object.values(readDb().transfers).filter((t) => t.status === "received" || t.status === "processing");

export function saveTransfer(transfer) {
  updateDb((db) => { db.transfers[transfer.id] = transfer; });
  return transfer;
}

export function saveFeeRecord(record) {
  updateDb((db) => { db.feeRecords.push(record); });
}
