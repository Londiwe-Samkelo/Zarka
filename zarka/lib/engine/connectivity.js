import { getState, setState } from "../store";
import { pingServer } from "../api";

const PING_INTERVAL_MS = 10000;

// navigator.onLine alone is unreliable, so we also ping our own server.
// The browser's own flag is copied into the store by startConnectivityMonitor (never read here),
// so the server render and the first browser render always agree.
export function isOnline(state = getState()) {
  return !state.forceOffline && state.serverReachable && state.browserOnline;
}

export const setForcedOffline = (flag) => setState({ forceOffline: flag });

export async function checkConnection() {
  setState({ serverReachable: await pingServer() });
}

export function startConnectivityMonitor() {
  const handleOnline = () => { setState({ browserOnline: true }); checkConnection(); };
  const handleOffline = () => setState({ browserOnline: false, serverReachable: false });
  setState({ browserOnline: navigator.onLine !== false });
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  const timer = setInterval(checkConnection, PING_INTERVAL_MS);
  checkConnection();
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    clearInterval(timer);
  };
}
