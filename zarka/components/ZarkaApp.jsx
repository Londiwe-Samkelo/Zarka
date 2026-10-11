"use client";

import { useEffect } from "react";
import { useStore, getState } from "../lib/store";
import { translate } from "../lib/i18n";
import { showToast } from "../lib/toast";
import { loadLocalData } from "../lib/localData";
import { registerServiceWorker } from "../lib/pwa";
import { isOnline, startConnectivityMonitor } from "../lib/engine/connectivity";
import { syncOutbox, startSyncLoop } from "../lib/engine/outbox";
import { startTracking, refreshTransfers, refreshIncoming } from "../lib/engine/tracking";
import { refreshRates } from "../lib/engine/rates";
import { refreshLanguageMessages, syncProfileLanguage } from "../lib/engine/languages";
import Header from "./Header";
import BottomNav from "./BottomNav";
import Toast from "./Toast";
import HomeScreen from "./screens/HomeScreen";
import SendScreen from "./screens/SendScreen";
import ConfirmScreen from "./screens/ConfirmScreen";
import TransfersScreen from "./screens/TransfersScreen";
import CollectScreen from "./screens/CollectScreen";
import RatesScreen from "./screens/RatesScreen";
import HelpScreen from "./screens/HelpScreen";
import LoginScreen from "./screens/LoginScreen";

const SCREENS = { home: HomeScreen, send: SendScreen, confirm: ConfirmScreen, history: TransfersScreen, collect: CollectScreen, rates: RatesScreen, help: HelpScreen };
const NEEDS_LOGIN = { send: "send", collect: "collect" }; // screens that need a login, and where to go after
const say = (key) => translate(getState().language, key);

// embedded = drawn inside the phone frame on the demo page (no fixed positioning)
export default function ZarkaApp({ embedded = false }) {
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

  // Whenever we come back online: refresh rates and text, send the queue, update statuses.
  useEffect(() => {
    if (!online || !state.ready) return;
    refreshRates();
    refreshLanguageMessages(getState().language);
    syncProfileLanguage();
    refreshTransfers();
    refreshIncoming();
    syncOutbox({ force: true }).then((count) => count && showToast(say("synced")));
  }, [online, state.ready, state.session]);

  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);

  useEffect(() => {
    if (state.ready && !state.session && state.outbox.length) showToast(say("loginNeeded"));
  }, [state.ready, state.session, state.outbox.length]);

  const returnTo = NEEDS_LOGIN[state.view];
  const loginHint = state.view === "collect" ? say("collectLoginHint") : undefined;
  const screen = returnTo && !state.session
    ? <LoginScreen returnTo={returnTo} hint={loginHint} />
    : (() => { const Screen = SCREENS[state.view] || HomeScreen; return <Screen />; })();

  if (embedded) {
    return (
      <div className="relative flex h-full flex-col bg-background">
        <Header />
        <main data-scroll-root className="flex-1 overflow-y-auto px-4 py-4">{state.ready && screen}</main>
        <BottomNav embedded />
        <Toast embedded />
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-24">
      <Header />
      <main className="flex-1 px-4 py-4">{state.ready && screen}</main>
      <BottomNav />
      <Toast />
    </div>
  );
}
