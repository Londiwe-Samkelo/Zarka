"use client";

import { useState } from "react";
import { useStore } from "../../lib/store";
import { showToast } from "../../lib/toast";
import { useT } from "../../lib/i18n";
import { collectWithCode } from "../../lib/api";
import { refreshIncoming } from "../../lib/engine/tracking";
import StatusTracker from "../StatusTracker";
import { cardClass, inputClass, buttonClass, headingClass, labelClass } from "../ui";

// The receiver's side: money sent to MY number. Collecting needs the code we texted to this phone.
function IncomingCard({ item }) {
  const t = useT();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCollect() {
    if (busy || code.length !== 6) return;
    setBusy(true);
    const result = await collectWithCode(item.id, code);
    setBusy(false);
    if (result.ok) {
      setMessage("");
      showToast(t("collectedOk").replace("{ref}", item.ref));
      return refreshIncoming();
    }
    if (result.code === "locked") setMessage(t("lockedCode").replace("{minutes}", result.minutes));
    else if (result.code === "wrong_code") setMessage(t("wrongCode").replace("{left}", result.attemptsLeft));
    else setMessage(t("notReadyYet"));
  }

  return (
    <article className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{t("fromSender").replace("{sender}", item.sender)}</p>
          <p className="text-sm text-mute">{t("refLabel")}: <span className="font-mono">{item.ref}</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-mute">{t("youReceive")}</p>
          <p className="font-bold text-foreground">{item.receive} {item.currency}</p>
        </div>
      </div>
      <StatusTracker status={item.status} variant="receiver" />
      {item.status === "ready" && (
        <div className="mt-4 border-t border-line pt-4">
          <label htmlFor={`code-${item.id}`} className={labelClass}>{t("pickupCode")}</label>
          <input
            id={`code-${item.id}`} value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className={`${inputClass} font-mono tracking-widest`}
          />
          {message && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{message}</p>}
          <button onClick={handleCollect} disabled={busy || code.length !== 6} className={`${buttonClass} mt-3`}>{t("collectBtn")}</button>
        </div>
      )}
    </article>
  );
}

export default function CollectScreen() {
  const { incoming } = useStore();
  const t = useT();
  return (
    <div className="space-y-3">
      <div className="px-1">
        <h2 className={headingClass}>{t("collectTitle")}</h2>
        <p className="mt-1 text-sm text-mute">{t("collectIntro")}</p>
      </div>
      {incoming.length === 0 && <div className={`${cardClass} text-center text-mute`}>{t("collectNoneYet")}</div>}
      {incoming.map((item) => <IncomingCard key={item.id} item={item} />)}
    </div>
  );
}
