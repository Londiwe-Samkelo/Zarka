import { getState, setState } from "../store";
import { postTransfer } from "../api";
import { isOnline } from "./connectivity";
import { saveOutboxItem, removeOutboxItem, saveHistoryItem, saveSetting } from "../localData";

const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;
let isSyncing = false;
let failures = 0;
let nextAttemptAt = 0;

export const createClientId = () =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Always save on the phone first; the screen never waits on the network.
export async function queueTransfer({ to, phone, country, amount }) {
  const transfer = { id: createClientId(), to, phone, country, amount, queuedAt: Date.now() };
  setState((s) => ({ outbox: [...s.outbox, transfer] }));
  await saveOutboxItem(transfer);
  nextAttemptAt = 0;
  return transfer;
}

async function moveToHistory(item, serverTransfer, status) {
  const record = { ...item, ...serverTransfer, status };
  setState((s) => ({ outbox: s.outbox.filter((t) => t.id !== item.id), history: [record, ...s.history] }));
  await Promise.all([removeOutboxItem(item.id), saveHistoryItem(record)]);
}

// Sends waiting transfers in order. Server trouble => retry later with exponential backoff.
export async function syncOutbox({ force = false } = {}) {
  if (isSyncing || !getState().outbox.length || !isOnline()) return 0;
  if (!force && Date.now() < nextAttemptAt) return 0;
  isSyncing = true;
  let syncedCount = 0;
  try {
    while (getState().outbox.length) {
      const item = getState().outbox[0];
      const { status, body } = await postTransfer(item);
      if (status === 401) { // login expired: keep the queue, ask the user to log in again
        setState({ session: null });
        await saveSetting("session", null);
        break;
      }
      if (status >= 200 && status < 300) {
        await moveToHistory(item, body.transfer, body.transfer.status);
        syncedCount++;
        failures = 0;
      } else if (status === 400) {
        await moveToHistory(item, {}, "failed"); // rejected: do not block the rest of the queue
      } else {
        throw new Error("server trouble");
      }
    }
  } catch {
    failures++;
    nextAttemptAt = Date.now() + Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** failures);
  }
  isSyncing = false;
  return syncedCount;
}

export function startSyncLoop(onSynced) {
  const timer = setInterval(async () => {
    const count = await syncOutbox();
    if (count) onSynced(count);
  }, 2000);
  return () => clearInterval(timer);
}
