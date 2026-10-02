"use client";

import { useStore } from "../../lib/store";
import { useT } from "../../lib/i18n";
import StatusTracker from "../StatusTracker";
import { cardClass } from "../ui";

export default function TransfersScreen() {
  const { outbox, history } = useStore();
  const t = useT();
  const rows = [...outbox.map((item) => ({ ...item, status: "queued" })), ...history];

  return (
    <div className={cardClass}>
      <h2 className="mb-2 text-xl font-bold">{t("history")}</h2>
      {rows.length === 0 && <p>{t("none")}</p>}
      {rows.map((transfer) => (
        <div key={transfer.id} className="border-b border-line py-3 last:border-b-0">
          <div className="flex justify-between">
            <span>
              <b>{transfer.to}</b>
              <br />
              <small className="text-mute">{transfer.country} · {new Date(transfer.queuedAt).toLocaleString()}</small>
            </span>
            <span className="text-right font-semibold">R{Number(transfer.amount)}</span>
          </div>
          <StatusTracker status={transfer.status} />
        </div>
      ))}
    </div>
  );
}
