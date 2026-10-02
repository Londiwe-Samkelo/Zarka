"use client";

import { navigateTo } from "../../lib/store";
import { showToast } from "../../lib/toast";
import { useT } from "../../lib/i18n";
import { tileClass } from "../ui";

export default function HomeScreen() {
  const t = useT();
  const soon = () => showToast(t("soon"));
  return (
    <>
      <h1 className="mx-4 mb-1 mt-4 text-2xl font-bold">{t("hello")}</h1>
      <p className="mx-4 mb-3 text-mute">{t("sub")}</p>
      <div className="grid grid-cols-2 gap-3 px-4">
        <button onClick={() => navigateTo("send")} className="col-span-2 min-h-24 rounded-2xl bg-zarka p-4 text-xl font-bold text-white">
          <span className="block text-3xl">💸</span>{t("send")}
        </button>
        <button onClick={soon} className={tileClass}><span className="block text-3xl">💵</span>{t("collect")}</button>
        <button onClick={soon} className={tileClass}><span className="block text-3xl">📱</span>{t("airtime")}</button>
        <button onClick={soon} className={tileClass}><span className="block text-3xl">🧾</span>{t("bills")}</button>
        <button onClick={() => navigateTo("rates")} className={tileClass}><span className="block text-3xl">📈</span>{t("rates")}</button>
        <button onClick={() => navigateTo("history")} className={tileClass}><span className="block text-3xl">🕘</span>{t("history")}</button>
        <button onClick={() => navigateTo("help")} className={tileClass}><span className="block text-3xl">💬</span>{t("help")}</button>
      </div>
    </>
  );
}
