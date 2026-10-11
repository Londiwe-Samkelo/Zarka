import { updateDb } from "../store/database.js";
import { maskPhone } from "./phoneService.js";

const MAX_ENTRIES = 500;

// Security log: who did what, never PINs or codes, phone numbers masked.
export function audit(event, { phone, ...details } = {}) {
  updateDb((db) => {
    db.auditLog.push({ at: new Date().toISOString(), event, phone: phone ? maskPhone(phone) : undefined, ...details });
    if (db.auditLog.length > MAX_ENTRIES) db.auditLog.splice(0, db.auditLog.length - MAX_ENTRIES);
  });
}
