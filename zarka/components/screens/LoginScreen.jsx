"use client";

import { useState } from "react";
import { setState, navigateTo } from "../../lib/store";
import { showToast } from "../../lib/toast";
import { useT } from "../../lib/i18n";
import { requestOtp, verifyOtp } from "../../lib/api";
import { saveSetting } from "../../lib/localData";
import { syncOutbox } from "../../lib/engine/outbox";
import { syncProfileLanguage } from "../../lib/engine/languages";
import { SENDER_COUNTRIES, COUNTRIES, normalizePhone, exampleFor } from "../../lib/phone";
import PhoneField from "../PhoneField";
import Icon from "../Icons";
import { cardClass, inputClass, labelClass, buttonClass, secondaryButtonClass, headingClass } from "../ui";

// Step 1: phone number. Step 2: the 6-digit code we text to it. Needs internet once.
export default function LoginScreen({ returnTo = "send", hint }) {
  const t = useT();
  const [country, setCountry] = useState("South Africa");
  const [phone, setPhone] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [step, setStep] = useState("phone");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSendCode() {
    const clean = normalizePhone(country, phone);
    if (clean.error) return setMessage(t("phoneInvalid").replace("{country}", country).replace("{example}", exampleFor(country)));
    setBusy(true);
    const result = await requestOtp(clean.phone);
    setBusy(false);
    if (result.error) return setMessage(result.error);
    setFullPhone(clean.phone);
    setMessage("");
    setDevCode(result.devCode || "");
    setStep("code");
  }

  async function handleVerify() {
    setBusy(true);
    const result = await verifyOtp(fullPhone, code.trim());
    setBusy(false);
    if (result.error) return setMessage(result.error);
    const session = { token: result.token, phone: result.phone };
    setState({ session });
    await saveSetting("session", session);
    syncProfileLanguage();
    navigateTo(returnTo);
    syncOutbox({ force: true }); // send anything that was waiting for a login
    showToast(t("signedInAs").replace("{phone}", result.phone));
  }

  return (
    <div className={cardClass}>
      <p className="text-xs font-semibold uppercase tracking-wide text-mute">{t(step === "phone" ? "loginStepPhone" : "loginStepCode")}</p>
      <h2 className={`${headingClass} mt-1`}>{t("loginT")}</h2>
      {step === "phone" ? (
        <>
          <p className="mt-1 text-sm text-mute">{hint || t("loginSub")}</p>
          <label htmlFor="login-country" className={labelClass}>{t("yourCountry")}</label>
          <select id="login-country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
            {SENDER_COUNTRIES.map((c) => <option key={c} value={c}>{c} ({COUNTRIES[c].dial})</option>)}
          </select>
          <label htmlFor="login-phone" className={labelClass}>{t("yourPhone")}</label>
          <PhoneField id="login-phone" country={country} value={phone} onChange={setPhone} label={t("yourPhone")} />
          <button onClick={handleSendCode} disabled={busy} className={`${buttonClass} mt-5`}>{t("sendCode")}</button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-mute">{t("codeSentTo").replace("{phone}", fullPhone)}</p>
          <label htmlFor="login-code" className={labelClass}>{t("code")}</label>
          <input id="login-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} autoComplete="one-time-code" className={`${inputClass} font-mono tracking-widest`} />
          <button onClick={handleVerify} disabled={busy || code.length !== 6} className={`${buttonClass} mt-5`}>{t("verify")}</button>
          <button onClick={() => { setStep("phone"); setMessage(""); }} className={`${secondaryButtonClass} mt-3 inline-flex items-center justify-center gap-2`}>
            <Icon name="arrowLeft" /> {t("backBtn")}
          </button>
          {devCode && <p className="mt-3 text-sm text-mute">Test code (development only): <b className="font-mono text-foreground">{devCode}</b></p>}
        </>
      )}
      {message && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{message}</p>}
      <p className="mt-5 flex gap-2 text-xs text-mute"><Icon name="shield" className="h-4 w-4 shrink-0" />{t("loginSecurity")}</p>
    </div>
  );
}
