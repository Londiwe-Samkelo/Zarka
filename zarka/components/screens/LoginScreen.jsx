"use client";

import { useState } from "react";
import { setState, navigateTo } from "../../lib/store";
import { showToast } from "../../lib/toast";
import { useT } from "../../lib/i18n";
import { requestOtp, verifyOtp } from "../../lib/api";
import { saveSetting } from "../../lib/localData";
import { syncOutbox } from "../../lib/engine/outbox";
import { cardClass, inputClass, labelClass, buttonClass } from "../ui";

// Step 1: phone number. Step 2: the 6-digit code we text to it. Needs internet once.
export default function LoginScreen({ returnTo = "send" }) {
  const t = useT();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [step, setStep] = useState("phone");
  const [message, setMessage] = useState("");

  async function handleSendCode() {
    const result = await requestOtp(phone.trim());
    if (result.error) return setMessage(result.error);
    setMessage("");
    setDevCode(result.devCode || "");
    setStep("code");
  }

  async function handleVerify() {
    const result = await verifyOtp(phone.trim(), code.trim());
    if (result.error) return setMessage(result.error);
    const session = { token: result.token, phone: result.phone };
    setState({ session });
    await saveSetting("session", session);
    showToast(result.phone);
    navigateTo(returnTo);
    syncOutbox({ force: true }); // send anything that was waiting for a login
  }

  return (
    <div className={cardClass}>
      <h2 className="text-xl font-bold">{t("loginT")}</h2>
      {step === "phone" ? (
        <>
          <p className="mt-1 text-mute">{t("loginSub")}</p>
          <label className={labelClass}>{t("yourPhone")}</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+27…" className={inputClass} />
          <button onClick={handleSendCode} className={buttonClass}>{t("sendCode")}</button>
        </>
      ) : (
        <>
          <label className={labelClass}>{t("code")}</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} autoComplete="one-time-code" className={inputClass} />
          <button onClick={handleVerify} className={buttonClass}>{t("verify")}</button>
          {devCode && <p className="mt-3 text-mute">Test code: <b>{devCode}</b></p>}
        </>
      )}
      {message && <p className="mt-3 font-semibold text-red-600">{message}</p>}
    </div>
  );
}
