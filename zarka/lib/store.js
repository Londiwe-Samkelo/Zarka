import { useSyncExternalStore } from "react";

// One tiny shared store. Screens read it with useStore(); the engine updates it with setState().
let state = {
  ready: false,           // local data loaded from IndexedDB
  language: "en",
  messagesByLanguage: {}, // UI text from Vambo AI per language, cached on the phone
  view: "home",
  session: null,          // { token, phone } after login
  outbox: [],             // transfers saved on this phone, waiting to be sent
  history: [],            // transfers the server has received
  rates: null,            // { rates, fee } cached from the server
  ratesUpdatedAt: null,
  forceOffline: false,    // "Test offline" switch
  serverReachable: true,
  browserOnline: true,    // from the browser; starts true so the server and first client render match
  toast: "",
};
const listeners = new Set();

export const getState = () => state;

export function setState(patch) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useStore = () => useSyncExternalStore(subscribe, getState, getState);

export function navigateTo(view) {
  setState({ view });
  window.scrollTo(0, 0);
}
