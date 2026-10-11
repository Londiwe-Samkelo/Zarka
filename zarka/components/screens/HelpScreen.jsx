"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore, setState } from "../../lib/store";
import { useT, LANGUAGES } from "../../lib/i18n";
import { requestTranslation, logoutOnServer } from "../../lib/api";
import { saveSetting } from "../../lib/localData";
import Icon from "../Icons";
import { cardClass, inputClass, buttonClass, headingClass } from "../ui";
import LoginScreen from "./LoginScreen";

const FAQ_NUMBERS = [1, 2, 3, 4, 5, 6, 7];
const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== "en");
const DEMO_TOOLS = process.env.NEXT_PUBLIC_DEMO_TOOLS !== "off";

export default function HelpScreen() {
  const { language, session } = useStore();
  const t = useT();
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState(language === "en" ? "sn" : language);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Only the translate tool needs a login (it costs money). The questions below never do, and work offline.
  if (showLogin && !session) return <LoginScreen returnTo="help" />;

  const needle = search.trim().toLowerCase();
  const faqs = FAQ_NUMBERS.map((n) => ({ n, q: t(`faq${n}q`), a: t(`faq${n}a`) }))
    .filter((f) => !needle || `${f.q} ${f.a}`.toLowerCase().includes(needle));

  async function handleTranslate() {
    if (!message.trim() || busy) return;
    setBusy(true);
    setResult(await requestTranslation(message.trim(), target));
    setBusy(false);
  }

  async function handleLogout() {
    await logoutOnServer(); // ends the login on the server too
    setState({ session: null, incoming: [] });
    saveSetting("session", null);
  }

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <h2 className={headingClass}>{t("helpFaqTitle")}</h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("helpSearch")} aria-label={t("helpSearch")} className={`${inputClass} mt-3`} />
        <div className="mt-2">
          {faqs.length === 0 && <p className="py-3 text-mute">{t("helpNoResults")}</p>}
          {faqs.map((f) => (
            <details key={f.n} className="border-b border-line py-3 last:border-b-0">
              <summary className="cursor-pointer font-semibold text-foreground">{f.q}</summary>
              <p className="mt-2 text-sm text-mute">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={`${cardClass} flex gap-3`}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-zarka-soft text-zarka"><Icon name="shield" /></span>
        <div>
          <h2 className="font-semibold text-foreground">{t("helpPinTitle")}</h2>
          <p className="mt-1 text-sm text-mute">{t("helpPin")}</p>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="font-semibold text-foreground">{t("helpTranslateTitle")}</h2>
        <p className="mb-3 mt-1 text-sm text-mute">{t("helpTranslateHint")}</p>
        {session ? (
          <>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} aria-label={t("helpTranslateTitle")} className={inputClass} />
            <label htmlFor="translate-target" className="mt-3 block text-sm font-semibold">{t("translateTo")}</label>
            <select id="translate-target" value={target} onChange={(e) => setTarget(e.target.value)} className={`${inputClass} mt-1.5`}>
              {TARGET_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button onClick={handleTranslate} disabled={busy} className={`${buttonClass} mt-4`}>{busy ? t("translating") : t("translateBtn")}</button>
            {result && (result.translated
              ? <p className="mt-3 rounded-xl bg-zarka-soft p-3 text-base text-foreground">{result.text}</p>
              : <p role="alert" className="mt-3 text-sm font-semibold text-danger">{t("translateFail")}</p>)}
            <button onClick={handleLogout} className="mt-5 text-sm font-semibold text-zarka underline underline-offset-2">
              {t("logout")} ({session.phone})
            </button>
          </>
        ) : (
          <button onClick={() => setShowLogin(true)} className={buttonClass}>{t("helpLoginToTranslate")}</button>
        )}
      </section>

      {DEMO_TOOLS && (
        <Link href="/demo" className="block text-center text-sm font-semibold text-zarka underline underline-offset-2">{t("demoLink")}</Link>
      )}
    </div>
  );
}
