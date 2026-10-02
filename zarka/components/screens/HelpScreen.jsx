"use client";

import { useState } from "react";
import { useStore, setState } from "../../lib/store";
import { useT } from "../../lib/i18n";
import { requestTranslation } from "../../lib/api";
import { saveSetting } from "../../lib/localData";
import { cardClass, inputClass, buttonClass } from "../ui";
import LoginScreen from "./LoginScreen";

export default function HelpScreen() {
  const { language, session } = useStore();
  const t = useT();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function handleAsk() {
    setAnswer(await requestTranslation(question, language));
  }

  function handleLogout() {
    setState({ session: null });
    saveSetting("session", null);
  }

  // Asking a question uses Vambo AI, which costs money, so it needs a login.
  if (!session) return <LoginScreen returnTo="help" />;

  return (
    <div className={cardClass}>
      <h2 className="mb-2 text-xl font-bold">{t("helpT")}</h2>
      <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t("ask")} className={inputClass} />
      <button onClick={handleAsk} className={buttonClass}>{t("ask")}</button>
      <p className="mt-3 text-mute">{answer || t("ans")}</p>
      {session && (
        <button onClick={handleLogout} className="mt-4 text-sm font-semibold text-zarka underline">
          {t("logout")} ({session.phone})
        </button>
      )}
    </div>
  );
}
