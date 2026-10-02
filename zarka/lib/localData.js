import { idbGetAll, idbGet, idbPut, idbDelete } from "./idb";
import { setState } from "./store";

// Local store: the phone's own copy of everything, so the app works with no internet.
export async function loadLocalData() {
  try {
    const [outbox, history, language, session, rates] = await Promise.all([
      idbGetAll("outbox"), idbGetAll("history"),
      idbGet("settings", "language"), idbGet("settings", "session"), idbGet("settings", "rates"),
    ]);
    const cachedMessages = language?.value ? await idbGet("settings", `messages:${language.value}`) : null;
    setState({
      messagesByLanguage: cachedMessages ? { [language.value]: cachedMessages.value } : {},
      outbox: outbox.sort((a, b) => a.queuedAt - b.queuedAt),
      history: history.sort((a, b) => b.queuedAt - a.queuedAt),
      language: language?.value || "en",
      session: session?.value || null,
      rates: rates?.value || null,
      ratesUpdatedAt: rates?.updatedAt || null,
      ready: true,
    });
  } catch {
    setState({ ready: true }); // storage blocked: run in memory only
  }
}

const quiet = (promise) => promise.catch(() => {});
export const saveSetting = (id, value, extra = {}) => quiet(idbPut("settings", { id, value, ...extra }));
export const saveOutboxItem = (transfer) => quiet(idbPut("outbox", transfer));
export const removeOutboxItem = (id) => quiet(idbDelete("outbox", id));
export const saveHistoryItem = (transfer) => quiet(idbPut("history", transfer));
