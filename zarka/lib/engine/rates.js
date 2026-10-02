import { setState } from "../store";
import { fetchRates } from "../api";
import { saveSetting } from "../localData";

// Keeps a fresh copy of fee + exchange rates on the phone for offline quotes.
export async function refreshRates() {
  const data = await fetchRates();
  if (!data) return;
  const updatedAt = Date.now();
  setState({ rates: data, ratesUpdatedAt: updatedAt });
  await saveSetting("rates", data, { updatedAt });
}
