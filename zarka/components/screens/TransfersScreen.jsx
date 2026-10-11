"use client";

import { useStore, navigateTo } from "../../lib/store";
import { useT } from "../../lib/i18n";
import StatusTracker from "../StatusTracker";
import { cardClass, buttonClass, headingClass } from "../ui";

export default function TransfersScreen() {
  const { outbox, history } = useStore();
  const t = useT();
  const rows = [...outbox.map((item) => ({ ...item, status: "queued" })), ...history];

  return (
    <div className="space-y-3">
      <h2 className={`${headingClass} px-1`}>{t("history")}</h2>
      {rows.length === 0 && (
        <div className={`${cardClass} text-center`}>
          <p className="text-mute">{t("historyEmpty")}</p>
          <button onClick={() => navigateTo("send")} className={`${buttonClass} mt-4`}>{t("startSending")}</button>
        </div>
      )}
      {rows.map((transfer) => (
        <article key={transfer.id} className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">{transfer.to}</p>
              <p className="text-sm text-mute">{transfer.country} · {new Date(transfer.queuedAt).toLocaleDateString()}</p>
            </div>
            <p className="text-right font-semibold text-foreground">R{Number(transfer.amount).toFixed(2)}</p>
          </div>
          <StatusTracker status={transfer.status} />
        </article>
      ))}
    </div>
  );
}
