import crypto from "node:crypto";
import { updateDb, readDb } from "./database.js";
import { AUTH } from "../config.js";

// Server-side login sessions, so logging out really ends a login (a signed token alone cannot be cancelled).
export function createSession(phone) {
  const id = crypto.randomUUID();
  const now = Date.now();
  updateDb((db) => {
    for (const [key, s] of Object.entries(db.sessions)) if (s.expiresAt < now) delete db.sessions[key]; // tidy up
    db.sessions[id] = { phone, createdAt: now, expiresAt: now + AUTH.tokenTtlMs };
  });
  return { id, expiresAt: now + AUTH.tokenTtlMs };
}

export function findActiveSession(id) {
  const session = readDb().sessions[id];
  return session && session.expiresAt > Date.now() ? session : null;
}

export function revokeSession(id) {
  updateDb((db) => { delete db.sessions[id]; });
}
