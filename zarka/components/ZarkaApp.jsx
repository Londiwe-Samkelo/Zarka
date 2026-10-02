"use client";

import { useEffect } from "react";
import { useStore, getState } from "../lib/store";
import { translate } from "../lib/i18n";
import { showToast } from "../lib/toast";
import { loadLocalData } from "../lib/localData";
import { registerServiceWorker } from "../lib/pwa";
import { isOnline, startConnectivityMonitor } from "../lib/engine/connectivity";
import { syncOutbox, startSyncLoop } from "../lib/engine/outbox";
import { startTracking, refreshTransfers } from "../lib/engine/tracking";
import { refreshRates } from "../lib/engine/rates";
import { refreshLanguageMessages } from "../lib/engine/languages";
import Header from "./Header";
import BottomNav from "./BottomNav";
import Toast from "./Toast";
import HomeScreen from "./screens/HomeScreen";
import SendScreen from "./screens/SendScreen";
import TransfersScreen from "./screens/TransfersScreen";
import RatesScreen from "./screens/RatesScreen";
import HelpScreen from "./screens/HelpScreen";
import LoginScreen from "./screens/LoginScreen";

const SCREENS = { home: HomeScreen, send: SendScreen, history: TransfersScreen, rates: RatesScreen, help: HelpScreen };
const say = (key) => translate(getState().language, key);

export default function ZarkaApp() {
  const state = useStore();
  const online = isOnline(state);

  // Start the connectivity engine once.
  useEffect(() => {
    let cancelled = false;
    let stops = [];
    loadLocalData().then(() => {
      if (cancelled) return;
      stops = [startConnectivityMonitor(), startSyncLoop(() => showToast(say("synced"))), startTracking()];
    });
    registerServiceWorker();
    return () => {
      cancelled = true;
      stops.forEach((stop) => stop());
    };
  }, []);

  // Whenever we come back online: refresh rates, send the queue, update statuses.
  useEffect(() => {
    if (!online || !state.ready) return;
    refreshRates();
    refreshLanguageMessages(getState().language);
    refreshTransfers();
    syncOutbox({ force: true }).then((count) => count && showToast(say("synced")));
  }, [online, state.ready]);

  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);

  useEffect(() => {
    if (state.ready && !state.session && state.outbox.length) showToast(say("loginNeeded"));
  }, [state.ready, state.session, state.outbox.length]);

  // Sending money needs a login (done once; the app then works offline).
  const Screen = state.view === "send" && !state.session ? LoginScreen : SCREENS[state.view] || HomeScreen;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-24">
      <Header />
      <main className="flex-1 pt-2">{state.ready && <Screen />}</main>
      <BottomNav />
      <Toast />
    </div>
  );
}
