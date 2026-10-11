"use client";

import { useStore, navigateTo } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { isOnline } from "../../lib/engine/connectivity";
import { maskPhone } from "../../lib/phone";
import Icon from "../Icons";
import { cardClass } from "../ui";

const SERVICES = [
  { view: "collect", icon: "cash", title: "homeCollect", hint: "homeCollectHint" },
  { view: "rates", icon: "chart", title: "homeRates" },
  { view: "history", icon: "clock", title: "homeHistory" },
  { view: "help", icon: "help", title: "homeHelp" },
];

export default function HomeScreen() {
  const state = useStore();
  const t = useT();
  const ready = state.incoming.filter((i) => i.status === "ready").length;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-zarka p-6 text-white">
        <h1 className="text-2xl font-bold leading-tight">{t("hello")}</h1>
        <p className="mt-1.5 text-sm text-white/90">{t("homeSendHint")}</p>
        <button
          onClick={() => navigateTo("send")}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-base font-semibold text-zarka-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Icon name="send" /> {t("homeSend")}
        </button>
        {state.session && <p className="mt-3 text-center text-xs text-white/80">{t("signedInAs").replace("{phone}", maskPhone(state.session.phone))}</p>}
      </section>

      {!isOnline(state) && (
        <p role="note" className="rounded-xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning">{t("homeOfflineNote")}</p>
      )}

      <section className="grid grid-cols-2 gap-3">
        {SERVICES.map((s) => (
          <button key={s.view} onClick={() => navigateTo(s.view)} className={`${cardClass} relative flex flex-col items-start gap-2 text-left transition hover:border-zarka`}>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-zarka-soft text-zarka"><Icon name={s.icon} /></span>
            <span className="font-semibold text-foreground">{t(s.title)}</span>
            {s.hint && <span className="text-xs text-mute">{t(s.hint)}</span>}
            {s.view === "collect" && ready > 0 && (
              <span className="absolute right-3 top-3 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">{t("readyToCollect").replace("{count}", ready)}</span>
            )}
          </button>
        ))}
        {["airtime", "bills"].map((key) => (
          <div key={key} className={`${cardClass} flex flex-col items-start gap-2 opacity-60`} aria-disabled="true">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-line text-mute"><Icon name={key === "airtime" ? "phone" : "bill"} /></span>
            <span className="font-semibold text-foreground">{t(key)}</span>
            <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-mute">{t("comingSoon")}</span>
          </div>
        ))}
      </section>

      <section className={`${cardClass} flex gap-3`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-zarka-soft text-zarka"><Icon name="phone" /></span>
        <div>
          <h2 className="font-semibold text-foreground">{t("buttonPhoneTitle")}</h2>
          <p className="mt-1 text-sm text-mute">{t("buttonPhoneBody")}</p>
        </div>
      </section>
    </div>
  );
}
