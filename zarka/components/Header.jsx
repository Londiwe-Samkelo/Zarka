"use client";

import { useStore } from "../lib/store";
import { LANGUAGES, translate } from "../lib/i18n";
import { isOnline, setForcedOffline } from "../lib/engine/connectivity";
import { activateLanguage } from "../lib/engine/languages";
import Icon from "./Icons";

const DEMO_TOOLS = process.env.NEXT_PUBLIC_DEMO_TOOLS !== "off";

export default function Header() {
  const state = useStore();
  const t = (key) => translate(state.language, key);
  const online = isOnline(state);

  return (
    <header className="border-b border-line bg-card px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-zarka text-lg font-extrabold text-white" aria-hidden="true">Z</span>
          <span className="text-xl font-bold tracking-tight text-foreground">Zarka</span>
        </div>
        <select
          aria-label="Language"
          value={state.language}
          onChange={(event) => activateLanguage(event.target.value)}
          className="rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground"
        >
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2" role="status">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${online ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
          <Icon name={online ? "wifi" : "wifiOff"} className="h-3.5 w-3.5" />
          {online ? t("online") : t("offline")}
        </span>
        {DEMO_TOOLS && (
          <button onClick={() => setForcedOffline(!state.forceOffline)} className="text-xs font-semibold text-zarka underline underline-offset-2">
            {state.forceOffline ? t("simOn") : t("sim")}
          </button>
        )}
      </div>
    </header>
  );
}
