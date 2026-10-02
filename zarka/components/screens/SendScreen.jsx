"use client";

import { useState } from "react";
import { useStore, navigateTo } from "../../lib/store";
import { showToast } from "../../lib/toast";
import { useT } from "../../lib/i18n";
import { getRatesOrDefault, calculateQuote } from "../../lib/quote";
import { queueTransfer, syncOutbox } from "../../lib/engine/outbox";
import { cardClass, inputClass, labelClass, buttonClass } from "../ui";

export default function SendScreen() {
  const state = useStore();
  const t = useT();
  const pricing = getRatesOrDefault(state);
  const [form, setForm] = useState({ country: Object.keys(pricing.rates)[0], name: "", phone: "", amount: "" });
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const amount = parseFloat(form.amount) || 0;
  const quote = calculateQuote(form.country, amount, pricing);

  async function handleSubmit() {
    if (!amount || !form.name.trim() || !form.phone.trim()) return showToast(t("fill"));
    await queueTransfer({ to: form.name.trim(), phone: form.phone.trim(), country: form.country, amount });
    showToast(t("queued"));
    navigateTo("history");
    syncOutbox({ force: true }).then((count) => count && showToast(t("synced")));
  }

  return (
    <div className={cardClass}>
      <h2 className="text-xl font-bold">{t("send")}</h2>
      <label className={labelClass}>{t("to")}</label>
      <select value={form.country} onChange={update("country")} className={inputClass}>
        {Object.keys(pricing.rates).map((country) => <option key={country}>{country}</option>)}
      </select>
      <label className={labelClass}>{t("name")}</label>
      <input value={form.name} onChange={update("name")} autoComplete="off" className={inputClass} />
      <label className={labelClass}>{t("phone")}</label>
      <input value={form.phone} onChange={update("phone")} inputMode="tel" placeholder="+263…" className={inputClass} />
      <label className={labelClass}>{t("amount")}</label>
      <input value={form.amount} onChange={update("amount")} inputMode="decimal" placeholder="500" className={inputClass} />
      <div className="mt-2">
        <div className="flex justify-between border-b border-line py-2"><span>{t("fee")}</span><b>R{quote.fee.toFixed(2)}</b></div>
        <div className="flex justify-between border-b border-line py-2"><span>{t("gets")}</span><b>{quote.receive.toFixed(2)} {quote.currency}</b></div>
      </div>
      <button onClick={handleSubmit} className={buttonClass}>{t("go")}</button>
    </div>
  );
}
