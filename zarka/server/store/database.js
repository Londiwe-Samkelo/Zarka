import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "../config.js";

// A small JSON file stands in for a real database (swap for Postgres later).
// Reads and writes are synchronous, so each read-change-write below cannot be interrupted.
const file = path.join(DATA_DIR, "db.json");
const empty = () => ({ transfers: {}, feeRecords: [], profiles: {}, sessions: {}, auditLog: [] });

export function readDb() {
  try { return { ...empty(), ...JSON.parse(fs.readFileSync(file, "utf8")) }; } catch { return empty(); }
}

export function writeDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file); // never leaves a half-written file behind
}

export function updateDb(change) {
  const db = readDb();
  const result = change(db);
  writeDb(db);
  return result;
}
