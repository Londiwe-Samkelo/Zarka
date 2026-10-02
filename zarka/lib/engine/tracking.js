import { getState, setState } from "../store";
import { fetchMyTransfers } from "../api";
import { isOnline } from "./connectivity";
import { saveHistoryItem } from "../localData";

const POLL_INTERVAL_MS = 5000;
const isOpen = (transfer) => transfer.status !== "ready" && transfer.status !== "failed";

// Asks the server for the latest status of transfers that are not finished yet.
export async function refreshTransfers() {
  const before = getState();
  if (!isOnline(before) || !before.session || !before.history.some(isOpen)) return;
  const list = await fetchMyTransfers();
  if (!list) return;
  const latest = new Map(list.map((t) => [t.id, t]));
  const changed = before.history.filter((t) => latest.has(t.id) && latest.get(t.id).status !== t.status).map((t) => ({ ...t, ...latest.get(t.id) }));
  if (!changed.length) return;
  const byId = new Map(changed.map((t) => [t.id, t]));
  setState((s) => ({ history: s.history.map((t) => byId.get(t.id) || t) }));
  await Promise.all(changed.map(saveHistoryItem));
}

export function startTracking() {
  const timer = setInterval(refreshTransfers, POLL_INTERVAL_MS);
  return () => clearInterval(timer);
}
