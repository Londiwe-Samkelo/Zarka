import { readDb, updateDb } from "./database.js";

// Per phone number: language, PIN (hashed) and lock-out counters.
export const getProfile = (phone) => readDb().profiles[phone] || {};

export function updateProfile(phone, patch) {
  return updateDb((db) => {
    db.profiles[phone] = { ...(db.profiles[phone] || {}), ...patch };
    return db.profiles[phone];
  });
}
