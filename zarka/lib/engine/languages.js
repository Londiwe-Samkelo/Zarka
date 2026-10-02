import { getState, setState } from "../store";
import { fetchUiMessages } from "../api";
import { isOnline } from "./connectivity";
import { idbGet } from "../idb";
import { saveSetting } from "../localData";
import { MESSAGES } from "../messages";
import { showToast } from "../toast";
import { translate } from "../i18n";

const inFlight = new Set();

// Gets Vambo AI's version of the app text for a language and keeps a copy on the phone.
export async function refreshLanguageMessages(code) {
  if (code === "en" || inFlight.has(code) || !isOnline()) return;
  inFlight.add(code);
  const data = await fetchUiMessages(code);
  inFlight.delete(code);
  if (!data?.messages) return;
  setState((s) => ({ messagesByLanguage: { ...s.messagesByLanguage, [code]: data.messages } }));
  await saveSetting(`messages:${code}`, data.messages);
}

export async function activateLanguage(code) {
  setState({ language: code });
  saveSetting("language", code);
  if (code === "en") return;

  if (!getState().messagesByLanguage[code]) {
    const cached = await idbGet("settings", `messages:${code}`).catch(() => null);
    if (cached) setState((s) => ({ messagesByLanguage: { ...s.messagesByLanguage, [code]: cached.value } }));
  }
  await refreshLanguageMessages(code);

  // Nothing bundled, nothing cached, and Vambo did not answer: we are showing English.
  if (!MESSAGES[code] && !getState().messagesByLanguage[code]) showToast(translate("en", "langUnavailable"));
}
