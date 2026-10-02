"use client";

import { useStore } from "../lib/store";
import { LANGUAGES, translate } from "../lib/i18n";
import { isOnline, setForcedOffline } from "../lib/engine/connectivity";
import { activateLanguage } from "../lib/engine/languages";

export default function Header() {
  const state = useStore();
  const t = (key) => translate(state.language, key);
  const online = isOnline(state);

  const changeLanguage = (event) => activateLanguage(event.target.value);

  return (
    <header className="rounded-b-3xl bg-zarka px-4 pb-5 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="text-2xl font-extrabold">Zarka</div>
        <select
          aria-label="Language"
          value={state.language}
          onChange={changeLanguage}
          className="rounded-full bg-white px-3 py-2 text-sm text-[#2b1a0e]"
        >
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm">
        <span className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${online ? "bg-green-300" : "bg-yellow-300"}`} />
          {online ? t("online") : t("offline")}
        </span>
        <button
          onClick={() => setForcedOffline(!state.forceOffline)}
          className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-zarka"
        >
          {state.forceOffline ? t("simOn") : t("sim")}
        </button>
      </div>
    </header>
  );
}
