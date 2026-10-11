"use client";

import { useState } from "react";
import { useStore, setState, navigateTo } from "../../lib/store";
import { showToast } from "../../lib/toast";
import { useT } from "../../lib/i18n";
import { getRatesOrDefault, calculateQuote } from "../../lib/quote";
import { normalizePhone, exampleFor } from "../../lib/phone";
import { isOnline } from "../../lib/engine/connectivity";
import { queueTransfer, syncOutbox } from "../../lib/engine/outbox";
import PhoneField from "../PhoneField";
import Icon from "../Icons";
import { cardClass, inputClass, labelClass, buttonClass, secondaryButtonClass, headingClass } from "../ui";

const Row = ({ label, value, strong }) => (
  <div className={`flex items-baseline justify-between gap-3 border-b border-line py-2.5 last:border-b-0 ${strong ? "text-lg" : ""}`}>
    <span className={strong ? "font-bold text-foreground" : "text-mute"}>{label}</span>
    <span className={`text-right ${strong ? "font-bold text-zarka" : "font-semibold text-foreground"}`}>{value}</span>
  </div>
);

export default function SendScreen() {
  const state = useStore();
  const t = useT();
  const pricing = getRatesOrDefault(state);
  const [step, setStep] = useState("form"); // form -> review
  const [form, setForm] = useState({ country: Object.keys(pricing.rates)[0], name: "", phone: "", amount: "" });
  const [fieldError, setFieldError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const amount = parseFloat(form.amount) || 0;
  const quote = calculateQuote(form.country, amount, pricing);
  const total = amount + quote.fee;

  function handleReview() {
    const phone = normalizePhone(form.country, form.phone); // adds the dial code, fixes a leading 0
    if (!amount || !form.name.trim() || !form.phone.trim()) return setFieldError(t("fill"));
    if (phone.error) return setFieldError(t("phoneInvalid").replace("{country}", form.country).replace("{example}", exampleFor(form.country)));
    setFieldError("");
    setForm({ ...form, phoneClean: phone.phone });
    setStep("review");
  }

  async function handleConfirm() {
    if (busy) return;
    setBusy(true); // a second tap must never queue a second transfer
    const transfer = await queueTransfer({ to: form.name.trim(), phone: form.phoneClean, country: form.country, amount });
    setState({ lastTransferId: transfer.id });
    navigateTo("confirm");
    syncOutbox({ force: true }).then((count) => count && showToast(t("synced")));
  }

  if (step === "review") {
    return (
      <div className={cardClass}>
        <h2 className={headingClass}>{t("reviewTitle")}</h2>
        <div className="mt-3">
          <Row label={t("recipientLabel")} value={form.name.trim()} />
          <Row label={t("numberLabel")} value={form.phoneClean} />
          <Row label={t("countryLabel")} value={form.country} />
          <Row label={t("amountLine")} value={`R${amount.toFixed(2)}`} />
          <Row label={t("fee")} value={`R${quote.fee.toFixed(2)}`} />
          <Row label={t("total")} value={`R${total.toFixed(2)}`} strong />
          <Row label={t("theyReceive")} value={`${quote.receive.toFixed(2)} ${quote.currency}`} />
        </div>
        {!isOnline(state) && <p role="note" className="mt-4 rounded-xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning">{t("offlineSendNote")}</p>}
        <div className="mt-5 space-y-3">
          <button onClick={handleConfirm} disabled={busy} className={buttonClass}>{t("confirmSend")}</button>
          <button onClick={() => setStep("form")} disabled={busy} className={secondaryButtonClass}>{t("editBtn")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <h2 className={headingClass}>{t("send")}</h2>
      <label htmlFor="send-country" className={labelClass}>{t("to")}</label>
      <select id="send-country" value={form.country} onChange={update("country")} className={inputClass}>
        {Object.keys(pricing.rates).map((country) => <option key={country}>{country}</option>)}
      </select>
      <label htmlFor="send-name" className={labelClass}>{t("name")}</label>
      <input id="send-name" value={form.name} onChange={update("name")} autoComplete="off" maxLength={60} className={inputClass} />
      <label htmlFor="send-phone" className={labelClass}>{t("phone")}</label>
      <PhoneField id="send-phone" country={form.country} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} label={t("phone")} />
      <label htmlFor="send-amount" className={labelClass}>{t("amount")}</label>
      <input id="send-amount" value={form.amount} onChange={update("amount")} inputMode="decimal" placeholder="500" className={inputClass} />

      <div className="mt-4 rounded-xl bg-background px-4">
        <Row label={t("fee")} value={`R${quote.fee.toFixed(2)}`} />
        <Row label={t("total")} value={`R${total.toFixed(2)}`} strong />
        <Row label={t("gets")} value={`${quote.receive.toFixed(2)} ${quote.currency}`} />
      </div>
      {fieldError && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{fieldError}</p>}
      <button onClick={handleReview} className={`${buttonClass} mt-5 inline-flex items-center justify-center gap-2`}>
        {t("reviewBtn")} <Icon name="arrowRight" />
      </button>
    </div>
  );
}
