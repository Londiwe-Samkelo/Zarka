import { STATUS_TIMING_MS } from "../config.js";

export const STATUSES = ["received", "processing", "ready"];

export function statusAt(createdAt, now = Date.now()) {
  const age = now - new Date(createdAt).getTime();
  if (age >= STATUS_TIMING_MS.ready) return "ready";
  if (age >= STATUS_TIMING_MS.processing) return "processing";
  return "received";
}

// Returns an updated copy (with new status log entries) or null if nothing changed.
export function advanceTransfer(transfer, now = Date.now()) {
  const from = STATUSES.indexOf(transfer.status);
  const to = STATUSES.indexOf(statusAt(transfer.createdAt, now));
  if (to <= from) return null;
  const at = new Date(now).toISOString();
  const entries = STATUSES.slice(from + 1, to + 1).map((status) => ({ status, at }));
  return { ...transfer, status: STATUSES[to], statusLog: [...transfer.statusLog, ...entries] };
}
