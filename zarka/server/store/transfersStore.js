import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const dbFile = path.join(dataDir, "db.json");

function readDatabase() {
  try { return JSON.parse(fs.readFileSync(dbFile, "utf8")); } catch { return { transfers: {}, feeRecords: [] }; }
}
function writeDatabase(db) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

export const findTransferById = (id) => readDatabase().transfers[id] || null;
export const listTransfersBySender = (phone) => Object.values(readDatabase().transfers).filter((t) => t.senderPhone === phone);
export const listOpenTransfers = () => Object.values(readDatabase().transfers).filter((t) => t.status !== "ready");

export function saveTransfer(transfer) {
  const db = readDatabase();
  db.transfers[transfer.id] = transfer;
  writeDatabase(db);
  return transfer;
}

export function saveFeeRecord(record) {
  const db = readDatabase();
  db.feeRecords = [...(db.feeRecords || []), record];
  writeDatabase(db);
}
